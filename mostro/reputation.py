"""Parse Mostro kind-38384 user rating events.

Addressable events keyed by the rated user's identity pubkey in the ``d`` tag.
See https://mostro.network/protocol/user_rating.html
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Optional

from .constants import Z_RATING


def _first(tags: list[list[str]], name: str) -> list[str] | None:
    for tag in tags:
        if tag and tag[0] == name:
            return tag
    return None


def _tag_int(tags: list[list[str]], name: str) -> int | None:
    tag = _first(tags, name)
    if not tag or len(tag) < 2:
        return None
    try:
        return int(tag[1])
    except (TypeError, ValueError):
        return None


def _tag_float(tags: list[list[str]], name: str) -> float | None:
    tag = _first(tags, name)
    if not tag or len(tag) < 2:
        return None
    try:
        return float(tag[1])
    except (TypeError, ValueError):
        return None


@dataclass
class UserReputation:
    """Normalized view of a kind-38384 rating snapshot."""

    pubkey: str
    total_reviews: int = 0
    total_rating: float = 0.0
    last_rating: int | None = None
    max_rate: int | None = None
    min_rate: int | None = None
    days: int | None = None
    platform: str | None = None

    @property
    def stars(self) -> float | None:
        if self.total_reviews <= 0:
            return None
        return max(0.0, min(5.0, self.total_rating))

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["found"] = True
        data["stars"] = self.stars
        data["is_new"] = self.total_reviews == 0
        return data


def parse_rating_tags(tags: list[list[str]]) -> UserReputation | None:
    """Parse a kind-38384 tag set into ``UserReputation``.

    Returns ``None`` when the event is not a Mostro rating document.
    """
    z = _first(tags, "z")
    if not z or len(z) < 2 or z[1] != Z_RATING:
        return None
    d = _first(tags, "d")
    if not d or len(d) < 2 or not d[1]:
        return None
    y = _first(tags, "y")
    platform = y[1] if y and len(y) > 1 else None
    return UserReputation(
        pubkey=d[1],
        total_reviews=_tag_int(tags, "total_reviews") or 0,
        total_rating=_tag_float(tags, "total_rating") or 0.0,
        last_rating=_tag_int(tags, "last_rating"),
        max_rate=_tag_int(tags, "max_rate"),
        min_rate=_tag_int(tags, "min_rate"),
        days=_tag_int(tags, "days"),
        platform=platform,
    )


def stars_from_payload(payload: Optional[dict]) -> int | None:
    """Extract a 1..5 star value from an operator rating payload."""
    if not isinstance(payload, dict):
        return None
    for key in ("rating_user", "last_rating", "rating"):
        raw = payload.get(key)
        if raw is None:
            continue
        try:
            value = int(raw)
        except (TypeError, ValueError):
            continue
        if 1 <= value <= 5:
            return value
    return None
