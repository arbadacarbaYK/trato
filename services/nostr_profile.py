"""Fetch Nostr kind-0 metadata (display name, avatar) from relays."""

from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from datetime import timedelta
from typing import Optional

from loguru import logger

from ..models import DEFAULT_RELAYS
from ..nostr.relays import relays_for_fetch, relays_for_publish
CONNECT_TIMEOUT_SECONDS = 8
LIVE_FETCH_TIMEOUT_SECONDS = 22
FOLLOWERS_FETCH_LIMIT = 500
CACHE_TTL_SECONDS = 300
KIND_METADATA = 0
KIND_CONTACTS = 3
PROFILE_FIELD_LIMITS = {
    "name": 64,
    "display_name": 64,
    "picture": 2048,
    "about": 1000,
    "nip05": 128,
    "lud16": 200,
}


@dataclass
class NostrProfile:
    pubkey: str
    name: str | None = None
    display_name: str | None = None
    picture: str | None = None
    about: str | None = None
    nip05: str | None = None
    lud16: str | None = None
    following_count: int | None = None
    followers_count: int | None = None
    followers_cap_hit: bool = False

    def label(self) -> str | None:
        for value in (self.display_name, self.name):
            if value and str(value).strip():
                return str(value).strip()
        return None

    def to_dict(self) -> dict:
        label = self.label()
        from ..nostr.pubkey import hex_to_npub

        return {
            "pubkey": self.pubkey,
            "npub": hex_to_npub(self.pubkey),
            "name": self.name,
            "display_name": self.display_name,
            "picture": self.picture,
            "about": self.about,
            "nip05": self.nip05,
            "lud16": self.lud16,
            "label": label,
            "following_count": self.following_count,
            "followers_count": self.followers_count,
            "followers_cap_hit": self.followers_cap_hit,
            "found": bool(
                label
                or self.picture
                or self.about
                or self.nip05
                or self.lud16
                or self.following_count is not None
                or self.followers_count is not None
            ),
        }


from ..nostr.pubkey import normalize_pubkey


def parse_metadata_content(content: str, pubkey: str) -> NostrProfile:
    """Parse kind-0 JSON content into a profile (empty on bad/missing data)."""
    base = NostrProfile(pubkey=pubkey)
    if not content or not content.strip():
        return base
    try:
        data = json.loads(content)
    except (json.JSONDecodeError, TypeError):
        return base
    if not isinstance(data, dict):
        return base
    return NostrProfile(
        pubkey=pubkey,
        name=_str_or_none(data.get("name")),
        display_name=_str_or_none(data.get("display_name")),
        picture=_str_or_none(data.get("picture")),
        about=_str_or_none(data.get("about")),
        nip05=_str_or_none(data.get("nip05")),
        lud16=_str_or_none(data.get("lud16")),
    )


def _str_or_none(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _clean_profile_field(key: str, value) -> str | None:
    limit = PROFILE_FIELD_LIMITS[key]
    text = _str_or_none(value)
    if not text:
        return None
    if len(text) > limit:
        raise ValueError(f"{key} is too long (max {limit} characters).")
    if key == "picture" and not (
        text.startswith("https://") or text.startswith("http://")
    ):
        raise ValueError("picture must be an http(s) URL.")
    if key == "nip05" and ("@" not in text or text.startswith("@") or text.endswith("@")):
        raise ValueError("nip05 must look like name@domain.")
    if key == "lud16":
        if "@" not in text or text.startswith("@") or text.endswith("@"):
            raise ValueError("lud16 must look like user@domain (Lightning address).")
        return text.lower()
    return text


def profile_to_metadata_dict(profile: NostrProfile) -> dict[str, str]:
    """Build the kind-0 JSON object from a profile."""
    out: dict[str, str] = {}
    for key in PROFILE_FIELD_LIMITS:
        value = getattr(profile, key, None)
        cleaned = _str_or_none(value)
        if cleaned:
            out[key] = cleaned
    return out


def normalize_profile_update(raw: dict) -> dict[str, str]:
    """Validate and normalize profile fields from an API request."""
    out: dict[str, str] = {}
    for key in PROFILE_FIELD_LIMITS:
        if key not in raw:
            continue
        cleaned = _clean_profile_field(key, raw.get(key))
        if cleaned:
            out[key] = cleaned
    if not any(out.get(k) for k in ("display_name", "name")):
        raise ValueError("Set a display name so others can recognize you on the book.")
    return out


def merge_profile_update(
    current: NostrProfile, updates: dict
) -> dict[str, str]:
    """Merge relay-fetched profile with new values (empty string clears a field)."""
    merged = profile_to_metadata_dict(current)
    for key in PROFILE_FIELD_LIMITS:
        if key not in updates:
            continue
        raw = updates.get(key)
        if raw is None or not str(raw).strip():
            merged.pop(key, None)
            continue
        cleaned = _clean_profile_field(key, raw)
        if cleaned:
            merged[key] = cleaned
        else:
            merged.pop(key, None)
    if not any(merged.get(k) for k in ("display_name", "name")):
        raise ValueError("Set a display name so others can recognize you on the book.")
    return merged


def build_metadata_json(metadata: dict[str, str]) -> str:
    """Compact kind-0 JSON payload."""
    import json

    return json.dumps(metadata, separators=(",", ":"), ensure_ascii=False)


def sign_metadata_event(signer_keys, metadata: dict[str, str]):
    """Sign a kind-0 metadata event with the identity key."""
    from nostr_sdk import EventBuilder, Metadata

    payload = build_metadata_json(metadata)
    meta = Metadata.from_json(payload)
    return EventBuilder.metadata(meta).sign_with_keys(signer_keys)


async def publish_kind0_metadata(
    signer_keys,
    metadata: dict[str, str],
    relays: list[str] | None = None,
) -> dict:
    """Sign and publish kind-0 metadata; return relay results."""
    from nostr_sdk import Client, NostrSigner, RelayUrl

    urls = relays_for_publish(relays)

    event = sign_metadata_event(signer_keys, metadata)
    client = Client(NostrSigner.keys(signer_keys))
    connected: list[str] = []
    failed: list[str] = []
    try:
        for url in urls:
            try:
                await client.add_relay(RelayUrl.parse(url))
                connected.append(url)
            except Exception as exc:  # noqa: BLE001
                logger.debug(f"trato profile publish: skip relay {url}: {exc}")
                failed.append(url)
        if not connected:
            return {
                "published": False,
                "relays_ok": [],
                "relays_failed": failed or urls,
                "error": "Could not connect to any relay. Check Settings → Relays.",
            }
        await client.connect()
        await client.send_event(event)
        return {
            "published": True,
            "relays_ok": connected,
            "relays_failed": failed,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"trato profile publish failed: {exc}")
        return {
            "published": False,
            "relays_ok": connected,
            "relays_failed": failed,
            "error": "Profile could not be published to relays. Try again in a moment.",
        }
    finally:
        try:
            await client.shutdown()
        except Exception:  # noqa: BLE001
            pass


def count_following_tags(tags: list) -> int:
    """NIP-02 kind-3: one ``p`` tag per followed pubkey."""
    total = 0
    for tag in tags:
        if not tag or tag[0] != "p":
            continue
        if len(tag) > 1 and str(tag[1]).strip():
            total += 1
    return total


def count_follower_authors(events, target_pubkey: str) -> tuple[int, bool]:
    """Count distinct authors whose kind-3 lists include ``target_pubkey``."""
    seen: set[str] = set()
    cap_hit = len(events) >= FOLLOWERS_FETCH_LIMIT
    for event in events:
        author = event.author().to_hex().lower()
        if author in seen:
            continue
        tags = [t.as_vec() for t in event.tags().to_vec()]
        for tag in tags:
            if (
                tag
                and tag[0] == "p"
                and len(tag) > 1
                and str(tag[1]).strip().lower() == target_pubkey
            ):
                seen.add(author)
                break
    return len(seen), cap_hit


class NostrProfileService:
    """Short-lived cache for per-pubkey kind-0 lookups."""

    def __init__(self) -> None:
        self._cache: dict[str, tuple[NostrProfile, int]] = {}

    async def fetch(
        self,
        pubkey: str,
        relays: list[str] | None = None,
        *,
        force: bool = False,
        include_counts: bool = False,
    ) -> NostrProfile:
        hexed = normalize_pubkey(pubkey)
        if not hexed:
            return NostrProfile(pubkey="")
        now = int(time.time())
        cached = self._cache.get(hexed)
        if not force and cached and now - cached[1] < CACHE_TTL_SECONDS:
            return cached[0]

        try:
            profile = await asyncio.wait_for(
                self._fetch_live(
                    hexed,
                    relays_for_fetch(relays),
                    include_counts=include_counts,
                ),
                timeout=LIVE_FETCH_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.warning(f"trato nostr profile fetch timed out for {hexed[:16]}…")
            if cached:
                return cached[0]
            return NostrProfile(pubkey=hexed)
        self._cache[hexed] = (profile, now)
        return profile

    def invalidate(self, pubkey: str) -> None:
        hexed = normalize_pubkey(pubkey)
        if hexed:
            self._cache.pop(hexed, None)

    async def fetch_many(
        self,
        pubkeys: list[str],
        relays: list[str] | None = None,
        *,
        include_counts: bool = False,
    ) -> dict[str, dict]:
        """Batch-fetch profiles; returns {pubkey_hex: profile_dict}."""
        unique: list[str] = []
        seen: set[str] = set()
        for raw in pubkeys:
            hexed = normalize_pubkey(raw)
            if hexed and hexed not in seen:
                seen.add(hexed)
                unique.append(hexed)
        out: dict[str, dict] = {}
        for hexed in unique[:25]:
            profile = await self.fetch(hexed, relays, include_counts=include_counts)
            out[hexed] = profile.to_dict()
        return out

    async def _fetch_live(
        self, pubkey_hex: str, relays: list[str], *, include_counts: bool = False
    ) -> NostrProfile:
        try:
            from nostr_sdk import Client, Filter, Kind, PublicKey, RelayUrl
        except ImportError:
            logger.warning("trato nostr profile: nostr_sdk unavailable")
            return NostrProfile(pubkey=pubkey_hex)

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
                logger.debug(f"trato profile: skip relay {url}: {exc}")
        if not connected:
            return NostrProfile(pubkey=pubkey_hex)

        try:
            await asyncio.wait_for(
                client.connect(), timeout=CONNECT_TIMEOUT_SECONDS
            )
            pubkey = PublicKey.parse(pubkey_hex)

            f_meta = (
                Filter()
                .author(pubkey)
                .kind(Kind(KIND_METADATA))
                .limit(1)
            )
            meta_events = await client.fetch_events(
                f_meta, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
            )
            meta_vec = meta_events.to_vec()
            profile = (
                parse_metadata_content(meta_vec[0].content(), pubkey_hex)
                if meta_vec
                else NostrProfile(pubkey=pubkey_hex)
            )

            if include_counts:
                f_following = (
                    Filter()
                    .author(pubkey)
                    .kind(Kind(KIND_CONTACTS))
                    .limit(1)
                )
                following_events = await client.fetch_events(
                    f_following, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
                )
                following_vec = following_events.to_vec()
                if following_vec:
                    tags = [t.as_vec() for t in following_vec[0].tags().to_vec()]
                    profile.following_count = count_following_tags(tags)

                f_followers = (
                    Filter()
                    .kind(Kind(KIND_CONTACTS))
                    .pubkey(pubkey)
                    .limit(FOLLOWERS_FETCH_LIMIT)
                )
                follower_events = await client.fetch_events(
                    f_followers, timedelta(seconds=FETCH_TIMEOUT_SECONDS)
                )
                follower_vec = follower_events.to_vec()
                if follower_vec:
                    count, cap_hit = count_follower_authors(follower_vec, pubkey_hex)
                    profile.followers_count = count
                    profile.followers_cap_hit = cap_hit

            return profile
        except asyncio.TimeoutError:
            logger.warning(f"trato nostr profile relay connect timed out for {pubkey_hex[:16]}…")
            return NostrProfile(pubkey=pubkey_hex)
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"trato nostr profile fetch failed: {exc}")
            return NostrProfile(pubkey=pubkey_hex)
        finally:
            try:
                await asyncio.wait_for(client.shutdown(), timeout=3.0)
            except Exception:  # noqa: BLE001
                pass


nostr_profile_service = NostrProfileService()
