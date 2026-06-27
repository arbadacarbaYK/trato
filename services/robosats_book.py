"""RoboSats coordinator REST book → NIP-69-shaped PublicOrder rows.

Coordinators publish kind-38383 to Nostr as a cache, but relays often hold only
stale events (NIP-40 ``expiration`` elapsed). The live book is always on each
coordinator's ``GET /api/book/`` — we merge that after each relay poll.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from loguru import logger

from ..mostro.order import OrderKind, OrderStatus
from ..mostro.orderbook import PublicOrder
from .robosats_federation import federation

HTTP_TIMEOUT_SECONDS = 10.0

# RoboSats frontend currencies.json (id → ISO code).
ROBOSATS_CURRENCY_CODES: dict[int, str] = {
    1: "USD",
    2: "EUR",
    3: "JPY",
    4: "GBP",
    5: "AUD",
    6: "CAD",
    7: "CHF",
    8: "CNY",
    9: "HKD",
    10: "NZD",
    11: "SEK",
    12: "KRW",
    13: "SGD",
    14: "NOK",
    15: "MXN",
    16: "BYN",
    17: "RUB",
    18: "ZAR",
    19: "TRY",
    20: "BRL",
    21: "CLP",
    22: "CZK",
    23: "DKK",
    24: "HRK",
    25: "HUF",
    26: "INR",
    27: "ISK",
    28: "PLN",
    29: "RON",
    30: "ARS",
    31: "VES",
    32: "COP",
    33: "PEN",
    34: "UYU",
    35: "PYG",
    36: "BOB",
    37: "IDR",
    38: "ANG",
    39: "CRC",
    40: "CUP",
    41: "DOP",
    42: "GHS",
    43: "GTQ",
    44: "ILS",
    45: "JMD",
    46: "KES",
    47: "KZT",
    48: "MYR",
    49: "NAD",
    50: "NGN",
    51: "AZN",
    52: "PAB",
    53: "PHP",
    54: "PKR",
    55: "QAR",
    56: "SAR",
    57: "THB",
    58: "TTD",
    59: "VND",
    60: "XOF",
    61: "TWD",
    62: "TZS",
    63: "XAF",
    64: "UAH",
    65: "EGP",
    66: "LKR",
    67: "MAD",
    68: "AED",
    69: "TND",
    70: "ETB",
    71: "GEL",
    72: "UGX",
    73: "RSD",
    74: "IRT",
    75: "BDT",
    76: "ALL",
    77: "DZD",
    78: "UZS",
    300: "XAU",
    1000: "BTC",
}

_SOURCE_ORDER_ID = re.compile(r"/order/[^/]+/(\d+)\s*$")


def robosats_api_order_id(order: PublicOrder) -> str:
    """Coordinator REST id (numeric) for verify/take.

    Nostr ``d`` tags are hashed UUIDs; the numeric id lives in ``source``.
    """
    return coordinator_api_order_id(str(order.id or ""), order.source)


def coordinator_api_order_id(order_id: str, source: str | None = None) -> str:
    """Resolve RoboSats coordinator REST order id from Nostr book row fields."""
    if source:
        match = _SOURCE_ORDER_ID.search(str(source).strip())
        if match:
            return match.group(1)
    oid = str(order_id or "").strip()
    if oid.isdigit():
        return oid
    return oid


def _parse_iso_ts(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip()
    if not text:
        return None
    if text.isdigit():
        return int(text)
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        return int(datetime.fromisoformat(text).timestamp())
    except (TypeError, ValueError):
        return None


def _to_number(value: Any) -> int | float | None:
    if value is None or value == "":
        return None
    try:
        number = float(value)
        return int(number) if number.is_integer() else number
    except (TypeError, ValueError):
        return None


def public_order_from_rest(
    entry: dict[str, Any],
    *,
    coordinator_pubkey: str,
    coordinator_alias: str,
    coordinator_base: str,
) -> PublicOrder | None:
    """Map one ``GET /api/book/`` row to a pending PublicOrder."""
    try:
        order_id = int(entry["id"])
    except (KeyError, TypeError, ValueError):
        return None

    currency_id = entry.get("currency")
    try:
        fiat_code = ROBOSATS_CURRENCY_CODES[int(currency_id)]
    except (KeyError, TypeError, ValueError):
        return None

    try:
        order_type = int(entry.get("type", -1))
    except (TypeError, ValueError):
        return None
    # RoboSats Order.Types: BUY=0, SELL=1
    kind = OrderKind.BUY if order_type == 0 else OrderKind.SELL

    has_range = bool(entry.get("has_range"))
    fiat_amount: int | float | None = None
    fiat_min: int | float | None = None
    fiat_max: int | float | None = None
    if has_range:
        fiat_min = _to_number(entry.get("min_amount"))
        fiat_max = _to_number(entry.get("max_amount"))
    else:
        fiat_amount = _to_number(entry.get("amount"))

    try:
        premium = float(entry.get("premium") or 0)
    except (TypeError, ValueError):
        premium = 0.0

    satoshis = entry.get("satoshis")
    if satoshis is not None and satoshis != "":
        try:
            amount_sats = int(satoshis)
        except (TypeError, ValueError):
            amount_sats = 0
    else:
        # Relative pricing (premium over market): fiat amount is fixed; sats at take.
        # ``satoshis_now`` is coordinator-internal — do not pin ``amount_sats``.
        amount_sats = 0

    payment_method = str(entry.get("payment_method") or "").strip()
    payment_methods = [p for p in payment_method.split() if p] if payment_method else []

    expires_at = _parse_iso_ts(entry.get("expires_at"))
    created_at = _parse_iso_ts(entry.get("created_at"))

    alias = (coordinator_alias or "").strip().lower()
    base = coordinator_base.rstrip("/")
    source = f"{base}/order/{alias}/{order_id}" if alias else f"{base}/order/{order_id}"

    return PublicOrder(
        id=str(order_id),
        kind=kind,
        fiat_code=fiat_code,
        status=OrderStatus.PENDING,
        amount_sats=amount_sats,
        fiat_amount=fiat_amount,
        fiat_min=fiat_min,
        fiat_max=fiat_max,
        payment_methods=payment_methods,
        premium=premium,
        network="mainnet",
        layer="lightning",
        layers=["lightning"],
        platform="robosats",
        platform_instance=alias or None,
        maker_name=str(entry.get("maker_nick") or "").strip() or None,
        source=source,
        bond=str(entry.get("bond_size") or "") or None,
        expires_at=expires_at,
        mostro_pubkey=coordinator_pubkey,
        event_created_at=created_at,
    )


async def fetch_coordinator_public_orders() -> list[PublicOrder]:
    """Live public rows from federation coordinators with clearnet ``/api/book/``."""
    await federation.ensure_loaded()
    if not federation.index_loaded:
        return []

    from .http_json import get_json

    out: list[PublicOrder] = []
    for alias, pk, base in federation.book_coordinators():
        url = f"{base}/api/book/"
        payload = await get_json(url, timeout=HTTP_TIMEOUT_SECONDS)
        if not isinstance(payload, list):
            continue
        for row in payload:
            if not isinstance(row, dict):
                continue
            order = public_order_from_rest(
                row,
                coordinator_pubkey=pk,
                coordinator_alias=alias,
                coordinator_base=base,
            )
            if order is not None:
                out.append(order)
        if payload:
            logger.info(
                f"trato: RoboSats REST book {alias!r}: {len(payload)} live rows"
            )
    return out
