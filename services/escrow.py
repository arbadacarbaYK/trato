"""Lightning hold-invoice escrow capability + health.

Mostro escrow works by the seller funding a Lightning HOLD invoice: the sats are
locked (not captured) until the operator either settles (release to buyer) or
cancels (refund to seller) after fiat is confirmed off-platform.

This requires the LNbits funding source to support hold invoices (LND-type).
This module reports that capability and is the single seam where real escrow
operations will be wired in the trade-flow phase. It deliberately does NOT move
money yet: real settlement is gated behind capability + non-demo + mainnet
checks so nothing can fire by accident.
"""

from __future__ import annotations

from lnbits.wallets import get_funding_source
from lnbits.wallets.base import Feature


def hold_invoices_supported() -> bool:
    try:
        return get_funding_source().has_feature(Feature.holdinvoice)
    except Exception:  # noqa: BLE001
        return False


def escrow_health() -> dict:
    """Actionable health for the UI: can this instance actually escrow sats?"""
    supported = hold_invoices_supported()
    try:
        funding_source = type(get_funding_source()).__name__
    except Exception:  # noqa: BLE001
        funding_source = "unknown"

    return {
        "hold_invoices_supported": supported,
        "funding_source": funding_source,
        "ready_for_real_escrow": supported,
        "message": (
            "Hold-invoice escrow is available."
            if supported
            else (
                "This LNbits funding source does not support hold invoices. "
                "Real (non-demo) trading needs an LND-type funding source. "
                "Demo mode and order-book browsing still work."
            )
        ),
    }
