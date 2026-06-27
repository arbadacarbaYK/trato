"""Mostro transport: message envelope + NIP-59 gift wrap + NIP-44 chat.

This is the layer validated end-to-end in spike/mostro_transport_spike.py.

Wire facts that must not drift (real money depends on them):
  - A Mostro message is the compact JSON array  [message_object, signature].
  - `signature` is a BIP-340 Schnorr signature over sha256(compact(message_object)),
    produced with the sender's trade key; or null in full-privacy mode.
  - The array (as a string) is the `content` of a kind-1 rumor, which is sealed
    (kind 13, signed by the trade key) and gift-wrapped (kind 1059, signed by a
    throwaway ephemeral key) addressed to the Mostro operator pubkey.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from nostr_sdk import (
    EventBuilder,
    Event,
    Keys,
    Nip44Version,
    NostrSigner,
    PublicKey,
    UnwrappedGift,
    gift_wrap,
    nip44_decrypt,
    nip44_encrypt,
)

from ..mostro.constants import KIND_TEXT_NOTE


def compact_json(value: Any) -> str:
    """Serialize exactly as Mostro expects: compact UTF-8, no whitespace."""
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def _digest(message_obj: Any) -> bytes:
    return hashlib.sha256(compact_json(message_obj).encode("utf-8")).digest()


def build_envelope(message_obj: dict, signer: Keys | None) -> str:
    """Build the [message, signature] envelope string.

    Pass `signer=None` for full-privacy mode (signature element is null and the
    message MUST NOT carry a trade_index). Pass a trade Keys to sign in
    reputation mode.
    """
    signature = signer.sign_schnorr(_digest(message_obj)) if signer else None
    return compact_json([message_obj, signature])


def parse_envelope(envelope: str) -> tuple[dict, str | None]:
    """Return (message_obj, signature) from a Mostro envelope string."""
    decoded = json.loads(envelope)
    if not isinstance(decoded, list) or len(decoded) != 2:
        raise ValueError("invalid Mostro envelope: expected [message, signature]")
    message_obj, signature = decoded
    if not isinstance(message_obj, dict):
        raise ValueError("invalid Mostro envelope: message must be an object")
    return message_obj, signature


def verify_envelope_signature(envelope: str, expected_pubkey_hex: str) -> bool:
    """Verify the inner Schnorr signature against the expected trade pubkey.

    Uses coincurve (BIP-340) which ships transitively with the LNbits crypto
    stack. Returns False on any structural or cryptographic failure.
    """
    try:
        message_obj, signature = parse_envelope(envelope)
        if signature is None:
            return False
        from coincurve import PublicKeyXOnly

        pub = PublicKeyXOnly(bytes.fromhex(expected_pubkey_hex))
        sig = bytes.fromhex(signature)
        return bool(pub.verify(sig, _digest(message_obj)))
    except Exception:
        return False


async def wrap_to(signer_keys: Keys, receiver_pubkey_hex: str, envelope: str) -> Event:
    """Gift-wrap an envelope to a receiver (e.g. the Mostro operator).

    The seal is signed by `signer_keys` (the trade key); the outer wrap is
    signed by a fresh ephemeral key generated inside nostr-sdk, so the trader's
    identity never appears on the relays.
    """
    receiver = PublicKey.parse(receiver_pubkey_hex)
    rumor = EventBuilder.text_note(envelope).build(signer_keys.public_key())
    assert rumor.kind().as_u16() == KIND_TEXT_NOTE
    return await gift_wrap(NostrSigner.keys(signer_keys), receiver, rumor, [])


async def unwrap(receiver_keys: Keys, gift: Event) -> tuple[str, str]:
    """Unwrap a gift wrap; return (sender_pubkey_hex, envelope_string).

    `sender_pubkey_hex` is the seal author, i.e. the counterpart's trade key.
    """
    unwrapped: UnwrappedGift = await UnwrappedGift.from_gift_wrap(
        NostrSigner.keys(receiver_keys), gift
    )
    return unwrapped.sender().to_hex(), unwrapped.rumor().content()


def chat_encrypt(sender_keys: Keys, receiver_pubkey_hex: str, plaintext: str) -> str:
    """NIP-44 v2 encrypt for the direct peer-to-peer trade chat."""
    return nip44_encrypt(
        sender_keys.secret_key(),
        PublicKey.parse(receiver_pubkey_hex),
        plaintext,
        Nip44Version.V2,
    )


def chat_decrypt(receiver_keys: Keys, sender_pubkey_hex: str, payload: str) -> str:
    """NIP-44 decrypt for the direct peer-to-peer trade chat."""
    return nip44_decrypt(
        receiver_keys.secret_key(),
        PublicKey.parse(sender_pubkey_hex),
        payload,
    )
