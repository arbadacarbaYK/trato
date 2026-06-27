"""Inbound message poller for live trades.

Listens for the operator's gift-wrapped replies addressed to each active order's
trade key, unwraps them, and feeds them to the trade engine. It mirrors the
order-book poller's design: a self-healing singleton task that refetches every
cycle, so a dropped relay connection simply recovers on the next pass.

Safety: it only processes NON-demo orders (see `crud.get_active_orders`). Since
live trading is gated off in this build, there are normally no such orders and
this task is dormant - but it is the real seam the live phase switches on.
"""

from __future__ import annotations

import asyncio
import json
import time
from datetime import timedelta
from typing import Optional

from loguru import logger

from .. import crud
from ..mostro.constants import KIND_GIFT_WRAP
from ..nostr.keys import KeyManager
from ..nostr.transport import parse_envelope, unwrap
from ..security import decrypt_secret
from .trade_engine import LnbitsTradeIO, TradeEngine

POLL_INTERVAL_SECONDS = 20
FETCH_TIMEOUT_SECONDS = 15


class CrudTradeStore:
    """Real persistence: writes order fields + timeline via crud."""

    async def update(self, order, **fields) -> None:
        if fields.get("status") in ("success", "released"):
            meta = {}
            try:
                meta = json.loads(order.order_json or "{}")
            except json.JSONDecodeError:
                meta = {}
            if not meta.get("fx_at_settlement"):
                from .fx_snapshot import capture_fx, merge_fx_into_order_json

                try:
                    snap = await capture_fx(order.fiat_code)
                    fields = dict(fields)
                    fields["order_json"] = merge_fx_into_order_json(
                        order.order_json, "fx_at_settlement", snap
                    )
                except Exception:  # noqa: BLE001
                    pass
        await crud.update_order_fields(order.id, **fields)

    async def log(self, order, direction, kind, payload=None) -> None:
        await crud.log_event(order.user, order.id, direction, kind, payload)


class Messenger:
    def __init__(self) -> None:
        self._running = False
        self.last_sync: Optional[int] = None
        self.last_error: Optional[str] = None
        self.handled = 0

    def stats(self) -> dict:
        return {
            "running": self._running,
            "last_sync": self.last_sync,
            "last_error": self.last_error,
            "handled": self.handled,
        }

    async def _process_order(self, client, order) -> int:
        from nostr_sdk import Filter, Kind, PublicKey, Timestamp

        identity = await crud.get_identity(order.user)
        if not identity:
            return 0
        keys = KeyManager(
            decrypt_secret(identity.encrypted_mnemonic)
        ).trade_key(order.trade_index).keys

        settings = await crud.get_settings(order.user)
        io = TradeEngine(
            LnbitsTradeIO(identity.wallet, settings.relays), CrudTradeStore()
        )

        since = Timestamp.from_secs(max(0, order.last_event_at))
        f = (
            Filter()
            .kind(Kind(KIND_GIFT_WRAP))
            .pubkey(PublicKey.parse(order.trade_pubkey))
            .since(since)
        )
        events = await client.fetch_events(f, timedelta(seconds=FETCH_TIMEOUT_SECONDS))

        processed = 0
        newest = order.last_event_at
        for ev in sorted(events.to_vec(), key=lambda e: e.created_at().as_secs()):
            created = ev.created_at().as_secs()
            try:
                sender_hex, envelope = await unwrap(keys, ev)
                message_obj, _sig = parse_envelope(envelope)
                _, kind = _split(message_obj)
                if not order.peer_pubkey and sender_hex != order.mostro_pubkey:
                    order.peer_pubkey = sender_hex
                    await crud.update_order_fields(order.id, peer_pubkey=sender_hex)
                await io.apply_incoming(order, kind, keys)
                processed += 1
            except Exception as exc:  # noqa: BLE001
                logger.debug(f"trato messenger: skip event: {exc!r}")
            newest = max(newest, created)
        if newest > order.last_event_at:
            await crud.update_order_fields(order.id, last_event_at=newest)
        return processed

    async def poll_once(self) -> int:
        orders = await crud.get_active_orders()
        if not orders:
            return 0

        from nostr_sdk import Client, RelayUrl

        relays = await crud.get_all_configured_relays()
        client = Client()
        total = 0
        try:
            for url in relays:
                try:
                    await client.add_relay(RelayUrl.parse(url))
                except Exception as exc:  # noqa: BLE001
                    logger.warning(f"trato messenger: bad relay {url!r}: {exc}")
            await client.connect()
            for order in orders:
                try:
                    total += await self._process_order(client, order)
                except Exception as exc:  # noqa: BLE001
                    logger.warning(
                        f"trato messenger: order {order.id} failed: {exc}"
                    )
        finally:
            try:
                await client.shutdown()
            except Exception:  # noqa: BLE001
                pass
        self.handled += total
        self.last_sync = int(time.time())
        return total

    async def run(self) -> None:
        self._running = True
        logger.info("trato: trade messenger started")
        while True:
            try:
                await self.poll_once()
                self.last_error = None
            except asyncio.CancelledError:
                self._running = False
                logger.info("trato: trade messenger stopped")
                raise
            except Exception as exc:  # noqa: BLE001
                self.last_error = str(exc)
                logger.warning(f"trato: messenger cycle failed: {exc}")
            await asyncio.sleep(POLL_INTERVAL_SECONDS)


def _split(message_obj: dict):
    """Local import-free split to avoid a circular import with protocol."""
    from ..mostro.protocol import parse_message

    return parse_message(message_obj)


messenger = Messenger()
