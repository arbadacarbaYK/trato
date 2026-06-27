"""Confirm non-Mostro NIP-69 ads against each platform's live backend."""

from __future__ import annotations

import asyncio
from typing import Iterable

from ..mostro.orderbook import PublicOrder
from .platforms import normalize_platform
from .robosats_federation import federation

BACKEND_VERIFIED_PLATFORMS = frozenset({"robosats"})


async def verify_external_order(order: PublicOrder) -> bool:
    plat = normalize_platform(order.platform)
    if plat not in BACKEND_VERIFIED_PLATFORMS:
        return False
    if plat == "robosats":
        return await federation.verify_public_order(
            order.mostro_pubkey, order.id, source=order.source
        )
    return False


async def verify_external_orders(
    orders: Iterable[PublicOrder],
) -> set[str]:
    """Return ``mostro_pubkey:order_id`` keys confirmed live on the source app."""
    await federation.ensure_loaded()
    candidates = [
        o
        for o in orders
        if normalize_platform(o.platform) in BACKEND_VERIFIED_PLATFORMS
    ]
    if not candidates:
        return set()

    sem = asyncio.Semaphore(8)
    verified: set[str] = set()

    async def _one(order: PublicOrder) -> None:
        async with sem:
            if await verify_external_order(order):
                verified.add(f"{order.mostro_pubkey}:{order.id}")

    await asyncio.gather(*[_one(o) for o in candidates])
    return verified
