"""Demo trade payment snapshots (seller fiat + buyer Bitcoin receive)."""

from __future__ import annotations

import json
from typing import Optional

from ..models import Identity, Order, now
from .payment_profiles import (
    classify_pm_tag,
    format_buyer_receive_for_chat,
    format_profile_for_chat,
    is_stablecoin_pm,
    normalize_profile,
    pick_buyer_receive_profile,
    profile_snapshot_for_trade,
    unpack_profiles,
)


def payment_methods_from_order(order: Order) -> list[str]:
    """Payment-method tags from the taken public order."""
    raw = (order.payment_method or "").strip()
    if raw and "," not in raw:
        return [raw]
    pms: list[str] = []
    if raw:
        for part in raw.split(","):
            tag = part.strip()
            if tag:
                pms.append(tag)
    if pms:
        return pms
    try:
        meta = json.loads(order.order_json or "{}")
        chosen = (meta.get("chosen_payment_method") or "").strip()
        if chosen:
            return [chosen]
        extra = meta.get("payment_methods")
        if isinstance(extra, list):
            for item in extra:
                tag = str(item or "").strip()
                if tag:
                    pms.append(tag)
    except (TypeError, ValueError, json.JSONDecodeError):
        pass
    return pms


def pick_primary_payment_method(pms: list[str]) -> str:
    """Prefer the first tag Trato can classify (stablecoin, SEPA, etc.)."""
    for pm in pms:
        if classify_pm_tag(pm) or is_stablecoin_pm(pm):
            return pm
    return pms[0] if pms else "SEPA"


def demo_seller_bank_profile(order: Order) -> dict:
    ref = (order.mostro_order_id or order.id or "")[:8]
    return normalize_profile(
        {
            "type": "bank_transfer",
            "label": "DEMO-BANK",
            "account_name": "Trato Demo Seller",
            "iban": f"DEMO-IBAN-TRATO-{ref}",
            "bank_name": "Practice bank (demo only)",
            "reference_hint": f"TRATO-{ref}",
        }
    )


def demo_seller_payment_profile(order: Order) -> dict:
    """Build a practice seller profile that matches the public order's payment tags."""
    pms = payment_methods_from_order(order)
    primary = pick_primary_payment_method(pms)
    ptype = classify_pm_tag(primary)
    ref = (order.mostro_order_id or order.id or "")[:8]
    tag_key = primary.upper().replace(" ", "").replace("-", "")

    if ptype in ("usdt", "usdc", "stablecoin") or is_stablecoin_pm(primary):
        compact = primary.lower().replace(" ", "").replace("-", "")
        on_lightning = "lusdt" in compact or compact.startswith("lusd")
        profile_type = ptype if ptype in ("usdt", "usdc", "stablecoin") else "stablecoin"
        if profile_type == "usdt":
            network = "Tron / Ethereum (confirm with seller)"
        elif profile_type == "usdc":
            network = "Ethereum / Base (confirm with seller)"
        elif on_lightning:
            network = "Lightning (L-USDt)"
        else:
            network = "Confirm network with seller"
        raw: dict = {
            "type": profile_type,
            "label": primary,
            "account_name": "Trato Demo Seller",
            "network": network,
            "reference_hint": f"TRATO-{ref}",
            "notes": "Practice payment details — demo only.",
        }
        if on_lightning:
            raw["lightning_address"] = f"demo-seller-{ref}@robosats.practice"
        else:
            raw["wallet_address"] = f"DEMO-{tag_key}-{ref}"
        return normalize_profile(raw)

    if ptype == "paypal":
        return normalize_profile(
            {
                "type": "paypal",
                "label": "PayPal",
                "account_name": "Trato Demo Seller",
                "email": f"demo-seller-{ref}@trato.practice",
                "reference_hint": f"TRATO-{ref}",
                "notes": "Practice PayPal — demo only.",
            }
        )

    if ptype == "revolut":
        return normalize_profile(
            {
                "type": "revolut",
                "label": "Revolut",
                "account_name": "Trato Demo Seller",
                "username": f"trato-demo-{ref}",
                "reference_hint": f"TRATO-{ref}",
            }
        )

    return demo_seller_bank_profile(order)


def demo_seller_payment_snapshot(order: Order) -> dict:
    profile = demo_seller_payment_profile(order)
    ref = (order.mostro_order_id or order.id or "")[:8]
    chat = format_profile_for_chat(
        profile,
        fiat_amount=float(order.fiat_amount) if order.fiat_amount else None,
        fiat_code=order.fiat_code or "",
        trade_ref=f"TRATO-{ref}",
    )
    snap = profile_snapshot_for_trade(profile)
    snap["chat_text"] = chat
    snap["shared_at"] = now()
    snap["demo"] = True
    return snap


def merge_order_json(order: Order, **patch) -> str:
    meta = json.loads(order.order_json or "{}")
    meta.update(patch)
    return json.dumps(meta)


async def seed_demo_trade_context(
    store,
    order: Order,
    identity: Optional[Identity],
    *,
    has_nwc: bool = False,
) -> None:
    """Attach demo seller payment + buyer receive details so the trade UI can proceed."""
    from ..crud import update_order_fields

    meta_patch: dict = {}
    ref = (order.mostro_order_id or order.id or "")[:8]
    pms = payment_methods_from_order(order)
    if pms:
        meta_patch["payment_methods"] = pms

    if order.side == "buy":
        meta_patch["seller_payment"] = demo_seller_payment_snapshot(order)
        profiles: list[dict] = []
        if identity and identity.encrypted_payment_details:
            from ..security import decrypt_secret

            profiles, _ = unpack_profiles(
                decrypt_secret(identity.encrypted_payment_details)
            )
        receive = pick_buyer_receive_profile(profiles)
        if receive:
            chat = format_buyer_receive_for_chat(receive, has_nwc=has_nwc)
            snap = profile_snapshot_for_trade(receive)
            snap["chat_text"] = chat
            snap["shared_at"] = now()
            meta_patch["buyer_receive"] = snap
            await store.log(order, "out", "chat", chat)
        else:
            await store.log(
                order,
                "system",
                "note",
                "Add a Lightning address or Bitcoin receive profile in Identity "
                "so the seller knows where to send your sats.",
            )

    await update_order_fields(
        order.id, order_json=merge_order_json(order, **meta_patch)
    )
    order.order_json = merge_order_json(order, **meta_patch)


async def seed_live_buyer_context(
    store,
    order: Order,
    identity: Optional[Identity],
    *,
    has_nwc: bool = False,
) -> None:
    """After a live take (buy side): publish receive details from Identity (no demo fiat)."""
    from ..crud import update_order_fields

    meta_patch: dict = {}
    pms = payment_methods_from_order(order)
    if pms:
        meta_patch["payment_methods"] = pms

    profiles: list[dict] = []
    if identity and identity.encrypted_payment_details:
        from ..security import decrypt_secret

        profiles, _ = unpack_profiles(
            decrypt_secret(identity.encrypted_payment_details)
        )
    receive = pick_buyer_receive_profile(profiles)
    if receive:
        chat = format_buyer_receive_for_chat(receive, has_nwc=has_nwc)
        snap = profile_snapshot_for_trade(receive)
        snap["chat_text"] = chat
        snap["shared_at"] = now()
        meta_patch["buyer_receive"] = snap
        await store.log(order, "out", "chat", chat)
    else:
        await store.log(
            order,
            "system",
            "note",
            "Add a Lightning address, on-chain address, or NWC wallet in Identity "
            "so your counterparty knows where to send Bitcoin.",
        )

    try:
        import json

        meta = json.loads(order.order_json or "{}")
        layer = str(meta.get("settlement_layer") or "lightning").lower()
    except json.JSONDecodeError:
        layer = "lightning"
    if layer == "onchain":
        await store.log(
            order,
            "system",
            "note",
            "On-chain settlement — Bitcoin moves to your address; fiat still "
            "moves off-platform between you and the seller.",
        )

    if meta_patch:
        await update_order_fields(
            order.id, order_json=merge_order_json(order, **meta_patch)
        )
        order.order_json = merge_order_json(order, **meta_patch)
