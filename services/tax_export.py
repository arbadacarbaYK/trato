"""CSV export of completed trades for tax reporting."""

from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import Any, Iterable

from ..models import Order
from .fx_snapshot import _snapshot_field, fiat_value_of_sats, trade_timestamps

_EXPORT_STATUSES = frozenset({"success", "released", "canceled", "cooperatively-canceled", "expired"})

_CSV_COLUMNS = [
    "trade_id",
    "mostro_order_id",
    "role",
    "side",
    "status",
    "demo",
    "fiat_code",
    "fiat_amount",
    "amount_sats",
    "premium_pct",
    "payment_method",
    "opened_at_utc",
    "taken_at_utc",
    "settled_at_utc",
    "btc_price_fiat_at_take",
    "sats_per_fiat_at_take",
    "fiat_value_of_btc_at_take",
    "btc_price_fiat_at_settlement",
    "sats_per_fiat_at_settlement",
    "fiat_value_of_btc_at_settlement",
    "fx_notes",
]


def _iso(ts: int | None) -> str:
    if not ts:
        return ""
    return datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _row_for_order(order: Order) -> dict[str, Any]:
    meta = json.loads(order.order_json or "{}")
    opened_at, settled_at = trade_timestamps(order, meta)
    taken_at = meta.get("taken_at") or order.created_at

    fx_take = _snapshot_field(meta, "fx_at_take", "fx_at_open")
    fx_settle = _snapshot_field(meta, "fx_at_settlement")

    notes: list[str] = []
    if not fx_take:
        notes.append("take_rate_missing")
    if order.status in ("success", "released") and not fx_settle:
        notes.append("settlement_rate_missing")

    btc_take = float(fx_take["btc_price"]) if fx_take else ""
    sats_take = float(fx_take["sats_per_fiat"]) if fx_take else ""
    fiat_at_take = ""
    if fx_take and order.amount_sats:
        fiat_at_take = fiat_value_of_sats(order.amount_sats, float(fx_take["btc_price"]))
    elif order.fiat_amount:
        fiat_at_take = round(float(order.fiat_amount), 2)

    btc_settle = float(fx_settle["btc_price"]) if fx_settle else ""
    sats_settle = float(fx_settle["sats_per_fiat"]) if fx_settle else ""
    fiat_at_settle = ""
    if fx_settle and order.amount_sats and order.status in ("success", "released"):
        fiat_at_settle = fiat_value_of_sats(
            order.amount_sats, float(fx_settle["btc_price"])
        )

    return {
        "trade_id": order.id,
        "mostro_order_id": order.mostro_order_id or "",
        "role": order.role,
        "side": order.side,
        "status": order.status,
        "demo": "yes" if order.demo else "no",
        "fiat_code": order.fiat_code,
        "fiat_amount": order.fiat_amount if order.fiat_amount is not None else "",
        "amount_sats": order.amount_sats,
        "premium_pct": order.premium,
        "payment_method": order.payment_method,
        "opened_at_utc": _iso(order.created_at),
        "taken_at_utc": _iso(int(taken_at) if taken_at else None),
        "settled_at_utc": _iso(settled_at),
        "btc_price_fiat_at_take": btc_take,
        "sats_per_fiat_at_take": sats_take,
        "fiat_value_of_btc_at_take": fiat_at_take,
        "btc_price_fiat_at_settlement": btc_settle,
        "sats_per_fiat_at_settlement": sats_settle,
        "fiat_value_of_btc_at_settlement": fiat_at_settle,
        "fx_notes": ";".join(notes),
    }


def filter_orders_for_export(
    orders: Iterable[Order],
    *,
    include_demo: bool,
    status: str | None = None,
    since: int | None = None,
    until: int | None = None,
) -> list[Order]:
    rows: list[Order] = []
    for order in orders:
        if not include_demo and order.demo:
            continue
        if status and order.status != status:
            continue
        if since and order.created_at < since:
            continue
        if until and order.created_at > until:
            continue
        if order.status not in _EXPORT_STATUSES and status is None:
            # Default export: only trades that reached a terminal state.
            if order.status not in ("success", "released"):
                continue
        rows.append(order)
    rows.sort(key=lambda o: o.created_at)
    return rows


def orders_to_csv(orders: Iterable[Order]) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for order in orders:
        writer.writerow(_row_for_order(order))
    return buf.getvalue()
