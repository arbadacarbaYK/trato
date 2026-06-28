"""Relay list helpers — one default set, separate publish vs fetch behaviour."""

from __future__ import annotations

from ..models import DEFAULT_RELAYS


def normalize_relay_list(relays: list[str] | None) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for url in relays or []:
        u = (url or "").strip()
        if u and u not in seen:
            seen.add(u)
            out.append(u)
    return out


def relays_for_publish(user_relays: list[str] | None) -> list[str]:
    """Relays used when publishing kind-0 / trade messages."""
    custom = normalize_relay_list(user_relays)
    return custom if custom else list(DEFAULT_RELAYS)


def relays_for_fetch(user_relays: list[str] | None) -> list[str]:
    """User-configured relays first, then defaults — improves profile/book reads."""
    merged = normalize_relay_list(user_relays)
    seen = set(merged)
    for url in DEFAULT_RELAYS:
        if url not in seen:
            merged.append(url)
            seen.add(url)
    return merged if merged else list(DEFAULT_RELAYS)
