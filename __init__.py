"""Trato - non-custodial P2P fiat<->Bitcoin trading as an LNbits extension.

This package is the LNbits extension. The pure protocol/transport core lives in
the `trato.mostro` and `trato.nostr` subpackages and has NO LNbits dependency,
so it can be unit-tested standalone.

The LNbits wiring (FastAPI routers, Database, startup tasks) is added in a
guarded block so that importing the protocol core never requires LNbits to be
installed (e.g. during isolated unit tests).
"""

from __future__ import annotations

__version__ = "0.1.0"

try:  # LNbits runtime wiring - intentionally optional for standalone tests.
    from fastapi import APIRouter
    from lnbits.db import Database

    db = Database("ext_trato")

    trato_ext: APIRouter = APIRouter(prefix="/trato", tags=["Trato"])

    trato_static_files = [
        {
            "path": "/trato/static",
            "name": "trato_static",
        }
    ]

    scheduled_tasks: list = []

    def trato_start():
        """Start background work as permanent tasks.

        - ``wait_for_orders``: keeps the public order book fresh (read-only).
        - ``wait_for_messages``: handles inbound operator messages for live
          trades (dormant unless live trading is enabled).
        """
        from lnbits.tasks import create_permanent_task

        from .tasks import wait_for_messages, wait_for_orders

        scheduled_tasks.append(create_permanent_task(wait_for_orders))
        scheduled_tasks.append(create_permanent_task(wait_for_messages))

    def trato_stop():
        for task in scheduled_tasks:
            try:
                task.cancel()
            except Exception:  # noqa: BLE001
                pass

    def _register_routes() -> None:
        from .views import trato_generic_router
        from .views_api import trato_api_router

        trato_ext.include_router(trato_generic_router)
        trato_ext.include_router(trato_api_router)

    _register_routes()

    LNBITS_AVAILABLE = True
except ImportError:  # pragma: no cover - exercised only outside LNbits
    LNBITS_AVAILABLE = False
