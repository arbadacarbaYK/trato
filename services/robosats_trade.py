"""RoboSats trade lifecycle (demo simulation + live take helper)."""

from __future__ import annotations

from typing import Optional

from loguru import logger

from ..mostro.protocol import Action
from ..models import Order
from .nwc_wallet import pay_invoice as nwc_pay_invoice
from .robosats_client import (
    bond_invoice_from_take_response,
    coordinator_for_order,
    new_robot_token,
    take_public_order,
)
from .trade_engine import TradeEngine


def _op_kind(action: Action, order_id: str, payload: Optional[dict] = None) -> dict:
    from ..mostro import messages

    return messages.operator_kind(action, order_id, payload)


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
) -> None:
    """Take on coordinator and pay taker bond via NWC."""
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
