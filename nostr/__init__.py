"""Pure (LNbits-independent) Nostr transport + key management for Trato.

Wraps the `nostr-sdk` library that ships with LNbits to implement Mostro's
key derivation (NIP-06), gift-wrap transport (NIP-59), and direct chat (NIP-44).
No new dependencies are introduced.
"""
