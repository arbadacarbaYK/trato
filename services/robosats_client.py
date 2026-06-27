"""RoboSats coordinator REST client (take + bond)."""

from __future__ import annotations

import hashlib
import secrets
from typing import Any

from loguru import logger

from .robosats_federation import federation

ROBOSATS_STATUS_PUBLIC = 1
ROBOSATS_STATUS_WAITING_TAKER_BOND = 3


def new_robot_token() -> str:
    return secrets.token_urlsafe(36)


def robot_auth_header(token: str) -> str:
    """Authorization header for coordinator API (SHA-256 of token, hex)."""
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return f"Token {digest}"


async def take_public_order(
    coordinator_base: str,
    *,
    robot_token: str,
    order_id: str,
) -> dict[str, Any]:
    """POST take on a public RoboSats order. Returns coordinator JSON."""
    import httpx

    url = f"{coordinator_base.rstrip('/')}/api/order/"
    headers = {"Authorization": robot_auth_header(robot_token)}
    body = {"order_id": order_id, "action": "take"}
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.post(url, json=body, headers=headers)
    if resp.status_code >= 400:
        detail = resp.text[:200] if resp.text else resp.reason_phrase
        raise RuntimeError(f"RoboSats take failed ({resp.status_code}): {detail}")
    return resp.json()


async def coordinator_for_order(pubkey_hex: str, alias: str | None) -> str | None:
    await federation.ensure_loaded()
    if alias:
        url = federation.coordinator_url_for_alias(alias)
        if url:
            return url
    return federation.coordinator_url(pubkey_hex)


def bond_invoice_from_take_response(payload: dict[str, Any]) -> str | None:
    inv = payload.get("bond_invoice")
    if isinstance(inv, str) and inv.startswith("ln"):
        return inv
    return None
