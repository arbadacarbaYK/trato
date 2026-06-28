"""JSON API for Trato.

Scoping: user-level data (settings, identity, orders) is keyed by the LNbits
user that owns the admin key used on the request. The public order book and
health endpoints are read-only.

Safety: creating/taking orders that move real money requires mainnet, hold-invoice
funding (Mostro), and/or NWC (RoboSats). Demo mode records orders locally only.
"""

from __future__ import annotations

import json
import os
from http import HTTPStatus

from embit import bip39
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from lnbits.core.crud import get_wallet
from lnbits.decorators import WalletTypeInfo, require_admin_key
from lnbits.helpers import urlsafe_short_hash
from pydantic import BaseModel, Field

from . import crud
from .models import (
    ChatMessage,
    CreateIdentity,
    CreateOrder,
    Identity,
    Order,
    OrderAction,
    SharePaymentProfile,
    TakeOrder,
    UpdatePaymentDetails,
    UpdateNostrProfile,
    UpdateSettings,
    now,
)
from .mostro.protocol import Action
from .mostro.orderbook import layer_matches
from .mostro.order import OrderKind, OrderStatus, SmallOrder
from .mostro.sides import maker_kind_for_user_intent
from .mostro.tradeflow import allowed_user_actions
from .nostr.keys import KeyManager
from .security import decrypt_secret, encrypt_secret
from .services.escrow import escrow_health
from .services.payment_profiles import (
    BITCOIN_RECEIVE_TYPES,
    COUNTRY_MAP_CENTER,
    COUNTRY_NAMES,
    FIAT_PAYMENT_TYPES,
    MOBILE_MONEY_COUNTRIES,
    PAYMENT_TYPE_SCHEMA,
    SEPA_IBAN_COUNTRIES,
    buyer_receive_summary,
    format_profile_for_chat,
    pack_profiles,
    pay_actions,
    profile_method_names,
    profile_snapshot_for_trade,
    unpack_profiles,
)
from .services.messenger import CrudTradeStore
from .services.nostr_profile import (
    merge_profile_update,
    nostr_profile_service,
    publish_kind0_metadata,
)
from .services.platforms import platform_takeable, trading_capabilities
from .services.operator_info import operator_info_service
from .services.reputation import reputation_service
from .services.relay import orderbook
from .services.robosats_client import new_robot_token
from .services.robosats_federation import federation
from .services.robosats_trade import (
    RoboSatsDemoOperator,
    apply_live_robosats_action,
    live_take_robosats,
    sync_live_robosats,
)
from .services.fx_snapshot import capture_fx, merge_fx_into_order_json
from .services.tax_export import filter_orders_for_export, orders_to_csv
from .services.trade_engine import (
    DemoOperator,
    DemoTradeIO,
    LnbitsTradeIO,
    NwcTradeIO,
    TradeEngine,
)
from .services.trade_snapshots import seed_demo_trade_context, seed_live_buyer_context

trato_api_router = APIRouter()


class NostrProfilesBody(BaseModel):
    pubkeys: list[str] = Field(..., max_items=25)
    relays: list[str] | None = None


# --- Public order book (read-only) ------------------------------------------
@trato_api_router.get("/api/v1/orderbook")
async def api_orderbook(
    side: str | None = Query(
        None,
        pattern="^(buy|sell)$",
        description="Your intent: buy or sell BTC (not the maker's wire label).",
    ),
    fiat: str | None = Query(None, max_length=8),
    platform: str | None = Query(None, max_length=64),
    settlement: str | None = Query(
        None,
        pattern="^(lightning|onchain|any)$",
        description="Settlement layer filter.",
    ),
    demo_seed: bool = Query(
        False,
        description="Merge synthetic Mostro demo offers when relays have no takeable ads.",
    ),
):
    maker_side = maker_kind_for_user_intent(side) if side else None
    return orderbook.snapshot(
        side=maker_side,
        fiat_code=fiat,
        platform=platform,
        settlement=settlement,
        demo_seed=demo_seed,
    )


@trato_api_router.get("/api/v1/orderbook/stats")
async def api_orderbook_stats(
    demo_seed: bool = Query(
        False,
        description="Count synthetic demo offers when relays have no takeable ads.",
    ),
):
    return orderbook.stats(demo_seed=demo_seed)


class OperatorInfoBody(BaseModel):
    pubkeys: list[str] = Field(..., max_items=25)
    relays: list[str] | None = None


@trato_api_router.post("/api/v1/operators/info")
async def api_operators_info(body: OperatorInfoBody):
    """Public: Mostro operator fee policy (kind 38385) for transparent pricing."""
    return await operator_info_service.fetch_many(body.pubkeys, body.relays)


@trato_api_router.get("/api/v1/fees/estimate")
async def api_fee_estimate(
    amount_sats: int = Query(0, ge=0),
    operator_pubkey: str = Query(..., min_length=8, max_length=128),
    side: str = Query("buy", pattern="^(buy|sell)$"),
    market_price: bool = Query(False),
    relays: str | None = Query(None),
):
    """Public fee breakdown for a trade amount and operator."""
    from .services.fees import estimate_trade_fees, fee_summary_line

    relay_list = [u.strip() for u in (relays or "").split(",") if u.strip()] or None
    info = await operator_info_service.fetch(operator_pubkey, relay_list)
    fee_fraction = info.fee_fraction if info else 0.006
    est = estimate_trade_fees(
        amount_sats,
        operator_fee_fraction=fee_fraction,
        host_operator_fee_fraction=0.0,
        market_price=market_price or amount_sats <= 0,
    )
    est["summary"] = fee_summary_line(est, side=side)
    est["operator_pubkey"] = operator_pubkey
    return est


@trato_api_router.get("/api/v1/nostr/profile")
async def api_nostr_profile(
    pubkey: str = Query(..., min_length=8, max_length=128),
    relays: str | None = Query(None, description="Comma-separated relay URLs"),
):
    """Nostr kind-0 metadata (name, avatar) for a pubkey — public read."""
    relay_list = [u.strip() for u in (relays or "").split(",") if u.strip()] or None
    profile = await nostr_profile_service.fetch(pubkey, relay_list)
    return profile.to_dict()


@trato_api_router.post("/api/v1/nostr/profiles")
async def api_nostr_profiles(body: NostrProfilesBody):
    """Batch kind-0 lookup (max 25 pubkeys)."""
    return await nostr_profile_service.fetch_many(body.pubkeys, body.relays)


# --- Price helper (LNbits core exchange rates) ------------------------------
@trato_api_router.get("/api/v1/currencies")
async def api_currencies():
    """Fiat currency codes LNbits can price, for the create-order picker."""
    from lnbits.utils.exchange_rates import allowed_currencies

    return allowed_currencies()


@trato_api_router.get("/api/v1/payment-schema")
async def api_payment_schema():
    """Payment profile types + map centres (no identity required — for the editor UI)."""
    return {
        "schema": PAYMENT_TYPE_SCHEMA,
        "country_names": COUNTRY_NAMES,
        "sepa_countries": sorted(SEPA_IBAN_COUNTRIES),
        "mobile_money_countries": sorted(MOBILE_MONEY_COUNTRIES),
        "map_centers": {
            k: {"lat": v[0], "lon": v[1], "zoom": v[2]}
            for k, v in COUNTRY_MAP_CENTER.items()
        },
    }


@trato_api_router.get("/api/v1/price")
async def api_price(fiat: str = Query(..., min_length=2, max_length=8)):
    """Live market rate so the UI can bind fiat<->sats both ways.

    Returns ``sats_per_fiat`` (satoshis for one unit of fiat) and the BTC price.
    Stablecoins (USDT/USDC) map to USD; the response includes ``price_fiat_code``
    when an alias or fallback was used. Never silently substitutes ALL (Albanian Lek)
    unless that is the requested ``fiat`` code.
    """
    from lnbits.settings import settings as lnbits_settings

    from .services.fiat_price import fetch_fiat_price_quote

    instance_fiat = (
        lnbits_settings.lnbits_default_accounting_currency or "USD"
    ).upper()
    try:
        return await fetch_fiat_price_quote(
            fiat,
            instance_fiat=instance_fiat,
        )
    except ValueError as exc:
        code = fiat.strip().upper()
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, f"No exchange rate for {code}."
        ) from exc


# --- Health -----------------------------------------------------------------
@trato_api_router.get("/api/v1/health")
async def api_health(
    request: Request,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    user_id = key_info.wallet.user
    identity = await crud.get_identity(user_id)
    settings = await crud.get_settings(user_id)
    from lnbits.settings import settings as lnbits_settings

    from .services.local_operator import fetch_local_operator_presence
    from .services.messenger import messenger

    instance_fiat = (
        lnbits_settings.lnbits_default_accounting_currency or "USD"
    ).upper()
    wallet_fiat = None
    if identity:
        wallet = await get_wallet(identity.wallet)
        if wallet and wallet.currency:
            wallet_fiat = wallet.currency.strip().upper()

    local_op = await fetch_local_operator_presence(str(request.base_url))
    nwc_configured = bool(settings.encrypted_nwc_uri)

    return {
        "escrow": escrow_health(),
        "orderbook": orderbook.stats(demo_seed=settings.demo_mode),
        "messenger": messenger.stats(),
        "has_identity": identity is not None,
        "demo_mode": settings.demo_mode,
        "mainnet_enabled": settings.mainnet_enabled,
        "nwc_configured": nwc_configured,
        "robosats_coordinator": settings.robosats_coordinator,
        "trade_counts": await crud.count_orders_by_env(user_id),
        "instance_fiat_code": instance_fiat,
        "default_fiat_code": wallet_fiat or instance_fiat,
        "local_operator": local_op,
        "trading": trading_capabilities(
            demo_mode=settings.demo_mode,
            mainnet_enabled=settings.mainnet_enabled,
            hold_invoices=escrow_health()["hold_invoices_supported"],
            local_operator=local_op,
            nwc_configured=nwc_configured,
        ),
    }


# --- Settings ---------------------------------------------------------------
@trato_api_router.get("/api/v1/settings")
async def api_get_settings(key_info: WalletTypeInfo = Depends(require_admin_key)):
    settings = await crud.get_settings(key_info.wallet.user)
    return settings.public_dict()


@trato_api_router.get("/api/v1/settings/nostrrelay-hints")
async def api_nostrrelay_hints(
    request: Request,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Active Nostr Relay extension URLs owned by this LNbits user."""
    from .services.lnurlp_hints import api_key_from_request_headers
    from .services.nostrrelay_hints import fetch_nostrrelay_hints

    api_key = api_key_from_request_headers(request.headers)
    return await fetch_nostrrelay_hints(str(request.base_url), api_key=api_key)


@trato_api_router.put("/api/v1/settings")
async def api_update_settings(
    data: UpdateSettings,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    settings = await crud.get_settings(key_info.wallet.user)
    if data.relays is not None:
        settings.relays = [r.strip() for r in data.relays if r.strip()]
        identity = await crud.get_identity(key_info.wallet.user)
        if identity:
            nostr_profile_service.invalidate(identity.identity_pubkey)
            reputation_service.invalidate(identity.identity_pubkey)
    if data.mostro_pubkey is not None:
        settings.mostro_pubkey = data.mostro_pubkey.strip() or None
    if data.demo_mode is not None:
        settings.demo_mode = data.demo_mode
    if data.mainnet_enabled is not None:
        settings.mainnet_enabled = data.mainnet_enabled
    settings.reconcile_trading_mode(
        demo_set=data.demo_mode,
        mainnet_set=data.mainnet_enabled,
    )
    if data.clear_nwc:
        settings.encrypted_nwc_uri = None
    elif data.nwc_uri is not None:
        uri = data.nwc_uri.strip()
        if uri:
            settings.encrypted_nwc_uri = encrypt_secret(uri)
    if data.robosats_coordinator is not None:
        settings.robosats_coordinator = data.robosats_coordinator.strip() or None
    updated = await crud.update_settings(settings)
    return updated.public_dict()


@trato_api_router.get("/api/v1/robosats/coordinators")
async def api_robosats_coordinators(
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Federation coordinator short aliases for Settings picker."""
    await federation.ensure_loaded()
    return {"aliases": federation.coordinator_aliases}


# --- Identity ---------------------------------------------------------------
@trato_api_router.get("/api/v1/identity")
async def api_get_identity(key_info: WalletTypeInfo = Depends(require_admin_key)):
    identity = await crud.get_identity(key_info.wallet.user)
    return identity.public_dict() if identity else None


@trato_api_router.post("/api/v1/identity", status_code=HTTPStatus.CREATED)
async def api_create_identity(
    data: CreateIdentity,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    user_id = key_info.wallet.user

    existing = await crud.get_identity(user_id)
    if existing:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            "A trading identity already exists for this user.",
        )

    wallet = await get_wallet(data.wallet)
    if not wallet or wallet.user != user_id:
        raise HTTPException(HTTPStatus.BAD_REQUEST, "Invalid wallet.")

    mnemonic = (data.mnemonic or "").strip()
    if mnemonic:
        if not bip39.mnemonic_is_valid(mnemonic):
            raise HTTPException(HTTPStatus.BAD_REQUEST, "Invalid BIP-39 mnemonic.")
    else:
        mnemonic = bip39.mnemonic_from_bytes(os.urandom(16))  # 12 words

    try:
        manager = KeyManager(mnemonic)
        identity_keys = manager.identity()
    except ValueError as exc:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(exc)) from exc

    identity = Identity(
        id=urlsafe_short_hash(),
        user=user_id,
        wallet=data.wallet,
        encrypted_mnemonic=encrypt_secret(mnemonic),
        identity_pubkey=identity_keys.pubkey_hex,
        identity_npub=identity_keys.npub,
        next_trade_index=1,
    )
    await crud.create_identity(identity)
    return identity.public_dict()


@trato_api_router.get("/api/v1/identity/payment-details")
async def api_get_payment_details(
    request: Request,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Owner-only: structured fiat payment profiles for editing."""
    identity = await crud.get_identity(key_info.wallet.user)
    if not identity:
        raise HTTPException(HTTPStatus.PRECONDITION_FAILED, "No identity yet.")
    profiles: list[dict] = []
    legacy_text = ""
    if identity.encrypted_payment_details:
        plaintext = decrypt_secret(identity.encrypted_payment_details)
        profiles, legacy = unpack_profiles(plaintext)
        if legacy:
            legacy_text = legacy
    from .services.lnurlp_hints import (
        api_key_from_request_headers,
        fetch_lnurlp_receive_hints,
    )
    from .services.lightning_receive import build_lightning_receive_choices

    settings = await crud.get_settings(key_info.wallet.user)
    api_key = api_key_from_request_headers(request.headers)
    lnurlp_receive = await fetch_lnurlp_receive_hints(
        str(request.base_url),
        api_key=api_key,
        wallet_id=identity.wallet,
    )
    nostr_profile = await nostr_profile_service.fetch(
        identity.identity_pubkey,
        settings.relays or None,
    )
    lightning_receive_choices = build_lightning_receive_choices(
        lnurlp_receive,
        lud16=nostr_profile.lud16,
    )
    return {
        "profiles": profiles,
        "schema": PAYMENT_TYPE_SCHEMA,
        "method_names": profile_method_names(profiles),
        "countries": sorted(
            {p.get("country") for p in profiles if p.get("country")}
        ),
        "country_names": COUNTRY_NAMES,
        "sepa_countries": sorted(SEPA_IBAN_COUNTRIES),
        "mobile_money_countries": sorted(MOBILE_MONEY_COUNTRIES),
        "map_centers": {
            k: {"lat": v[0], "lon": v[1], "zoom": v[2]}
            for k, v in COUNTRY_MAP_CENTER.items()
        },
        "legacy_text": legacy_text,
        "lnurlp_receive": lnurlp_receive,
        "nostr_lud16": nostr_profile.lud16,
        "lightning_receive_choices": lightning_receive_choices,
        # Deprecated single blob; kept for older clients.
        "payment_details": legacy_text or (
            format_profile_for_chat(profiles[0]) if len(profiles) == 1 else ""
        ),
    }


@trato_api_router.put("/api/v1/identity/payment-details")
async def api_set_payment_details(
    data: UpdatePaymentDetails,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    identity = await crud.get_identity(key_info.wallet.user)
    if not identity:
        raise HTTPException(HTTPStatus.PRECONDITION_FAILED, "No identity yet.")
    encrypted: str | None
    if data.profiles is not None:
        try:
            packed = pack_profiles(data.profiles)
        except ValueError as exc:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(exc)) from exc
        encrypted = encrypt_secret(packed) if data.profiles else None
    else:
        text = (data.payment_details or "").strip()
        if len(text) > 2000:
            raise HTTPException(HTTPStatus.BAD_REQUEST, "Payment details too long.")
        encrypted = encrypt_secret(text) if text else None
    await crud.update_identity_payment_details(identity.id, encrypted)
    profiles: list[dict] = []
    if encrypted:
        profiles, _ = unpack_profiles(decrypt_secret(encrypted))
    return {
        "has_payment_details": bool(encrypted),
        "profile_count": len(profiles),
        "method_names": profile_method_names(profiles),
    }


def _identity_payment_profiles(identity: Identity) -> list[dict]:
    if not identity.encrypted_payment_details:
        return []
    profiles, _ = unpack_profiles(decrypt_secret(identity.encrypted_payment_details))
    return profiles


def _merge_order_json(order: Order, **patch) -> str:
    meta = json.loads(order.order_json or "{}")
    meta.update(patch)
    return json.dumps(meta)


_TERMINAL_SUCCESS = frozenset({"success", "released"})


async def _persist_fx_snapshot(
    user_id: str, order_id: str, snapshot_key: str
) -> None:
    """Best-effort FX capture; never blocks trading if rates are unavailable."""
    order = await crud.get_order(user_id, order_id)
    if not order:
        return
    try:
        snap = await capture_fx(order.fiat_code)
    except Exception:  # noqa: BLE001
        return
    await crud.update_order_fields(
        order_id,
        order_json=merge_fx_into_order_json(order.order_json, snapshot_key, snap),
    )


async def _maybe_snapshot_settlement(user_id: str, order_id: str) -> None:
    order = await crud.get_order(user_id, order_id)
    if not order or order.status not in _TERMINAL_SUCCESS:
        return
    meta = json.loads(order.order_json or "{}")
    if meta.get("fx_at_settlement"):
        return
    await _persist_fx_snapshot(user_id, order_id, "fx_at_settlement")


def _trade_payment_ref(order: Order) -> str:
    ref = (order.mostro_order_id or order.id or "")[:8]
    return f"TRATO-{ref}"


def _order_payment_view(
    order: Order, identity: Identity | None, *, has_nwc: bool = False
) -> dict:
    """Seller payment snapshot + buyer pay links for the trade UI."""
    meta = json.loads(order.order_json or "{}")
    seller_payment = meta.get("seller_payment")
    buyer_receive = meta.get("buyer_receive")
    actions: list[dict] = []
    if order.side == "buy" and seller_payment and isinstance(seller_payment, dict):
        profile = seller_payment.get("profile") or {}
        actions = pay_actions(
            profile,
            fiat_amount=order.fiat_amount,
            fiat_code=order.fiat_code,
            trade_ref=_trade_payment_ref(order),
        )
    profile_options: list[dict] = []
    if order.side == "sell" and identity:
        for p in _identity_payment_profiles(identity):
            if p.get("type") in FIAT_PAYMENT_TYPES and p.get("type") != "cash_in_person":
                profile_options.append(
                    {
                        "id": p["id"],
                        "label": p.get("label") or p["type"],
                        "type": p["type"],
                    }
                )
    receive_line = ""
    if buyer_receive and isinstance(buyer_receive, dict):
        prof = buyer_receive.get("profile") or {}
        if prof:
            receive_line = buyer_receive_summary(prof, has_nwc=has_nwc)
    return {
        "seller_payment": seller_payment,
        "buyer_receive": buyer_receive,
        "buyer_receive_summary": receive_line,
        "pay_actions": actions,
        "payment_profile_options": profile_options,
    }


@trato_api_router.get("/api/v1/identity/reputation")
async def api_identity_reputation(
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Fetch the user's Mostro network reputation (kind 38384) from relays."""
    from .services.reputation import reputation_service

    identity = await crud.get_identity(key_info.wallet.user)
    if not identity:
        raise HTTPException(HTTPStatus.PRECONDITION_FAILED, "No identity yet.")
    settings = await crud.get_settings(key_info.wallet.user)
    rep = await reputation_service.fetch(
        identity.identity_pubkey, settings.relays or None
    )
    if rep is None:
        return {
            "found": False,
            "pubkey": identity.identity_pubkey,
            "total_reviews": 0,
            "stars": None,
            "is_new": True,
        }
    return rep.to_dict()


@trato_api_router.get("/api/v1/identity/nostr-profile")
async def api_get_identity_nostr_profile(
    key_info: WalletTypeInfo = Depends(require_admin_key),
    refresh: bool = Query(False, description="Bypass cache and refetch from relays"),
    include_counts: bool = Query(
        False,
        description="Also fetch Nostr follow/follower counts (slow on a Pi)",
    ),
):
    """Kind-0 profile for the logged-in user's trading identity."""
    identity = await crud.get_identity(key_info.wallet.user)
    if not identity:
        raise HTTPException(HTTPStatus.PRECONDITION_FAILED, "No identity yet.")
    settings = await crud.get_settings(key_info.wallet.user)
    profile = await nostr_profile_service.fetch(
        identity.identity_pubkey,
        settings.relays or None,
        force=refresh,
        include_counts=include_counts,
    )
    return profile.to_dict()


@trato_api_router.put("/api/v1/identity/nostr-profile")
async def api_update_identity_nostr_profile(
    data: UpdateNostrProfile,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Publish kind-0 metadata for the trading identity to configured relays."""
    identity = await crud.get_identity(key_info.wallet.user)
    if not identity:
        raise HTTPException(HTTPStatus.PRECONDITION_FAILED, "No identity yet.")

    updates = data.dict()
    settings = await crud.get_settings(key_info.wallet.user)
    relays = settings.relays or None
    current = await nostr_profile_service.fetch(
        identity.identity_pubkey, relays, force=True, include_counts=False
    )
    try:
        merged = merge_profile_update(current, updates)
    except ValueError as exc:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(exc)) from exc

    manager = KeyManager(decrypt_secret(identity.encrypted_mnemonic))
    identity_keys = manager.identity().keys
    publish = await publish_kind0_metadata(identity_keys, merged, relays)
    if not publish.get("published"):
        detail = publish.get("error") or "Could not publish profile to relays."
        raise HTTPException(HTTPStatus.BAD_GATEWAY, detail)

    nostr_profile_service.invalidate(identity.identity_pubkey)
    profile = await nostr_profile_service.fetch(
        identity.identity_pubkey, relays, force=True, include_counts=False
    )
    out = profile.to_dict()
    out["publish"] = publish
    return out


# --- Orders -----------------------------------------------------------------
@trato_api_router.get("/api/v1/orders")
async def api_list_orders(key_info: WalletTypeInfo = Depends(require_admin_key)):
    user_id = key_info.wallet.user
    settings = await crud.get_settings(user_id)
    return await crud.get_orders(user_id, demo=settings.demo_mode)


@trato_api_router.get("/api/v1/orders/export")
async def api_export_orders(
    key_info: WalletTypeInfo = Depends(require_admin_key),
    format: str = Query("csv", pattern="^(csv)$"),
    include_demo: bool = Query(False),
    status: str | None = Query(None),
    since: int | None = Query(None, ge=0),
    until: int | None = Query(None, ge=0),
):
    """Download trade history for tax reporting (CSV).

    By default exports completed trades (``success`` / ``released``) in the
    current demo/live mode. Pass ``include_demo=true`` to merge both environments.
    """
    user_id = key_info.wallet.user
    settings = await crud.get_settings(user_id)
    if include_demo:
        orders = await crud.get_orders(user_id, demo=None)
    else:
        orders = await crud.get_orders(user_id, demo=settings.demo_mode)
    filtered = filter_orders_for_export(
        orders,
        include_demo=include_demo or settings.demo_mode,
        status=status,
        since=since,
        until=until,
    )
    if not include_demo:
        filtered = [o for o in filtered if o.demo == settings.demo_mode]
    body = orders_to_csv(filtered)
    filename = f"trato-trades-{settings.demo_mode and 'demo' or 'live'}.csv"
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _delete_all_demo_orders_for_user(user_id: str) -> dict:
    """Remove every demo-flagged trade. Safe in any mode — live rows are untouched."""
    removed = await crud.delete_all_demo_orders(user_id)
    return {"removed": removed}


@trato_api_router.delete("/api/v1/orders/clear-demo")
@trato_api_router.post("/api/v1/orders/clear-demo")
@trato_api_router.delete("/api/v1/orders/demo")
@trato_api_router.post("/api/v1/orders/demo")
async def api_delete_all_demo_orders(
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Delete all demo trades for this user (practice reset)."""
    return await _delete_all_demo_orders_for_user(key_info.wallet.user)


@trato_api_router.delete("/api/v1/orders/purge-canceled")
@trato_api_router.post("/api/v1/orders/purge-canceled")
async def api_purge_canceled_orders(
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Delete canceled/expired demo trades. Demo mode only (legacy path)."""
    user_id = key_info.wallet.user
    settings = await crud.get_settings(user_id)
    if not settings.demo_mode:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            "Clearing practice trades is only allowed in Demo mode. "
            "Turn on Demo mode in Settings first.",
        )
    removed = await crud.delete_canceled_orders(user_id, demo=True)
    return {"removed": removed}


@trato_api_router.delete("/api/v1/orders/{order_id}")
async def api_delete_order(
    order_id: str,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Remove a canceled or expired trade from your history."""
    user_id = key_info.wallet.user
    try:
        deleted = await crud.delete_order(user_id, order_id)
    except ValueError as exc:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(exc)) from exc
    if not deleted:
        raise HTTPException(
            HTTPStatus.NOT_FOUND,
            "Trade not found — it may have been deleted. Refresh My trades.",
        )
    return {"deleted": True, "id": order_id}


def _is_live_robosats_order(order: Order) -> bool:
    if order.demo:
        return False
    try:
        meta = json.loads(order.order_json or "{}")
    except json.JSONDecodeError:
        return False
    cp = meta.get("counterparty") or {}
    return (cp.get("platform") or "").strip().lower() == "robosats"


def _guard_real_trading(settings, *, platform: str | None = None) -> None:
    """Stop accidental real-money trades when prerequisites are missing."""
    if settings.demo_mode:
        return
    plat = (platform or "mostro").strip().lower()
    if plat == "robosats":
        if not settings.encrypted_nwc_uri:
            raise HTTPException(
                HTTPStatus.PRECONDITION_FAILED,
                "Connect your Lightning wallet (NWC URI in Settings) for live "
                "RoboSats trades.",
            )
        if not settings.mainnet_enabled:
            raise HTTPException(
                HTTPStatus.PRECONDITION_FAILED,
                "Mainnet is off — enable it in Settings for live RoboSats trades. "
                "Demo mode works without mainnet.",
            )
        return
    health = escrow_health()
    if not health["hold_invoices_supported"] and not settings.encrypted_nwc_uri:
        raise HTTPException(
            HTTPStatus.PRECONDITION_FAILED,
            "Real Mostro trading needs NWC in Settings or a hold-invoice-capable "
            "funding source. Turn on Demo mode, or connect your Lightning wallet.",
        )
    if not settings.mainnet_enabled:
        raise HTTPException(
            HTTPStatus.PRECONDITION_FAILED,
            "Mainnet is off — enable it in Settings for live trades. "
            "Demo mode works without mainnet.",
        )


def _small_order_from_create(data: CreateOrder, trade_pubkey: str, side: str) -> SmallOrder:
    """Build a wire-valid SmallOrder for live maker publish."""
    kind = OrderKind.BUY if side == "buy" else OrderKind.SELL
    is_range = data.fiat_min is not None and data.fiat_max is not None
    so = SmallOrder(
        kind=kind,
        status=OrderStatus.PENDING,
        amount=int(data.amount_sats or 0),
        fiat_code=data.fiat_code.upper(),
        payment_method=data.payment_method,
        premium=int(round(float(data.premium or 0))),
    )
    if is_range:
        so.min_amount = int(data.fiat_min)
        so.max_amount = int(data.fiat_max)
        so.fiat_amount = 0
    else:
        so.fiat_amount = int(data.fiat_amount or 0)
    if side == "sell":
        so.seller_trade_pubkey = trade_pubkey
    else:
        so.buyer_trade_pubkey = trade_pubkey
    return so


def _validate_take_settlement(
    *,
    settings,
    settlement_layer: str,
    mostro_pubkey: str,
    order_id: str,
):
    """Ensure the take matches a live book row and allowed settlement modes."""
    layer = (settlement_layer or "lightning").strip().lower()
    pub = orderbook.find_pending(mostro_pubkey, order_id)
    if pub is None:
        raise HTTPException(
            HTTPStatus.NOT_FOUND,
            "This offer is no longer on the order book — it may have been taken "
            "or expired. Refresh the book and pick another offer.",
        )
    if not layer_matches(pub.layers, layer):
        allowed = ", ".join(pub.layers)
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f"This offer settles via {allowed}, not {layer}. "
            "Pick a matching settlement layer and try again.",
        )
    caps = trading_capabilities(
        demo_mode=settings.demo_mode,
        mainnet_enabled=settings.mainnet_enabled,
        hold_invoices=escrow_health()["hold_invoices_supported"],
        nwc_configured=bool(getattr(settings, "encrypted_nwc_uri", None)),
    )
    if layer == "onchain" and not caps["onchain_take_enabled"]:
        raise HTTPException(
            HTTPStatus.PRECONDITION_FAILED,
            "On-chain takes need mainnet plus NWC or LND hold invoices (same gate "
            "as Lightning), or turn on Demo mode to practise.",
        )
    if layer == "lightning" and caps.get("lightning_take_enabled") is False:
        raise HTTPException(
            HTTPStatus.PRECONDITION_FAILED,
            "Lightning takes are disabled in this build. Try Demo mode or check Settings.",
        )
    return pub


def _validate_take_fiat_amount(
    pub, fiat_amount: float | None
) -> float | None:
    """Require an in-range fiat amount for range book rows; optional on fixed."""
    if pub.is_range:
        if fiat_amount is None:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f"Pick a fiat amount between {pub.fiat_min} and {pub.fiat_max} "
                f"{pub.fiat_code} for this range offer.",
            )
        amount = float(fiat_amount)
        lo = float(pub.fiat_min) if pub.fiat_min is not None else None
        hi = float(pub.fiat_max) if pub.fiat_max is not None else None
        if lo is not None and amount < lo:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f"Fiat amount must be at least {pub.fiat_min} {pub.fiat_code}.",
            )
        if hi is not None and amount > hi:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f"Fiat amount must be at most {pub.fiat_max} {pub.fiat_code}.",
            )
        return amount
    return float(fiat_amount) if fiat_amount is not None else None


async def _new_trade_key(identity: Identity):
    index = await crud.bump_trade_index(identity.id)
    manager = KeyManager(decrypt_secret(identity.encrypted_mnemonic))
    return index, manager.trade_key(index)


def _trade_keys_for(identity: Identity, trade_index: int):
    manager = KeyManager(decrypt_secret(identity.encrypted_mnemonic))
    return manager.trade_key(trade_index).keys


def _engine_for(order: Order, identity: Identity, settings) -> TradeEngine:
    """Build a trade engine; demo uses no-money IO, live uses NWC or LNbits."""
    store = CrudTradeStore()
    if order.demo:
        return TradeEngine(DemoTradeIO(), store)
    if settings.encrypted_nwc_uri:
        nwc_uri = decrypt_secret(settings.encrypted_nwc_uri)
        return TradeEngine(NwcTradeIO(nwc_uri, settings.relays), store)
    return TradeEngine(LnbitsTradeIO(identity.wallet, settings.relays), store)


async def _load_party(user_id: str):
    """Fetch the (identity, settings) pair or raise an actionable error."""
    identity = await crud.get_identity(user_id)
    if not identity:
        raise HTTPException(
            HTTPStatus.PRECONDITION_FAILED, "Create a trading identity first."
        )
    settings = await crud.get_settings(user_id)
    return identity, settings


def _guard_order_environment(order: Order, settings) -> None:
    """Block actions on trades from the other environment (demo vs live)."""
    if order.demo == settings.demo_mode:
        return
    trade_env = "demo" if order.demo else "live"
    raise HTTPException(
        HTTPStatus.CONFLICT,
        f"This is a {trade_env} trade. Switch to {trade_env} mode in Settings "
        "to view or continue it.",
    )


@trato_api_router.post("/api/v1/orders", status_code=HTTPStatus.CREATED)
async def api_create_order(
    data: CreateOrder,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    user_id = key_info.wallet.user

    identity = await crud.get_identity(user_id)
    if not identity:
        raise HTTPException(
            HTTPStatus.PRECONDITION_FAILED,
            "Create a trading identity first.",
        )

    settings = await crud.get_settings(user_id)
    _guard_real_trading(settings)

    if data.side not in ("buy", "sell"):
        raise HTTPException(HTTPStatus.BAD_REQUEST, "side must be buy or sell")
    if data.amount_sats < 0:
        raise HTTPException(HTTPStatus.BAD_REQUEST, "amount_sats must be >= 0")

    mostro_pubkey = (data.mostro_pubkey or settings.mostro_pubkey or "").strip()

    local_id = urlsafe_short_hash()
    index, trade = await _new_trade_key(identity)
    if not settings.demo_mode:
        if not mostro_pubkey:
            raise HTTPException(
                HTTPStatus.PRECONDITION_FAILED,
                "Set a Mostro operator pubkey in Settings (or on the order) "
                "before publishing live orders.",
            )
        small = _small_order_from_create(data, trade.pubkey_hex, data.side)
        small.check_valid_for_new()

    order = Order(
        id=local_id,
        user=user_id,
        identity_id=identity.id,
        role="maker",
        side=data.side,
        mostro_pubkey=mostro_pubkey,
        trade_index=index,
        trade_pubkey=trade.pubkey_hex,
        status="pending",
        fiat_code=data.fiat_code.upper(),
        payment_method=data.payment_method,
        amount_sats=data.amount_sats,
        fiat_amount=data.fiat_amount,
        premium=data.premium,
        mostro_order_id=local_id,
        order_json=json.dumps(
            {
                "side": data.side,
                "fiat_code": data.fiat_code.upper(),
                "fiat_amount": data.fiat_amount,
                "fiat_min": data.fiat_min,
                "fiat_max": data.fiat_max,
                "amount_sats": data.amount_sats,
                "payment_method": data.payment_method,
                "premium": data.premium,
                "settlement_layers": data.settlement_layers,
            }
        ),
        demo=settings.demo_mode,
    )
    await crud.create_order(order)
    keys = _trade_keys_for(identity, index)
    engine = _engine_for(order, identity, settings)
    if not order.demo:
        await engine.publish_new_order(order, small, keys)
        await engine.store.log(
            order,
            "system",
            "note",
            "Order published to the Mostro operator — waiting for a taker on the network.",
        )
    await _persist_fx_snapshot(user_id, local_id, "fx_at_open")
    return await crud.get_order(user_id, local_id)


@trato_api_router.post("/api/v1/orders/take", status_code=HTTPStatus.CREATED)
async def api_take_order(
    data: TakeOrder,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Take a public order. Taking a SELL order makes you the BUYER and vice
    versa. In demo mode the whole trade is walked locally via DemoOperator; real
    mode is gated until live trading is enabled."""
    user_id = key_info.wallet.user
    identity, settings = await _load_party(user_id)
    platform = (data.platform or "mostro").strip().lower()
    if not platform_takeable(platform):
        takeable = ", ".join(sorted({"mostro", "robosats"}))
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            f"Trato cannot take {platform} orders — only {takeable} offers. "
            "Other platforms are view-only in the book; use their own app.",
        )
    _guard_real_trading(settings, platform=platform)

    if data.kind not in ("buy", "sell"):
        raise HTTPException(HTTPStatus.BAD_REQUEST, "kind must be buy or sell")

    pub = _validate_take_settlement(
        settings=settings,
        settlement_layer=data.settlement_layer,
        mostro_pubkey=data.mostro_pubkey,
        order_id=data.order_id,
    )

    # The user's own side is the opposite of the public order's kind.
    user_side = "buy" if data.kind == "sell" else "sell"
    raw_fiat = float(data.fiat_amount) if data.fiat_amount is not None else None
    fiat_amount = _validate_take_fiat_amount(pub, raw_fiat)
    take_fiat_int = int(round(fiat_amount)) if fiat_amount is not None else None

    index, trade = await _new_trade_key(identity)
    order = Order(
        id=urlsafe_short_hash(),
        user=user_id,
        identity_id=identity.id,
        role="taker",
        side=user_side,
        mostro_pubkey=data.mostro_pubkey,
        trade_index=index,
        trade_pubkey=trade.pubkey_hex,
        status="pending",
        fiat_code=data.fiat_code.upper(),
        payment_method=data.payment_method,
        amount_sats=data.amount_sats or 0,
        fiat_amount=fiat_amount,
        mostro_order_id=data.order_id,
        order_json=json.dumps(
            {
                "taken_order_id": data.order_id,
                "public_kind": data.kind,
                "taken_at": now(),
                "chosen_payment_method": (data.payment_method or "").strip(),
                "chosen_fiat_amount": fiat_amount,
                "public_is_range": pub.is_range,
                "counterparty": {
                    "platform": data.platform,
                    "maker_name": data.maker_name,
                    "identity_pubkey": data.maker_identity_pubkey,
                    "rating": data.rating,
                    "bonded": data.bonded,
                },
                "public_source": (
                    (data.source or (pub.source if pub else None) or "").strip() or None
                ),
                "platform_instance": (
                    pub.platform_instance if pub and pub.platform_instance else None
                ),
                "settlement_layer": data.settlement_layer,
            }
        ),
        demo=settings.demo_mode,
    )
    await crud.create_order(order)

    keys = _trade_keys_for(identity, index)
    engine = _engine_for(order, identity, settings)
    if order.demo and order.side == "buy":
        await seed_demo_trade_context(
            engine.store,
            order,
            identity,
            has_nwc=bool(settings.encrypted_nwc_uri),
        )
    elif not order.demo and order.side == "buy":
        await seed_live_buyer_context(
            engine.store,
            order,
            identity,
            has_nwc=bool(settings.encrypted_nwc_uri),
        )
    if platform == "robosats":
        if order.demo:
            await RoboSatsDemoOperator().after_take(engine, order, keys)
        else:
            if not settings.encrypted_nwc_uri:
                raise HTTPException(
                    HTTPStatus.PRECONDITION_FAILED,
                    "Connect your Lightning wallet (NWC URI) in Settings for live "
                    "RoboSats trades.",
                )
            pub = orderbook.find_pending(data.mostro_pubkey, data.order_id)
            if pub:
                from .services.external_verify import verify_external_order

                if not await verify_external_order(pub):
                    raise HTTPException(
                        HTTPStatus.GONE,
                        "This RoboSats offer is no longer public on the coordinator — "
                        "refresh the book or open RoboSats directly.",
                    )
            nwc_uri = decrypt_secret(settings.encrypted_nwc_uri)
            if not settings.encrypted_robosats_token:
                robot_token = new_robot_token()
                settings.encrypted_robosats_token = encrypt_secret(robot_token)
                await crud.update_settings(settings)
            else:
                robot_token = decrypt_secret(settings.encrypted_robosats_token)
            coord_alias = settings.robosats_coordinator
            if pub and pub.platform_instance:
                coord_alias = coord_alias or pub.platform_instance
            try:
                take_payload = await live_take_robosats(
                    order=order,
                    coordinator_pubkey=data.mostro_pubkey,
                    coordinator_alias=coord_alias,
                    robot_token=robot_token,
                    nwc_uri=nwc_uri,
                )
            except RuntimeError as exc:
                raise HTTPException(HTTPStatus.BAD_GATEWAY, str(exc)) from exc
            order_json = json.dumps(
                {
                    **json.loads(order.order_json or "{}"),
                    "robosats": {
                        "bond_paid": True,
                        "last_status": take_payload.get("status"),
                    },
                }
            )
            await crud.update_order_fields(order.id, order_json=order_json)
            order.order_json = order_json
            await engine.store.log(
                order,
                "system",
                "note",
                "Bond paid in Trato — Trato syncs escrow steps via NWC when possible. "
                "Coordinator chat may still need the RoboSats site.",
            )
            await engine.store.update(order, status="active")
            await sync_live_robosats(
                order, settings, engine.store, nwc_uri=nwc_uri
            )
    else:
        await engine.take(order, data.kind, keys, fiat_amount=take_fiat_int)
        if order.demo:
            await DemoOperator().after_take(engine, order, keys)
        else:
            layer = (data.settlement_layer or "lightning").strip().lower()
            if layer == "onchain":
                await engine.store.log(
                    order,
                    "system",
                    "note",
                    "On-chain settlement — the operator coordinates the Bitcoin "
                    "transaction after fiat is confirmed. Share your on-chain "
                    "receive address in chat when asked.",
                )
            else:
                funding = (
                    "NWC wallet"
                    if settings.encrypted_nwc_uri
                    else "LNbits identity wallet"
                )
                await engine.store.log(
                    order,
                    "system",
                    "note",
                    f"Take sent to the operator — escrow uses your {funding}. "
                    "Follow payment steps in the timeline below.",
                )

    await _persist_fx_snapshot(user_id, order.id, "fx_at_take")
    await _maybe_snapshot_settlement(user_id, order.id)
    return await crud.get_order(user_id, order.id)


@trato_api_router.get("/api/v1/orders/{order_id}")
async def api_order_detail(
    order_id: str, key_info: WalletTypeInfo = Depends(require_admin_key)
):
    user_id = key_info.wallet.user
    order = await crud.get_order(user_id, order_id)
    if not order:
        raise HTTPException(
            HTTPStatus.NOT_FOUND,
            "Trade not found — it may have been deleted. Refresh My trades.",
        )
    settings = await crud.get_settings(user_id)
    _guard_order_environment(order, settings)
    if _is_live_robosats_order(order):
        nwc_uri = (
            decrypt_secret(settings.encrypted_nwc_uri)
            if settings.encrypted_nwc_uri
            else None
        )
        store = CrudTradeStore()
        await sync_live_robosats(order, settings, store, nwc_uri=nwc_uri)
        order = await crud.get_order(user_id, order_id) or order
    events = await crud.get_events(user_id, order_id)
    identity = await crud.get_identity(user_id)
    payment_view = _order_payment_view(
        order, identity, has_nwc=bool(settings.encrypted_nwc_uri)
    )
    return {
        "order": order,
        "events": events,
        "allowed_actions": allowed_user_actions(order.side, order.status),
        **payment_view,
    }


@trato_api_router.post("/api/v1/orders/{order_id}/action")
async def api_order_action(
    order_id: str,
    data: OrderAction,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Perform a lifecycle action (fiat-sent, release, cancel, dispute, rate)."""
    user_id = key_info.wallet.user
    order = await crud.get_order(user_id, order_id)
    if not order:
        raise HTTPException(
            HTTPStatus.NOT_FOUND,
            "Trade not found — it may have been deleted. Refresh My trades.",
        )
    identity, settings = await _load_party(user_id)
    _guard_order_environment(order, settings)

    try:
        action = Action(data.action)
    except ValueError as exc:
        raise HTTPException(HTTPStatus.BAD_REQUEST, "Unknown action.") from exc

    keys = _trade_keys_for(identity, order.trade_index)
    engine = _engine_for(order, identity, settings)

    if _is_live_robosats_order(order):
        try:
            await apply_live_robosats_action(
                order, settings, action, rating=data.rating
            )
        except RuntimeError as exc:
            raise HTTPException(HTTPStatus.BAD_GATEWAY, str(exc)) from exc
        nwc_uri = (
            decrypt_secret(settings.encrypted_nwc_uri)
            if settings.encrypted_nwc_uri
            else None
        )
        await sync_live_robosats(
            order, settings, engine.store, nwc_uri=nwc_uri
        )
        await _maybe_snapshot_settlement(user_id, order_id)
        return await crud.get_order(user_id, order_id)

    try:
        await engine.apply_user_action(order, action, keys, rating=data.rating)
    except ValueError as exc:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(exc)) from exc

    if order.demo:
        oj = json.loads(order.order_json or "{}")
        cp = oj.get("counterparty") or {}
        if (cp.get("platform") or "").strip().lower() == "robosats":
            await RoboSatsDemoOperator().after_user_action(
                engine, order, action, keys, rating=data.rating
            )
        else:
            await DemoOperator().after_user_action(
                engine, order, action, keys, rating=data.rating
            )

    await _maybe_snapshot_settlement(user_id, order_id)
    return await crud.get_order(user_id, order_id)


@trato_api_router.post("/api/v1/orders/{order_id}/chat")
async def api_order_chat(
    order_id: str,
    data: ChatMessage,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    user_id = key_info.wallet.user
    order = await crud.get_order(user_id, order_id)
    if not order:
        raise HTTPException(
            HTTPStatus.NOT_FOUND,
            "Trade not found — it may have been deleted. Refresh My trades.",
        )
    text = (data.text or "").strip()
    if not text:
        raise HTTPException(HTTPStatus.BAD_REQUEST, "Message is empty.")
    if len(text) > 2000:
        raise HTTPException(HTTPStatus.BAD_REQUEST, "Message too long.")

    settings = await crud.get_settings(user_id)
    _guard_order_environment(order, settings)

    await crud.log_event(user_id, order_id, "chat", "chat", text)
    if not order.demo and order.mostro_order_id:
        identity, settings = await _load_party(user_id)
        keys = _trade_keys_for(identity, order.trade_index)
        engine = _engine_for(order, identity, settings)
        from .mostro import messages as _messages

        await engine.io.send(
            order, keys,
            _messages.direct_message(
                order.mostro_order_id, text, trade_index=order.trade_index
            ),
        )
    return await crud.get_events(user_id, order_id)


@trato_api_router.post("/api/v1/orders/{order_id}/share-payment")
async def api_share_payment(
    order_id: str,
    data: SharePaymentProfile,
    key_info: WalletTypeInfo = Depends(require_admin_key),
):
    """Seller shares a saved payment profile with the buyer (chat + trade snapshot)."""
    user_id = key_info.wallet.user
    order = await crud.get_order(user_id, order_id)
    if not order:
        raise HTTPException(
            HTTPStatus.NOT_FOUND,
            "Trade not found — it may have been deleted. Refresh My trades.",
        )
    if order.side != "sell":
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            "Only the party receiving fiat can share payment details.",
        )
    settings = await crud.get_settings(user_id)
    _guard_order_environment(order, settings)
    identity = await crud.get_identity(user_id)
    if not identity:
        raise HTTPException(HTTPStatus.PRECONDITION_FAILED, "No identity yet.")
    profiles = _identity_payment_profiles(identity)
    profile = next((p for p in profiles if p.get("id") == data.profile_id), None)
    if not profile:
        raise HTTPException(HTTPStatus.NOT_FOUND, "Payment profile not found.")
    if profile.get("type") not in FIAT_PAYMENT_TYPES or profile.get("type") == "cash_in_person":
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            "Share a fiat payment method — Bitcoin receive profiles are for buyers.",
        )
    chat_text = format_profile_for_chat(
        profile,
        fiat_amount=order.fiat_amount,
        fiat_code=order.fiat_code,
        trade_ref=_trade_payment_ref(order),
        meetup_at=data.meetup_at,
    )
    snapshot = profile_snapshot_for_trade(profile)
    snapshot["chat_text"] = chat_text
    snapshot["shared_at"] = now()
    snapshot["meetup_at"] = data.meetup_at
    snapshot["pay_actions"] = pay_actions(
        profile,
        fiat_amount=order.fiat_amount,
        fiat_code=order.fiat_code,
        trade_ref=_trade_payment_ref(order),
    )
    await crud.update_order_fields(
        order.id,
        order_json=_merge_order_json(order, seller_payment=snapshot),
    )
    await crud.log_event(user_id, order_id, "chat", "chat", chat_text)
    if not order.demo and order.mostro_order_id:
        keys = _trade_keys_for(identity, order.trade_index)
        engine = _engine_for(order, identity, settings)
        from .mostro import messages as _messages

        await engine.io.send(
            order,
            keys,
            _messages.direct_message(
                order.mostro_order_id, chat_text, trade_index=order.trade_index
            ),
        )
    order = await crud.get_order(user_id, order_id)
    events = await crud.get_events(user_id, order_id)
    payment_view = _order_payment_view(
        order, identity, has_nwc=bool(settings.encrypted_nwc_uri)
    )
    return {
        "order": order,
        "events": events,
        "allowed_actions": allowed_user_actions(order.side, order.status),
        **payment_view,
    }
