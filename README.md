# Trato (LNbits extension)

**Client UI** for P2P Bitcoin ↔ fiat on the public Nostr order book (Mostro, RoboSats,
Peach, lnp2pbot, …). Browse live ads, practise trades in **Demo mode**, and (when
enabled) take real offers.

Install together with LNbits on a home server, Raspberry Pi, or VPS.

## What you need on this LNbits instance

| LNbits funding source | Order book (browse) | Demo trades | Live Mostro trades | Live RoboSats trades |
|----------------------|---------------------|-------------|--------------------|----------------------|
| **FakeWallet** (dev) | Yes | Yes | No | No |
| **phoenixd** | Yes | Yes | See note below | **Live** with NWC in Settings |
| **LND** or **CLN** (hold invoices) | Yes | Yes | **Live** (identity wallet pays hold invoices) | **Live** with NWC |
| **OpenNode / Blink / …** (API wallets) | Yes | Yes | No — no hold invoices | No |

**Order book** always uses Nostr relays — it does **not** depend on your Lightning
backend. **Your trades** depend on Demo vs live and on hold-invoice support.

**Order book** always uses Nostr relays — ads from **operators all over the network**,
not your Lightning backend. Demo mode never needs hold invoices.

### phoenixd on a Pi — client host, not the escrow node

Mostro **escrow runs on the operator** behind each ad (kind 38385 on the relays —
usually someone else’s `mostrod` + LND, not your Pi). Trato **reads** that book and
**routes** your trade to that operator. Your phoenixd does **not** need to hold other
people’s escrow.

What phoenixd **is** good for on a home Pi:

- **LNbits + Trato** with low ops (LSP opens inbound liquidity)
- **Live order book** and public `/trato/book`
- **Demo mode** — full practise trades, no real sats
- **Live RoboSats** — pay bonds via **NWC** (your phone wallet in Settings)

**Live Mostro** today: the operator creates the hold invoice on *their* node, but
Trato still pays it through your **LNbits identity wallet**, which must support hold
invoices (LND/CLN funding) unless Demo is on. That gate is about *your* wallet API,
not about running an operator on the Pi. Using **foreign operators only** does not
require Trato Operator or `mostrod` locally — it requires a funding path that can pay
hold invoices (LND on LNbits today; NWC for Mostro seller pay is the planned Pi-friendly
path).

**Run your own operator** (earn fees, mediate disputes): separate — needs
[Trato Operator](../trato_operator/README.md) + LND/`mostrod`, not phoenixd alone.

### How live trades fit together

```
Your phone (NWC — Phoenix, Alby, …)     →  RoboSats bonds; (planned) Mostro hold-invoice pay
This LNbits + Trato (phoenixd OK)       →  UI, identity, chat, order book
A Mostro operator on the network        →  hold invoice, settle, disputes (often not you)
```

Liquidity for trades should sit in **users’ wallets** (NWC / identity wallet), not in
a shared phoenixd float for every taker.

## Demo mode vs production (live)

| | **Demo mode ON** | **Demo mode OFF** |
|--|------------------|-------------------|
| Order book | Live relay data (network operators) | Live relay data |
| Your trades | Simulated locally (no real sats) | Real Mostro / RoboSats paths |
| Lightning invoices | Practice strings only | Real BOLT11 |
| Mainnet switch | Off (auto when Demo on) | Required for live |
| phoenixd on Pi | Book + demo + RoboSats live (NWC) | Book + RoboSats live (NWC); live Mostro needs LND identity wallet *or* Demo |

**Live Mostro:** escrow is on the **ad’s operator** (foreign or yours). **Live RoboSats:**
needs **NWC** in Settings. On-chain settlement remains demo-only.

## What Trato can take

| Platform | In Trato today |
|----------|----------------|
| **Mostro** | Full **Demo**; **live** via network operators (LND identity wallet on LNbits today) |
| **RoboSats** | **Demo** or **live** with NWC + mainnet |
| Peach, lnp2pbot, HodlHodl, … | **Browse only** — open their app to trade |

## Raspberry Pi / home server

- **LNbits + Trato + phoenixd** — sensible default: book, demo, RoboSats live with NWC.
- You do **not** need a local operator to **take** someone else’s Mostro ad — their
  operator escrows; you only need a wallet path that can pay hold invoices in live mode.
- Install **Trato Operator** + LND only if **you** want to run escrow and earn fees.

## Public pages (no login)

- **`/trato/book`** — live order book for visitors.

## Screenshots

Live order book (real Nostr ads; **DEMO** = practice trades only):

![Order book](../docs/screenshots/order-book.png)

Trade dialog — fees, timeline, chat:

![Trade dialog](../docs/screenshots/trade-dialog.png)

My trades, Identity, Settings, public book:

![My trades](../docs/screenshots/my-trades.png)

![Identity](../docs/screenshots/identity.png)

![Settings](../docs/screenshots/settings.png)

![Public order book](../docs/screenshots/public-book.png)

Full gallery: [`../README.md`](../README.md#screenshots). On GitHub releases, include
`docs/screenshots/` in the published repo so these images resolve.

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
