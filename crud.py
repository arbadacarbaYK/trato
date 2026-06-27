"""Database access for Trato.

All queries are parameterized. Settings are stored with the relay list as JSON
text and re-hydrated via ``TratoSettings.from_row`` so the model layer always
sees a real list. Secrets (the seed) are encrypted before they ever reach here.
"""

from __future__ import annotations

import json
from typing import Optional

from . import db
from lnbits.helpers import urlsafe_short_hash

from .serialize import model_to_dict
from .models import (
    DEFAULT_RELAYS,
    Identity,
    Order,
    TradeEvent,
    TratoSettings,
    now,
)


# --- Settings ---------------------------------------------------------------
async def get_settings(user_id: str) -> TratoSettings:
    row = await db.fetchone(
        'SELECT * FROM trato.settings WHERE "user" = :user',
        {"user": user_id},
    )
    if not row:
        return await _create_default_settings(user_id)
    return TratoSettings.from_row(row)


async def _create_default_settings(user_id: str) -> TratoSettings:
    s = TratoSettings(user=user_id, relays=list(DEFAULT_RELAYS))
    await db.execute(
        """
        INSERT INTO trato.settings
            ("user", relays, mostro_pubkey, demo_mode, mainnet_enabled,
             encrypted_nwc_uri, robosats_coordinator, encrypted_robosats_token,
             created_at, updated_at)
        VALUES
            (:user, :relays, :mostro_pubkey, :demo_mode, :mainnet_enabled,
             :encrypted_nwc_uri, :robosats_coordinator, :encrypted_robosats_token,
             :created_at, :updated_at)
        """,
        {
            "user": s.user,
            "relays": json.dumps(s.relays),
            "mostro_pubkey": s.mostro_pubkey,
            "demo_mode": s.demo_mode,
            "mainnet_enabled": s.mainnet_enabled,
            "encrypted_nwc_uri": s.encrypted_nwc_uri,
            "robosats_coordinator": s.robosats_coordinator,
            "encrypted_robosats_token": s.encrypted_robosats_token,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
        },
    )
    return s


async def update_settings(settings_obj: TratoSettings) -> TratoSettings:
    settings_obj.updated_at = now()
    await db.execute(
        """
        UPDATE trato.settings SET
            relays = :relays,
            mostro_pubkey = :mostro_pubkey,
            demo_mode = :demo_mode,
            mainnet_enabled = :mainnet_enabled,
            encrypted_nwc_uri = :encrypted_nwc_uri,
            robosats_coordinator = :robosats_coordinator,
            encrypted_robosats_token = :encrypted_robosats_token,
            updated_at = :updated_at
        WHERE "user" = :user
        """,
        {
            "user": settings_obj.user,
            "relays": json.dumps(settings_obj.relays),
            "mostro_pubkey": settings_obj.mostro_pubkey,
            "demo_mode": settings_obj.demo_mode,
            "mainnet_enabled": settings_obj.mainnet_enabled,
            "encrypted_nwc_uri": settings_obj.encrypted_nwc_uri,
            "robosats_coordinator": settings_obj.robosats_coordinator,
            "encrypted_robosats_token": settings_obj.encrypted_robosats_token,
            "updated_at": settings_obj.updated_at,
        },
    )
    return settings_obj


# --- Identity ---------------------------------------------------------------
async def get_identity(user_id: str) -> Optional[Identity]:
    row = await db.fetchone(
        'SELECT * FROM trato.identities WHERE "user" = :user',
        {"user": user_id},
    )
    return Identity(**row) if row else None


async def create_identity(identity: Identity) -> Identity:
    await db.execute(
        """
        INSERT INTO trato.identities
            (id, "user", wallet, encrypted_mnemonic, identity_pubkey,
             identity_npub, next_trade_index, created_at)
        VALUES
            (:id, :user, :wallet, :encrypted_mnemonic, :identity_pubkey,
             :identity_npub, :next_trade_index, :created_at)
        """,
        model_to_dict(identity),
    )
    return identity


async def update_identity_payment_details(
    identity_id: str, encrypted_payment_details: Optional[str]
) -> None:
    """Set (or clear) the identity's encrypted default payment details."""
    await db.execute(
        """
        UPDATE trato.identities
        SET encrypted_payment_details = :pd
        WHERE id = :id
        """,
        {"pd": encrypted_payment_details, "id": identity_id},
    )


async def bump_trade_index(identity_id: str) -> int:
    """Atomically reserve and return the next trade index.

    Trade indices MUST be strictly increasing per identity (Mostro reputation
    accounting), so this is the single source of truth for allocating one.
    """
    async with db.connect() as conn:
        row = await conn.fetchone(
            "SELECT next_trade_index FROM trato.identities WHERE id = :id",
            {"id": identity_id},
        )
        if not row:
            raise ValueError("identity not found")
        current = int(row["next_trade_index"])
        await conn.execute(
            "UPDATE trato.identities SET next_trade_index = :nxt WHERE id = :id",
            {"nxt": current + 1, "id": identity_id},
        )
        return current


# --- Orders -----------------------------------------------------------------
async def create_order(order: Order) -> Order:
    await db.execute(
        """
        INSERT INTO trato.orders
            (id, "user", identity_id, role, side, mostro_pubkey, trade_index,
             trade_pubkey, status, fiat_code, payment_method, amount_sats,
             fiat_amount, premium, order_json, demo, created_at, updated_at)
        VALUES
            (:id, :user, :identity_id, :role, :side, :mostro_pubkey,
             :trade_index, :trade_pubkey, :status, :fiat_code, :payment_method,
             :amount_sats, :fiat_amount, :premium, :order_json, :demo,
             :created_at, :updated_at)
        """,
        model_to_dict(order),
    )
    return order


async def get_order(user_id: str, order_id: str) -> Optional[Order]:
    row = await db.fetchone(
        'SELECT * FROM trato.orders WHERE "user" = :user AND id = :id',
        {"user": user_id, "id": order_id},
    )
    return Order.from_row(row) if row else None


DELETABLE_ORDER_STATUSES = frozenset(
    {
        "canceled",
        "cancelled",
        "cooperatively-canceled",
        "expired",
    }
)

# Statuses that are finished — not counted as "active" on the operator dashboard
# or picked up by the live inbound poller. Keep in sync with tradeflow TERMINAL_STATUSES
# plus admin / alias spellings seen in the wild.
TERMINAL_ORDER_STATUSES = frozenset(
    {
        "success",
        "released",
        "canceled",
        "cancelled",
        "cooperatively-canceled",
        "expired",
        "canceled-by-admin",
        "settled-by-admin",
        "completed-by-admin",
    }
)


def _sql_status_not_in_terminal() -> str:
    """SQL fragment: ``status NOT IN ('…', …)`` for TERMINAL_ORDER_STATUSES."""
    quoted = ", ".join(f"'{s}'" for s in sorted(TERMINAL_ORDER_STATUSES))
    return f"status NOT IN ({quoted})"


async def _purge_order_row(user_id: str, order_id: str) -> None:
    """Delete a trade row and its timeline without status checks."""
    await db.execute(
        'DELETE FROM trato.events WHERE "user" = :user AND order_id = :id',
        {"user": user_id, "id": order_id},
    )
    await db.execute(
        'DELETE FROM trato.orders WHERE "user" = :user AND id = :id',
        {"user": user_id, "id": order_id},
    )


async def delete_order(user_id: str, order_id: str) -> bool:
    """Remove a finished/canceled local trade row and its timeline."""
    order = await get_order(user_id, order_id)
    if not order:
        return False
    status = (order.status or "").strip().lower()
    if status not in DELETABLE_ORDER_STATUSES:
        raise ValueError(
            "Only canceled or expired trades can be deleted. "
            "Active trades must be completed or canceled first."
        )
    await _purge_order_row(user_id, order_id)
    return True


async def delete_canceled_orders(user_id: str, *, demo: bool | None = None) -> int:
    """Delete all canceled/expired trades for this user; returns count removed."""
    orders = await get_orders(user_id, demo=demo)
    removed = 0
    for order in orders:
        status = (order.status or "").strip().lower()
        if status in DELETABLE_ORDER_STATUSES:
            await delete_order(user_id, order.id)
            removed += 1
    return removed


async def delete_all_demo_orders(user_id: str) -> int:
    """Remove every demo trade for this user (practice history reset)."""
    orders = await get_orders(user_id, demo=True)
    for order in orders:
        await _purge_order_row(user_id, order.id)
    return len(orders)


async def get_orders(user_id: str, *, demo: bool | None = None) -> list[Order]:
    if demo is None:
        rows = await db.fetchall(
            'SELECT * FROM trato.orders WHERE "user" = :user ORDER BY created_at DESC',
            {"user": user_id},
        )
    else:
        rows = await db.fetchall(
            """
            SELECT * FROM trato.orders
            WHERE "user" = :user AND demo = :demo
            ORDER BY created_at DESC
            """,
            {"user": user_id, "demo": demo},
        )
    return [Order.from_row(r) for r in rows]


async def instance_stats() -> dict:
    """Aggregate counts for the operator dashboard (all users on this instance)."""
    not_terminal = _sql_status_not_in_terminal()
    total = int((await db.fetchone("SELECT COUNT(*) AS n FROM trato.orders", {}))["n"])
    active_live = int(
        (
            await db.fetchone(
                f"""
                SELECT COUNT(*) AS n FROM trato.orders
                WHERE demo = false AND {not_terminal}
                """,
                {},
            )
        )["n"]
    )
    active_demo = int(
        (
            await db.fetchone(
                f"""
                SELECT COUNT(*) AS n FROM trato.orders
                WHERE demo = true AND {not_terminal}
                """,
                {},
            )
        )["n"]
    )
    env = {"demo": 0, "live": 0}
    for row in await db.fetchall(
        'SELECT demo, COUNT(*) AS n FROM trato.orders GROUP BY demo', {}
    ):
        key = "demo" if row["demo"] else "live"
        env[key] = int(row["n"])
    identities = int(
        (await db.fetchone("SELECT COUNT(*) AS n FROM trato.identities", {}))["n"]
    )
    settings_users = int(
        (await db.fetchone('SELECT COUNT(*) AS n FROM trato.settings', {}))["n"]
    )
    disputes_open = int(
        (
            await db.fetchone(
                "SELECT COUNT(*) AS n FROM trato.orders WHERE status = 'dispute'",
                {},
            )
        )["n"]
    )
    return {
        "trades_total": total,
        # Live non-terminal trades — what operators care about for escrow/load.
        "trades_active": active_live,
        "trades_active_demo": active_demo,
        "trades_demo": env["demo"],
        "trades_live": env["live"],
        "identities": identities,
        "settings_users": settings_users,
        "disputes_open": disputes_open,
    }


async def count_orders_by_env(user_id: str) -> dict[str, int]:
    rows = await db.fetchall(
        """
        SELECT demo, COUNT(*) AS n
        FROM trato.orders
        WHERE "user" = :user
        GROUP BY demo
        """,
        {"user": user_id},
    )
    counts = {"demo": 0, "live": 0}
    for row in rows:
        key = "demo" if row["demo"] else "live"
        counts[key] = int(row["n"])
    return counts


async def get_all_configured_relays() -> list[str]:
    """Union of default relays and every relay any user has configured.

    Used by the order book poller so the aggregated book reflects whatever
    relays the instance's users actually trade on.
    """
    relays: list[str] = list(DEFAULT_RELAYS)
    rows = await db.fetchall("SELECT relays FROM trato.settings", {})
    for row in rows:
        try:
            for url in json.loads(row["relays"] or "[]"):
                if url and url not in relays:
                    relays.append(url)
        except (json.JSONDecodeError, TypeError, KeyError):
            continue
    return relays


async def update_order_status(user_id: str, order_id: str, status: str) -> None:
    await db.execute(
        """
        UPDATE trato.orders SET status = :status, updated_at = :updated_at
        WHERE "user" = :user AND id = :id
        """,
        {"status": status, "updated_at": now(), "user": user_id, "id": order_id},
    )


# Columns the trade engine is allowed to update on an order row.
_UPDATABLE_ORDER_FIELDS = frozenset(
    {
        "status", "mostro_order_id", "peer_pubkey", "buyer_invoice",
        "hold_invoice", "rated", "last_event_at", "amount_sats", "fiat_amount",
        "fiat_code", "payment_method", "side", "role", "order_json",
    }
)


async def update_order_fields(order_id: str, **fields) -> None:
    """Update a whitelisted set of columns on an order (keyed by local id)."""
    updates = {k: v for k, v in fields.items() if k in _UPDATABLE_ORDER_FIELDS}
    if not updates:
        return
    updates["updated_at"] = now()
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = order_id
    await db.execute(
        f"UPDATE trato.orders SET {set_clause} WHERE id = :id", updates
    )


async def get_order_by_local_id(order_id: str) -> Optional[Order]:
    row = await db.fetchone(
        "SELECT * FROM trato.orders WHERE id = :id", {"id": order_id}
    )
    return Order.from_row(row) if row else None


async def get_active_orders() -> list[Order]:
    """All non-terminal, non-demo orders across users (for the inbound poller)."""
    not_terminal = _sql_status_not_in_terminal()
    rows = await db.fetchall(
        f"""
        SELECT * FROM trato.orders
        WHERE demo = false AND {not_terminal}
        """,
        {},
    )
    return [Order.from_row(r) for r in rows]


async def find_order_by_trade_pubkey(trade_pubkey: str) -> Optional[Order]:
    row = await db.fetchone(
        "SELECT * FROM trato.orders WHERE trade_pubkey = :pk ORDER BY created_at DESC",
        {"pk": trade_pubkey},
    )
    return Order.from_row(row) if row else None


# --- Event / timeline log ---------------------------------------------------
async def log_event(
    user_id: str,
    order_id: Optional[str],
    direction: str,
    kind: str,
    payload: Optional[str] = None,
) -> TradeEvent:
    event = TradeEvent(
        id=urlsafe_short_hash(),
        order_id=order_id,
        user=user_id,
        direction=direction,
        kind=kind,
        payload=payload,
    )
    await db.execute(
        """
        INSERT INTO trato.events
            (id, order_id, "user", direction, kind, payload, created_at)
        VALUES (:id, :order_id, :user, :direction, :kind, :payload, :created_at)
        """,
        model_to_dict(event),
    )
    return event


async def get_events(user_id: str, order_id: str) -> list[TradeEvent]:
    rows = await db.fetchall(
        """
        SELECT * FROM trato.events
        WHERE "user" = :user AND order_id = :order_id
        ORDER BY created_at ASC
        """,
        {"user": user_id, "order_id": order_id},
    )
    return [TradeEvent(**r) for r in rows]


async def get_events_by_order_id(order_id: str) -> list[TradeEvent]:
    """Timeline for one order (operator dashboard — any user on instance)."""
    rows = await db.fetchall(
        """
        SELECT * FROM trato.events
        WHERE order_id = :order_id
        ORDER BY created_at ASC
        """,
        {"order_id": order_id},
    )
    return [TradeEvent(**r) for r in rows]


async def merge_order_json(order_id: str, patch: dict) -> None:
    """Merge keys into order_json for dispute metadata etc."""
    order = await get_order_by_local_id(order_id)
    if not order:
        return
    try:
        meta = json.loads(order.order_json or "{}")
    except json.JSONDecodeError:
        meta = {}
    if not isinstance(meta, dict):
        meta = {}
    meta.update(patch)
    await update_order_fields(order_id, order_json=json.dumps(meta))


async def list_instance_disputes(*, operator_pubkey: str | None = None) -> list[dict]:
    """Open disputes on this LNbits instance (demo + host-operator live trades)."""
    op_hex = (operator_pubkey or "").strip().lower()
    rows = await db.fetchall(
        """
        SELECT * FROM trato.orders
        WHERE status = 'dispute'
        ORDER BY updated_at DESC
        """,
        {},
    )
    out: list[dict] = []
    for row in rows:
        order = Order.from_row(row)
        if not order.demo:
            order_pk = (order.mostro_pubkey or "").strip().lower()
            if not op_hex or order_pk != op_hex:
                continue
        try:
            meta = json.loads(order.order_json or "{}")
        except json.JSONDecodeError:
            meta = {}
        if not isinstance(meta, dict):
            meta = {}
        out.append(
            {
                "order_id": order.id,
                "user_id": order.user,
                "demo": order.demo,
                "side": order.side,
                "role": order.role,
                "mostro_order_id": order.mostro_order_id,
                "mostro_pubkey": order.mostro_pubkey,
                "amount_sats": order.amount_sats,
                "fiat_amount": order.fiat_amount,
                "fiat_code": order.fiat_code,
                "payment_method": order.payment_method,
                "updated_at": order.updated_at,
                "dispute_taken": bool(meta.get("dispute_taken")),
                "dispute_taken_at": meta.get("dispute_taken_at"),
            }
        )
    return out
