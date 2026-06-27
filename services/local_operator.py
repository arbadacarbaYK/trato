"""Detect a local Trato Operator extension on the same LNbits instance."""

from __future__ import annotations

from typing import Any, Optional

from loguru import logger


async def fetch_local_operator_presence(base_url: str) -> Optional[dict[str, Any]]:
    """GET /trato_operator/api/v1/presence on this host (no auth)."""
    from .lnurlp_hints import lnbits_instance_root_url

    url = lnbits_instance_root_url(base_url) + "/trato_operator/api/v1/presence"
    try:
        import httpx

        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()
            return data if isinstance(data, dict) else None
    except Exception as exc:  # noqa: BLE001
        logger.debug(f"local operator presence unavailable: {exc}")
        return None
