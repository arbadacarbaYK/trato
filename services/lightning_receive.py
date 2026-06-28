"""Lightning receive address choices (LNURLp + Nostr lud16)."""

from __future__ import annotations

from typing import Any


def normalize_lightning_address(value: str | None) -> str:
    return (value or "").strip().lower()


def build_lightning_receive_choices(
    lnurlp: dict[str, Any] | None,
    *,
    lud16: str | None,
) -> list[dict[str, str]]:
    """Merge LNURLp pay links and Nostr kind-0 ``lud16`` for the receive UI."""
    choices: list[dict[str, str]] = []
    by_address: dict[str, dict[str, str]] = {}

    for addr in (lnurlp or {}).get("addresses") or []:
        if not isinstance(addr, dict):
            continue
        la = normalize_lightning_address(addr.get("lightning_address"))
        if not la:
            continue
        detail = (addr.get("description") or "").strip()
        by_address[la] = {
            "lightning_address": la,
            "source": "lnurlp",
            "source_label": "LNURLp on this instance",
            "detail": detail,
            "link_url": (addr.get("link_url") or "").strip(),
        }

    lud = normalize_lightning_address(lud16)
    if lud:
        if lud in by_address:
            row = by_address[lud]
            row["source"] = "both"
            row["source_label"] = "LNURLp and Nostr profile"
            if not row.get("detail"):
                row["detail"] = "Same address on LNURLp and your Nostr profile"
        else:
            by_address[lud] = {
                "lightning_address": lud,
                "source": "nostr_profile",
                "source_label": "Nostr profile (lud16)",
                "detail": "From your kind-0 profile on relays",
            }

    choices.extend(by_address.values())
    return choices
