"""Pure trade-flow state machine for a Mostro *client*.

This encodes how a client (buyer or seller) reacts to each operator message and
which actions the user may take in each state. It is deliberately free of any
I/O (no LNbits, no Nostr, no DB) so every transition can be unit-tested
exhaustively - the part where a mistake would strand real money.

Two roles in money terms, derived from the user's own side:
  - SELLER (side == "sell"): sends sats. Pays the operator's HOLD invoice, then
    releases once fiat is confirmed.
  - BUYER  (side == "buy"):  receives sats. Supplies a Lightning invoice, sends
    fiat off-platform, then signals fiat-sent.

`plan_incoming` maps (side, status, operator_action) -> Plan.
`plan_user_action` maps (side, status, user_action) -> Plan.
Both raise ValueError for combinations that must never happen, so callers fail
closed instead of guessing.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .protocol import Action
from .reputation import stars_from_payload


class Side(str, Enum):
    BUY = "buy"        # user receives sats (BUYER)
    SELL = "sell"      # user sends sats (SELLER)


class Role(str, Enum):
    MAKER = "maker"
    TAKER = "taker"


class LnEffect(str, Enum):
    """A Lightning action the engine must perform as part of a transition."""

    PAY_HOLD = "pay_hold"            # seller pays the operator's hold invoice
    CREATE_INVOICE = "create_invoice"  # buyer creates an invoice to receive sats


# --- Local order statuses (superset of Mostro's, all kebab-case strings) -----
class Status(str, Enum):
    PENDING = "pending"
    WAITING_PAYMENT = "waiting-payment"
    WAITING_BUYER_INVOICE = "waiting-buyer-invoice"
    ACTIVE = "active"
    FIAT_SENT = "fiat-sent"
    RELEASED = "released"
    SETTLED = "settled-hold-invoice"
    SUCCESS = "success"
    DISPUTE = "dispute"
    COOP_CANCEL_PENDING = "coop-cancel-pending"
    CANCELED = "canceled"
    COOPERATIVELY_CANCELED = "cooperatively-canceled"
    EXPIRED = "expired"


TERMINAL_STATUSES = frozenset(
    {
        Status.SUCCESS.value,
        Status.CANCELED.value,
        Status.COOPERATIVELY_CANCELED.value,
        Status.EXPIRED.value,
    }
)

# Statuses where escrow has NOT been funded yet -> a plain cancel is safe.
PRE_ESCROW_STATUSES = frozenset(
    {
        Status.PENDING.value,
        Status.WAITING_PAYMENT.value,
        Status.WAITING_BUYER_INVOICE.value,
    }
)


@dataclass
class Plan:
    """The result of evaluating a transition.

    - `status`: the new local status (None = unchanged).
    - `ln`: a Lightning side effect the engine must execute (None = none).
    - `reply`: a Mostro action to send back to the operator (None = none).
    - `note`: a short human-readable line for the timeline / audit log.
    - `needs_rating`: True once the trade is complete and a rating may be sent.
    """

    note: str
    status: str | None = None
    ln: LnEffect | None = None
    reply: Action | None = None
    needs_rating: bool = False


def is_seller(side: str) -> bool:
    return side == Side.SELL.value


def is_buyer(side: str) -> bool:
    return side == Side.BUY.value


# --- Operator -> client -----------------------------------------------------
def plan_incoming(
    side: str, status: str, action: Action, payload: dict | None = None
) -> Plan:
    """Decide how the client reacts to an operator message.

    Unknown/irrelevant actions return a no-op Plan with a note rather than
    raising, because operators legitimately emit informational messages we only
    need to record.
    """
    seller = is_seller(side)
    buyer = is_buyer(side)

    # --- escrow setup ---
    if action == Action.PAY_INVOICE:
        if not seller:
            raise ValueError("pay-invoice received but client is not the seller")
        return Plan(
            note="Operator sent the hold invoice to fund escrow.",
            status=Status.WAITING_PAYMENT.value,
            ln=LnEffect.PAY_HOLD,
        )

    if action == Action.ADD_INVOICE:
        if not buyer:
            raise ValueError("add-invoice received but client is not the buyer")
        return Plan(
            note="Operator requested your Lightning invoice to receive the sats.",
            status=Status.WAITING_BUYER_INVOICE.value,
            ln=LnEffect.CREATE_INVOICE,
            reply=Action.ADD_INVOICE,
        )

    # --- waiting / informational ---
    if action == Action.WAITING_SELLER_TO_PAY:
        return Plan(note="Waiting for the seller to fund escrow.",
                    status=Status.WAITING_PAYMENT.value)
    if action == Action.WAITING_BUYER_INVOICE:
        return Plan(note="Waiting for the buyer's invoice.",
                    status=Status.WAITING_BUYER_INVOICE.value)
    if action == Action.BUYER_TOOK_ORDER:
        return Plan(note="A buyer took your order.")

    # --- escrow funded -> trade active ---
    if action in (Action.HOLD_INVOICE_PAYMENT_ACCEPTED, Action.BUYER_INVOICE_ACCEPTED):
        return Plan(note="Escrow is funded. Trade is active.",
                    status=Status.ACTIVE.value)

    # --- fiat ---
    if action in (Action.FIAT_SENT, Action.FIAT_SENT_OK):
        return Plan(note="Buyer marked the fiat as sent.",
                    status=Status.FIAT_SENT.value)

    # --- completion ---
    if action == Action.HOLD_INVOICE_PAYMENT_SETTLED:
        return Plan(note="Hold invoice settled. Sats released.",
                    status=Status.SUCCESS.value, needs_rating=True)
    if action == Action.RELEASED:
        return Plan(note="Seller released the sats.",
                    status=Status.RELEASED.value)
    if action == Action.PURCHASE_COMPLETED:
        return Plan(note="Purchase completed. Sats received.",
                    status=Status.SUCCESS.value, needs_rating=True)

    # --- cancels ---
    if action == Action.CANCELED:
        return Plan(note="Order canceled.", status=Status.CANCELED.value)
    if action == Action.COOPERATIVE_CANCEL_INITIATED_BY_PEER:
        return Plan(note="Peer requested a cooperative cancel.",
                    status=Status.COOP_CANCEL_PENDING.value)
    if action == Action.COOPERATIVE_CANCEL_INITIATED_BY_YOU:
        return Plan(note="You requested a cooperative cancel.",
                    status=Status.COOP_CANCEL_PENDING.value)
    if action == Action.COOPERATIVE_CANCEL_ACCEPTED:
        return Plan(note="Cooperative cancel accepted.",
                    status=Status.COOPERATIVELY_CANCELED.value)

    # --- disputes ---
    if action in (Action.DISPUTE_INITIATED_BY_YOU, Action.DISPUTE_INITIATED_BY_PEER):
        return Plan(note="A dispute was opened. A solver will mediate.",
                    status=Status.DISPUTE.value)
    if action == Action.ADMIN_TOOK_DISPUTE:
        return Plan(note="A solver took your dispute. They will mediate in chat.")
    if action == Action.ADMIN_SETTLE:
        return Plan(note="Solver is releasing Bitcoin to the buyer.")
    if action == Action.ADMIN_SETTLED:
        return Plan(note="Dispute resolved — sats released to the buyer.",
                    status=Status.SUCCESS.value, needs_rating=True)
    if action == Action.ADMIN_CANCEL:
        return Plan(note="Solver is refunding escrow to the seller.")
    if action == Action.ADMIN_CANCELED:
        return Plan(note="Dispute resolved — escrow refunded.",
                    status=Status.CANCELED.value)
    if action == Action.HOLD_INVOICE_PAYMENT_CANCELED:
        if status == Status.DISPUTE.value:
            return Plan(note="Escrow refunded after dispute.",
                        status=Status.CANCELED.value)
        return Plan(note="Hold invoice canceled; escrow refunded.")

    # --- ratings / misc ---
    if action == Action.RATE:
        return Plan(note="You can now rate your counterpart.", needs_rating=True)
    if action == Action.RATE_RECEIVED:
        stars = stars_from_payload(payload)
        if stars:
            return Plan(note=f"Your counterpart rated you {stars}/5.")
        return Plan(note="Your counterpart rated you.")
    if action == Action.PAYMENT_FAILED:
        return Plan(note="Paying your invoice failed; the operator will retry.")
    if action == Action.CANT_DO:
        return Plan(note="Operator rejected the last request (cant-do).")

    return Plan(note=f"Operator message: {action.value}")


# --- client (user) -> operator ----------------------------------------------
def plan_user_action(side: str, status: str, action: Action) -> Plan:
    """Decide the effect of a user-initiated action, validating it is allowed."""
    seller = is_seller(side)
    buyer = is_buyer(side)

    if action == Action.FIAT_SENT:
        if not buyer:
            raise ValueError("only the buyer can mark fiat as sent")
        if status not in (Status.ACTIVE.value, Status.WAITING_PAYMENT.value,
                          Status.WAITING_BUYER_INVOICE.value):
            raise ValueError(f"cannot mark fiat-sent from status {status!r}")
        return Plan(note="You marked the fiat as sent.",
                    status=Status.FIAT_SENT.value, reply=Action.FIAT_SENT)

    if action == Action.RELEASE:
        if not seller:
            raise ValueError("only the seller can release the sats")
        if status not in (Status.FIAT_SENT.value, Status.ACTIVE.value):
            raise ValueError(f"cannot release from status {status!r}")
        return Plan(note="You released the sats.",
                    status=Status.RELEASED.value, reply=Action.RELEASE)

    if action == Action.CANCEL:
        if status in TERMINAL_STATUSES:
            raise ValueError("order already finished")
        if status in PRE_ESCROW_STATUSES:
            return Plan(note="You canceled the order.",
                        status=Status.CANCELED.value, reply=Action.CANCEL)
        return Plan(note="You requested a cooperative cancel.",
                    status=Status.COOP_CANCEL_PENDING.value, reply=Action.CANCEL)

    if action == Action.DISPUTE:
        if status not in (Status.ACTIVE.value, Status.FIAT_SENT.value,
                          Status.WAITING_PAYMENT.value, Status.RELEASED.value):
            raise ValueError(f"cannot dispute from status {status!r}")
        return Plan(note="You opened a dispute.",
                    status=Status.DISPUTE.value, reply=Action.DISPUTE)

    if action == Action.RATE_USER:
        if status not in (Status.SUCCESS.value, Status.RELEASED.value):
            raise ValueError("can only rate after the trade succeeds")
        return Plan(note="You rated your counterpart.", reply=Action.RATE_USER)

    raise ValueError(f"unsupported user action: {action.value}")


def allowed_user_actions(side: str, status: str) -> list[str]:
    """Which user actions the UI should offer in the given state."""
    out: list[str] = []
    for action in (Action.FIAT_SENT, Action.RELEASE, Action.CANCEL,
                   Action.DISPUTE, Action.RATE_USER):
        try:
            plan_user_action(side, status, action)
            out.append(action.value)
        except ValueError:
            continue
    return out
