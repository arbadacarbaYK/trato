"""RoboSats trade lifecycle (demo simulation + live take/sync)."""

from __future__ import annotations

import json
from typing import Optional

from loguru import logger

from ..mostro.protocol import Action
from ..models import Order
from .nwc_wallet import make_invoice as nwc_make_invoice
from .nwc_wallet import pay_invoice as nwc_pay_invoice
from .robosats_client import (
    ROBOSATS_STATUS_CHAT,
    ROBOSATS_STATUS_FIAT_SENT,
    ROBOSATS_STATUS_LABELS,
    ROBOSATS_STATUS_SUCCESS,
    ROBOSATS_STATUS_WAITING_BUYER_INVOICE,
    ROBOSATS_STATUS_WAITING_COLLATERAL,
    ROBOSATS_STATUS_WAITING_SELLER_COLLATERAL,
    bond_invoice_from_take_response,
    coordinator_for_order,
    escrow_invoice_from_response,
    fetch_order,
    new_robot_token,
    order_status_code,
    post_order_action,
    take_public_order,
    trato_status_for_robosats,
)
from .trade_engine import TradeEngine


def _op_kind(action: Action, order_id: str, payload: Optional[dict] = None) -> dict:
    from ..mostro import messages

    return messages.operator_kind(action, order_id, payload)


def _robosats_meta(order: Order) -> dict:
    try:
        return json.loads(order.order_json or "{}")
    except json.JSONDecodeError:
        return {}


def _merge_robosats_meta(order: Order, **patch) -> str:
    meta = _robosats_meta(order)
    rs = meta.get("robosats") or {}
    rs.update(patch)
    meta["robosats"] = rs
    return json.dumps(meta)


async def _coordinator_context(order: Order, settings) -> tuple[str, str]:
    from ..security import decrypt_secret

    meta = _robosats_meta(order)
    cp = meta.get("counterparty") or {}
    alias = (
        meta.get("platform_instance")
        or settings.robosats_coordinator
        or cp.get("platform_instance")
    )
    base = await coordinator_for_order(order.mostro_pubkey, alias)
    if not base:
        raise RuntimeError(
            "Unknown RoboSats coordinator — pick one in Settings or refresh the book."
        )
    if not settings.encrypted_robosats_token:
        raise RuntimeError("RoboSats robot token missing — take the order again.")
    robot_token = decrypt_secret(settings.encrypted_robosats_token)
    return base, robot_token


class RoboSatsDemoOperator:
    """Walk a RoboSats-shaped trade in demo mode (no coordinator REST)."""

    async def after_take(self, engine: TradeEngine, order: Order, trade_keys) -> None:
        oid = order.mostro_order_id
        fiat = f"{order.fiat_amount or '?'} {order.fiat_code}"
        ref = (oid or order.id or "")[:8]
        await engine.store.log(
            order,
            "system",
            "note",
            "RoboSats practice trade — taker bond paid (simulated). "
            "Live trades use your NWC wallet for the real bond invoice.",
        )
        await engine.store.update(order, status="active")
        if order.side == "buy":
            import json

            meta = json.loads(order.order_json or "{}")
            sp = meta.get("seller_payment") or {}
            chat = (sp.get("chat_text") or "").strip()
            if chat:
                await engine.store.log(order, "in", "chat", chat)
            else:
                await engine.store.log(
                    order,
                    "in",
                    "chat",
                    f"Seller: Send {fiat} using the agreed payment method "
                    f"(ref TRATO-{ref}) — then tap “Payment sent”.",
                )
        else:
            await engine.store.log(
                order,
                "in",
                "chat",
                f"Buyer: Ready to pay {fiat}. Share your payment details here.",
            )
            await engine.store.log(
                order,
                "system",
                "note",
                "Demo shortcut: buyer marks payment sent so you can try Release.",
            )
            await engine.store.update(order, status="fiat-sent")

    async def after_user_action(
        self,
        engine: TradeEngine,
        order: Order,
        action: Action,
        trade_keys,
        *,
        rating: Optional[int] = None,
    ) -> None:
        if action == Action.FIAT_SENT:
            await engine.store.update(order, status="fiat-sent")
            import json

            from .payment_profiles import buyer_receive_summary

            meta = json.loads(order.order_json or "{}")
            br = meta.get("buyer_receive") or {}
            profile = br.get("profile") or {}
            addr = (
                buyer_receive_summary(profile)
                if profile
                else "the buyer's receive address in chat"
            )
            amt = (
                f"{order.amount_sats} sats"
                if order.amount_sats
                else "the agreed BTC amount"
            )
            if order.side == "buy":
                await engine.store.log(
                    order,
                    "system",
                    "note",
                    f"Waiting for the seller to release Bitcoin to {addr}.",
                )
            await engine.store.log(
                order,
                "in",
                "chat",
                f"Seller: Buyer marked payment sent. Release {amt} to {addr}, "
                "then tap “Release sats”.",
            )
        elif action == Action.RELEASE:
            await engine.store.update(order, status="success")
            import json

            from .payment_profiles import buyer_receive_summary

            meta = json.loads(order.order_json or "{}")
            br = meta.get("buyer_receive") or {}
            profile = br.get("profile") or {}
            dest = (
                buyer_receive_summary(profile)
                if profile
                else "buyer's address"
            )
            await engine.store.log(
                order,
                "system",
                "note",
                f"RoboSats trade completed (demo) — practice sats sent to {dest}.",
            )
        elif action == Action.RATE_USER:
            stars = rating if rating is not None else 5
            await engine.store.log(
                order, "in", "rate", f"Rated coordinator {stars}/5 (demo)."
            )
            await engine.store.update(order, status="success", rated=True)


async def live_take_robosats(
    *,
    order: Order,
    coordinator_pubkey: str,
    coordinator_alias: str | None,
    robot_token: str,
    nwc_uri: str,
) -> dict:
    """Take on coordinator and pay taker bond via NWC. Returns coordinator JSON."""
    base = await coordinator_for_order(coordinator_pubkey, coordinator_alias)
    if not base:
        raise RuntimeError(
            "Unknown RoboSats coordinator — pick one in Settings or refresh the book."
        )
    payload = await take_public_order(
        base, robot_token=robot_token, order_id=order.mostro_order_id
    )
    bond = bond_invoice_from_take_response(payload)
    if not bond:
        raise RuntimeError(
            "RoboSats did not return a taker bond invoice — the offer may be gone."
        )
    logger.info(f"trato: paying RoboSats taker bond for {order.mostro_order_id}")
    await nwc_pay_invoice(nwc_uri, bond)
    return payload


async def sync_live_robosats(
    order: Order,
    settings,
    store,
    *,
    nwc_uri: str | None = None,
) -> None:
    """Poll coordinator state; pay/submit invoices via NWC when Trato can."""
    if order.demo:
        return
    meta = _robosats_meta(order)
    if (meta.get("counterparty") or {}).get("platform", "").lower() != "robosats":
        cp_plat = meta.get("counterparty", {}).get("platform")
        if cp_plat is None and meta.get("public_source"):
            pass
        elif (cp_plat or "").lower() != "robosats":
            return

    try:
        base, robot_token = await _coordinator_context(order, settings)
    except RuntimeError as exc:
        logger.debug(f"trato: RoboSats sync skipped: {exc}")
        return

    try:
        payload = await fetch_order(
            base, robot_token=robot_token, order_id=order.mostro_order_id
        )
    except RuntimeError as exc:
        await store.log(order, "system", "note", f"RoboSats status check failed: {exc}")
        return

    status = order_status_code(payload)
    prev = (meta.get("robosats") or {}).get("last_status")
    label = ROBOSATS_STATUS_LABELS.get(status or -1, f"status {status}")
    if status != prev:
        await store.log(
            order,
            "system",
            "note",
            f"RoboSats coordinator: {label}. "
            "Coordinator chat and some steps may still need the RoboSats web UI.",
        )
        mapped = trato_status_for_robosats(status)
        if mapped and mapped != order.status:
            await store.update(order, status=mapped)
        order_json = _merge_robosats_meta(
            order, last_status=status, last_label=label, coordinator_base=base
        )
        await store.update(order, order_json=order_json)
        order.order_json = order_json

    if not nwc_uri:
        return

    meta = _robosats_meta(order)
    rs = meta.get("robosats") or {}
    oid = order.mostro_order_id

    if order.side == "sell" and status in (
        ROBOSATS_STATUS_WAITING_COLLATERAL,
        ROBOSATS_STATUS_WAITING_SELLER_COLLATERAL,
    ):
        if not rs.get("escrow_paid"):
            inv = escrow_invoice_from_response(payload)
            if inv:
                logger.info(f"trato: paying RoboSats escrow for {oid}")
                await nwc_pay_invoice(nwc_uri, inv)
                order_json = _merge_robosats_meta(order, escrow_paid=True)
                await store.update(order, order_json=order_json)
                await store.log(
                    order,
                    "system",
                    "note",
                    "Escrow invoice paid via your NWC wallet.",
                )

    if order.side == "buy" and status in (
        ROBOSATS_STATUS_WAITING_COLLATERAL,
        ROBOSATS_STATUS_WAITING_BUYER_INVOICE,
        ROBOSATS_STATUS_WAITING_SELLER_COLLATERAL,
    ):
        if not rs.get("buyer_invoice_submitted"):
            amount = int(payload.get("escrow_satoshis") or order.amount_sats or 0)
            if amount > 0:
                inv = await nwc_make_invoice(
                    nwc_uri, amount, memo=f"RoboSats {oid}"
                )
                await post_order_action(
                    base,
                    robot_token=robot_token,
                    order_id=oid,
                    action="update_invoice",
                    invoice=inv,
                )
                order_json = _merge_robosats_meta(
                    order, buyer_invoice_submitted=True, buyer_invoice=inv
                )
                await store.update(
                    order, buyer_invoice=inv, order_json=order_json
                )
                await store.log(
                    order,
                    "system",
                    "note",
                    "Buyer receive invoice submitted to RoboSats via NWC.",
                )


async def apply_live_robosats_action(
    order: Order,
    settings,
    action: Action,
    *,
    rating: Optional[int] = None,
) -> None:
    """Forward supported user actions to the coordinator REST API."""
    base, robot_token = await _coordinator_context(order, settings)
    oid = order.mostro_order_id
    if action == Action.FIAT_SENT:
        await post_order_action(
            base, robot_token=robot_token, order_id=oid, action="confirm"
        )
    elif action == Action.RELEASE:
        await post_order_action(
            base, robot_token=robot_token, order_id=oid, action="confirm"
        )
    elif action == Action.DISPUTE:
        await post_order_action(
            base, robot_token=robot_token, order_id=oid, action="dispute"
        )
    elif action == Action.CANCEL:
        payload = await fetch_order(base, robot_token=robot_token, order_id=oid)
        cancel_status = order_status_code(payload)
        await post_order_action(
            base,
            robot_token=robot_token,
            order_id=oid,
            action="cancel",
            cancel_status=cancel_status,
        )
    elif action == Action.RATE_USER:
        stars = max(1, min(5, int(rating or 5)))
        await post_order_action(
            base,
            robot_token=robot_token,
            order_id=oid,
            action="rate",
            rating=stars,
        )
    else:
        raise RuntimeError(
            f"Action {action.value} is not supported for live RoboSats trades."
        )
