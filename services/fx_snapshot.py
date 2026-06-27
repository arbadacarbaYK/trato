"""Capture fiat/BTC reference rates for tax and audit exports.

Uses LNbits' cached exchange-rate feed (same source as the price API).
Snapshots are stored inside ``order_json`` so exports stay stable even if
rates move later.
"""

from __future__ import annotations

import json
import time
from typing import Any

from ..models import now


async def capture_fx(fiat_code: str) -> dict[str, Any]:
    """Return a serializable FX snapshot for one fiat currency."""
    from lnbits.utils.exchange_rates import get_fiat_rate_and_price_satoshis

    code = (fiat_code or "USD").strip().upper()
    rate, btc_price = await get_fiat_rate_and_price_satoshis(code)
    if not rate or rate <= 0:
        raise ValueError(f"No exchange rate for {code}")
    return {
        "fiat_code": code,
        "sats_per_fiat": float(rate),
        "btc_price": float(btc_price),
        "captured_at": now(),
        "source": "lnbits_exchange_rates",
    }


def merge_fx_into_order_json(
    order_json: str | None, key: str, snapshot: dict[str, Any]
) -> str:
    """Merge one FX snapshot key into order_json without dropping other fields."""
    meta = json.loads(order_json or "{}")
    meta[key] = snapshot
    return json.dumps(meta)


def _snapshot_field(meta: dict, *keys: str) -> dict | None:
    for key in keys:
        value = meta.get(key)
        if isinstance(value, dict) and value.get("btc_price"):
            return value
    return None


def fiat_value_of_sats(amount_sats: int, btc_price_fiat: float) -> float:
    """Fiat value of ``amount_sats`` at ``btc_price_fiat`` (1 BTC in fiat)."""
    if amount_sats <= 0 or btc_price_fiat <= 0:
        return 0.0
    return round((amount_sats / 100_000_000) * btc_price_fiat, 2)


def trade_timestamps(order, meta: dict) -> tuple[int, int | None]:
    """(opened_or_taken_at, settled_at_or_none)."""
    taken = meta.get("taken_at")
    opened = int(taken) if taken else int(order.created_at)
    settled = None
    if order.status in ("success", "released"):
        settled = int(order.updated_at)
    return opened, settled
