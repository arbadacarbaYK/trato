"""LNbits Nostr Relay extension hints for Settings → Relays."""

from __future__ import annotations

import json
import ssl
import urllib.error
import urllib.request
from typing import Any, Optional
from urllib.parse import urlparse

from loguru import logger

from .lnurlp_hints import api_key_from_request_headers, lnbits_instance_root_url


def nostrrelay_websocket_url(root: str, relay_id: str) -> str:
    """Public WebSocket URL for an instance relay (``wss://host/nostrrelay/{id}``)."""
    parsed = urlparse(root.strip())
    scheme = "wss" if parsed.scheme == "https" else "ws"
    path = (parsed.path or "").rstrip("/")
    rid = (relay_id or "").strip().strip("/")
    return f"{scheme}://{parsed.netloc}{path}/nostrrelay/{rid}"


def nostrrelay_admin_url(root: str, relay_id: str) -> str:
    base = root.rstrip("/")
    rid = (relay_id or "").strip().strip("/")
    return f"{base}/nostrrelay/{rid}"


def pick_user_nostrrelays(
    relays: list[dict[str, Any]],
    *,
    root: str,
) -> list[dict[str, str]]:
    """Build Trato-facing rows from ``GET /nostrrelay/api/v1/relay``."""
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in relays:
        if not isinstance(row, dict):
            continue
        if not row.get("active"):
            continue
        rid = str(row.get("id") or "").strip()
        if not rid:
            continue
        wss = nostrrelay_websocket_url(root, rid)
        if wss in seen:
            continue
        seen.add(wss)
        name = str(row.get("name") or rid).strip() or rid
        out.append(
            {
                "relay_id": rid,
                "name": name,
                "wss_url": wss,
                "admin_url": nostrrelay_admin_url(root, rid),
            }
        )
    return out


def nostrrelay_hints_shell(base_url: str) -> dict[str, Any]:
    root = lnbits_instance_root_url(base_url)
    return {
        "extension_installed": False,
        "extension_url": root + "/nostrrelay/",
        "extensions_url": root + "/extensions",
        "relays": [],
        "note": (
            "Run your own Nostr relay on this LNbits instance with the Nostr Relay "
            "extension — then add it here for profile and order-book sync."
        ),
    }


async def _get_json_with_api_key(url: str, api_key: str, *, timeout: float) -> tuple[int, Any]:
    headers = {
        "X-Api-Key": api_key.strip(),
        "Accept": "application/json",
        "User-Agent": "Trato/1.0",
    }
    try:
        import httpx

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, headers=headers)
            try:
                body = resp.json()
            except Exception:  # noqa: BLE001
                body = None
            return resp.status_code, body
    except Exception as exc:  # noqa: BLE001
        logger.debug(f"trato nostrrelay hints httpx: {exc}")

    def _urllib() -> tuple[int, Any]:
        req = urllib.request.Request(url, headers=headers)
        ctx = ssl.create_default_context()
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                raw = resp.read()
                return resp.status, json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            try:
                raw = exc.read()
                body = json.loads(raw.decode("utf-8")) if raw else None
            except Exception:  # noqa: BLE001
                body = None
            return exc.code, body

    import asyncio

    return await asyncio.to_thread(_urllib)


async def fetch_nostrrelay_hints(
    base_url: str,
    *,
    api_key: Optional[str] = None,
) -> dict[str, Any]:
    """Probe LNbits Nostr Relay extension for this user's active relays."""
    root = lnbits_instance_root_url(base_url)
    extensions_url = root + "/extensions"
    nostrrelay_url = root + "/nostrrelay/"

    empty = nostrrelay_hints_shell(base_url)
    empty["extension_url"] = nostrrelay_url
    empty["extensions_url"] = extensions_url

    if not (api_key or "").strip():
        return empty

    url = root + "/nostrrelay/api/v1/relay"
    try:
        status, payload = await _get_json_with_api_key(
            url, api_key.strip(), timeout=3.0
        )
    except Exception as exc:  # noqa: BLE001
        logger.debug(f"trato nostrrelay hints unavailable: {exc}")
        return empty

    if status == 404:
        empty["note"] = (
            "Install and enable the Nostr Relay extension on this LNbits instance, "
            "then create a relay in its UI."
        )
        return empty

    if status != 200 or not isinstance(payload, list):
        logger.debug(f"trato nostrrelay hints status {status}")
        return empty

    relays = pick_user_nostrrelays(payload, root=root)
    note = empty["note"]
    if relays:
        note = (
            "These are your active relays on this LNbits instance. Add one to publish "
            "your Trato profile and read the order book through your own relay."
        )
    else:
        note = (
            "Nostr Relay is installed — create and activate a relay in the extension, "
            "then return here to add its WebSocket URL."
        )

    return {
        "extension_installed": True,
        "extension_url": nostrrelay_url,
        "extensions_url": extensions_url,
        "relays": relays,
        "note": note,
    }


__all__ = [
    "api_key_from_request_headers",
    "fetch_nostrrelay_hints",
    "nostrrelay_admin_url",
    "nostrrelay_hints_shell",
    "nostrrelay_websocket_url",
    "pick_user_nostrrelays",
]
