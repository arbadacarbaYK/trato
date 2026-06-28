"""LNURLp extension hints for Bitcoin receive (Lightning address) profiles."""

from __future__ import annotations

from typing import Any, Optional
from urllib.parse import urlparse, urlunparse

from loguru import logger


def lnbits_instance_root_url(base_url: str) -> str:
    """LNbits host root — strip extension mount paths like ``/trato``."""
    parsed = urlparse(base_url.strip())
    path = parsed.path or ""
    for mount in ("/trato", "/trato_operator"):
        pos = path.find(mount)
        if pos >= 0:
            path = path[:pos]
            break
    return urlunparse(
        (parsed.scheme, parsed.netloc, path.rstrip("/") or "", "", "", "")
    ).rstrip("/")


def host_for_lnaddress(base_url: str) -> str:
    """Netloc used in ``username@host`` Lightning addresses on this instance."""
    parsed = urlparse(base_url.strip())
    if parsed.netloc:
        return parsed.netloc
    if parsed.path:
        return parsed.path.strip("/")
    return "localhost"


def is_local_lnaddress_host(host: str) -> bool:
    """True when a Lightning address on this host is unlikely to work off-LAN."""
    bare = (host or "").split(":")[0].lower()
    if bare in ("localhost", "127.0.0.1", "::1"):
        return True
    if bare.startswith("192.168.") or bare.startswith("10."):
        return True
    if bare.endswith(".local"):
        return True
    return False


def lightning_address_from_username(username: str, host: str) -> str:
    user = (username or "").strip().lower()
    if not user:
        raise ValueError("username required")
    return f"{user}@{host_for_lnaddress(host) if '://' in host else host}"


def lnurlp_link_admin_url(root: str, link_id: str) -> str:
    """LNbits LNURLp admin page for one pay link (``/lnurlp/link/{id}``)."""
    base = root.rstrip("/")
    lid = (link_id or "").strip()
    if lid:
        return f"{base}/lnurlp/link/{lid}"
    return f"{base}/lnurlp/"


def pick_lnurlp_addresses(
    links: list[dict[str, Any]],
    *,
    root: str,
    wallet_id: str,
    host: str,
) -> list[dict[str, str]]:
    """Build Lightning addresses from LNURLp pay links on the identity wallet."""
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for link in links:
        if not isinstance(link, dict):
            continue
        if str(link.get("wallet") or "") != str(wallet_id):
            continue
        username = (link.get("username") or "").strip()
        if not username:
            continue
        try:
            address = lightning_address_from_username(username, host)
        except ValueError:
            continue
        if address in seen:
            continue
        seen.add(address)
        link_id = str(link.get("id") or "").strip()
        out.append(
            {
                "lightning_address": address,
                "username": username,
                "link_id": link_id,
                "link_url": lnurlp_link_admin_url(root, link_id),
                "description": (link.get("description") or "").strip(),
            }
        )
    return out


def lnurlp_receive_shell(base_url: str) -> dict[str, Any]:
    """Static LNURLp links/notes before (or without) probing the extension API."""
    root = lnbits_instance_root_url(base_url)
    host = host_for_lnaddress(root)
    local_host = is_local_lnaddress_host(host)
    return {
        "extension_installed": False,
        "extension_url": root + "/lnurlp/",
        "extensions_url": root + "/extensions",
        "host": host,
        "local_host": local_host,
        "addresses": [],
        "note": (
            "Lightning addresses need a public domain. Enable the LNURLp extension "
            "on this LNbits instance and create a pay link on your Trato wallet."
        ),
    }


async def fetch_lnurlp_receive_hints(
    base_url: str,
    *,
    api_key: Optional[str] = None,
    wallet_id: str,
) -> dict[str, Any]:
    """Probe the LNURLp extension for pay links on the Trato identity wallet."""
    root = lnbits_instance_root_url(base_url)
    host = host_for_lnaddress(root)
    extensions_url = root + "/extensions"
    lnurlp_url = root + "/lnurlp/"
    local_host = is_local_lnaddress_host(host)

    empty: dict[str, Any] = lnurlp_receive_shell(base_url)
    empty["extension_url"] = lnurlp_url
    empty["extensions_url"] = extensions_url

    if not (api_key or "").strip():
        return empty

    url = root + "/lnurlp/api/v1/links"
    try:
        import httpx

        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, headers={"X-Api-Key": api_key.strip()})
    except Exception as exc:  # noqa: BLE001
        logger.debug(f"trato lnurlp hints unavailable: {exc}")
        return empty

    if resp.status_code == 404:
        empty["note"] = (
            "Install and enable the LNURLp extension on this LNbits instance, "
            "then create a pay link on your Trato wallet."
        )
        return empty

    if resp.status_code != 200:
        logger.debug(f"trato lnurlp links status {resp.status_code}")
        return empty

    try:
        payload = resp.json()
    except Exception:  # noqa: BLE001
        return empty

    links = payload if isinstance(payload, list) else []
    addresses = pick_lnurlp_addresses(
        links, root=root, wallet_id=wallet_id, host=host
    )
    primary_link_url = (
        lnurlp_link_admin_url(root, addresses[0]["link_id"])
        if addresses
        else lnurlp_url
    )

    note = empty["note"]
    if addresses:
        note = (
            "These Lightning addresses come from LNURLp on this instance. "
            "Use one tied to your Trato identity wallet."
        )
        if local_host:
            note += (
                " This host looks local — addresses may not work for sellers "
                "outside your network until you use a public domain."
            )
    elif local_host:
        note = (
            "LNURLp is available, but Lightning addresses need a public domain "
            "(not localhost or a LAN IP). Open LNURLp after your instance has "
            "a reachable hostname."
        )
    else:
        note = (
            "Open LNURLp, create a pay link on your Trato identity wallet, "
            "then pick your username@domain here."
        )

    return {
        "extension_installed": True,
        "extension_url": primary_link_url,
        "extensions_url": extensions_url,
        "host": host,
        "local_host": local_host,
        "addresses": addresses,
        "note": note,
    }


def api_key_from_request_headers(headers: Any) -> Optional[str]:
    """Reuse the LNbits admin key from the incoming Trato API request."""
    key = headers.get("X-Api-Key") if headers else None
    if key and str(key).strip():
        return str(key).strip()
    auth = (headers.get("Authorization") if headers else None) or ""
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        return token or None
    return None
