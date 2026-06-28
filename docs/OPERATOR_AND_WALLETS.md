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

## NWC (live client mode)

**Shipped in Trato 0.2.30+** — Settings → **NWC URI** (encrypted at rest).

**Do not** require the LNbits NWC extension on the host. Trato speaks NIP-47
directly to the user's wallet relay.

1. User pastes an **`nwc://` URI** from Phoenix, Alby, etc.
2. **Live Mostro (Lightning):** pay operator hold invoices and create receive
   invoices via NWC (`NwcTradeIO`) instead of the LNbits identity wallet when NWC
   is configured.
3. **Live RoboSats:** pay taker bond, seller escrow, and submit buyer invoices via
   NWC; poll coordinator REST for status; forward confirm/dispute/cancel when
   possible. Coordinator **chat** may still require the RoboSats web UI.
4. Without NWC, Mostro live can fall back to an **LND-type LNbits identity wallet**
   when hold invoices are supported.

## On-chain

Trato supports **on-chain settlement in demo** and **live take** when the book row
includes `onchain`, mainnet is on, and NWC or LND gating passes. The Nostr take is
sent to the operator; users share on-chain receive addresses in chat for the
Bitcoin leg after fiat is confirmed.

## Public order book

- **`/trato/book`** — standalone page (no LNbits login). Uses public JSON APIs only.
- Share on clearnet or Tor; same relay data as the logged-in app.
