"""Fetch Mostro user reputation (kind 38384) from relays."""

from __future__ import annotations

import time
from datetime import timedelta
from typing import Optional

from loguru import logger

from ..mostro.constants import KIND_RATING
from ..mostro.reputation import UserReputation, parse_rating_tags

DEFAULT_RELAYS = [
    "wss://relay.mostro.network",
    "wss://relay.damus.io",
    "wss://nostr.wine",
]
FETCH_TIMEOUT_SECONDS = 15
CACHE_TTL_SECONDS = 300


class ReputationService:
    """Short-lived cache for per-pubkey rating lookups."""

    def __init__(self) -> None:
        self._cache: dict[str, tuple[Optional[UserReputation], int]] = {}

    async def fetch(
        self, identity_pubkey: str, relays: list[str] | None = None
    ) -> Optional[UserReputation]:
        pubkey = (identity_pubkey or "").strip().lower()
        if not pubkey:
            return None
        now = int(time.time())
        cached = self._cache.get(pubkey)
        if cached and now - cached[1] < CACHE_TTL_SECONDS:
            return cached[0]

        rep = await self._fetch_live(pubkey, relays or DEFAULT_RELAYS)
        self._cache[pubkey] = (rep, now)
        return rep

    async def _fetch_live(
        self, identity_pubkey: str, relays: list[str]
    ) -> Optional[UserReputation]:
        try:
            from nostr_sdk import Client, Filter, Kind, RelayUrl
        except ImportError:
            logger.warning("trato reputation: nostr_sdk unavailable")
            return None

        urls = [u.strip() for u in relays if u and u.strip()]
        if not urls:
            urls = list(DEFAULT_RELAYS)

        client = Client()
        connected = False
        for url in urls:
            try:
                await client.add_relay(RelayUrl.parse(url))
                connected = True
            except Exception as exc:  # noqa: BLE001
                logger.debug(f"trato reputation: skip relay {url}: {exc}")
        if not connected:
            return None

        try:
            await client.connect()
            f = (
                Filter()
                .kind(Kind(KIND_RATING))
                .identifier(identity_pubkey)
                .limit(1)
            )
            events = await client.fetch_events(
                f, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
            )
            vec = events.to_vec()
            if not vec:
                return None
            tags = [t.as_vec() for t in vec[0].tags().to_vec()]
            return parse_rating_tags(tags)
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"trato reputation fetch failed: {exc}")
            return None
        finally:
            try:
                await client.shutdown()
            except Exception:  # noqa: BLE001
                pass


reputation_service = ReputationService()
