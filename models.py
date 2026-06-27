"""Pydantic models + DB row models for the Trato LNbits extension.

These describe the LNbits-side persisted state (settings, the user's Nostr
trading identity, and local order/trade state). The pure wire types live in
`trato.mostro` and are intentionally kept separate.

Money rule: `amount_sats` is always an integer number of satoshis. Fiat amounts
are quote values and may be fractional (other platforms publish fractions).
"""

from __future__ import annotations

import json
import time
from typing import Optional

from pydantic import BaseModel, Field, validator

from .mostro.orderbook import normalize_rating

DEFAULT_RELAYS = [
    "wss://relay.mostro.network",
    "wss://relay.damus.io",
    "wss://nostr.bitcoiner.social",
    "wss://relay.nostr.net",
    "wss://nostr.robosats.org",
]


def now() -> int:
    return int(time.time())


# --- Settings ---------------------------------------------------------------
class TratoSettings(BaseModel):
    """Per-user Trato configuration."""

    user: str
    relays: list[str] = Field(default_factory=lambda: list(DEFAULT_RELAYS))
    mostro_pubkey: Optional[str] = None  # default operator (hex) to trade with
    demo_mode: bool = True               # never moves real money while true
    mainnet_enabled: bool = False        # hard gate for real mainnet trading
    encrypted_nwc_uri: Optional[str] = None
    robosats_coordinator: Optional[str] = None  # federation shortAlias
    encrypted_robosats_token: Optional[str] = None
    created_at: int = Field(default_factory=now)
    updated_at: int = Field(default_factory=now)

    @classmethod
    def from_row(cls, row: dict) -> "TratoSettings":
        data = dict(row)
        data["relays"] = json.loads(data.get("relays") or "[]") or list(DEFAULT_RELAYS)
        data["demo_mode"] = bool(data.get("demo_mode", True))
        data["mainnet_enabled"] = bool(data.get("mainnet_enabled", False))
        return cls(**data)

    def reconcile_trading_mode(
        self,
        *,
        demo_set: Optional[bool] = None,
        mainnet_set: Optional[bool] = None,
    ) -> None:
        """Demo mode and mainnet are mutually exclusive."""
        if demo_set is True:
            self.mainnet_enabled = False
        elif mainnet_set is True:
            self.demo_mode = False
        elif self.demo_mode and self.mainnet_enabled:
            # Persisted conflict — prefer live trading.
            self.demo_mode = False

    def public_dict(self) -> dict:
        return {
            "user": self.user,
            "relays": self.relays,
            "mostro_pubkey": self.mostro_pubkey,
            "demo_mode": self.demo_mode,
            "mainnet_enabled": self.mainnet_enabled,
            "has_nwc": bool(self.encrypted_nwc_uri),
            "robosats_coordinator": self.robosats_coordinator,
            "has_robosats_robot": bool(self.encrypted_robosats_token),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class UpdateSettings(BaseModel):
    relays: Optional[list[str]] = None
    mostro_pubkey: Optional[str] = None
    demo_mode: Optional[bool] = None
    mainnet_enabled: Optional[bool] = None
    nwc_uri: Optional[str] = None  # plaintext once; stored encrypted
    clear_nwc: bool = False
    robosats_coordinator: Optional[str] = None


# --- Trading identity (Nostr seed) ------------------------------------------
class Identity(BaseModel):
    """A user's Nostr trading identity.

    The BIP-39 mnemonic is stored ENCRYPTED (`encrypted_mnemonic`) and is never
    serialized to the frontend. Only the public identity (npub) is exposed.
    """

    id: str
    user: str
    wallet: str
    encrypted_mnemonic: str
    identity_pubkey: str
    identity_npub: str
    next_trade_index: int = 1
    encrypted_payment_details: Optional[str] = None
    created_at: int = Field(default_factory=now)

    def public_dict(self) -> dict:
        """Safe-to-expose view: NO secret material.

        ``encrypted_payment_details`` is the user's own fiat info (not a key), so
        we expose only whether it is set; the plaintext is fetched on demand via
        the dedicated, owner-only endpoint.
        """
        return {
            "id": self.id,
            "wallet": self.wallet,
            "identity_pubkey": self.identity_pubkey,
            "identity_npub": self.identity_npub,
            "next_trade_index": self.next_trade_index,
            "has_payment_details": bool(self.encrypted_payment_details),
            "created_at": self.created_at,
        }


class CreateIdentity(BaseModel):
    wallet: str
    # Optional: import an existing seed; otherwise a fresh one is generated.
    mnemonic: Optional[str] = None


class UpdatePaymentDetails(BaseModel):
    """Structured fiat payment profiles (encrypted at rest)."""

    payment_details: str = ""  # legacy single text block
    profiles: Optional[list[dict]] = None


class UpdateNostrProfile(BaseModel):
    """Nostr kind-0 metadata published to relays for the trading identity."""

    display_name: str = Field(default="", max_length=64)
    name: str = Field(default="", max_length=64)
    picture: str = Field(default="", max_length=2048)
    about: str = Field(default="", max_length=1000)
    nip05: str = Field(default="", max_length=128)
    lud16: str = Field(default="", max_length=200)


class SharePaymentProfile(BaseModel):
    profile_id: str
    meetup_at: Optional[int] = None  # unix UTC for cash-in-person proposals


# --- Local order / trade state ----------------------------------------------
class CreateOrder(BaseModel):
    side: str  # "buy" | "sell" — your intent as maker (same on the wire)
    fiat_code: str
    payment_method: str
    amount_sats: int = 0           # 0 == market price
    fiat_amount: Optional[float] = None
    fiat_min: Optional[float] = None
    fiat_max: Optional[float] = None
    premium: float = 0.0
    mostro_pubkey: Optional[str] = None  # operator to route through
    settlement_layers: list[str] = Field(default_factory=lambda: ["lightning"])

    @validator("settlement_layers", pre=True)
    def _normalize_layers(cls, value):
        if value is None:
            return ["lightning"]
        if isinstance(value, str):
            value = [value]
        layers = [str(v).strip().lower() for v in value if str(v).strip()]
        allowed = {"lightning", "onchain"}
        clean = [v for v in layers if v in allowed]
        return clean or ["lightning"]


class TakeOrder(BaseModel):
    order_id: str                  # mostro order id (d tag)
    mostro_pubkey: str             # operator that published it
    kind: str                      # the PUBLIC order's kind: "buy" | "sell"
    amount_sats: Optional[int] = None      # for market-price orders
    fiat_amount: Optional[float] = None     # for range orders (fiat units)
    fiat_code: str = ""
    payment_method: str = ""
    # Snapshot of public-book trust signals at take time (for the trade UI).
    platform: str = ""
    maker_name: Optional[str] = None
    maker_identity_pubkey: Optional[str] = None
    rating: Optional[dict] = None
    bonded: bool = False
    settlement_layer: str = "lightning"
    source: Optional[str] = None  # RoboSats coordinator order URL (from book row)

    @validator("settlement_layer")
    def _settlement_layer_ok(cls, value):
        layer = (value or "lightning").strip().lower()
        if layer not in ("lightning", "onchain"):
            raise ValueError("settlement_layer must be lightning or onchain")
        return layer

    @validator("rating", pre=True)
    def _rating_is_dict(cls, value):
        return normalize_rating(value)

    @validator("maker_identity_pubkey", pre=True)
    def _normalize_maker_pubkey(cls, value):
        if not value:
            return None
        from .nostr.pubkey import normalize_pubkey

        return normalize_pubkey(str(value))


class OrderAction(BaseModel):
    """A user-initiated lifecycle action on one of the user's orders."""

    action: str                    # fiat-sent | release | cancel | dispute | rate-user
    rating: Optional[int] = None   # 1..5, required for rate-user

    @validator("rating")
    def _rating_1_to_5(cls, value):
        if value is None:
            return value
        try:
            stars = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError("rating must be an integer from 1 to 5") from exc
        if stars < 1 or stars > 5:
            raise ValueError("rating must be between 1 and 5")
        return stars


class ChatMessage(BaseModel):
    text: str


class Order(BaseModel):
    """Local record of an order the user is party to (maker or taker).

    ``side`` is the user's own Bitcoin action: "buy" == receives sats (BUYER),
    "sell" == sends sats (SELLER). ``mostro_order_id`` is the operator-assigned
    id every protocol message references (our ``id`` is only a local row key).
    """

    id: str
    user: str
    identity_id: str
    role: str                      # "maker" | "taker"
    side: str                      # "buy" | "sell" (user's BTC action)
    mostro_pubkey: str
    trade_index: int
    trade_pubkey: str
    status: str
    fiat_code: str
    payment_method: str = ""
    amount_sats: int = 0
    fiat_amount: Optional[float] = None
    premium: float = 0.0
    order_json: str = "{}"
    demo: bool = True              # frozen at create/take from settings.demo_mode
    mostro_order_id: Optional[str] = None
    peer_pubkey: Optional[str] = None
    buyer_invoice: Optional[str] = None
    hold_invoice: Optional[str] = None
    rated: bool = False
    last_event_at: int = 0
    created_at: int = Field(default_factory=now)
    updated_at: int = Field(default_factory=now)

    @classmethod
    def from_row(cls, row: dict) -> "Order":
        data = dict(row)
        data["demo"] = bool(data.get("demo", True))
        data["rated"] = bool(data.get("rated", False))
        return cls(**data)


class TradeEvent(BaseModel):
    """An audit/timeline entry for a trade (incoming/outgoing/chat/system)."""

    id: str
    order_id: Optional[str]
    user: str
    direction: str                 # "in" | "out" | "system" | "chat"
    kind: str                      # action name, "note", or "chat"
    payload: Optional[str] = None
    created_at: int = Field(default_factory=now)
