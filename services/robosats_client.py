"""RoboSats coordinator REST client (take + bond + post-bond lifecycle)."""

from __future__ import annotations

import hashlib
import secrets
from typing import Any

from .robosats_federation import federation

ROBOSATS_STATUS_PUBLIC = 1
ROBOSATS_STATUS_WAITING_TAKER_BOND = 3
ROBOSATS_STATUS_WAITING_COLLATERAL = 6
ROBOSATS_STATUS_WAITING_SELLER_COLLATERAL = 7
ROBOSATS_STATUS_WAITING_BUYER_INVOICE = 8
ROBOSATS_STATUS_CHAT = 9
ROBOSATS_STATUS_FIAT_SENT = 10
ROBOSATS_STATUS_DISPUTE = 11
ROBOSATS_STATUS_SENDING_SATS = 13
ROBOSATS_STATUS_SUCCESS = 14

ROBOSATS_STATUS_LABELS: dict[int, str] = {
    0: "Waiting for maker bond",
    1: "Public",
    2: "Paused",
    3: "Waiting for taker bond",
    4: "Cancelled",
    5: "Expired",
    6: "Waiting for trade collateral and buyer invoice",
    7: "Waiting for seller trade collateral",
    8: "Waiting for buyer invoice",
    9: "Sending fiat — in chat",
    10: "Fiat sent — in chat",
    11: "In dispute",
    12: "Collaboratively cancelled",
    13: "Sending satoshis to buyer",
    14: "Successful trade",
    15: "Failed lightning routing",
    16: "Waiting for dispute resolution",
    17: "Maker lost dispute",
    18: "Taker lost dispute",
}


def new_robot_token() -> str:
    return secrets.token_urlsafe(36)


def robot_auth_header(token: str) -> str:
    """Authorization header for coordinator API (SHA-256 of token, hex)."""
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return f"Token {digest}"


async def _coordinator_request(
    coordinator_base: str,
    *,
    robot_token: str,
    method: str,
    params: dict[str, Any] | None = None,
    body: dict[str, Any] | None = None,
    timeout: float = 12.0,
) -> dict[str, Any]:
    import httpx

    url = f"{coordinator_base.rstrip('/')}/api/order/"
    headers = {"Authorization": robot_auth_header(robot_token)}
    async with httpx.AsyncClient(timeout=timeout) as client:
        if method.upper() == "GET":
            resp = await client.get(url, params=params or {}, headers=headers)
        else:
            resp = await client.post(url, json=body or {}, headers=headers)
    if resp.status_code >= 400:
        detail = resp.text[:200] if resp.text else resp.reason_phrase
        raise RuntimeError(
            f"RoboSats coordinator error ({resp.status_code}): {detail}"
        )
    data = resp.json()
    if not isinstance(data, dict):
        raise RuntimeError("RoboSats returned an unexpected response.")
    return data


async def fetch_order(
    coordinator_base: str,
    *,
    robot_token: str,
    order_id: str,
) -> dict[str, Any]:
    """GET current coordinator order state for this robot."""
    return await _coordinator_request(
        coordinator_base,
        robot_token=robot_token,
        method="GET",
        params={"order_id": order_id},
    )


async def post_order_action(
    coordinator_base: str,
    *,
    robot_token: str,
    order_id: str,
    action: str,
    **fields: Any,
) -> dict[str, Any]:
    """POST an order action (take, confirm, update_invoice, cancel, dispute, …)."""
    body = {"order_id": order_id, "action": action, **fields}
    return await _coordinator_request(
        coordinator_base,
        robot_token=robot_token,
        method="POST",
        body=body,
    )


async def take_public_order(
    coordinator_base: str,
    *,
    robot_token: str,
    order_id: str,
) -> dict[str, Any]:
    """POST take on a public RoboSats order. Returns coordinator JSON."""
    return await post_order_action(
        coordinator_base,
        robot_token=robot_token,
        order_id=order_id,
        action="take",
    )


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


def escrow_invoice_from_response(payload: dict[str, Any]) -> str | None:
    inv = payload.get("escrow_invoice")
    if isinstance(inv, str) and inv.startswith("ln"):
        return inv
    return None


def order_status_code(payload: dict[str, Any]) -> int | None:
    raw = payload.get("status")
    try:
        return int(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def trato_status_for_robosats(status: int | None) -> str | None:
    """Map coordinator status to Trato order.status when unambiguous."""
    if status is None:
        return None
    if status in (
        ROBOSATS_STATUS_WAITING_TAKER_BOND,
        ROBOSATS_STATUS_WAITING_COLLATERAL,
        ROBOSATS_STATUS_WAITING_SELLER_COLLATERAL,
        ROBOSATS_STATUS_WAITING_BUYER_INVOICE,
    ):
        return "active"
    if status in (ROBOSATS_STATUS_CHAT, ROBOSATS_STATUS_FIAT_SENT):
        return "fiat-sent" if status == ROBOSATS_STATUS_FIAT_SENT else "active"
    if status == ROBOSATS_STATUS_DISPUTE:
        return "dispute"
    if status in (ROBOSATS_STATUS_SENDING_SATS, ROBOSATS_STATUS_SUCCESS):
        return "success"
    if status in (4, 5, 12, 15, 17, 18):
        return "canceled"
    return None
