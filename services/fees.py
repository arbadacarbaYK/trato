"""Trade fee estimates for transparent UI (operator + optional host operator).

Fee model (for UI / invoice quotes):
- **Mostro operator fee** — % of BTC trade amount (kind 38385), split 50/50 between
  buyer and seller, deducted at release. This is what Mostro clients show.
- **Instance operator fee** — additional % only when trading on the host's own mostrod.
- **Lightning routing** — NOT in operator %; paid by whoever pays the hold invoice.
- **Channel / LSP** — operator or user wallet overhead; not stacked on operator %.
- **LNbits funding** — escrow hold invoices use the configured funding source; NWC
  will route user wallets separately from shared node liquidity.
"""

from __future__ import annotations

from typing import Optional


def estimate_trade_fees(
    amount_sats: int,
    *,
    operator_fee_fraction: float,
    host_operator_fee_fraction: float = 0.0,
    market_price: bool = False,
) -> dict:
    """Estimate Lightning escrow fees split buyer / seller (Mostro default model).

    ``operator_fee_fraction`` comes from kind-38385 ``fee`` (e.g. 0.006 = 0.6%).
    When this instance runs its **own** Mostro operator (Phase 4), an additional
    ``host_operator_fee_fraction`` may apply on trades routed through it — never
    stacked on top of a *foreign* operator's fee for the same leg.
    """
    op_pct = round(operator_fee_fraction * 100, 3)
    host_pct = round(host_operator_fee_fraction * 100, 3)
    if market_price or amount_sats <= 0:
        return {
            "market_price": True,
            "amount_sats": amount_sats,
            "operator_fee_fraction": operator_fee_fraction,
            "operator_fee_percent": op_pct,
            "host_fee_fraction": host_operator_fee_fraction,
            "host_fee_percent": host_pct,
            "total_fee_sats": None,
            "buyer_fee_sats": None,
            "seller_fee_sats": None,
            "note": (
                "Fee is a percentage of the Bitcoin amount at execution "
                f"(operator ~{op_pct}% total, split between buyer and seller)."
            ),
        }
    op_total = max(1, round(amount_sats * operator_fee_fraction))
    host_total = (
        max(1, round(amount_sats * host_operator_fee_fraction))
        if host_operator_fee_fraction > 0
        else 0
    )
    combined = op_total + host_total
    buyer = combined // 2
    seller = combined - buyer
    return {
        "market_price": False,
        "amount_sats": amount_sats,
        "operator_fee_fraction": operator_fee_fraction,
        "operator_fee_percent": op_pct,
        "host_fee_fraction": host_operator_fee_fraction,
        "host_fee_percent": host_pct,
        "operator_fee_sats": op_total,
        "host_fee_sats": host_total or None,
        "total_fee_sats": combined,
        "buyer_fee_sats": buyer,
        "seller_fee_sats": seller,
        "note": None,
    }


def fee_summary_line(estimate: dict, *, side: str) -> str:
    """One-line human summary for buyer or seller role in the trade."""
    if estimate.get("market_price"):
        return (
            f"Operator fee ~{estimate['operator_fee_percent']}% of BTC at execution "
            "(split between buyer and seller)"
        )
    yours = (
        estimate["buyer_fee_sats"]
        if side == "buy"
        else estimate["seller_fee_sats"]
    )
    total = estimate["total_fee_sats"]
    parts = [f"~{yours} sats your share"]
    if total is not None:
        parts.append(f"{total} sats total escrow fee")
    if estimate.get("host_fee_sats"):
        parts.append(
            f"includes ~{estimate['host_fee_sats']} sats instance operator fee"
        )
    return " · ".join(parts)
