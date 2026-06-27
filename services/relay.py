"""Live order book service.

Maintains an in-memory snapshot of the public Mostro order book by periodically
fetching kind-38383 events from a set of relays and parsing them with our
NIP-69 parser. This is strictly read-only: it never publishes or moves money.

Poll cycle:
  1. Fetch kind-38383 orders and merge (newest ``d`` tag wins).
  2. Fetch kind-5 deletion events (NIP-09) and drop removed orders.
  3. Enforce ``pending`` + expiry on all rows.
  4. For RoboSats / other externals, background verify sets ``book_verified``;
     browse-only rows still list when pending on relays (UI may filter).
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import asdict
from datetime import timedelta
from typing import Awaitable, Callable, Optional

from loguru import logger

from ..mostro.constants import KIND_DELETE, KIND_ORDER
from ..mostro.order import OrderStatus
from ..mostro.orderbook import PublicOrder, layer_matches, parse_order_event
from .demo_book import (
    find_demo_order,
    demo_seed_orders,
    live_takeable_count,
)
from .external_verify import BACKEND_VERIFIED_PLATFORMS, verify_external_orders
from .order_freshness import (
    deletion_targets_from_tags,
    is_order_bookable,
)
from .platforms import normalize_platform, platform_takeable, takeable_platforms_list, trading_capabilities
from .robosats_federation import federation

POLL_INTERVAL_SECONDS = 60
FETCH_TIMEOUT_SECONDS = 15
# Drop an order if we have not seen a refresh for this long.
ORDER_TTL_SECONDS = 15 * 60
# Always re-fetch this window of kind-38383 events each poll. Incremental
# ``since(last_sync)`` starves quiet makers (e.g. Mostro) that do not republish
# every few minutes; their ``seen_at`` would age out under ORDER_TTL_SECONDS.
ORDER_FETCH_LOOKBACK_SECONDS = 86400
DELETION_LOOKBACK_SECONDS = 2 * POLL_INTERVAL_SECONDS

# Back-compat: tests import platform_supported from relay.
platform_supported = platform_takeable


def public_order_to_dict(
    order: PublicOrder,
    *,
    verified_external: set[str] | None = None,
) -> dict:
    data = asdict(order)
    data["kind"] = order.kind.value
    data["status"] = order.status.value
    data["is_range"] = order.is_range
    data["is_market_price"] = order.is_market_price
    data["fiat_display"] = order.fiat_display()
    data["takeable"] = platform_takeable(order.platform)
    key = f"{order.mostro_pubkey}:{order.id}"
    plat = (order.platform or "mostro").strip().lower()
    if platform_takeable(plat):
        # RoboSats: coordinator API confirm when we have a verify pass.
        if plat == "robosats" and verified_external is not None:
            data["book_verified"] = key in verified_external
        else:
            data["book_verified"] = True
    else:
        data["book_verified"] = (
            verified_external is not None and key in verified_external
        )
    data["layers"] = list(order.layers)
    if str(order.id or "").startswith("trato-demo-"):
        data["demo_book"] = True
    return data


class OrderbookService:
    """Singleton holding the aggregated public order book."""

    def __init__(self) -> None:
        self._orders: dict[str, tuple[PublicOrder, int]] = {}
        self._event_id_to_key: dict[str, str] = {}
        self._verified_external: set[str] = set()
        self._verify_task: asyncio.Task | None = None
        self._relays: list[str] = []
        self._running = False
        self.last_sync: Optional[int] = None
        self.last_error: Optional[str] = None
        self.raw_seen = 0
        self.deletions_seen = 0

    @staticmethod
    def _key(order: PublicOrder) -> str:
        return OrderbookService._key_for(order.mostro_pubkey, order.id)

    def set_relays(self, relays: list[str]) -> None:
        seen: set[str] = set()
        clean: list[str] = []
        for url in relays:
            url = (url or "").strip()
            if url and url not in seen:
                seen.add(url)
                clean.append(url)
        self._relays = clean

    @property
    def relays(self) -> list[str]:
        return list(self._relays)

    def find_pending(self, mostro_pubkey: str, order_id: str) -> PublicOrder | None:
        """Return a pending public order if it is still on the in-memory book."""
        self._evict_stale()
        demo = find_demo_order(mostro_pubkey, order_id)
        if demo is not None and demo.id in {
            o.id for o in demo_seed_orders(self._orders, int(time.time()))
        }:
            return demo
        pair = self._orders.get(self._key_for(mostro_pubkey, order_id))
        if not pair:
            return None
        order, _ = pair
        now = int(time.time())
        if not self._is_listable(order, now):
            return None
        return order

    @staticmethod
    def _key_for(mostro_pubkey: str, order_id: str) -> str:
        return f"{mostro_pubkey}:{order_id}"

    def _is_listable(self, order: PublicOrder, now: int) -> bool:
        """Pending, non-expired orders from relays (deletions applied separately).

        Browse-only platforms (Peach, lnp2pbot, …) are included here so the UI
        can show them when “all platforms” is selected. ``book_verified`` and
        ``takeable`` on each row tell the client what Trato can act on.
        """
        return is_order_bookable(order, now)

    def snapshot(
        self,
        *,
        side: Optional[str] = None,
        fiat_code: Optional[str] = None,
        platform: Optional[str] = None,
        settlement: Optional[str] = None,
        demo_seed: bool = False,
    ) -> list[dict]:
        """Return listable pending orders only, newest first."""
        self._evict_stale()
        now = int(time.time())
        out: list[dict] = []
        for order, _ in self._orders.values():
            if not self._is_listable(order, now):
                continue
            if side and order.kind.value != side:
                continue
            if fiat_code and order.fiat_code.upper() != fiat_code.upper():
                continue
            if platform and order.platform != platform:
                continue
            if settlement and not layer_matches(order.layers, settlement):
                continue
            out.append(
                public_order_to_dict(
                    order, verified_external=self._verified_external
                )
            )
        seeded = demo_seed_orders(self._orders, now) if demo_seed else []
        if seeded:
            seeded_ids = {o.id for o in seeded}
            out = [o for o in out if o.get("id") not in seeded_ids]
            for order in seeded:
                if not self._is_listable(order, now):
                    continue
                if side and order.kind.value != side:
                    continue
                if fiat_code and order.fiat_code.upper() != fiat_code.upper():
                    continue
                if platform and order.platform != platform:
                    continue
                if settlement and not layer_matches(order.layers, settlement):
                    continue
                out.append(
                    public_order_to_dict(
                        order, verified_external=self._verified_external
                    )
                )
        out.sort(key=lambda o: o.get("event_created_at") or 0, reverse=True)
        return out

    def stats(self, *, demo_seed: bool = False) -> dict:
        self._evict_stale()
        now = int(time.time())
        platforms: dict[str, int] = {}
        fiat_codes: dict[str, int] = {}
        takeable_count = live_takeable_count(self._orders, now)
        for order, _ in self._orders.values():
            if not self._is_listable(order, now):
                continue
            platforms[order.platform] = platforms.get(order.platform, 0) + 1
            code = (order.fiat_code or "").strip().upper()
            if code:
                fiat_codes[code] = fiat_codes.get(code, 0) + 1
        demo_seeded = False
        if demo_seed:
            seeded = demo_seed_orders(self._orders, now)
            if seeded:
                demo_seeded = True
                for order in seeded:
                    if not self._is_listable(order, now):
                        continue
                    platforms[order.platform] = platforms.get(order.platform, 0) + 1
                    if platform_takeable(order.platform):
                        takeable_count += 1
                    code = (order.fiat_code or "").strip().upper()
                    if code:
                        fiat_codes[code] = fiat_codes.get(code, 0) + 1
        return {
            "total": sum(platforms.values()),
            "takeable": takeable_count,
            "demo_seeded": demo_seeded,
            "takeable_platforms": takeable_platforms_list(),
            "platforms": platforms,
            "fiat_codes": fiat_codes,
            "relays": self._relays,
            "last_sync": self.last_sync,
            "last_error": self.last_error,
            "running": self._running,
            "deletions_seen": self.deletions_seen,
            "verified_external": len(self._verified_external),
        }

    def _evict_stale(self) -> None:
        cutoff = int(time.time()) - ORDER_TTL_SECONDS
        stale = [k for k, (_, seen) in self._orders.items() if seen < cutoff]
        for k in stale:
            self._orders.pop(k, None)
        if stale:
            self._prune_event_index()

    def _prune_event_index(self) -> None:
        live = set(self._orders.keys())
        self._event_id_to_key = {
            eid: key for eid, key in self._event_id_to_key.items() if key in live
        }
        self._verified_external = {
            k for k in self._verified_external if k in live
        }

    def _remove_key(self, key: str) -> None:
        self._orders.pop(key, None)
        self._event_id_to_key = {
            eid: k for eid, k in self._event_id_to_key.items() if k != key
        }
        self._verified_external.discard(key)

    def _store_order(self, order: PublicOrder, seen_at: int) -> None:
        key = self._key(order)
        if order.status != OrderStatus.PENDING:
            self._remove_key(key)
            return
        self._orders[key] = (order, seen_at)
        if order.nostr_event_id:
            self._event_id_to_key[order.nostr_event_id] = key

    def _apply_deletions(self, events) -> None:
        removed = 0
        for ev in events:
            tags = [t.as_vec() for t in ev.tags().to_vec()]
            for pubkey, order_id in deletion_targets_from_tags(tags):
                key = self._key_for(pubkey, order_id)
                if key in self._orders:
                    self._remove_key(key)
                    removed += 1
            for tag in tags:
                if tag and tag[0] == "e" and len(tag) > 1:
                    event_id = tag[1]
                    key = self._event_id_to_key.get(event_id)
                    if key and key in self._orders:
                        self._remove_key(key)
                        removed += 1
        self.deletions_seen += removed

    async def _verify_external_book(self) -> None:
        now = int(time.time())
        candidates = [
            order
            for order, _ in self._orders.values()
            if is_order_bookable(order, now)
            and normalize_platform(order.platform) in BACKEND_VERIFIED_PLATFORMS
        ]
        self._verified_external = await verify_external_orders(candidates)

    def _schedule_verify_external(self) -> None:
        """Verify RoboSats rows in the background — do not block relay poll."""
        if self._verify_task and not self._verify_task.done():
            return
        self._verify_task = asyncio.create_task(self._verify_external_book())

    async def poll_once(self) -> int:
        """Fetch + merge one cycle. Returns number of parsed orders."""
        if not self._relays:
            return 0

        from nostr_sdk import Client, Filter, Kind, RelayUrl, Timestamp

        client = Client()
        parsed = 0
        try:
            for url in self._relays:
                try:
                    await client.add_relay(RelayUrl.parse(url))
                except Exception as exc:  # noqa: BLE001
                    logger.warning(f"trato: bad relay {url!r}: {exc}")
            await client.connect()

            now_secs = int(time.time())
            order_since_ts = Timestamp.from_secs(
                max(0, now_secs - ORDER_FETCH_LOOKBACK_SECONDS)
            )
            if self.last_sync:
                deletion_since_ts = Timestamp.from_secs(
                    max(0, self.last_sync - DELETION_LOOKBACK_SECONDS)
                )
            else:
                deletion_since_ts = order_since_ts

            f = (
                Filter()
                .kind(Kind(KIND_ORDER))
                .limit(1000)
                .since(order_since_ts)
            )
            events = await client.fetch_events(
                f, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
            )
            vec = events.to_vec()
            self.raw_seen = len(vec)
            seen_at = int(time.time())
            await federation.ensure_loaded()
            for ev in vec:
                try:
                    order = parse_order_event(ev)
                except ValueError:
                    continue
                except Exception as exc:  # noqa: BLE001
                    logger.debug(f"trato: order parse error: {exc!r}")
                    continue
                plat = (order.platform or "mostro").strip().lower()
                if plat == "robosats" and not federation.passes_ingest_filter(
                    order.mostro_pubkey
                ):
                    continue
                key = self._key(order)
                existing = self._orders.get(key)
                if existing and (existing[0].event_created_at or 0) >= (
                    order.event_created_at or 0
                ):
                    self._store_order(existing[0], seen_at)
                else:
                    self._store_order(order, seen_at)
                parsed += 1

            f_del = Filter().kind(Kind(KIND_DELETE)).limit(500).since(deletion_since_ts)
            del_events = await client.fetch_events(
                f_del, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
            )
            self._apply_deletions(del_events.to_vec())

            self.last_sync = seen_at
            self.last_error = None
            self._schedule_verify_external()
        finally:
            try:
                await client.shutdown()
            except Exception:  # noqa: BLE001
                pass
        return parsed

    async def run(
        self, get_relays: Callable[[], Awaitable[list[str]]]
    ) -> None:
        """Permanent task: refresh relays + poll forever."""
        self._running = True
        logger.info("trato: order book service started")
        while True:
            try:
                relays = await get_relays()
                self.set_relays(relays)
                count = await self.poll_once()
                logger.debug(
                    f"trato: order book sync ok "
                    f"({count} parsed, {self.raw_seen} raw, "
                    f"{len(self._verified_external)} verified external, "
                    f"{len(self._relays)} relays)"
                )
            except asyncio.CancelledError:
                self._running = False
                logger.info("trato: order book service stopped")
                raise
            except Exception as exc:  # noqa: BLE001
                self.last_error = str(exc)
                logger.warning(f"trato: order book sync failed: {exc}")
            await asyncio.sleep(POLL_INTERVAL_SECONDS)


orderbook = OrderbookService()
