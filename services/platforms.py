"""Which P2P platforms Trato can trade on vs browse-only."""

from __future__ import annotations

# Platforms whose take flow is implemented in Trato.
TAKEABLE_PLATFORMS = frozenset({"mostro", "robosats"})

# Roadmap / external apps — shown in UI when user hits a non-takeable ad.
EXTERNAL_PLATFORM_URLS: dict[str, str] = {
    "robosats": "https://learn.robosats.org/",
    "peach": "https://peachbitcoin.com/",
    "lnp2pbot": "https://lnp2pbot.com/",
    "hodlhodl": "https://hodlhodl.com/",
}


def normalize_platform(platform: str | None) -> str:
    return (platform or "mostro").strip().lower()


def platform_takeable(platform: str | None) -> bool:
    """True when Trato implements the take/publish protocol for this platform."""
    return normalize_platform(platform) in TAKEABLE_PLATFORMS


def platform_external_url(platform: str | None) -> str | None:
    return EXTERNAL_PLATFORM_URLS.get(normalize_platform(platform))


def takeable_platforms_list() -> list[str]:
    return sorted(TAKEABLE_PLATFORMS)


def trading_capabilities(
    *,
    demo_mode: bool,
    mainnet_enabled: bool,
    hold_invoices: bool,
    local_operator: dict | None = None,
    nwc_configured: bool = False,
) -> dict:
    """What the UI should advertise as possible right now."""
    live_blockers: list[str] = []
    live_mostro_ready = mainnet_enabled and hold_invoices
    live_robosats_ready = mainnet_enabled and nwc_configured
    live_take_enabled = live_mostro_ready or live_robosats_ready

    if not demo_mode:
        if not mainnet_enabled:
            live_blockers.append("Enable mainnet in Settings.")
        if not hold_invoices:
            live_blockers.append(
                "Connect a hold-invoice-capable wallet (e.g. LND) for live Mostro escrow."
            )
        if not nwc_configured:
            live_blockers.append(
                "Connect your Lightning wallet (NWC URI in Settings) for live RoboSats bonds."
            )

    op_ready = bool(
        local_operator
        and (
            local_operator.get("ready")
            or local_operator.get("configured")
        )
    )
    op_pubkey = None
    op_fee = None
    if local_operator:
        op = local_operator.get("operator") or {}
        op_pubkey = op.get("pubkey")
        op_fee = op.get("fee_fraction")

    return {
        "takeable_platforms": takeable_platforms_list(),
        "demo_take_enabled": True,
        "live_take_enabled": live_take_enabled,
        "live_mostro_enabled": live_mostro_ready,
        "live_robosats_enabled": live_robosats_ready,
        "robosats_take_enabled": demo_mode or nwc_configured,
        "nwc_configured": nwc_configured,
        "live_take_blockers": live_blockers if not demo_mode else [],
        "onchain_take_enabled": demo_mode or live_mostro_ready,
        "lightning_take_enabled": True,
        "operator_mode_enabled": op_ready,
        "host_operator_pubkey": op_pubkey,
        "host_operator_fee_fraction": op_fee,
        "host_operator_fee_percent": (op_fee * 100) if isinstance(op_fee, (int, float)) else None,
        "operator_mode_note": (
            "This LNbits instance runs Trato Operator (mostrod) — your trades can "
            "route to your own operator and you earn the published fee (kind 38385)."
            if op_ready
            else (
                "Install Trato Operator on this instance to run mostrod, mediate "
                "disputes, and earn trade fees on trades routed to your operator key."
            )
        ),
    }
