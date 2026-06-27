"""Pubkey normalization helpers."""

from __future__ import annotations


def normalize_pubkey(value: str | None) -> str | None:
    """Return lowercase 64-char hex pubkey, accepting npub bech32."""
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None
    if raw.lower().startswith("npub"):
        try:
            from nostr_sdk import PublicKey

            return PublicKey.parse(raw).to_hex().lower()
        except Exception:  # noqa: BLE001
            return None
    hexed = raw.lower()
    if len(hexed) == 64 and all(c in "0123456789abcdef" for c in hexed):
        return hexed
    return None


def hex_to_npub(value: str | None) -> str | None:
    """Encode a hex pubkey (or pass through npub) for human-facing links."""
    if not value:
        return None
    raw = value.strip()
    if raw.lower().startswith("npub"):
        return raw
    hexed = normalize_pubkey(raw)
    if not hexed:
        return None
    try:
        from nostr_sdk import PublicKey

        return PublicKey.parse(hexed).to_bech32()
    except Exception:  # noqa: BLE001
        return None


def njump_profile_url(value: str | None) -> str | None:
    """Njump profile page for a hex pubkey or npub."""
    npub = hex_to_npub(value)
    return f"https://njump.me/{npub}" if npub else None
