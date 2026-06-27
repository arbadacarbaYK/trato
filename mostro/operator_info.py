"""Parse Mostro kind-38385 operator info events.

See https://mostro.network/protocol/other_events.html
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class OperatorInfo:
    """Public policy published by a Mostro operator (kind 38385)."""

    pubkey: str
    fee_fraction: float = 0.006  # tag ``fee``: 0.006 == 0.6%
    min_order_amount_sats: int | None = None
    max_order_amount_sats: int | None = None
    fiat_currencies: list[str] = field(default_factory=list)
    bond_enabled: bool = False
    bond_apply_to: str | None = None
    bond_amount_pct: float | None = None
    bond_base_amount_sats: int | None = None
    mostro_version: str | None = None
    instance_name: str | None = None
    raw_tags: dict[str, list[str]] = field(default_factory=dict)

    @property
    def fee_percent(self) -> float:
        return round(self.fee_fraction * 100, 3)

    def to_dict(self) -> dict:
        return {
            "pubkey": self.pubkey,
            "fee_fraction": self.fee_fraction,
            "fee_percent": self.fee_percent,
            "min_order_amount_sats": self.min_order_amount_sats,
            "max_order_amount_sats": self.max_order_amount_sats,
            "fiat_currencies": self.fiat_currencies,
            "bond_enabled": self.bond_enabled,
            "bond_apply_to": self.bond_apply_to,
            "bond_amount_pct": self.bond_amount_pct,
            "bond_base_amount_sats": self.bond_base_amount_sats,
            "mostro_version": self.mostro_version,
            "instance_name": self.instance_name,
        }


def _tag_str(tags: list[list[str]], name: str) -> str | None:
    for tag in tags:
        if tag and tag[0] == name and len(tag) > 1:
            return str(tag[1]).strip() or None
    return None


def _tag_float(tags: list[list[str]], name: str) -> float | None:
    raw = _tag_str(tags, name)
    if raw is None:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def _tag_int(tags: list[list[str]], name: str) -> int | None:
    raw = _tag_str(tags, name)
    if raw is None:
        return None
    try:
        return int(float(raw))
    except ValueError:
        return None


def parse_operator_info_tags(
    tags: list[list[str]], *, pubkey: str = ""
) -> Optional[OperatorInfo]:
    """Parse a kind-38385 tag set. Returns None when ``z`` is not ``info``."""
    z = _tag_str(tags, "z")
    if z and z != "info":
        return None
    y_vals = []
    for tag in tags:
        if tag and tag[0] == "y" and len(tag) > 1:
            y_vals.extend(tag[1:])
    instance_name = y_vals[1] if len(y_vals) > 1 else None
    fee = _tag_float(tags, "fee")
    fiats_raw = _tag_str(tags, "fiat_currencies_accepted") or ""
    fiats = [c.strip().upper() for c in fiats_raw.split(",") if c.strip()]
    bond_enabled = (_tag_str(tags, "bond_enabled") or "").lower() == "true"
    indexed: dict[str, list[str]] = {}
    for tag in tags:
        if tag:
            indexed.setdefault(tag[0], []).append(tag[1] if len(tag) > 1 else "")
    return OperatorInfo(
        pubkey=pubkey,
        fee_fraction=fee if fee is not None else 0.006,
        min_order_amount_sats=_tag_int(tags, "min_order_amount"),
        max_order_amount_sats=_tag_int(tags, "max_order_amount"),
        fiat_currencies=fiats,
        bond_enabled=bond_enabled,
        bond_apply_to=_tag_str(tags, "bond_apply_to"),
        bond_amount_pct=_tag_float(tags, "bond_amount_pct"),
        bond_base_amount_sats=_tag_int(tags, "bond_base_amount_sats"),
        mostro_version=_tag_str(tags, "mostro_version"),
        instance_name=instance_name,
        raw_tags=indexed,
    )
