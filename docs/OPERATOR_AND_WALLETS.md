# Operator mode, phoenixd, NWC, and fees

## Goal (from project plan)

Trato ships in two roles:

1. **Client** (today) — trade on the global Mostro book via external operators.
2. **Operator** (Phase 4) — run `mostrod` on this LNbits instance, publish kind
   38385 info, earn the **trade fee** (not just LNbits install/enable sats).

You cannot stack a second trade fee as a pure client: the operator that creates
the hold invoice already publishes its `fee` tag (~0.6% default). Instance revenue
from trades requires **your** operator.

## phoenixd as the instance Lightning backend

**phoenixd** (headless Phoenix) is a good fit for the **operator node**:

- Opens inbound liquidity via ACINQ LSP when needed (no manual channel management
  for every user).
- Suited to **one** operational node (your Mostro operator), not per-user nodes.

Architecture:

```
Users (NWC wallets)          Your LNbits + mostrod + phoenixd
     |                                |
     |  pay hold / receive invoice     |  creates hold invoices, settles, pays buyer
     +------------------------------->|
```

- **Users** should pay/receive through **NWC** (their Phoenix, Alby, etc.) so your
  phoenixd channels are not consumed by every taker/maker.
- **phoenixd** backs **operator** escrow volume and payout retries.

Hold invoices for Mostro still require an LND-compatible hold-invoice API today;
confirm phoenixd/LNbits funding integration before mainnet operator launch.

## Trade fee on your operator

When Phase 4 is live:

- Set fee in `mostrod` settings (published as kind 38385 `fee`, e.g. `0.006`).
- Trato UI already reads that tag and shows **escrow fee estimates** on cards and
  in the take dialog.
- Optional small **premium** on top is a product choice, but must be disclosed in
  the 38385 `fee` tag — not hidden.

## NWC (future live client mode)

**Not implemented in Trato yet** — no Settings UI, no runtime dependency.

**Do not** require the LNbits NWC extension on the host for Trato to work today.
Demo mode uses fake invoices; live take is still gated (`501` / demo-only).

When live client mode ships, the plan is:

1. User pastes or connects an **`nwc://` URI** from their own wallet app (Phoenix,
   Alby, etc.) in Trato Identity/Settings — direct NWC protocol, not necessarily
   the LNbits NWC extension.
2. Live trades: pay operator **hold invoices** / create receive invoices via that
   connection so routing uses **the user's** channels, not a shared LNbits node.
3. Keep LNbits Identity wallet path for **demo** only, or strict caps until NWC
   is tested end-to-end.

Until then, verify Trato with **Demo mode on** — no NWC install needed.

## On-chain

Trato supports **on-chain settlement in demo** (`settlement_layer: onchain`) and
book filtering. Live on-chain on the public Mostro network depends on operator
support; instance operator mode can add on-chain escrow as a Trato-native flow
later (address + confirmations), separate from Lightning hold invoices.

## Public order book

- **`/trato/book`** — standalone page (no LNbits login). Uses public JSON APIs only.
- Share on clearnet or Tor; same relay data as the logged-in app.
