"""Small async JSON GET helper — httpx when available, stdlib fallback otherwise.

LNbits extensions must not add runtime dependencies. Coordinators and federation
are fetched over HTTPS; this module works whether or not httpx is installed.
"""

from __future__ import annotations

import asyncio
import json
import ssl
import urllib.error
import urllib.request
from typing import Any


def _urllib_get_json(url: str, *, timeout: float) -> Any:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "Trato/1.0"},
    )
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        raw = resp.read()
    return json.loads(raw.decode("utf-8"))


async def get_json(url: str, *, timeout: float = 10.0) -> Any | None:
    """GET *url* and parse JSON. Returns None on any failure."""
    try:
        import httpx

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
    except ImportError:
        pass
    except Exception:
        pass

    try:
        return await asyncio.to_thread(_urllib_get_json, url, timeout=timeout)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None
    except Exception:
        return None
