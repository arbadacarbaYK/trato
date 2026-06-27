"""Database schema for the Trato extension (schema name: ``trato``).

Migrations run on extension load (see lnbits.core.helpers.run_migration). Each
``m###_*`` function is applied once, in order. Never edit an applied migration;
add a new one instead.
"""

from __future__ import annotations


async def m001_initial(db):
    """Settings, trading identity, local orders, and an event/audit log."""

    await db.execute(
        """
        CREATE TABLE trato.settings (
            "user" TEXT PRIMARY KEY,
            relays TEXT NOT NULL,
            mostro_pubkey TEXT,
            demo_mode BOOLEAN NOT NULL DEFAULT true,
            mainnet_enabled BOOLEAN NOT NULL DEFAULT false,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        """
    )

    await db.execute(
        """
        CREATE TABLE trato.identities (
            id TEXT PRIMARY KEY,
            "user" TEXT NOT NULL,
            wallet TEXT NOT NULL,
            encrypted_mnemonic TEXT NOT NULL,
            identity_pubkey TEXT NOT NULL,
            identity_npub TEXT NOT NULL,
            next_trade_index INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL
        );
        """
    )

    await db.execute(
        """
        CREATE TABLE trato.orders (
            id TEXT PRIMARY KEY,
            "user" TEXT NOT NULL,
            identity_id TEXT NOT NULL,
            role TEXT NOT NULL,
            side TEXT NOT NULL,
            mostro_pubkey TEXT NOT NULL,
            trade_index INTEGER NOT NULL,
            trade_pubkey TEXT NOT NULL,
            status TEXT NOT NULL,
            fiat_code TEXT NOT NULL,
            payment_method TEXT,
            amount_sats INTEGER NOT NULL DEFAULT 0,
            fiat_amount REAL,
            premium REAL NOT NULL DEFAULT 0,
            order_json TEXT NOT NULL DEFAULT '{}',
            demo BOOLEAN NOT NULL DEFAULT true,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        """
    )

    await db.execute(
        """
        CREATE TABLE trato.events (
            id TEXT PRIMARY KEY,
            order_id TEXT,
            "user" TEXT NOT NULL,
            direction TEXT NOT NULL,
            kind TEXT NOT NULL,
            payload TEXT,
            created_at INTEGER NOT NULL
        );
        """
    )


async def m002_trade_flow(db):
    """Columns the client trade engine needs to track a live trade.

    - ``mostro_order_id``: the operator-assigned order id (NIP-69 ``d`` tag),
      distinct from our local row id; this is what every message references.
    - ``peer_pubkey``: the counterpart's trade pubkey (learned from messages),
      used for the end-to-end encrypted peer chat.
    - ``buyer_invoice`` / ``hold_invoice``: the Lightning legs, kept for audit
      and so a retry never double-creates them.
    - ``last_event_at``: high-water mark so the inbound poller only processes
      operator messages newer than what we've already handled.
    """

    for column, ddl in (
        ("mostro_order_id", "TEXT"),
        ("peer_pubkey", "TEXT"),
        ("buyer_invoice", "TEXT"),
        ("hold_invoice", "TEXT"),
        ("rated", "BOOLEAN NOT NULL DEFAULT false"),
        ("last_event_at", "INTEGER NOT NULL DEFAULT 0"),
    ):
        await db.execute(f"ALTER TABLE trato.orders ADD COLUMN {column} {ddl};")


async def m003_payment_details(db):
    """Optional reusable fiat payment details, stored ENCRYPTED at rest.

    These are the user's own bank/wallet coordinates (IBAN, PayPal, etc). They
    are never part of a public order and are only ever shared into the private,
    end-to-end-encrypted per-trade chat. Stored encrypted with the same key as
    the seed so a DB dump alone never reveals them.
    """

    await db.execute(
        "ALTER TABLE trato.identities ADD COLUMN encrypted_payment_details TEXT;"
    )


async def m004_nwc_robosats_settings(db):
    """NWC connection + RoboSats coordinator / robot token (encrypted at rest)."""
    for column, ddl in (
        ("encrypted_nwc_uri", "TEXT"),
        ("robosats_coordinator", "TEXT"),
        ("encrypted_robosats_token", "TEXT"),
    ):
        await db.execute(f"ALTER TABLE trato.settings ADD COLUMN {column} {ddl};")
