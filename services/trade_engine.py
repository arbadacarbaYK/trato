"""Client trade engine: orchestrates one trade's lifecycle.

The engine is intentionally split from its side effects so the money-critical
choreography can be tested without real Lightning payments, Nostr relays, or a
database:

  - `TradeIO`    performs Lightning + Nostr I/O (real impl: `LnbitsTradeIO`).
  - `TradeStore` persists status/fields and appends to the timeline
    (real impl: `CrudTradeStore`).

Both are injected. Unit/integration tests pass fakes; the live extension passes
the real implementations. The decision logic itself lives in
`mostro.tradeflow` (pure) and the wire messages in `mostro.messages` (pure).

Demo mode uses the very same engine with a local `DemoOperator` that synthesizes
the operator's expected replies, so demo trades exercise the real state machine
and message builders end to end - just with no money and no network.
"""

from __future__ import annotations

from typing import Optional, Protocol

from loguru import logger

from ..mostro import messages
from ..mostro.protocol import Action
from ..mostro.tradeflow import LnEffect, Plan, Side, plan_incoming, plan_user_action
from ..nostr.transport import compact_json


# --- Injected collaborators -------------------------------------------------
class TradeIO(Protocol):
    async def pay_hold_invoice(self, order, bolt11: str, amount_sats: int) -> None: ...

    async def create_receive_invoice(
        self, order, amount_sats: int, memo: str
    ) -> str: ...

    async def send(self, order, trade_keys, message_obj: dict) -> None: ...


class TradeStore(Protocol):
    async def update(self, order, **fields) -> None: ...

    async def log(
        self, order, direction: str, kind: str, payload: Optional[str] = None
    ) -> None: ...


# --- Payload helpers --------------------------------------------------------
def _payment_request(payload: Optional[dict]) -> tuple[Optional[str], Optional[int]]:
    """Extract (bolt11, amount) from a `payment_request` payload."""
    if not isinstance(payload, dict):
        return None, None
    pr = payload.get("payment_request")
    if isinstance(pr, list) and len(pr) >= 2:
        bolt11 = pr[1]
        amount = pr[2] if len(pr) >= 3 else None
        return bolt11, (int(amount) if isinstance(amount, (int, float)) else None)
    return None, None


def _order_amount(payload: Optional[dict]) -> Optional[int]:
    """Extract a sats amount from an `order` payload (operator add-invoice req)."""
    if not isinstance(payload, dict):
        return None
    order = payload.get("order")
    if isinstance(order, dict) and order.get("amount"):
        try:
            return int(order["amount"])
        except (TypeError, ValueError):
            return None
    return None


class TradeEngine:
    def __init__(self, io: TradeIO, store: TradeStore) -> None:
        self.io = io
        self.store = store

    async def _send(self, order, trade_keys, message_obj: dict, action: str) -> None:
        await self.io.send(order, trade_keys, message_obj)
        await self.store.log(order, "out", action, compact_json(message_obj))

    # --- taker: place the take message --------------------------------------
    async def take(
        self,
        order,
        public_kind: str,
        trade_keys,
        *,
        fiat_amount: Optional[int] = None,
    ) -> dict:
        """Send take-sell/take-buy for the public order being taken.

        `public_kind` is the PUBLIC order's kind ("sell" or "buy"); the user's
        own side is the opposite (taking a sell order makes the user a buyer).
        """
        if public_kind == "sell":
            msg = messages.take_sell(
                order.mostro_order_id, fiat_amount=fiat_amount,
                trade_index=order.trade_index,
            )
            action = Action.TAKE_SELL.value
        else:
            msg = messages.take_buy(
                order.mostro_order_id, fiat_amount=fiat_amount,
                trade_index=order.trade_index,
            )
            action = Action.TAKE_BUY.value
        await self._send(order, trade_keys, msg, action)
        return msg

    # --- maker: publish a new order -----------------------------------------
    async def publish_new_order(self, order, small_order, trade_keys) -> dict:
        msg = messages.new_order(small_order, trade_index=order.trade_index)
        await self._send(order, trade_keys, msg, Action.NEW_ORDER.value)
        return msg

    # --- operator -> client -------------------------------------------------
    async def apply_incoming(self, order, kind: dict, trade_keys) -> Plan:
        """Handle one operator message; performs LN effects and replies."""
        action = Action(kind["action"])
        payload = kind.get("payload")
        await self.store.log(order, "in", action.value, compact_json(kind))

        plan = plan_incoming(order.side, order.status, action, payload)

        # Learn (and persist) the operator-assigned order id if we didn't have it.
        if kind.get("id") and not order.mostro_order_id:
            order.mostro_order_id = kind["id"]
            await self.store.update(order, mostro_order_id=kind["id"])

        if plan.ln == LnEffect.PAY_HOLD:
            bolt11, amount = _payment_request(payload)
            if bolt11:
                order.hold_invoice = bolt11
                await self.store.update(order, hold_invoice=bolt11)
                await self.io.pay_hold_invoice(
                    order, bolt11, amount or order.amount_sats
                )

        elif plan.ln == LnEffect.CREATE_INVOICE:
            amount = _order_amount(payload) or order.amount_sats
            if amount and amount > 0:
                invoice = await self.io.create_receive_invoice(
                    order, amount, memo=f"Trato order {order.mostro_order_id}"
                )
                order.buyer_invoice = invoice
                order.amount_sats = amount
                await self.store.update(
                    order, buyer_invoice=invoice, amount_sats=amount
                )
                if plan.reply == Action.ADD_INVOICE:
                    reply = messages.add_invoice(
                        order.mostro_order_id, invoice,
                        trade_index=order.trade_index,
                    )
                    await self._send(
                        order, trade_keys, reply, Action.ADD_INVOICE.value
                    )

        if plan.status:
            order.status = plan.status
            await self.store.update(order, status=plan.status)
        await self.store.log(order, "system", "note", plan.note)
        return plan

    # --- client (user) -> operator ------------------------------------------
    async def apply_user_action(
        self, order, action: Action, trade_keys, *, rating: Optional[int] = None
    ) -> Plan:
        """Handle a user-initiated action (validated by the state machine)."""
        plan = plan_user_action(order.side, order.status, action)

        if action == Action.FIAT_SENT:
            msg = messages.fiat_sent(
                order.mostro_order_id, trade_index=order.trade_index
            )
        elif action == Action.RELEASE:
            msg = messages.release(
                order.mostro_order_id, trade_index=order.trade_index
            )
        elif action == Action.CANCEL:
            msg = messages.cancel(
                order.mostro_order_id, trade_index=order.trade_index
            )
        elif action == Action.DISPUTE:
            msg = messages.dispute(
                order.mostro_order_id, trade_index=order.trade_index
            )
        elif action == Action.RATE_USER:
            if rating is None:
                raise ValueError("a rating value (1..5) is required")
            rating = max(1, min(5, int(rating)))
            msg = messages.rate_user(
                order.mostro_order_id, rating, trade_index=order.trade_index
            )
        else:  # pragma: no cover - guarded by plan_user_action
            raise ValueError(f"unsupported action {action.value}")

        await self._send(order, trade_keys, msg, action.value)

        if action == Action.RATE_USER:
            order.rated = True
            await self.store.update(order, rated=True)
        if plan.status:
            order.status = plan.status
            await self.store.update(order, status=plan.status)
        await self.store.log(order, "system", "note", plan.note)
        return plan


# --- Demo operator (no money, no network) -----------------------------------
DEMO_FALLBACK_SATS = 21000


def _op_kind(action: Action, order_id: str, payload: Optional[dict] = None) -> dict:
    """Craft a minimal operator MessageKind for demo/simulation."""
    return {
        "version": 1,
        "request_id": None,
        "trade_index": None,
        "id": order_id,
        "action": action.value,
        "payload": payload,
    }


class DemoOperator:
    """Synthesizes the operator's expected replies for demo trades.

    Used so a demo trade walks the full lifecycle through the real engine and
    state machine without any money or relays. The synthetic messages mirror the
    shapes a real Mostro operator sends.
    """

    @staticmethod
    def _demo_amount(order) -> int:
        return order.amount_sats if order.amount_sats and order.amount_sats > 0 \
            else DEMO_FALLBACK_SATS

    @staticmethod
    def _fiat_phrase(order) -> str:
        """A human 'X EUR via SEPA' phrase for demo chat (best-effort)."""
        fiat_amount = getattr(order, "fiat_amount", None)
        amount = f"{fiat_amount} " if fiat_amount else ""
        code = getattr(order, "fiat_code", None) or "fiat"
        payment_method = getattr(order, "payment_method", None)
        method = f" via {payment_method}" if payment_method else ""
        return f"{amount}{code}{method}".strip()

    async def after_take(self, engine: TradeEngine, order, trade_keys) -> None:
        settlement = self._settlement_layer(order)
        if settlement == "onchain":
            await self._after_take_onchain(engine, order, trade_keys)
            return
        await self._after_take_lightning(engine, order, trade_keys)

    @staticmethod
    def _settlement_layer(order) -> str:
        try:
            import json

            meta = json.loads(getattr(order, "order_json", None) or "{}")
            layer = str(meta.get("settlement_layer") or "lightning").lower()
            if layer in ("lightning", "onchain"):
                return layer
        except (TypeError, ValueError, json.JSONDecodeError):
            pass
        return "lightning"

    async def _after_take_onchain(self, engine: TradeEngine, order, trade_keys) -> None:
        fiat = self._fiat_phrase(order)
        amount = self._demo_amount(order)
        ref = (order.mostro_order_id or getattr(order, "id", None) or "")[:8]
        demo_addr = f"bc1qDEMO{ref}onchainnotreal"
        await engine.store.log(
            order, "system", "note",
            "On-chain settlement — Bitcoin moves via a blockchain transaction, "
            "not a Lightning hold invoice. Addresses are practice-only in demo.",
        )
        if order.side == Side.BUY.value:
            await engine.store.log(
                order, "in", "chat",
                f"Seller: Pay {fiat} to DEMO-ACME-BANK ref TRATO-{ref}. "
                f"I will send {amount} sats on-chain to your address after confirm.",
            )
            await engine.store.log(
                order, "system", "note",
                "Share your on-chain receive address in chat when the seller asks.",
            )
        else:
            await engine.store.log(
                order, "system", "note",
                f"Your practice deposit address: {demo_addr} — "
                "buyer pays here on-chain after you confirm fiat (demo only).",
            )
            await engine.store.log(
                order, "in", "chat",
                f"Buyer: Ready to pay {fiat}. Share your bank details and your "
                "on-chain address for the Bitcoin leg.",
            )
            await engine.store.log(
                order, "system", "note",
                "Demo shortcut: simulating buyer marking payment sent.",
            )
            oid = order.mostro_order_id
            await engine.apply_incoming(
                order, _op_kind(Action.FIAT_SENT_OK, oid), trade_keys
            )

    async def _after_take_lightning(self, engine: TradeEngine, order, trade_keys) -> None:
        oid = order.mostro_order_id
        amount = self._demo_amount(order)
        fiat = self._fiat_phrase(order)
        ref = (oid or getattr(order, "id", None) or "")[:8]
        if order.side == Side.BUY.value:
            # Operator asks the buyer for an invoice, then accepts it.
            await engine.apply_incoming(
                order, _op_kind(Action.ADD_INVOICE, oid,
                                {"order": {"amount": amount}}), trade_keys
            )
            await engine.apply_incoming(
                order, _op_kind(Action.BUYER_INVOICE_ACCEPTED, oid), trade_keys
            )
            # Fiat details are exchanged peer-to-peer in this chat - not via the
            # operator. Show that here so the buyer knows where to look.
            await engine.store.log(
                order, "system", "note",
                "Payment details appear in this chat (encrypted on the live "
                "network). Look for the seller's instructions below.",
            )
            import json

            meta = json.loads(getattr(order, "order_json", None) or "{}")
            sp = meta.get("seller_payment") or {}
            chat = (sp.get("chat_text") or "").strip()
            if chat:
                await engine.store.log(order, "in", "chat", chat)
            else:
                await engine.store.log(
                    order, "in", "chat",
                    f"Seller: Please send {fiat} to account "
                    f"DEMO-ACME-BANK 0000-{ref} — reference TRATO-{ref}. "
                    "Tap “Payment sent” once it's done.",
                )
        else:
            # Operator sends the seller a hold invoice, then confirms the lock,
            # then (demo shortcut) the buyer marks payment sent.
            await engine.apply_incoming(
                order,
                _op_kind(Action.PAY_INVOICE, oid,
                         {"payment_request": [None,
                          "lnbcDEMOHOLDu1p-practice-escrow-not-real", amount]}),
                trade_keys,
            )
            await engine.apply_incoming(
                order, _op_kind(Action.HOLD_INVOICE_PAYMENT_ACCEPTED, oid),
                trade_keys,
            )
            # The seller RECEIVES fiat, so the seller posts their details here.
            await engine.store.log(
                order, "system", "note",
                "You receive the payment — share your payment details in this chat. "
                "The buyer pays you off-platform, then taps “Payment sent”.",
            )
            await engine.store.log(
                order, "in", "chat",
                f"Buyer: Hi — ready to pay {fiat}. "
                "What account should I send it to?",
            )
            await engine.store.log(
                order, "system", "note",
                "Demo shortcut: simulating the buyer marking payment sent so you "
                "can try “Release Bitcoin” (live trades wait for the real buyer).",
            )
            await engine.apply_incoming(
                order, _op_kind(Action.FIAT_SENT_OK, oid), trade_keys
            )

    async def after_user_action(
        self,
        engine: TradeEngine,
        order,
        action: Action,
        trade_keys,
        *,
        rating: Optional[int] = None,
    ) -> None:
        oid = order.mostro_order_id
        if action == Action.FIAT_SENT:
            await engine.apply_incoming(
                order, _op_kind(Action.PURCHASE_COMPLETED, oid), trade_keys
            )
        elif action == Action.RELEASE:
            await engine.apply_incoming(
                order, _op_kind(Action.HOLD_INVOICE_PAYMENT_SETTLED, oid),
                trade_keys,
            )
        elif action == Action.RATE_USER:
            demo_stars = rating if rating is not None else 5
            await engine.apply_incoming(
                order,
                _op_kind(
                    Action.RATE_RECEIVED,
                    oid,
                    {"rating_user": demo_stars},
                ),
                trade_keys,
            )
        elif action == Action.DISPUTE:
            await engine.apply_incoming(
                order, _op_kind(Action.DISPUTE_INITIATED_BY_YOU, oid), trade_keys
            )
            await engine.apply_incoming(
                order, _op_kind(Action.ADMIN_TOOK_DISPUTE, oid), trade_keys
            )
            await engine.store.log(
                order,
                "in",
                "chat",
                "Solver: Hi — I'm reviewing this trade. Describe what went wrong "
                "and share any payment proof here. (Demo solver — live trades use "
                "your instance coordinator via mostrod.)",
            )
            await engine.store.log(
                order,
                "system",
                "note",
                "A practice solver picked up your dispute. On live trades, your "
                "instance coordinator mediates from Trato Operator → Disputes.",
            )


# --- Real IO implementations ------------------------------------------------
async def _nostr_send(order, trade_keys, message_obj: dict, relays: list[str]) -> None:
    from nostr_sdk import Client, NostrSigner, RelayUrl

    from ..nostr.transport import build_envelope, wrap_to

    envelope = build_envelope(message_obj, trade_keys)
    wrap = await wrap_to(trade_keys, order.mostro_pubkey, envelope)

    client = Client(NostrSigner.keys(trade_keys))
    try:
        for url in relays:
            try:
                await client.add_relay(RelayUrl.parse(url))
            except Exception as exc:  # noqa: BLE001
                logger.warning(f"trato: bad relay {url!r}: {exc}")
        await client.connect()
        await client.send_event(wrap)
    finally:
        try:
            await client.shutdown()
        except Exception:  # noqa: BLE001
            pass


class DemoTradeIO:
    """No-op IO for demo mode: never moves money, never hits a relay."""

    async def pay_hold_invoice(self, order, bolt11: str, amount_sats: int) -> None:
        logger.info(f"trato demo: would pay hold invoice {amount_sats} sats")

    async def create_receive_invoice(self, order, amount_sats: int, memo: str) -> str:
        return f"lnbcDEMO{amount_sats}u1p-practice-invoice-not-real"

    async def send(self, order, trade_keys, message_obj: dict) -> None:
        logger.debug(f"trato demo: would send {message_obj}")


class NwcTradeIO:
    """Lightning via the user's NWC wallet; Nostr publish unchanged."""

    def __init__(self, nwc_uri: str, relays: list[str]) -> None:
        self.nwc_uri = nwc_uri
        self.relays = relays

    async def pay_hold_invoice(self, order, bolt11: str, amount_sats: int) -> None:
        import asyncio

        from .nwc_wallet import pay_invoice as nwc_pay_invoice

        async def _pay() -> None:
            try:
                await nwc_pay_invoice(self.nwc_uri, bolt11)
            except Exception as exc:  # noqa: BLE001
                logger.error(f"trato: NWC hold-invoice payment error: {exc}")

        asyncio.create_task(_pay())

    async def create_receive_invoice(
        self, order, amount_sats: int, memo: str
    ) -> str:
        from .nwc_wallet import make_invoice as nwc_make_invoice

        return await nwc_make_invoice(self.nwc_uri, amount_sats, memo)

    async def send(self, order, trade_keys, message_obj: dict) -> None:
        await _nostr_send(order, trade_keys, message_obj, self.relays)


class LnbitsTradeIO:
    """Real IO: LNbits Lightning + Nostr gift-wrapped publish.

    Constructed with the wallet that funds/receives sats and the relays to
    publish to. Real settlement is gated by callers (demo off + mainnet on +
    hold-invoice-capable funding source); this class assumes the gate passed.
    """

    def __init__(self, wallet_id: str, relays: list[str]) -> None:
        self.wallet_id = wallet_id
        self.relays = relays

    async def pay_hold_invoice(self, order, bolt11: str, amount_sats: int) -> None:
        # Paying a HOLD invoice stays in-flight until the operator settles or
        # cancels, so we must NOT await it (it would block the trade). Fire it
        # off and let LNbits track the in-flight payment.
        import asyncio

        from lnbits.core.services import pay_invoice

        async def _pay() -> None:
            try:
                await pay_invoice(
                    wallet_id=self.wallet_id,
                    payment_request=bolt11,
                    description=f"Trato escrow {order.mostro_order_id}",
                    tag="trato",
                )
            except Exception as exc:  # noqa: BLE001
                logger.error(f"trato: hold-invoice payment error: {exc}")

        asyncio.create_task(_pay())

    async def create_receive_invoice(self, order, amount_sats: int, memo: str) -> str:
        from lnbits.core.services import create_invoice

        payment = await create_invoice(
            wallet_id=self.wallet_id,
            amount=amount_sats,
            memo=memo,
            extra={"tag": "trato", "order": order.mostro_order_id},
        )
        return payment.bolt11

    async def send(self, order, trade_keys, message_obj: dict) -> None:
        await _nostr_send(order, trade_keys, message_obj, self.relays)
