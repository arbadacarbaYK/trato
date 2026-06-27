"""Order book: parse NIP-69 kind-38383 events into usable orders.

NIP-69 (https://github.com/nostr-protocol/nips/blob/master/69.md): addressable
P2P order events. All data lives in tags; `content` is empty. This module turns
the raw tag list of a kind-38383 event into a `PublicOrder`, which is what we
render as the live order book aggregated across every Mostro on the network.

Pure module: parsing takes a plain list-of-lists of tags so it is fully
unit-testable without a relay connection. `PublicOrder.from_nostr_event` is a
thin adapter for nostr-sdk `Event` objects.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field

from ..nostr.pubkey import normalize_pubkey
from .constants import KIND_ORDER, Z_ORDER
from .order import OrderKind, OrderStatus


def normalize_rating(value) -> dict | None:
    """Coerce heterogeneous platform ``rating`` tag JSON to a dict.

    Live relays publish floats (lnp2pbot), dicts (Mostro/Peach), and occasional
    broken list shapes. Downstream APIs expect a dict or null.
    """
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, (int, float)):
        return {"rating": float(value)}
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                return item
        return None
    if isinstance(value, str):
        try:
            return normalize_rating(json.loads(value))
        except (json.JSONDecodeError, TypeError):
            try:
                return {"rating": float(value)}
            except (TypeError, ValueError):
                return None
    return None


def _maker_pubkey_from_tags(tags: list, rating: dict | None) -> str | None:
    """Optional NIP-69 extensions and rating JSON may carry the maker identity key."""
    for tag_name in ("pubkey", "maker", "identity", "p"):
        tag = _first(tags, tag_name)
        if tag and len(tag) > 1:
            pk = normalize_pubkey(tag[1])
            if pk:
                return pk
    if isinstance(rating, dict):
        for key in ("pubkey", "identity_pubkey", "identity"):
            pk = normalize_pubkey(str(rating.get(key) or ""))
            if pk:
                return pk
    return None


def _to_number(value: str) -> int | float:
    """Parse a numeric tag value as int when integral, else float.

    Real-world platforms (RoboSats, Peach) publish fractional FIAT amounts in
    the `fa` tag (e.g. "232.23", "50.00000000"), while Mostro/lnp2pbot use
    integers. Fiat is a quote value, so float is acceptable here; the sat
    `amount` (the value that actually moves) is always parsed as a strict int.
    """
    number = float(value)
    return int(number) if number.is_integer() else number


def _to_sats(value: str) -> int:
    """Parse the `amt` tag as an integer number of satoshis (money - strict)."""
    number = float(value)
    if not number.is_integer():
        raise ValueError(f"non-integer sat amount: {value!r}")
    return int(number)


@dataclass
class PublicOrder:
    """A single order as advertised on the public book (kind 38383)."""

    id: str                                   # d tag
    kind: OrderKind                           # k tag
    fiat_code: str                            # f tag
    status: OrderStatus                       # s tag
    amount_sats: int                          # amt tag (0 == market price)
    fiat_amount: int | float | None           # fa tag (fixed) -> single value
    fiat_min: int | float | None = None       # fa tag (range) lower bound
    fiat_max: int | float | None = None       # fa tag (range) upper bound
    payment_methods: list[str] = field(default_factory=list)  # pm tag
    premium: float = 0.0                      # premium tag
    network: str = "mainnet"                  # network tag
    layer: str = "lightning"                  # primary layer tag (legacy)
    layers: list[str] = field(default_factory=lambda: ["lightning"])
    platform: str = ""                        # y tag (first value, e.g. "mostro")
    platform_instance: str | None = None      # y tag (optional second value)
    rating: dict | None = None                # rating tag (JSON string)
    maker_name: str | None = None             # name tag
    maker_pubkey: str | None = None           # optional identity pubkey (hex)
    source: str | None = None                 # source tag
    geohash: str | None = None                # g tag
    bond: str | None = None                   # bond tag
    expires_at: int | None = None             # expires_at tag
    expiration: int | None = None             # NIP-40 expiration tag
    # Nostr metadata
    mostro_pubkey: str = ""                   # event author = the operator
    event_created_at: int | None = None
    nostr_event_id: str = ""                  # hex id — for NIP-09 deletion mapping

    @property
    def is_range(self) -> bool:
        return self.fiat_min is not None and self.fiat_max is not None

    @property
    def is_market_price(self) -> bool:
        return self.amount_sats == 0

    def fiat_display(self) -> str:
        if self.is_range:
            return f"{self.fiat_min}-{self.fiat_max} {self.fiat_code}"
        return f"{self.fiat_amount} {self.fiat_code}"


def _layers_from_tags(t: dict[str, list[list[str]]]) -> list[str]:
    """Collect settlement layers (``layer`` tag may repeat or be multi-valued)."""
    layers: list[str] = []
    for tag_list in t.get("layer", []):
        if not tag_list:
            continue
        for value in tag_list[1:]:
            v = str(value).strip().lower()
            if v and v not in layers:
                layers.append(v)
    return layers or ["lightning"]


def layer_matches(order_layers: list[str], want: str | None) -> bool:
    if not want or want == "any":
        return True
    want = want.lower()
    if want == "lightning":
        return "lightning" in order_layers
    if want == "onchain":
        return "onchain" in order_layers
    return want in order_layers


def _first(tags: dict[str, list[list[str]]], name: str) -> list[str] | None:
    values = tags.get(name)
    return values[0] if values else None


def _index_tags(tags: list[list[str]]) -> dict[str, list[list[str]]]:
    indexed: dict[str, list[list[str]]] = {}
    for tag in tags:
        if not tag:
            continue
        indexed.setdefault(tag[0], []).append(tag)
    return indexed


def parse_order_tags(
    tags: list[list[str]],
    *,
    mostro_pubkey: str = "",
    event_created_at: int | None = None,
) -> PublicOrder:
    """Parse a kind-38383 tag set into a PublicOrder.

    Raises ValueError on missing mandatory tags or a non-order `z` value, so
    malformed/foreign events never enter the book.
    """
    t = _index_tags(tags)

    z = _first(t, "z")
    if not z or z[1:2] != [Z_ORDER]:
        raise ValueError("not an order event (z != 'order')")

    def need(name: str) -> list[str]:
        tag = _first(t, name)
        if tag is None or len(tag) < 2:
            raise ValueError(f"missing mandatory tag: {name}")
        return tag

    d = need("d")
    k = need("k")
    f = need("f")
    s = need("s")
    amt = need("amt")
    fa = need("fa")

    try:
        kind = OrderKind(k[1])
    except ValueError as exc:
        raise ValueError(f"invalid order kind: {k[1]!r}") from exc
    try:
        status = OrderStatus(s[1])
    except ValueError as exc:
        raise ValueError(f"invalid order status: {s[1]!r}") from exc

    fiat_amount: int | float | None = None
    fiat_min: int | float | None = None
    fiat_max: int | float | None = None
    if len(fa) >= 3:  # ["fa", min, max] range order
        fiat_min, fiat_max = _to_number(fa[1]), _to_number(fa[2])
    else:             # ["fa", amount] fixed price
        fiat_amount = _to_number(fa[1])

    pm_tag = _first(t, "pm")
    payment_methods = pm_tag[1:] if pm_tag else []

    premium_tag = _first(t, "premium")
    premium = float(premium_tag[1]) if premium_tag and len(premium_tag) > 1 else 0.0

    y_tag = _first(t, "y")
    platform = y_tag[1] if y_tag and len(y_tag) > 1 else ""
    platform_instance = y_tag[2] if y_tag and len(y_tag) > 2 else None

    rating = None
    rating_tag = _first(t, "rating")
    if rating_tag and len(rating_tag) > 1:
        try:
            rating = normalize_rating(json.loads(rating_tag[1]))
        except (json.JSONDecodeError, TypeError):
            rating = None

    def opt(name: str) -> str | None:
        tag = _first(t, name)
        return tag[1] if tag and len(tag) > 1 else None

    def opt_int(name: str) -> int | None:
        value = opt(name)
        return int(value) if value is not None else None

    network = opt("network") or "mainnet"
    layers = _layers_from_tags(t)
    layer = layers[0]

    return PublicOrder(
        id=d[1],
        kind=kind,
        fiat_code=f[1],
        status=status,
        amount_sats=_to_sats(amt[1]),
        fiat_amount=fiat_amount,
        fiat_min=fiat_min,
        fiat_max=fiat_max,
        payment_methods=payment_methods,
        premium=premium,
        network=network,
        layer=layer,
        layers=layers,
        platform=platform,
        platform_instance=platform_instance,
        rating=rating,
        maker_name=opt("name"),
        maker_pubkey=_maker_pubkey_from_tags(t, rating),
        source=opt("source"),
        geohash=opt("g"),
        bond=opt("bond"),
        expires_at=opt_int("expires_at"),
        expiration=opt_int("expiration"),
        mostro_pubkey=mostro_pubkey,
        event_created_at=event_created_at,
    )


def parse_order_event(event) -> PublicOrder:  # pragma: no cover - needs nostr Event
    """Adapter for a nostr-sdk Event (kind 38383)."""
    if event.kind().as_u16() != KIND_ORDER:
        raise ValueError(f"expected kind {KIND_ORDER}, got {event.kind().as_u16()}")
    tags = [t.as_vec() for t in event.tags().to_vec()]
    order = parse_order_tags(
        tags,
        mostro_pubkey=event.author().to_hex(),
        event_created_at=event.created_at().as_secs(),
    )
    order.nostr_event_id = event.id().to_hex()
    return order
