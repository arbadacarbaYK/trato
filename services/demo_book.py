"""Synthetic Mostro book rows for demo mode when relays have no takeable offers.

These are not published to Nostr. They exist so demo users can practise take
flows when the live relay book has only browse-only platforms (Peach, etc.) or
is empty. ``find_pending`` resolves them while ``live_takeable_count`` is zero.
"""

from __future__ import annotations

import time

from ..mostro.order import OrderKind, OrderStatus
from ..mostro.orderbook import PublicOrder
from .order_freshness import is_order_bookable
from .platforms import platform_takeable

# Stable synthetic operator key (64-char hex). Not a real Mostro instance.
DEMO_OPERATOR_PUBKEY = "ab" * 32
DEMO_ROBOSATS_PUBKEY = "cd" * 32

DEMO_BOOK_PREFIX = "trato-demo-"
DEMO_BOOK_PUBKEYS = frozenset({DEMO_OPERATOR_PUBKEY, DEMO_ROBOSATS_PUBKEY})


def _expiry() -> int:
    return int(time.time()) + 7 * 24 * 3600


def demo_public_orders() -> list[PublicOrder]:
    """Fixed sample offers for demo practise (Mostro, takeable)."""
    now = int(time.time())
    exp = _expiry()
    return [
        PublicOrder(
            id=f"{DEMO_BOOK_PREFIX}sell-eur",
            kind=OrderKind.SELL,
            fiat_code="EUR",
            status=OrderStatus.PENDING,
            amount_sats=0,
            fiat_amount=100,
            payment_methods=["SEPA"],
            premium=0.0,
            network="mainnet",
            layer="lightning",
            layers=["lightning"],
            platform="mostro",
            platform_instance="trato-demo",
            maker_name="Demo seller",
            expiration=exp,
            mostro_pubkey=DEMO_OPERATOR_PUBKEY,
            event_created_at=now,
        ),
        PublicOrder(
            id=f"{DEMO_BOOK_PREFIX}buy-eur",
            kind=OrderKind.BUY,
            fiat_code="EUR",
            status=OrderStatus.PENDING,
            amount_sats=250_000,
            fiat_amount=100,
            payment_methods=["SEPA", "Revolut"],
            premium=2.0,
            network="mainnet",
            layer="lightning",
            layers=["lightning", "onchain"],
            platform="mostro",
            platform_instance="trato-demo",
            maker_name="Demo buyer",
            expiration=exp,
            mostro_pubkey=DEMO_OPERATOR_PUBKEY,
            event_created_at=now - 120,
        ),
        PublicOrder(
            id=f"{DEMO_BOOK_PREFIX}sell-usd",
            kind=OrderKind.SELL,
            fiat_code="USD",
            status=OrderStatus.PENDING,
            amount_sats=0,
            fiat_amount=None,
            fiat_min=50,
            fiat_max=500,
            payment_methods=["PayPal", "Zelle"],
            premium=-1.0,
            network="mainnet",
            layer="lightning",
            layers=["lightning"],
            platform="mostro",
            platform_instance="trato-demo",
            maker_name="Demo range seller",
            expiration=exp,
            mostro_pubkey=DEMO_OPERATOR_PUBKEY,
            event_created_at=now - 300,
        ),
        PublicOrder(
            id=f"{DEMO_BOOK_PREFIX}robosats-sell-usd",
            kind=OrderKind.SELL,
            fiat_code="USD",
            status=OrderStatus.PENDING,
            amount_sats=0,
            fiat_amount=None,
            fiat_min=500,
            fiat_max=3000,
            payment_methods=["USDT", "L-USDt", "USDC"],
            premium=2.0,
            network="mainnet",
            layer="lightning",
            layers=["lightning"],
            platform="robosats",
            platform_instance="robosats-demo",
            maker_name="Demo RoboSats seller",
            expiration=exp,
            mostro_pubkey=DEMO_ROBOSATS_PUBKEY,
            event_created_at=now - 60,
        ),
    ]


def is_demo_book_order(order_id: str, mostro_pubkey: str) -> bool:
    return (
        str(order_id or "").startswith(DEMO_BOOK_PREFIX)
        and (mostro_pubkey or "").lower() in DEMO_BOOK_PUBKEYS
    )


def live_takeable_count_by_platform(
    orders: dict[str, tuple[PublicOrder, int]], now: int
) -> dict[str, int]:
    counts: dict[str, int] = {}
    for order, _ in orders.values():
        if is_order_bookable(order, now) and platform_takeable(order.platform):
            counts[order.platform] = counts.get(order.platform, 0) + 1
    return counts


def demo_seed_orders(
    orders: dict[str, tuple[PublicOrder, int]], now: int
) -> list[PublicOrder]:
    """Demo rows to merge when ``demo_seed=1``.

    - Empty takeable book → all practise offers (Mostro + RoboSats).
    - Otherwise → only takeable platforms missing from the live book (gap fill).
    """
    if should_seed_demo_book(orders, now):
        return demo_public_orders()
    by_platform = live_takeable_count_by_platform(orders, now)
    return [
        order
        for order in demo_public_orders()
        if platform_takeable(order.platform)
        and by_platform.get(order.platform, 0) == 0
    ]


def demo_seed_active(
    orders: dict[str, tuple[PublicOrder, int]], now: int
) -> bool:
    return bool(demo_seed_orders(orders, now))


def find_demo_order(mostro_pubkey: str, order_id: str) -> PublicOrder | None:
    if not is_demo_book_order(order_id, mostro_pubkey):
        return None
    for order in demo_public_orders():
        if order.id == order_id:
            return order
    return None


def live_takeable_count(orders: dict[str, tuple[PublicOrder, int]], now: int) -> int:
    count = 0
    for order, _ in orders.values():
        if is_order_bookable(order, now) and platform_takeable(order.platform):
            count += 1
    return count


def should_seed_demo_book(orders: dict[str, tuple[PublicOrder, int]], now: int) -> bool:
    """Inject demo rows when relays have no pending takeable offers."""
    return live_takeable_count(orders, now) == 0
