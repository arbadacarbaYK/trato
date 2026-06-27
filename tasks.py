"""Background tasks for Trato.

The single permanent task keeps the public order book fresh by polling the
configured relays. It is started from ``trato_start`` in ``__init__`` via
LNbits' ``create_permanent_task`` and is read-only (no money movement).
"""

from __future__ import annotations

from .crud import get_all_configured_relays
from .services.messenger import messenger
from .services.relay import orderbook


async def wait_for_orders() -> None:
    await orderbook.run(get_all_configured_relays)


async def wait_for_messages() -> None:
    await messenger.run()
