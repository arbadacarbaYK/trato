# Trato (LNbits extension)

**Client UI** for P2P Bitcoin ↔ fiat on the public Nostr order book (Mostro, RoboSats,
Peach, lnp2pbot, …). Browse live ads, practise trades in **Demo mode**, and (when
enabled) take real offers.

Install together with LNbits on a home server, Raspberry Pi, or VPS.

## What you need on this LNbits instance

| LNbits funding source | Order book (browse) | Demo trades | Live Mostro trades | Live RoboSats trades |
|----------------------|---------------------|-------------|--------------------|----------------------|
| **FakeWallet** (dev) | Yes | Yes | No | No |
| **phoenixd** | Yes | Yes | No — no hold invoices | NWC only (when live path enabled) |
| **LND** or **CLN** (hold invoices) | Yes | Yes | Yes — when live trading is enabled in build | NWC only (when live path enabled) |
| **OpenNode / Blink / …** (API wallets) | Yes | Yes | No — no hold invoices | No |

**Order book** always uses Nostr relays — it does **not** depend on your Lightning
backend. **Your trades** depend on Demo vs live and on hold-invoice support.

### Why phoenixd is not enough for live Mostro

Mostro escrow uses **hold invoices**: the seller’s sats are **locked** until they
release Bitcoin after fiat is confirmed. phoenixd supports normal pay/receive only
(**no hold invoices**). Trato checks this at runtime (`Settings` shows a warning).

That does **not** mean phoenixd is useless on a Pi — it is fine for hosting Trato,
LNbits wallets, and **Demo mode**. For live P2P escrow you need **LND/CLN** on the
**operator** node (see [Trato Operator README](../trato_operator/README.md)), or
you trade through **someone else’s** Mostro operator on the network.

### Intended live setup (future / partial today)

```
Your phone (Phoenix, Alby, … via NWC)  →  pay bonds / hold invoices / receive sats
This LNbits + Trato                   →  UI, identity, chat, order book
A Mostro operator (LND + mostrod)     →  creates hold invoices, settles on release
```

Liquidity for trades should sit in **users’ own wallets** (NWC), not one shared
phoenixd on the server.

## Demo mode vs production (live)

| | **Demo mode ON** | **Demo mode OFF** |
|--|------------------|-------------------|
| Order book | Live relay data | Live relay data |
| Your trades | Simulated locally (no real sats) | Real Mostro/RoboSats path (v0.2+) |
| Lightning invoices | Practice strings only | Real BOLT11 via LND hold invoices |
| Mainnet switch | Optional | Required for live |
| phoenixd on Pi | **Recommended** for learning | Browse + NWC (RoboSats); Mostro needs LND |

**Live (v0.2+):** turn **Demo off**, enable **mainnet**, use **LND hold invoices**
for Mostro escrow. **RoboSats** live takes need **NWC** in Settings. On-chain
settlement remains demo-only.

## What Trato can take

| Platform | In Trato today |
|----------|----------------|
| **Mostro** | Full **Demo** flow; **live** with mainnet + LND hold invoices (v0.2+) |
| **RoboSats** | **Demo** or **live** with NWC + mainnet |
| Peach, lnp2pbot, HodlHodl, … | **Browse only** — open their app to trade |

## Raspberry Pi / home server

- **LNbits + Trato + phoenixd** — good default: light, auto-inbound liquidity via
  ACINQ LSP, Demo trades, public book at `/trato/book`.
- Turn **Demo mode on** in Settings until you run an LND-backed operator or NWC
  live client is configured.
- Do **not** expect the Pi’s phoenixd to escrow other people’s Mostro trades.

## Public pages (no login)

- **`/trato/book`** — live order book for visitors.

## Health check

`GET /trato/api/v1/health` (wallet admin key) reports relay sync, escrow backend
(`hold_invoices_supported`, `funding_source`), and demo vs live trade counts.

## Bitcoin receive (Lightning address)

When you **buy** Bitcoin, sellers need where to send sats. In **Identity → Bitcoin
receive**, add a Lightning address (or on-chain / NWC profile).

If you do not use an external address (Alby, etc.), enable the **LNURLp** extension
on the same LNbits instance, create a pay link on your **Trato identity wallet**,
then Trato offers **Open LNURLp** and **Use username@your-domain** in the editor
(`GET /trato/api/v1/identity/payment-details` → `lnurlp_receive`). Lightning
addresses need a **public hostname** — not localhost or a LAN IP.

## More detail

- Developers: [`../SETUP_INSTRUCTIONS.md`](../SETUP_INSTRUCTIONS.md)
- Wallets & operator: [`../docs/OPERATOR_AND_WALLETS.md`](../docs/OPERATOR_AND_WALLETS.md)
- Operator extension: [`../trato_operator/README.md`](../trato_operator/README.md)
