"""Whether a NIP-69 book row is still safe to show as an open offer."""

from __future__ import annotations

from ..mostro.constants import KIND_ORDER, PUBLIC_BOOK_STATUSES
from ..mostro.order import OrderStatus
from ..mostro.orderbook import PublicOrder


def order_expires_at_unix(order: PublicOrder) -> int | None:
    """When a pending offer should leave the book (NIP-69 ``expires_at``).

    RoboSats encodes order expiry in the first ``expiration`` tag value (see
    ``api/nostr.py`` in the RoboSats repo). Plain NIP-40 ``expiration`` alone
    is relay event TTL — do not treat that as order expiry for other platforms.
    """
    if order.expires_at is not None:
        return order.expires_at
    plat = (order.platform or "").strip().lower()
    if plat == "robosats" and order.expiration is not None:
        return order.expiration
    return None


def is_order_expired(order: PublicOrder, now: int) -> bool:
    exp = order_expires_at_unix(order)
    return exp is not None and now >= exp


def is_public_book_status(status: OrderStatus) -> bool:
    return status.value in PUBLIC_BOOK_STATUSES


def is_order_bookable(order: PublicOrder, now: int) -> bool:
    """Open on the public book: pending and not past expiry."""
    return is_public_book_status(order.status) and not is_order_expired(order, now)


def deletion_targets_from_tags(tags: list[list[str]]) -> list[tuple[str, str]]:
    """Map NIP-09 / addressable deletion tags to (pubkey, order_id) keys."""
    targets: list[tuple[str, str]] = []
    for tag in tags:
        if not tag:
            continue
        name = tag[0]
        if name == "a" and len(tag) > 1:
            parts = str(tag[1]).split(":", 2)
            if len(parts) == 3 and parts[0] == str(KIND_ORDER):
                pubkey, order_id = parts[1], parts[2]
                if pubkey and order_id:
                    targets.append((pubkey.lower(), order_id))
        elif name == "e" and len(tag) > 1:
            # Event-id deletions are resolved via relay._event_id_to_key.
            continue
    return targets
