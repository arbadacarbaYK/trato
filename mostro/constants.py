"""Canonical Mostro protocol constants.

Sources:
  - NIP-69 P2P order events: https://github.com/nostr-protocol/nips/blob/master/69.md
  - Mostro protocol: https://mostro.network/protocol/
  - Mostro key management: https://mostro.network/protocol/key_management.html

IMPORTANT (real money): these constants define wire-level interoperability with
the live Mostro network. Do not change them to "look nicer" - they must match
the network exactly. The Action set is verified against mostro-core during the
protocol port (see mostro/protocol.py).
"""

from __future__ import annotations

# --- Protocol version -------------------------------------------------------
# Mostro message envelope version. We refuse to act on messages from a newer
# protocol than we understand (fail-safe), to avoid mishandling money flows.
PROTOCOL_VER = 1

# --- Nostr event kinds ------------------------------------------------------
KIND_METADATA = 0          # operator profile (NIP-01)
KIND_DELETE = 5            # NIP-09 deletion request
KIND_TEXT_NOTE = 1         # rumor inner kind inside a gift wrap (NIP-59)
KIND_SEAL = 13             # sealed envelope inside a gift wrap (NIP-59)
KIND_GIFT_WRAP = 1059      # relay-visible NIP-59 envelope
KIND_RELAY_LIST = 10002    # operator relay list (NIP-65)
KIND_DEV_FEE_AUDIT = 8383  # transparent dev-fee audit event
KIND_EXCHANGE_RATES = 30078  # replaceable BTC/fiat rates
KIND_ORDER = 38383         # addressable P2P order book event (NIP-69)
KIND_RATING = 38384        # addressable reputation snapshot
KIND_INFO = 38385          # addressable operator/instance info
KIND_DISPUTE = 38386       # addressable dispute publication

# `z` tag document values that pair with the addressable kinds above.
Z_ORDER = "order"
Z_RATING = "rating"
Z_INFO = "info"
Z_DISPUTE = "dispute"

# --- BIP-44 / NIP-06 trade-key derivation -----------------------------------
# Path: m/44'/1237'/38383'/0/{index}
#   index 0     -> permanent identity key (carries reputation)
#   index >= 1  -> single-use trade key (privacy: one fresh key per trade)
BIP44_PURPOSE = 44
NOSTR_COIN_TYPE = 1237        # NIP-06
MOSTRO_ACCOUNT = 38383        # == KIND_ORDER
DERIVATION_CHANGE = 0
IDENTITY_KEY_INDEX = 0

# --- Order taxonomy ---------------------------------------------------------
ORDER_KIND_BUY = "buy"        # maker buys BTC on the wire (taker sells)
ORDER_KIND_SELL = "sell"      # maker sells BTC on the wire (taker buys)
ORDER_KINDS = (ORDER_KIND_BUY, ORDER_KIND_SELL)

# Order statuses as published in the `s` tag of kind 38383 and in messages.
STATUS_PENDING = "pending"
STATUS_CANCELED = "canceled"
STATUS_IN_PROGRESS = "in-progress"
STATUS_SUCCESS = "success"
STATUS_EXPIRED = "expired"
STATUS_ACTIVE = "active"
STATUS_FIAT_SENT = "fiat-sent"
STATUS_SETTLED_HOLD_INVOICE = "settled-hold-invoice"
STATUS_WAITING_BUYER_INVOICE = "waiting-buyer-invoice"
STATUS_WAITING_PAYMENT = "waiting-payment"
STATUS_DISPUTE = "dispute"
STATUS_COMPLETED_BY_ADMIN = "completed-by-admin"
STATUS_CANCELED_BY_ADMIN = "canceled-by-admin"

# Statuses an order may legitimately be in while sitting on the public book.
PUBLIC_BOOK_STATUSES = (STATUS_PENDING,)

# --- Network / layer (settlement) tags --------------------------------------
NETWORK_MAINNET = "mainnet"
NETWORK_TESTNET = "testnet"
NETWORK_SIGNET = "signet"
NETWORKS = (NETWORK_MAINNET, NETWORK_TESTNET, NETWORK_SIGNET)

LAYER_ONCHAIN = "onchain"
LAYER_LIGHTNING = "lightning"

# Platform identifier published in the `y` tag. Trato participates in the
# Mostro network, so the interoperable value is "mostro"; we MAY add a second
# element with our instance name.
PLATFORM_TAG = "mostro"

# --- Money unit boundary ----------------------------------------------------
# Mostro wire protocol speaks satoshis. LNbits internal APIs speak millisats.
# Convert ONLY at the boundary; never mix. See nostr/transport.py + escrow.
MSAT_PER_SAT = 1000
