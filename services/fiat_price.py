"""Central fiat→BTC price resolution for Trato.

LNbits has no BTC/USDT feed; stablecoins map to USD. When an instance only
allows ``ALL`` (Albanian Lek, not "all currencies"), applying that rate to a
USD/USDT book row yields ~9 sats per dollar instead of ~1000 — fees show as
~540 sats instead of ~100k+ BTC on a 100 USDT trade.
"""

from __future__ import annotations

from typing import Any

# Book / wallet codes → ISO code LNbits can price.
FIAT_PRICE_ALIASES: dict[str, str] = {
    "USDT": "USD",
    "USDC": "USD",
    "L-USDT": "USD",
    "L-USDC": "USD",
    "BUSD": "USD",
    "DAI": "USD",
    "TUSD": "USD",
    "USDP": "USD",
    "GUSD": "USD",
    "PYUSD": "USD",
}

_GLOBAL_FALLBACKS = ("USD", "EUR")


def normalize_fiat_code(fiat_code: str | None) -> str:
    return (fiat_code or "USD").strip().upper()


def resolve_fiat_price_code(fiat_code: str | None) -> str:
    code = normalize_fiat_code(fiat_code)
    if code in FIAT_PRICE_ALIASES:
        return FIAT_PRICE_ALIASES[code]
    if code.replace("-", "") == "LUSDT":
        return "USD"
    return code


resolve_price_fiat_code = resolve_fiat_price_code


def resolve_fiat_code(fiat_code: str) -> tuple[str, str]:
    """Return ``(lookup_code, requested_code)`` for exchange-rate lookups."""
    requested = normalize_fiat_code(fiat_code)
    return resolve_fiat_price_code(requested), requested


def premium_price_factor(premium_pct: float) -> float:
    """+premium % means fewer sats per fiat unit (maker values BTC higher)."""
    return 1.0 - float(premium_pct) / 100.0


def sats_per_fiat_from_btc_price(btc_price_fiat: float) -> float:
    if btc_price_fiat <= 0:
        return 0.0
    return 100_000_000 / btc_price_fiat


def price_fallback_chain(
    fiat_code: str,
    *,
    instance_fiat: str | None = None,
    wallet_fiat: str | None = None,
) -> list[str]:
    """Ordered fiat codes to try when fetching ``sats_per_fiat``."""
    chain: list[str] = []

    def push(c: str | None) -> None:
        c = (c or "").strip().upper()
        if c and c not in chain:
            chain.append(c)

    raw = normalize_fiat_code(fiat_code)
    resolved = resolve_fiat_price_code(raw)
    push(resolved)
    if raw != resolved:
        push(raw)
    for c in (wallet_fiat, instance_fiat):
        c = (c or "").strip().upper()
        if c and c != "ALL":
            push(c)
            alias = resolve_fiat_price_code(c)
            if alias != c:
                push(alias)
    for fb in _GLOBAL_FALLBACKS:
        push(fb)
    if raw == "ALL" or resolved == "ALL":
        push("ALL")
    return chain


price_fiat_fallback_chain = price_fallback_chain


async def fetch_fiat_price_quote(
    fiat_code: str,
    *,
    instance_fiat: str | None = None,
    wallet_fiat: str | None = None,
) -> dict[str, Any]:
    """Resolve aliases and fallbacks; return LNbits rate metadata for the UI."""
    from lnbits.utils.exchange_rates import get_fiat_rate_and_price_satoshis

    requested = normalize_fiat_code(fiat_code)
    resolved = resolve_fiat_price_code(requested)
    chain = price_fallback_chain(
        requested,
        instance_fiat=instance_fiat,
        wallet_fiat=wallet_fiat,
    )
    for try_code in chain:
        if try_code == "ALL" and resolved != "ALL" and requested != "ALL":
            continue
        try:
            rate, price = await get_fiat_rate_and_price_satoshis(try_code)
        except Exception:
            continue
        if not rate or rate <= 0:
            continue
        return {
            "fiat_code": requested,
            "price_fiat_code": try_code,
            "sats_per_fiat": float(rate),
            "btc_price": float(price),
            "resolved_via_alias": try_code == resolved and requested != resolved,
            "fallback_chain": chain,
        }
    raise ValueError(f"No exchange rate for {requested}")


def sats_from_fiat(
    fiat_amount: float,
    sats_per_fiat: float,
    *,
    premium_pct: float = 0.0,
) -> int:
    """Satoshis for a fiat amount at market, with maker premium applied."""
    if fiat_amount <= 0 or sats_per_fiat <= 0:
        return 0
    factor = premium_price_factor(premium_pct)
    return max(0, round(float(fiat_amount) * float(sats_per_fiat) * factor))


fiat_to_sats = sats_from_fiat


def sats_to_fiat(
    amount_sats: int,
    sats_per_fiat: float,
    *,
    premium_pct: float = 0.0,
) -> float:
    if amount_sats <= 0 or sats_per_fiat <= 0:
        return 0.0
    factor = premium_price_factor(premium_pct) or 1.0
    return round((amount_sats / sats_per_fiat / factor) * 100) / 100


def format_sats_display(value: int | float | None) -> str:
    """Locale-neutral integer sats string (comma thousands, never ``540.501``)."""
    if value is None:
        return "—"
    try:
        n = int(round(float(value)))
    except (TypeError, ValueError):
        return "—"
    return f"{n:,}"


def is_plausible_sats_for_fiat(
    amount_sats: int,
    fiat_amount: float,
    sats_per_fiat: float,
    *,
    premium_pct: float = 0.0,
) -> bool:
    """Reject platform ``amount_sats`` that disagree with fiat × rate by >4×."""
    if amount_sats <= 0 or fiat_amount <= 0 or sats_per_fiat <= 0:
        return True
    expected = sats_from_fiat(fiat_amount, sats_per_fiat, premium_pct=premium_pct)
    if expected <= 0:
        return True
    ratio = amount_sats / expected
    return 0.25 <= ratio <= 4.0
