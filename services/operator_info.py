"""Fetch and cache Mostro operator info (kind 38385) from relays."""

from __future__ import annotations

import time
from datetime import timedelta

from loguru import logger

from ..mostro.constants import KIND_INFO
from ..mostro.operator_info import OperatorInfo, parse_operator_info_tags
from ..nostr.pubkey import normalize_pubkey

CACHE_TTL_SECONDS = 300
FETCH_TIMEOUT_SECONDS = 15

DEFAULT_RELAYS = [
    "wss://relay.mostro.network",
    "wss://relay.damus.io",
    "wss://nostr.bitcoiner.social",
    "wss://relay.nostr.net",
]


class OperatorInfoService:
    def __init__(self) -> None:
        self._cache: dict[str, tuple[OperatorInfo, int]] = {}

    async def fetch(
        self, pubkey: str, relays: list[str] | None = None
    ) -> OperatorInfo | None:
        hexed = normalize_pubkey(pubkey)
        if not hexed:
            return None
        now = int(time.time())
        cached = self._cache.get(hexed)
        if cached and now - cached[1] < CACHE_TTL_SECONDS:
            return cached[0]
        info = await self._fetch_live(hexed, relays or DEFAULT_RELAYS)
        self._cache[hexed] = (info, now)
        return info

    async def fetch_many(
        self, pubkeys: list[str], relays: list[str] | None = None
    ) -> dict[str, dict]:
        out: dict[str, dict] = {}
        seen: set[str] = set()
        for raw in pubkeys:
            hexed = normalize_pubkey(raw)
            if not hexed or hexed in seen:
                continue
            seen.add(hexed)
            info = await self.fetch(hexed, relays)
            if info:
                out[hexed] = info.to_dict()
        return out

    async def _fetch_live(
        self, pubkey_hex: str, relays: list[str]
    ) -> OperatorInfo:
        try:
            from nostr_sdk import Client, Filter, Kind, PublicKey, RelayUrl
        except ImportError:
            logger.warning("trato operator info: nostr_sdk unavailable")
            return OperatorInfo(pubkey=pubkey_hex)

        urls = [u.strip() for u in relays if u and u.strip()] or list(DEFAULT_RELAYS)
        client = Client()
        connected = False
        for url in urls:
            try:
                await client.add_relay(RelayUrl.parse(url))
                connected = True
            except Exception as exc:  # noqa: BLE001
                logger.debug(f"trato operator info: skip relay {url}: {exc}")
        if not connected:
            return OperatorInfo(pubkey=pubkey_hex)

        try:
            await client.connect()
            author = PublicKey.parse(pubkey_hex)
            filt = (
                Filter()
                .author(author)
                .kind(Kind(KIND_INFO))
                .limit(1)
            )
            result = await client.fetch_events(
                filt, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
            )
            events = result.to_vec()
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"trato operator info fetch failed: {exc}")
            return OperatorInfo(pubkey=pubkey_hex)
        finally:
            try:
                await client.shutdown()
            except Exception:  # noqa: BLE001
                pass

        if not events:
            return OperatorInfo(pubkey=pubkey_hex)

        tags = [t.as_vec() for t in events[0].tags().to_vec()]
        parsed = parse_operator_info_tags(tags, pubkey=pubkey_hex)
        return parsed or OperatorInfo(pubkey=pubkey_hex)


operator_info_service = OperatorInfoService()
