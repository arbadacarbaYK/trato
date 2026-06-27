"""High-level Mostro client message builders.

These compose `protocol.build_message` with the correct channel/action/payload
for each step a *client* (maker or taker) sends to a Mostro operator. Keeping
them in one place means the exact wire shape for every money-affecting action is
auditable side by side, and unit-testable without any network or LNbits.

Reference: mostro-core message.rs + mostro-cli. PROTOCOL_VER = 1.

Conventions used by Mostro for client -> operator messages:
  - The order/dispute id goes in MessageKind.id (omitted only for new-order).
  - `trade_index` is set in reputation mode (the per-trade key index) and left
    None in full-privacy mode; the transport signs with the trade key in the
    former and uses a null signature in the latter.
  - Payloads are the snake_case single-key objects from `protocol`.
"""

from __future__ import annotations

from .order import SmallOrder
from .protocol import (
    Action,
    Channel,
    build_message,
    payload_amount,
    payload_order,
    payload_payment_request,
    payload_rating_user,
    payload_text_message,
)


def new_order(small_order: SmallOrder, *, trade_index: int | None = None) -> dict:
    """Maker publishes a brand new order (no id yet; Mostro assigns one)."""
    small_order.check_valid_for_new()
    return build_message(
        Channel.ORDER,
        Action.NEW_ORDER,
        payload=payload_order(small_order.to_dict()),
        trade_index=trade_index,
    )


def take_sell(
    order_id: str,
    *,
    fiat_amount: int | None = None,
    trade_index: int | None = None,
) -> dict:
    """Taker takes a public SELL order (the taker becomes the BUYER of sats).

    For a range order, `fiat_amount` selects how much fiat to trade and is sent
    as the Amount payload; for a fixed order it is omitted.
    """
    payload = payload_amount(fiat_amount) if fiat_amount is not None else None
    return build_message(
        Channel.ORDER,
        Action.TAKE_SELL,
        payload=payload,
        order_id=order_id,
        trade_index=trade_index,
    )


def take_buy(
    order_id: str,
    *,
    fiat_amount: int | None = None,
    trade_index: int | None = None,
) -> dict:
    """Taker takes a public BUY order (the taker becomes the SELLER of sats)."""
    payload = payload_amount(fiat_amount) if fiat_amount is not None else None
    return build_message(
        Channel.ORDER,
        Action.TAKE_BUY,
        payload=payload,
        order_id=order_id,
        trade_index=trade_index,
    )


def add_invoice(
    order_id: str,
    bolt11: str,
    *,
    trade_index: int | None = None,
) -> dict:
    """Buyer supplies the Lightning invoice that will receive the sats.

    Sent in response to the operator's `add-invoice` request. The order and
    amount are matched by the operator via the id, so we send them as null.
    """
    return build_message(
        Channel.ORDER,
        Action.ADD_INVOICE,
        payload=payload_payment_request(None, bolt11, None),
        order_id=order_id,
        trade_index=trade_index,
    )


def fiat_sent(order_id: str, *, trade_index: int | None = None) -> dict:
    """Buyer signals they have sent the fiat off-platform."""
    return build_message(
        Channel.ORDER,
        Action.FIAT_SENT,
        order_id=order_id,
        trade_index=trade_index,
    )


def release(order_id: str, *, trade_index: int | None = None) -> dict:
    """Seller releases the escrow so the operator settles the hold invoice."""
    return build_message(
        Channel.ORDER,
        Action.RELEASE,
        order_id=order_id,
        trade_index=trade_index,
    )


def cancel(order_id: str, *, trade_index: int | None = None) -> dict:
    """Cancel an order (before escrow) or request a cooperative cancel."""
    return build_message(
        Channel.ORDER,
        Action.CANCEL,
        order_id=order_id,
        trade_index=trade_index,
    )


def dispute(order_id: str, *, trade_index: int | None = None) -> dict:
    """Open a dispute; a human solver will mediate."""
    return build_message(
        Channel.DISPUTE,
        Action.DISPUTE,
        order_id=order_id,
        trade_index=trade_index,
    )


def rate_user(order_id: str, value: int, *, trade_index: int | None = None) -> dict:
    """Rate the counterpart 1..5 after a successful trade."""
    return build_message(
        Channel.RATE,
        Action.RATE_USER,
        payload=payload_rating_user(value),
        order_id=order_id,
        trade_index=trade_index,
    )


def direct_message(order_id: str, text: str, *, trade_index: int | None = None) -> dict:
    """A free-text message routed through the operator (kind `dm`)."""
    return build_message(
        Channel.DM,
        Action.SEND_DM,
        payload=payload_text_message(text),
        order_id=order_id,
        trade_index=trade_index,
    )
