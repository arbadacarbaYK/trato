"""NIP-47 Nostr Wallet Connect — pay Lightning invoices from the user's wallet."""

from __future__ import annotations

import asyncio
import json
import secrets
from typing import Any
from urllib.parse import parse_qs, urlparse

from loguru import logger


def parse_nwc_uri(uri: str) -> dict[str, str]:
    """Parse ``nwc://pubkey?relay=…&secret=…`` into connection parts."""
    raw = (uri or "").strip()
    if not raw.lower().startswith("nwc://"):
        raise ValueError("NWC URI must start with nwc://")
    parsed = urlparse(raw)
    pubkey = (parsed.netloc or parsed.path or "").strip()
    if not pubkey:
        raise ValueError("NWC URI missing wallet pubkey")
    qs = parse_qs(parsed.query)
    relay = (qs.get("relay") or [""])[0].strip()
    secret = (qs.get("secret") or [""])[0].strip()
    if not relay or not secret:
        raise ValueError("NWC URI needs relay= and secret= query parameters")
    return {"pubkey": pubkey, "relay": relay, "secret": secret}


async def _nwc_request(
    uri: str,
    method: str,
    params: dict[str, Any],
    *,
    timeout: float = 45.0,
) -> dict[str, Any]:
    """Send one JSON-RPC call over NWC and return the result dict."""
    parts = parse_nwc_uri(uri)
    import websockets

    request_id = secrets.token_hex(8)
    payload = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": params,
    }
    try:
        async with websockets.connect(
            parts["relay"],
            subprotocols=["nwc"],
            open_timeout=timeout,
            close_timeout=5,
        ) as ws:
            await ws.send(json.dumps(payload))
            while True:
                raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
                msg = json.loads(raw)
                if msg.get("id") != request_id:
                    continue
                if "error" in msg:
                    err = msg["error"]
                    raise RuntimeError(
                        err.get("message") or err.get("code") or f"NWC {method} failed"
                    )
                return msg.get("result") or {}
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"trato: NWC {method} failed: {exc}")
        raise RuntimeError(
            f"Could not complete NWC {method}. Check the connection string in "
            "Settings and that the wallet is online."
        ) from exc


async def make_invoice(
    uri: str,
    amount_sats: int,
    memo: str = "",
    *,
    timeout: float = 45.0,
) -> str:
    """Create a BOLT11 receive invoice via NWC."""
    if amount_sats <= 0:
        raise ValueError("amount_sats must be positive")
    result = await _nwc_request(
        uri,
        "make_invoice",
        {"amount": int(amount_sats), "description": memo or "Trato"},
        timeout=timeout,
    )
    inv = result.get("invoice") or result.get("bolt11")
    if isinstance(inv, str) and inv.startswith("ln"):
        return inv
    raise RuntimeError(
        "Your NWC wallet did not return a Lightning invoice. Try again or check "
        "wallet permissions."
    )


async def pay_invoice(uri: str, bolt11: str, *, timeout: float = 45.0) -> dict[str, Any]:
    """Pay a BOLT11 via NWC. Returns the JSON-RPC result dict."""
    return await _nwc_request(
        uri, "pay_invoice", {"invoice": bolt11}, timeout=timeout
    )
