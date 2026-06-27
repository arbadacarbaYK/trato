"""At-rest encryption for the user's Nostr trading seed.

The BIP-39 mnemonic is the most sensitive secret Trato holds: whoever has it can
sign trades and (with reputation mode) move the user's escrow. We therefore:

  - encrypt it at rest with AES-256-CBC (LNbits' bundled ``AESCipher``),
  - keep the encryption key in a 0600 file inside the LNbits data folder, never
    in the database next to the ciphertext, and
  - never serialize the plaintext (or the key) to the frontend.

This is defence-in-depth: a leaked DB dump alone does not reveal seeds.
"""

from __future__ import annotations

import os
import secrets
from pathlib import Path

from lnbits.settings import settings
from lnbits.utils.crypto import AESCipher

_KEY_FILENAME = "trato_secret.key"


def _key_path() -> Path:
    return Path(settings.lnbits_data_folder, _KEY_FILENAME)


def _load_or_create_key() -> str:
    path = _key_path()
    if path.is_file():
        return path.read_text().strip()

    key = secrets.token_hex(32)  # 256-bit
    # Write atomically with restrictive perms before anyone else can read it.
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        os.write(fd, key.encode())
    finally:
        os.close(fd)
    return key


def _cipher() -> AESCipher:
    return AESCipher(_load_or_create_key())


def encrypt_secret(plaintext: str) -> str:
    return _cipher().encrypt(plaintext.encode())


def decrypt_secret(ciphertext: str) -> str:
    return _cipher().decrypt(ciphertext)
