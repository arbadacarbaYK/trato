"""Mostro-compatible key management (NIP-06 / per-trade keys).

A Trato user has a single BIP-39 seed. From it we deterministically derive:

  - the *identity key* at index 0 (m/44'/1237'/38383'/0/0), which carries the
    user's reputation across trades, and
  - a fresh *trade key* per trade at index >= 1, so that on the relays no two
    trades are linkable to the same user ("nobody knows who did what").

The seed is the user's most sensitive secret. It is NEVER sent to the frontend
and NEVER leaves the LNbits server in plaintext (see crud.py for at-rest
encryption). This module only deals with derivation and signing.
"""

from __future__ import annotations

from dataclasses import dataclass

from nostr_sdk import Keys

from ..mostro.constants import (
    DERIVATION_CHANGE,
    IDENTITY_KEY_INDEX,
    MOSTRO_ACCOUNT,
)


def derive_keys(mnemonic: str, index: int, passphrase: str | None = None) -> Keys:
    """Derive the Mostro key pair at m/44'/1237'/38383'/0/{index}.

    `account=MOSTRO_ACCOUNT`, `typ=DERIVATION_CHANGE`, `index=index` reproduces
    Mostro's canonical derivation path via nostr-sdk's NIP-06 helper.
    """
    if index < 0:
        raise ValueError("trade key index must be >= 0")
    return Keys.from_mnemonic(
        mnemonic,
        passphrase=passphrase,
        account=MOSTRO_ACCOUNT,
        typ=DERIVATION_CHANGE,
        index=index,
    )


@dataclass
class TradeIdentity:
    """The pair of keys used in a single trade."""

    index: int
    keys: Keys

    @property
    def pubkey_hex(self) -> str:
        return self.keys.public_key().to_hex()

    @property
    def npub(self) -> str:
        return self.keys.public_key().to_bech32()


class KeyManager:
    """Derives identity and per-trade keys from one seed.

    The next trade index is tracked by the caller (persisted in the DB) and
    passed in, because trade indices MUST be strictly increasing per user for
    Mostro reputation accounting. This class never invents an index on its own.
    """

    def __init__(self, mnemonic: str, passphrase: str | None = None) -> None:
        if not mnemonic or len(mnemonic.split()) not in (12, 24):
            raise ValueError("a 12 or 24 word BIP-39 mnemonic is required")
        self._mnemonic = mnemonic
        self._passphrase = passphrase

    def identity(self) -> TradeIdentity:
        return TradeIdentity(
            index=IDENTITY_KEY_INDEX,
            keys=derive_keys(self._mnemonic, IDENTITY_KEY_INDEX, self._passphrase),
        )

    def trade_key(self, index: int) -> TradeIdentity:
        if index < 1:
            raise ValueError("trade key index must be >= 1 (0 is the identity key)")
        return TradeIdentity(
            index=index,
            keys=derive_keys(self._mnemonic, index, self._passphrase),
        )

    @property
    def identity_pubkey_hex(self) -> str:
        return self.identity().pubkey_hex
