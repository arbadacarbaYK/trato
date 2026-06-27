"""Faithful Python port of the mostro-core message layer.

Ported from mostro-core/src/message.rs (PROTOCOL_VER = 1). This defines the
exact JSON shapes exchanged with the live Mostro network. Getting these wrong
risks stuck funds, so the structures mirror the Rust serde derives precisely:

  - `Message` is a tagged union keyed by channel name (kebab-case):
    {"order"|"dispute"|"cant-do"|"rate"|"dm"|"restore": <MessageKind>}
  - `MessageKind` fields: version, request_id, trade_index, id (omitted when
    None), action, payload.
  - `Action` values are kebab-case.
  - `Payload` is a single-key object whose key is the snake_case variant name.

The envelope wrapping (the [message, signature] array and gift wrap) lives in
nostr/transport.py; this module only builds/parses the message object.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from .constants import PROTOCOL_VER


class Channel(str, Enum):
    """Top-level Message variant (the outer JSON key)."""

    ORDER = "order"
    DISPUTE = "dispute"
    CANT_DO = "cant-do"
    RATE = "rate"
    DM = "dm"
    RESTORE = "restore"


class Action(str, Enum):
    """Mostro Action verbs (kebab-case wire values), ported 1:1 from message.rs."""

    NEW_ORDER = "new-order"
    TAKE_SELL = "take-sell"
    TAKE_BUY = "take-buy"
    PAY_INVOICE = "pay-invoice"
    PAY_BOND_INVOICE = "pay-bond-invoice"
    FIAT_SENT = "fiat-sent"
    FIAT_SENT_OK = "fiat-sent-ok"
    RELEASE = "release"
    RELEASED = "released"
    CANCEL = "cancel"
    CANCELED = "canceled"
    COOPERATIVE_CANCEL_INITIATED_BY_YOU = "cooperative-cancel-initiated-by-you"
    COOPERATIVE_CANCEL_INITIATED_BY_PEER = "cooperative-cancel-initiated-by-peer"
    DISPUTE_INITIATED_BY_YOU = "dispute-initiated-by-you"
    DISPUTE_INITIATED_BY_PEER = "dispute-initiated-by-peer"
    COOPERATIVE_CANCEL_ACCEPTED = "cooperative-cancel-accepted"
    BUYER_INVOICE_ACCEPTED = "buyer-invoice-accepted"
    BOND_INVOICE_ACCEPTED = "bond-invoice-accepted"
    PURCHASE_COMPLETED = "purchase-completed"
    BOND_PAYOUT_COMPLETED = "bond-payout-completed"
    BOND_SLASHED = "bond-slashed"
    HOLD_INVOICE_PAYMENT_ACCEPTED = "hold-invoice-payment-accepted"
    HOLD_INVOICE_PAYMENT_SETTLED = "hold-invoice-payment-settled"
    HOLD_INVOICE_PAYMENT_CANCELED = "hold-invoice-payment-canceled"
    WAITING_SELLER_TO_PAY = "waiting-seller-to-pay"
    WAITING_BUYER_INVOICE = "waiting-buyer-invoice"
    ADD_INVOICE = "add-invoice"
    ADD_BOND_INVOICE = "add-bond-invoice"
    BUYER_TOOK_ORDER = "buyer-took-order"
    RATE = "rate"
    RATE_USER = "rate-user"
    RATE_RECEIVED = "rate-received"
    CANT_DO = "cant-do"
    DISPUTE = "dispute"
    ADMIN_CANCEL = "admin-cancel"
    ADMIN_CANCELED = "admin-canceled"
    ADMIN_SETTLE = "admin-settle"
    ADMIN_SETTLED = "admin-settled"
    ADMIN_ADD_SOLVER = "admin-add-solver"
    ADMIN_TAKE_DISPUTE = "admin-take-dispute"
    ADMIN_TOOK_DISPUTE = "admin-took-dispute"
    PAYMENT_FAILED = "payment-failed"
    INVOICE_UPDATED = "invoice-updated"
    SEND_DM = "send-dm"
    TRADE_PUBKEY = "trade-pubkey"
    RESTORE_SESSION = "restore-session"
    LAST_TRADE_INDEX = "last-trade-index"
    ORDERS = "orders"
    ADD_CASHU_ESCROW = "add-cashu-escrow"
    CASHU_ESCROW_LOCKED = "cashu-escrow-locked"
    CASHU_PM_SIGNATURE = "cashu-pm-signature"


# --- Payload builders (snake_case single-key objects) -----------------------
# Each returns the JSON object Mostro expects under MessageKind.payload.

def payload_order(small_order: dict) -> dict:
    return {"order": small_order}


def payload_payment_request(
    small_order: dict | None, bolt11: str, amount: int | None = None
) -> dict:
    # Rust: PaymentRequest(Option<SmallOrder>, String, Option<Amount>)
    return {"payment_request": [small_order, bolt11, amount]}


def payload_text_message(text: str) -> dict:
    return {"text_message": text}


def payload_peer(peer: dict) -> dict:
    return {"peer": peer}


def payload_rating_user(value: int) -> dict:
    if not 1 <= value <= 5:
        raise ValueError("rating must be between 1 and 5")
    return {"rating_user": value}


def payload_amount(amount: int) -> dict:
    return {"amount": amount}


def payload_next_trade(pubkey_hex: str, index: int) -> dict:
    return {"next_trade": [pubkey_hex, index]}


def payload_dispute(dispute_id: str, solver_info: dict | None = None) -> dict:
    return {"dispute": [dispute_id, solver_info]}


# --- MessageKind / Message --------------------------------------------------

def build_message_kind(
    action: Action,
    *,
    payload: dict | None = None,
    order_id: str | None = None,
    request_id: int | None = None,
    trade_index: int | None = None,
) -> dict:
    """Build a MessageKind dict matching the serde layout in message.rs.

    `id` (order/dispute id) is omitted when None (serde skip_serializing_if);
    request_id, trade_index and payload are always present (null when unset),
    mirroring the Rust struct.
    """
    kind: dict[str, Any] = {
        "version": PROTOCOL_VER,
        "request_id": request_id,
        "trade_index": trade_index,
    }
    if order_id is not None:
        kind["id"] = order_id
    kind["action"] = action.value
    kind["payload"] = payload
    return kind


def build_message(
    channel: Channel,
    action: Action,
    *,
    payload: dict | None = None,
    order_id: str | None = None,
    request_id: int | None = None,
    trade_index: int | None = None,
) -> dict:
    """Build a full Message object: {channel: MessageKind}."""
    return {
        channel.value: build_message_kind(
            action,
            payload=payload,
            order_id=order_id,
            request_id=request_id,
            trade_index=trade_index,
        )
    }


def parse_message(message_obj: dict) -> tuple[Channel, dict]:
    """Split a Message object into (channel, message_kind dict).

    Fails safe on unknown channels and on a protocol version newer than we
    understand, so we never act on money flows we cannot fully interpret.
    """
    if len(message_obj) != 1:
        raise ValueError("a Mostro Message must have exactly one channel key")
    raw_channel, kind = next(iter(message_obj.items()))
    try:
        channel = Channel(raw_channel)
    except ValueError as exc:
        raise ValueError(f"unknown Mostro channel: {raw_channel!r}") from exc
    if not isinstance(kind, dict):
        raise ValueError("MessageKind must be an object")
    version = kind.get("version")
    if version is not None and version > PROTOCOL_VER:
        raise ValueError(
            f"refusing message: protocol v{version} newer than supported v{PROTOCOL_VER}"
        )
    return channel, kind


def message_action(message_obj: dict) -> Action:
    _, kind = parse_message(message_obj)
    return Action(kind["action"])


# --- verify(): action -> payload/id consistency (ported from MessageKind::verify) ---

def _payload_variant(kind: dict) -> str | None:
    """Return the snake_case payload variant key, or None if no payload."""
    payload = kind.get("payload")
    if payload is None:
        return None
    if not isinstance(payload, dict) or len(payload) != 1:
        return "__invalid__"
    return next(iter(payload.keys()))


# Actions that only require: id present, and payload is NOT a bond-only variant.
_GENERIC_ID_ACTIONS = frozenset(
    {
        Action.TAKE_SELL, Action.TAKE_BUY, Action.FIAT_SENT, Action.FIAT_SENT_OK,
        Action.RELEASE, Action.RELEASED, Action.DISPUTE, Action.ADMIN_CANCELED,
        Action.ADMIN_SETTLED, Action.RATE, Action.RATE_RECEIVED,
        Action.ADMIN_TAKE_DISPUTE, Action.ADMIN_TOOK_DISPUTE,
        Action.DISPUTE_INITIATED_BY_YOU, Action.DISPUTE_INITIATED_BY_PEER,
        Action.WAITING_BUYER_INVOICE, Action.PURCHASE_COMPLETED,
        Action.BOND_PAYOUT_COMPLETED, Action.BOND_SLASHED,
        Action.HOLD_INVOICE_PAYMENT_ACCEPTED, Action.HOLD_INVOICE_PAYMENT_SETTLED,
        Action.HOLD_INVOICE_PAYMENT_CANCELED, Action.WAITING_SELLER_TO_PAY,
        Action.BUYER_TOOK_ORDER, Action.BUYER_INVOICE_ACCEPTED,
        Action.BOND_INVOICE_ACCEPTED, Action.COOPERATIVE_CANCEL_INITIATED_BY_YOU,
        Action.COOPERATIVE_CANCEL_INITIATED_BY_PEER,
        Action.COOPERATIVE_CANCEL_ACCEPTED, Action.CANCEL, Action.INVOICE_UPDATED,
        Action.ADMIN_ADD_SOLVER, Action.SEND_DM, Action.TRADE_PUBKEY,
        Action.CASHU_ESCROW_LOCKED, Action.CANCELED,
    }
)


def verify_message_kind(kind: dict) -> bool:
    """Port of mostro-core MessageKind::verify.

    Returns True only when (action, id, payload) form a well-formed combination.
    Used to reject malformed messages before acting on any fund movement.
    """
    try:
        action = Action(kind.get("action"))
    except ValueError:
        return False

    has_id = kind.get("id") is not None
    variant = _payload_variant(kind)
    if variant == "__invalid__":
        return False

    if action == Action.NEW_ORDER:
        return variant == "order"

    if action in (Action.PAY_INVOICE, Action.PAY_BOND_INVOICE, Action.ADD_INVOICE):
        return has_id and variant == "payment_request"

    if action == Action.ADD_BOND_INVOICE:
        return has_id and variant in ("bond_payout_request", "payment_request")

    if action in (Action.ADMIN_SETTLE, Action.ADMIN_CANCEL):
        return has_id and variant in (None, "bond_resolution")

    if action == Action.ADD_CASHU_ESCROW:
        return has_id and variant == "cashu_lock_proof"

    if action == Action.CASHU_PM_SIGNATURE:
        payload = kind.get("payload") or {}
        sigs = payload.get("cashu_signatures")
        return has_id and isinstance(sigs, list) and len(sigs) > 0

    if action in (Action.LAST_TRADE_INDEX, Action.RESTORE_SESSION):
        return variant is None

    if action == Action.PAYMENT_FAILED:
        return has_id and variant == "payment_failed"

    if action == Action.RATE_USER:
        return variant == "rating_user"

    if action == Action.CANT_DO:
        return variant == "cant_do"

    if action == Action.ORDERS:
        return variant in ("ids", "orders")

    if action in _GENERIC_ID_ACTIONS:
        return has_id and variant not in ("bond_resolution", "bond_payout_request")

    return False


def verify_message(message_obj: dict) -> bool:
    """Verify a full Message object (channel wrapper + kind)."""
    try:
        _, kind = parse_message(message_obj)
    except ValueError:
        return False
    return verify_message_kind(kind)
