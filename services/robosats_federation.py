"""RoboSats federation coordinator index (shared by book verify + take)."""

from __future__ import annotations

import time
from typing import Any

from loguru import logger

FEDERATION_URL = (
    "https://raw.githubusercontent.com/RoboSats/robosats/main/"
    "frontend/static/federation.json"
)
FEDERATION_TTL_SECONDS = 3600
HTTP_TIMEOUT_SECONDS = 8.0

# RoboSats Order.Status — on the public book.
ROBOSATS_STATUS_PUBLIC = 1


class RoboSatsFederation:
    def __init__(self) -> None:
        self._by_pubkey: dict[str, str] = {}
        self._by_alias: dict[str, str] = {}
        self._meta: dict[str, dict[str, Any]] = {}
        self._loaded_at = 0.0

    @property
    def coordinator_aliases(self) -> list[str]:
        return sorted(self._by_alias.keys())

    @property
    def index_loaded(self) -> bool:
        """True after federation.json was fetched and parsed at least once."""
        return bool(self._by_pubkey)

    def is_coordinator_pubkey(self, pubkey_hex: str) -> bool:
        return (pubkey_hex or "").lower() in self._by_pubkey

    def passes_ingest_filter(self, pubkey_hex: str) -> bool:
        """Allow RoboSats relay rows when the index is unavailable; filter when loaded."""
        if not self.index_loaded:
            return True
        return self.is_coordinator_pubkey(pubkey_hex)

    def coordinator_url(self, pubkey_hex: str) -> str | None:
        url = self._by_pubkey.get((pubkey_hex or "").lower())
        return url or None

    def coordinator_url_for_alias(self, alias: str) -> str | None:
        return self._by_alias.get((alias or "").strip().lower())

    def coordinator_pubkey_for_alias(self, alias: str) -> str | None:
        meta = self._meta.get((alias or "").strip().lower())
        if not meta:
            return None
        return str(meta.get("nostrHexPubkey") or "").lower() or None

    def coordinator_pubkeys(self) -> list[str]:
        return list(self._by_pubkey.keys())

    async def ensure_loaded(self) -> None:
        now = time.time()
        if self._by_pubkey and now - self._loaded_at < FEDERATION_TTL_SECONDS:
            return
        try:
            import httpx
        except ImportError:
            return
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
                resp = await client.get(FEDERATION_URL)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"trato: RoboSats federation fetch failed: {exc}")
            return
        by_pk: dict[str, str] = {}
        by_alias: dict[str, str] = {}
        meta: dict[str, dict[str, Any]] = {}
        for alias, entry in data.items():
            if not isinstance(entry, dict):
                continue
            pk = str(entry.get("nostrHexPubkey") or "").strip().lower()
            mainnet = entry.get("mainnet") or {}
            base = str(mainnet.get("clearnet") or "").strip().rstrip("/")
            short = str(entry.get("shortAlias") or alias).strip().lower()
            if pk:
                if base:
                    by_pk[pk] = base
                elif pk not in by_pk:
                    by_pk[pk] = ""
                if base:
                    by_alias[short] = base
                    meta[short] = entry
        if by_pk:
            self._by_pubkey = by_pk
            self._by_alias = by_alias
            self._meta = meta
            self._loaded_at = now

    async def verify_public_order(self, pubkey_hex: str, order_id: str) -> bool:
        """True when coordinator API reports the order is still public."""
        await self.ensure_loaded()
        base = self.coordinator_url(pubkey_hex)
        if not base:
            return False
        try:
            import httpx
        except ImportError:
            return False
        url = f"{base}/api/order/{order_id}"
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
                resp = await client.get(url)
            if resp.status_code == 404:
                return False
            if resp.status_code != 200:
                return False
            payload = resp.json()
            return payload.get("status") == ROBOSATS_STATUS_PUBLIC
        except Exception as exc:  # noqa: BLE001
            logger.debug(f"trato: RoboSats verify {order_id!r} failed: {exc!r}")
            return False


federation = RoboSatsFederation()
