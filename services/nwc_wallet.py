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


async def pay_invoice(uri: str, bolt11: str, *, timeout: float = 45.0) -> dict[str, Any]:
    """Pay a BOLT11 via NWC. Returns the JSON-RPC result dict."""
    parts = parse_nwc_uri(uri)
    import websockets

    request_id = secrets.token_hex(8)
    payload = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": "pay_invoice",
        "params": {"invoice": bolt11},
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
                        err.get("message") or err.get("code") or "NWC pay failed"
                    )
                return msg.get("result") or {}
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"trato: NWC pay_invoice failed: {exc}")
        raise RuntimeError(
            "Could not pay via your NWC wallet. Check the connection string in "
            "Settings and that the wallet is online."
        ) from exc
