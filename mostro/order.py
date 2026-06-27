"""SmallOrder model + Kind/Status enums, ported from mostro-core/src/order.rs.

SmallOrder is the compact order representation carried by `Payload::Order`
(new-order) and order listings. The Rust struct uses `deny_unknown_fields`, so
we must serialize EXACTLY these keys and nothing else, with the documented skip
rules, or Mostro will reject the message.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class OrderKind(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    CANCELED_BY_ADMIN = "canceled-by-admin"
    SETTLED_BY_ADMIN = "settled-by-admin"
    COMPLETED_BY_ADMIN = "completed-by-admin"
    DISPUTE = "dispute"
    EXPIRED = "expired"
    FIAT_SENT = "fiat-sent"
    SETTLED_HOLD_INVOICE = "settled-hold-invoice"
    PENDING = "pending"
    SUCCESS = "success"
    WAITING_BUYER_INVOICE = "waiting-buyer-invoice"
    WAITING_PAYMENT = "waiting-payment"
    WAITING_TAKER_BOND = "waiting-taker-bond"
    WAITING_MAKER_BOND = "waiting-maker-bond"
    COOPERATIVELY_CANCELED = "cooperatively-canceled"
    IN_PROGRESS = "in-progress"


# Fields serialized only when present (serde skip_serializing_if = Option::is_none).
_SKIP_IF_NONE = ("id", "buyer_trade_pubkey", "seller_trade_pubkey", "buyer_invoice")

# All allowed SmallOrder keys (deny_unknown_fields on the Rust side).
_ALLOWED_KEYS = frozenset(
    {
        "id", "kind", "status", "amount", "fiat_code", "min_amount", "max_amount",
        "fiat_amount", "payment_method", "premium", "buyer_trade_pubkey",
        "seller_trade_pubkey", "buyer_invoice", "created_at", "expires_at",
    }
)


@dataclass
class SmallOrder:
    """Mirror of mostro-core SmallOrder."""

    kind: OrderKind | None = None
    status: OrderStatus | None = None
    amount: int = 0                       # sats; 0 == market price at take time
    fiat_code: str = ""
    fiat_amount: int = 0
    payment_method: str = ""
    premium: int = 0
    min_amount: int | None = None         # range order lower bound (fiat)
    max_amount: int | None = None         # range order upper bound (fiat)
    id: str | None = None
    buyer_trade_pubkey: str | None = None
    seller_trade_pubkey: str | None = None
    buyer_invoice: str | None = None
    created_at: int | None = None
    expires_at: int | None = None

    def to_dict(self) -> dict:
        """Serialize matching serde: required keys always, skip-none for some."""
        out: dict = {
            "kind": self.kind.value if isinstance(self.kind, OrderKind) else self.kind,
            "status": self.status.value
            if isinstance(self.status, OrderStatus)
            else self.status,
            "amount": self.amount,
            "fiat_code": self.fiat_code,
            "min_amount": self.min_amount,
            "max_amount": self.max_amount,
            "fiat_amount": self.fiat_amount,
            "payment_method": self.payment_method,
            "premium": self.premium,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
        }
        for key in _SKIP_IF_NONE:
            value = getattr(self, key)
            if value is not None:
                out[key] = value
        return out

    @classmethod
    def from_dict(cls, data: dict) -> "SmallOrder":
        unknown = set(data) - _ALLOWED_KEYS
        if unknown:
            raise ValueError(f"unknown SmallOrder fields: {sorted(unknown)}")
        kind = data.get("kind")
        status = data.get("status")
        return cls(
            kind=OrderKind(kind) if kind is not None else None,
            status=OrderStatus(status) if status is not None else None,
            amount=int(data.get("amount", 0)),
            fiat_code=data.get("fiat_code", ""),
            fiat_amount=int(data.get("fiat_amount", 0)),
            payment_method=data.get("payment_method", ""),
            premium=int(data.get("premium", 0)),
            min_amount=data.get("min_amount"),
            max_amount=data.get("max_amount"),
            id=data.get("id"),
            buyer_trade_pubkey=data.get("buyer_trade_pubkey"),
            seller_trade_pubkey=data.get("seller_trade_pubkey"),
            buyer_invoice=data.get("buyer_invoice"),
            created_at=data.get("created_at"),
            expires_at=data.get("expires_at"),
        )

    def is_range_order(self) -> bool:
        return self.min_amount is not None and self.max_amount is not None

    def check_valid_for_new(self) -> None:
        """Client-side sanity checks before publishing a new order."""
        if self.kind not in (OrderKind.BUY, OrderKind.SELL):
            raise ValueError("order kind must be buy or sell")
        if self.amount < 0:
            raise ValueError("sats amount must be >= 0 (0 means market price)")
        if self.is_range_order():
            if self.min_amount <= 0 or self.max_amount <= self.min_amount:
                raise ValueError("range order requires 0 < min_amount < max_amount")
        elif self.fiat_amount <= 0:
            raise ValueError("fiat_amount must be > 0 for a fixed-price order")
        if not self.fiat_code:
            raise ValueError("fiat_code is required")
        if not self.payment_method:
            raise ValueError("payment_method is required")
