"""Structured fiat payment profiles for identity + trade flows.

Stored encrypted as JSON in ``identities.encrypted_payment_details``. Legacy
plain-text blobs are still accepted and surfaced as a single "other" profile.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional
from urllib.parse import quote, urlencode

PROFILE_VERSION = 1
MAX_PROFILES = 8
MAX_FIELD_LEN = 200

# ISO 3166-1 alpha-2 codes that issue IBANs in the SEPA area (approximate).
SEPA_IBAN_COUNTRIES = frozenset(
    {
        "AD", "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
        "FR", "GB", "GI", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU",
        "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS",
        "SE", "SI", "SK", "SM", "VA", "XK",
    }
)

COUNTRY_NAMES: dict[str, str] = {
    "AD": "Andorra",
    "AT": "Austria",
    "BE": "Belgium",
    "BG": "Bulgaria",
    "CH": "Switzerland",
    "CY": "Cyprus",
    "CZ": "Czechia",
    "DE": "Germany",
    "DK": "Denmark",
    "EE": "Estonia",
    "ES": "Spain",
    "FI": "Finland",
    "FR": "France",
    "GB": "United Kingdom",
    "GI": "Gibraltar",
    "GR": "Greece",
    "HR": "Croatia",
    "HU": "Hungary",
    "IE": "Ireland",
    "IS": "Iceland",
    "IT": "Italy",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "LV": "Latvia",
    "MC": "Monaco",
    "MD": "Moldova",
    "ME": "Montenegro",
    "MK": "North Macedonia",
    "MT": "Malta",
    "NL": "Netherlands",
    "NO": "Norway",
    "PL": "Poland",
    "PT": "Portugal",
    "RO": "Romania",
    "RS": "Serbia",
    "SE": "Sweden",
    "SI": "Slovenia",
    "SK": "Slovakia",
    "SM": "San Marino",
    "VA": "Vatican City",
    "XK": "Kosovo",
    # Common mobile-money markets (optional country on M-Pesa / mobile money profiles).
    "KE": "Kenya",
    "TZ": "Tanzania",
    "UG": "Uganda",
    "RW": "Rwanda",
    "NG": "Nigeria",
    "GH": "Ghana",
    "ZM": "Zambia",
    "MW": "Malawi",
    "MZ": "Mozambique",
    "ET": "Ethiopia",
    "SN": "Senegal",
    "CI": "Côte d'Ivoire",
    "CM": "Cameroon",
    "BF": "Burkina Faso",
    "BJ": "Benin",
    "TG": "Togo",
    "ML": "Mali",
    "NE": "Niger",
    "CD": "DR Congo",
    "CG": "Congo",
    "GA": "Gabon",
    "MG": "Madagascar",
    "LS": "Lesotho",
    "SZ": "Eswatini",
    "BW": "Botswana",
    "NA": "Namibia",
    "ZA": "South Africa",
}

MOBILE_MONEY_COUNTRIES = frozenset(
    {
        "KE", "TZ", "UG", "RW", "NG", "GH", "ZM", "MW", "MZ", "ET",
        "SN", "CI", "CM", "BF", "BJ", "TG", "ML", "NE", "CD", "CG",
        "GA", "MG", "LS", "SZ", "BW", "NA", "ZA",
    }
)

# Approximate map centres for OSM picker (lat, lon, zoom).
COUNTRY_MAP_CENTER: dict[str, tuple[float, float, int]] = {
    "DE": (51.16, 10.45, 6),
    "AT": (47.52, 14.55, 7),
    "CH": (46.82, 8.23, 7),
    "FR": (46.23, 2.21, 6),
    "NL": (52.13, 5.29, 7),
    "BE": (50.50, 4.47, 7),
    "ES": (40.46, -3.75, 6),
    "IT": (41.87, 12.57, 6),
    "PL": (51.92, 19.15, 6),
    "GB": (55.38, -3.44, 6),
    "US": (39.83, -98.58, 4),
}

DEFAULT_MAP_CENTER = (50.0, 10.0, 5)


def osm_map_url(lat: float, lon: float, *, zoom: int = 15) -> str:
    return f"https://www.openstreetmap.org/#map={zoom}/{lat}/{lon}"


def osm_country_picker_url(country: str | None) -> str:
    code = (country or "").strip().upper()
    lat, lon, zoom = COUNTRY_MAP_CENTER.get(code, DEFAULT_MAP_CENTER)
    return osm_map_url(lat, lon, zoom=zoom)


def parse_osm_coordinates(url: str) -> tuple[Optional[float], Optional[float]]:
    """Extract lat/lon from common OpenStreetMap URL shapes."""
    text = (url or "").strip()
    if not text:
        return None, None
    patterns = [
        r"#map=\d+/([-\d.]+)/([-\d.]+)",
        r"[?&]mlat=([-\d.]+)[^&]*(?:&|#).*?[&?]mlon=([-\d.]+)",
        r"/(?:search|node|way|relation)/[^?#]*/?([-\d.]+)/([-\d.]+)",
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            try:
                return float(m.group(1)), float(m.group(2))
            except ValueError:
                continue
    return None, None


def meetup_map_url(profile: dict) -> Optional[str]:
    p = normalize_profile(profile)
    link = (p.get("map_url") or "").strip()
    if link and "openstreetmap" in link.lower():
        return link
    if p.get("lat") and p.get("lon"):
        try:
            return osm_map_url(float(p["lat"]), float(p["lon"]))
        except ValueError:
            return None
    return None


def format_meetup_time(unix_ts: int, timezone: str | None) -> str:
    """Human line for chat; timezone is IANA hint for the counterparty."""
    from datetime import datetime, timezone as tz

    dt = datetime.fromtimestamp(unix_ts, tz=tz.utc)
    base = dt.strftime("%Y-%m-%d %H:%M UTC")
    if timezone:
        return f"{base} (meetup timezone: {timezone})"
    return base

# type -> (display label, fields used in UI)
PAYMENT_TYPE_SCHEMA: dict[str, dict[str, Any]] = {
    "sepa": {
        "label": "SEPA bank transfer",
        "fields": ["account_name", "country", "iban", "bic", "bank_name"],
        "method_name": "SEPA",
        "description": (
            "Standard SEPA credit transfer (usually by next business day). "
            "Also matches orders listed as “Bank transfer” on the book."
        ),
    },
    "sepa_instant": {
        "label": "SEPA Instant",
        "fields": ["account_name", "country", "iban", "bic", "bank_name"],
        "method_name": "SEPA Instant",
        "description": (
            "SEPA Instant (SCT Inst) — seconds if both banks support it. "
            "Works cross-border in the SEPA zone, but many banks only offer "
            "instant to same-country IBANs; confirm in your banking app."
        ),
    },
    "bank_transfer": {
        "label": "Bank transfer",
        "fields": ["account_name", "country", "iban", "bic", "bank_name", "account_number"],
        "method_name": "Bank transfer",
    },
    "revolut": {
        "label": "Revolut",
        "fields": ["account_name", "username", "phone"],
        "method_name": "Revolut",
    },
    "wise": {
        "label": "Wise",
        "fields": ["account_name", "email", "username"],
        "method_name": "Wise",
    },
    "paypal": {
        "label": "PayPal",
        "fields": ["account_name", "email", "payment_link", "notes"],
        "method_name": "PayPal",
    },
    "bizum": {
        "label": "Bizum",
        "fields": ["account_name", "phone"],
        "method_name": "Bizum",
    },
    "strike": {
        "label": "Strike",
        "fields": ["account_name", "username"],
        "method_name": "Strike",
    },
    "cash_app": {
        "label": "Cash App",
        "fields": ["account_name", "username"],
        "method_name": "Cash App",
    },
    "venmo": {
        "label": "Venmo",
        "fields": ["account_name", "username"],
        "method_name": "Venmo",
    },
    "zelle": {
        "label": "Zelle",
        "fields": ["account_name", "email", "phone"],
        "method_name": "Zelle",
    },
    "mpesa": {
        "label": "M-Pesa",
        "fields": [
            "account_name",
            "phone",
            "till_number",
            "paybill",
            "country",
            "notes",
        ],
        "method_name": "M-Pesa",
        "description": (
            "Safaricom M-Pesa (Kenya and other markets). Share phone, Till, "
            "or Paybill after you take a trade — never on the public book."
        ),
    },
    "mobile_money": {
        "label": "Other mobile wallet (Airtel, MTN, Orange)",
        "fields": ["account_name", "phone", "provider", "country", "notes"],
        "method_name": "Other mobile wallet (Airtel, MTN, Orange)",
        "description": (
            "Phone-based wallets other than M-Pesa — e.g. Airtel Money, "
            "MTN Mobile Money, or Orange Money. Set the provider name; "
            "book tags usually use the provider name, not this label."
        ),
    },
    "cash_in_person": {
        "label": "Cash in person (meetup)",
        "fields": [
            "place_label",
            "country",
            "map_url",
            "timezone",
            "notes",
        ],
        "method_name": "Cash in person",
    },
    "cash_by_mail": {
        "label": "Cash by mail",
        "fields": ["account_name", "country", "notes"],
        "method_name": "Cash by mail",
    },
    "usdt": {
        "label": "USDT",
        "fields": ["account_name", "wallet_address", "network", "notes"],
        "method_name": "USDT",
        "description": "Tether (USDT) — on-chain or agreed network.",
    },
    "usdc": {
        "label": "USDC",
        "fields": ["account_name", "wallet_address", "network", "notes"],
        "method_name": "USDC",
        "description": "USD Coin (USDC) — on-chain or agreed network.",
    },
    "stablecoin": {
        "label": "Stablecoin",
        "fields": [
            "account_name",
            "wallet_address",
            "lightning_address",
            "network",
            "notes",
        ],
        "method_name": "Stablecoin",
        "description": (
            "USD stablecoins on Lightning (e.g. L-USDt) or other chains — "
            "address or Lightning details shared after take."
        ),
    },
    "other": {
        "label": "Other",
        "fields": ["account_name", "notes"],
        "method_name": "Other",
    },
    "lightning_address": {
        "label": "Lightning address (receive)",
        "fields": ["account_name", "lightning_address", "notes"],
        "method_name": "Lightning",
        "description": (
            "Where you receive sats — Lightning address (you@domain.com) or "
            "LNURL-pay. Shared with your trade partner when you buy Bitcoin."
        ),
    },
    "onchain_btc": {
        "label": "On-chain Bitcoin (receive)",
        "fields": ["account_name", "btc_address", "notes"],
        "method_name": "On-chain",
        "description": (
            "Bitcoin address for on-chain settlement (bc1…, 1…, or 3…). "
            "Shared with the seller when you buy Bitcoin."
        ),
    },
    "nwc_wallet": {
        "label": "NWC wallet (receive via invoice)",
        "fields": ["account_name", "notes"],
        "method_name": "NWC",
        "description": (
            "Receive sats via invoices from your NWC wallet in Settings — "
            "the connection URI stays in Settings, not in this profile."
        ),
    },
}


BITCOIN_RECEIVE_TYPES = frozenset({"lightning_address", "onchain_btc", "nwc_wallet"})
FIAT_PAYMENT_TYPES = frozenset(PAYMENT_TYPE_SCHEMA.keys()) - BITCOIN_RECEIVE_TYPES


def _clean(value: Any, limit: int = MAX_FIELD_LEN) -> str:
    text = (str(value) if value is not None else "").strip()
    if len(text) > limit:
        text = text[:limit]
    return text


def iban_country(iban: str) -> Optional[str]:
    """ISO country code from IBAN prefix (first two letters)."""
    code = (iban or "").replace(" ", "").upper()[:2]
    if len(code) == 2 and code.isalpha():
        return code
    return None


def _pm_compact(pm: str) -> str:
    return re.sub(r"[\s\-_]", "", (pm or "").strip().lower())


def is_stablecoin_pm(pm: str) -> bool:
    """Whether a book payment-method tag is a USD stablecoin rail."""
    compact = _pm_compact(pm)
    if not compact:
        return False
    return any(
        token in compact
        for token in ("usdt", "usdc", "lusdt", "lusd", "dai", "pyusd", "busd")
    )


def classify_pm_tag(pm: str) -> Optional[str]:
    """Map a public-order ``pm`` tag to a Trato payment profile type, if any."""
    s = (pm or "").strip().lower()
    if not s:
        return None
    compact = _pm_compact(pm)
    if "lusdt" in compact or compact.startswith("lusd"):
        return "stablecoin"
    if "usdt" in compact:
        return "usdt"
    if "usdc" in compact:
        return "usdc"
    if is_stablecoin_pm(pm):
        return "stablecoin"
    if "face" in s or "in person" in s or s in ("cash in person", "cash"):
        return "cash_in_person"
    if "cash by mail" in s or "by mail" in s:
        return "cash_by_mail"
    if "sepa" in s or "bank transfer" in s or s in ("bank transfer", "bank"):
        if "instant" in s or "echtzeit" in s or "sct inst" in s or "realtime" in s:
            return "sepa_instant"
        return "sepa"
    if compact == "mpesa" or "mpesa" in compact:
        return "mpesa"
    if (
        "mobile money" in s
        or "airtel money" in s
        or "airtel" in s
        or "mtn mobile" in s
        or "mtn momo" in s
        or "orange money" in s
        or s in ("momo", "mobilemoney")
    ):
        return "mobile_money"
    for ptype, schema in PAYMENT_TYPE_SCHEMA.items():
        name = (schema.get("method_name") or "").lower()
        if name and name in s:
            return ptype
    return None


def profile_matches_pm(profile: dict, pm: str) -> bool:
    """Whether a saved profile can satisfy an order's payment-method tag."""
    p = normalize_profile(profile)
    pm_kind = classify_pm_tag(pm)
    ptype = p["type"]
    if ptype in ("sepa", "sepa_instant", "bank_transfer"):
        if pm_kind == "sepa_instant":
            return ptype == "sepa_instant"
        if pm_kind == "sepa":
            return ptype in ("sepa", "sepa_instant", "bank_transfer")
        if "bank" in (pm or "").lower():
            return ptype in ("sepa", "bank_transfer", "sepa_instant")
        return False
    if ptype in ("usdt", "usdc", "stablecoin") and pm_kind in (
        "usdt",
        "usdc",
        "stablecoin",
    ):
        return ptype == pm_kind or (
            pm_kind == "stablecoin" and ptype in ("usdt", "usdc", "stablecoin")
        )
    if is_stablecoin_pm(pm) and ptype in ("usdt", "usdc", "stablecoin"):
        return True
    if ptype in ("mpesa", "mobile_money") and pm_kind in ("mpesa", "mobile_money"):
        if ptype == pm_kind:
            return True
        # Generic "mobile money" tag can match either saved mobile wallet type.
        s = (pm or "").strip().lower()
        return "mobile money" in s and ptype in ("mpesa", "mobile_money")
    if pm_kind:
        return ptype == pm_kind
    schema = PAYMENT_TYPE_SCHEMA.get(ptype, {})
    name = (schema.get("method_name") or p.get("label") or "").lower()
    return bool(name) and name in (pm or "").lower()


def profile_country_label(profile: dict) -> str:
    p = normalize_profile(profile)
    code = p.get("country") or iban_country(p.get("iban") or "")
    if not code:
        return ""
    return COUNTRY_NAMES.get(code, code)


def normalize_profile(raw: dict) -> dict:
    ptype = _clean(raw.get("type") or "other", 32).lower()
    if ptype not in PAYMENT_TYPE_SCHEMA:
        ptype = "other"
    profile = {
        "id": _clean(raw.get("id") or "", 40) or None,
        "type": ptype,
        "label": _clean(raw.get("label") or PAYMENT_TYPE_SCHEMA[ptype]["label"], 80),
        "account_name": _clean(raw.get("account_name")),
        "iban": _clean(raw.get("iban")).replace(" ", "").upper(),
        "bic": _clean(raw.get("bic")).upper(),
        "bank_name": _clean(raw.get("bank_name")),
        "account_number": _clean(raw.get("account_number")),
        "email": _clean(raw.get("email")),
        "username": _clean(raw.get("username")).lstrip("@"),
        "phone": _clean(raw.get("phone")),
        "till_number": _clean(raw.get("till_number"), 32),
        "paybill": _clean(raw.get("paybill"), 32),
        "provider": _clean(raw.get("provider"), 80),
        "notes": _clean(raw.get("notes"), 500),
        "reference_hint": _clean(raw.get("reference_hint"), 80),
        "payment_link": _clean(raw.get("payment_link"), 500),
        "country": _clean(raw.get("country"), 2).upper(),
        "place_label": _clean(raw.get("place_label"), 120),
        "lat": _clean(raw.get("lat"), 20),
        "lon": _clean(raw.get("lon"), 20),
        "map_url": _clean(raw.get("map_url"), 500),
        "timezone": _clean(raw.get("timezone"), 64),
        "lightning_address": _clean(raw.get("lightning_address"), 200),
        "btc_address": _clean(raw.get("btc_address"), 120),
        "wallet_address": _clean(raw.get("wallet_address"), 200),
        "network": _clean(raw.get("network"), 80),
    }
    if profile["type"] == "cash_in_person":
        link = profile.get("map_url") or ""
        lat, lon = parse_osm_coordinates(link)
        if lat is not None and lon is not None:
            profile["lat"] = str(lat)
            profile["lon"] = str(lon)
        elif profile["lat"] and profile["lon"] and not link:
            try:
                profile["map_url"] = osm_map_url(
                    float(profile["lat"]), float(profile["lon"])
                )
            except ValueError:
                pass
    if not profile["country"] and profile["iban"]:
        profile["country"] = iban_country(profile["iban"]) or ""
    if not profile["id"]:
        profile["id"] = f"{ptype}-{profile['account_name'] or 'default'}"[:40]
    return profile


def validate_profiles(profiles: list[dict]) -> list[dict]:
    if len(profiles) > MAX_PROFILES:
        raise ValueError(f"At most {MAX_PROFILES} payment profiles allowed.")
    out: list[dict] = []
    for raw in profiles:
        profile = normalize_profile(raw if isinstance(raw, dict) else {})
        if profile["type"] in ("sepa", "sepa_instant") and profile["iban"]:
            if len(profile["iban"]) < 8:
                raise ValueError(f"{profile['type']} profile needs a valid IBAN.")
            cc = profile["country"] or iban_country(profile["iban"])
            if cc and cc not in SEPA_IBAN_COUNTRIES:
                raise ValueError(f"IBAN country {cc} is outside the SEPA IBAN area.")
        if profile["type"] == "paypal":
            has_email = profile["email"] and "@" in profile["email"]
            has_link = bool(profile["payment_link"])
            if not has_email and not has_link:
                raise ValueError("PayPal profile needs an email or a payment link.")
            if profile["payment_link"]:
                link = profile["payment_link"].lower()
                if "paypal.com" not in link and "paypal.me" not in link:
                    raise ValueError("PayPal payment link must be a paypal.com URL.")
        if profile["type"] in ("mpesa", "mobile_money"):
            has_route = any(
                profile.get(k)
                for k in ("phone", "till_number", "paybill")
            )
            if not has_route:
                raise ValueError(
                    f"{PAYMENT_TYPE_SCHEMA[profile['type']]['label']} profile "
                    "needs a phone number, Till, or Paybill."
                )
            if profile["country"] and profile["country"] not in MOBILE_MONEY_COUNTRIES:
                raise ValueError(
                    f"Country {profile['country']} is not in the mobile-money list."
                )
        if profile["type"] == "cash_in_person":
            if not profile["place_label"] and not profile["map_url"]:
                raise ValueError("Meetup needs a place name or an OpenStreetMap link.")
            if profile["map_url"] and "openstreetmap" not in profile["map_url"].lower():
                raise ValueError("Map link must be an openstreetmap.org URL.")
            link = profile["map_url"]
            if link:
                lat, lon = parse_osm_coordinates(link)
                if lat is None:
                    raise ValueError("Could not read coordinates from that map link.")
        if profile["type"] == "lightning_address":
            if not (profile.get("lightning_address") or "").strip():
                raise ValueError("Lightning receive profile needs an address.")
        if profile["type"] == "onchain_btc":
            if len((profile.get("btc_address") or "").strip()) < 14:
                raise ValueError("On-chain profile needs a Bitcoin address.")
        out.append(profile)
    return out


def pack_profiles(profiles: list[dict]) -> str:
    return json.dumps(
        {"version": PROFILE_VERSION, "profiles": validate_profiles(profiles)},
        separators=(",", ":"),
    )


def unpack_profiles(plaintext: Optional[str]) -> tuple[list[dict], Optional[str]]:
    """Return (profiles, legacy_text_if_any)."""
    text = (plaintext or "").strip()
    if not text:
        return [], None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return (
            [
                normalize_profile(
                    {"type": "other", "label": "Saved details", "notes": text}
                )
            ],
            text,
        )
    if isinstance(data, dict) and isinstance(data.get("profiles"), list):
        profiles = [normalize_profile(p) for p in data["profiles"] if isinstance(p, dict)]
        return profiles, None
    return (
        [normalize_profile({"type": "other", "label": "Saved details", "notes": text})],
        text,
    )


def profile_method_names(profiles: list[dict]) -> list[str]:
    names: list[str] = []
    for p in profiles:
        schema = PAYMENT_TYPE_SCHEMA.get(p["type"], {})
        name = schema.get("method_name") or p.get("label") or p["type"]
        if name and name not in names:
            names.append(name)
    return names


def pick_buyer_receive_profile(profiles: list[dict]) -> Optional[dict]:
    """Prefer Lightning, then on-chain, then NWC marker profile."""
    normalized = [normalize_profile(p) for p in profiles]
    for preferred in ("lightning_address", "onchain_btc", "nwc_wallet"):
        for p in normalized:
            if p["type"] == preferred:
                return p
    return None


def buyer_receive_summary(profile: dict, *, has_nwc: bool = False) -> str:
    p = normalize_profile(profile)
    if p["type"] == "lightning_address" and p.get("lightning_address"):
        return f"Lightning: {p['lightning_address']}"
    if p["type"] == "onchain_btc" and p.get("btc_address"):
        return f"On-chain: {p['btc_address']}"
    if p["type"] == "nwc_wallet":
        return "NWC wallet (invoice from Settings)" if has_nwc else "NWC — connect in Settings"
    return p.get("label") or "Receive address"


def format_buyer_receive_for_chat(profile: dict, *, has_nwc: bool = False) -> str:
    p = normalize_profile(profile)
    lines = ["My Bitcoin receive details:"]
    if p["account_name"]:
        lines.append(f"Name: {p['account_name']}")
    if p["type"] == "lightning_address" and p.get("lightning_address"):
        lines.append(f"Lightning address: {p['lightning_address']}")
    elif p["type"] == "onchain_btc" and p.get("btc_address"):
        lines.append(f"Bitcoin address: {p['btc_address']}")
    elif p["type"] == "nwc_wallet":
        if has_nwc:
            lines.append(
                "Receive via Lightning invoice from my NWC wallet (connected in Trato Settings)."
            )
        else:
            lines.append(
                "I will share a Lightning invoice from my NWC wallet — connect NWC in Settings first."
            )
    if p.get("notes"):
        lines.append(p["notes"])
    return "\n".join(lines)


def format_profile_for_chat(
    profile: dict,
    *,
    fiat_amount: Optional[float] = None,
    fiat_code: str = "",
    trade_ref: str = "",
    meetup_at: Optional[int] = None,
    has_nwc: bool = False,
) -> str:
    p = normalize_profile(profile)
    if p["type"] in BITCOIN_RECEIVE_TYPES:
        return format_buyer_receive_for_chat(p, has_nwc=has_nwc)
    lines = [f"Payment via {p['label']}:"]
    if p["type"] == "cash_in_person":
        if p["place_label"]:
            lines.append(f"Meet at: {p['place_label']}")
        if p["country"]:
            lines.append(f"Country: {profile_country_label(p)} ({p['country']})")
        map_link = meetup_map_url(p)
        if map_link:
            lines.append(f"Map: {map_link}")
        if meetup_at:
            lines.append(f"Proposed time: {format_meetup_time(meetup_at, p.get('timezone'))}")
        if p["notes"]:
            lines.append(p["notes"])
        if fiat_amount and fiat_code:
            lines.append(f"Cash amount: {fiat_amount} {fiat_code.upper()}")
        return "\n".join(lines)
    if p["country"]:
        lines.append(f"Country: {profile_country_label(p)} ({p['country']})")
    if p["type"] == "sepa_instant":
        lines.append(
            "Use SEPA Instant / Echtzeitüberweisung in your bank app if available."
        )
    elif p["type"] == "sepa":
        lines.append("Standard SEPA transfer (not instant).")
    if p["type"] in ("usdt", "usdc", "stablecoin"):
        if p.get("network"):
            lines.append(f"Network: {p['network']}")
        if p.get("lightning_address"):
            lines.append(f"Lightning: {p['lightning_address']}")
        if p.get("wallet_address"):
            lines.append(f"Address: {p['wallet_address']}")
    if p["account_name"]:
        lines.append(f"Name: {p['account_name']}")
    if p["iban"]:
        lines.append(f"IBAN: {p['iban']}")
    if p["bic"]:
        lines.append(f"BIC: {p['bic']}")
    if p["bank_name"]:
        lines.append(f"Bank: {p['bank_name']}")
    if p["account_number"]:
        lines.append(f"Account: {p['account_number']}")
    if p["email"]:
        lines.append(f"Email: {p['email']}")
    if p["username"]:
        lines.append(f"Username: @{p['username']}")
    if p["phone"]:
        lines.append(f"Phone: {p['phone']}")
    if p.get("till_number"):
        lines.append(f"Till number: {p['till_number']}")
    if p.get("paybill"):
        lines.append(f"Paybill: {p['paybill']}")
    if p.get("provider"):
        lines.append(f"Provider: {p['provider']}")
    if fiat_amount and fiat_code:
        lines.append(f"Amount: {fiat_amount} {fiat_code.upper()}")
    ref = trade_ref or p["reference_hint"]
    if ref:
        lines.append(f"Reference: {ref}")
    if p["notes"]:
        lines.append(p["notes"])
    return "\n".join(lines)


def _amount_path(amount: Optional[float], fiat_code: str) -> str:
    if amount is None or amount <= 0:
        return ""
    code = (fiat_code or "").strip().lower()
    # PayPal / Revolut style: 25.00eur
    return f"{amount:.2f}{code}" if code else f"{amount:.2f}"


PAYPAL_GS_HINT = (
    "Goods & Services only — not Friends & Family. F&F is for gifts, violates "
    "PayPal rules for trades, and is easier to reverse. If PayPal shows a choice, "
    "pick paying for goods or services."
)


def _paypal_goods_checkout_url(
    profile: dict,
    *,
    fiat_amount: Optional[float] = None,
    fiat_code: str = "",
    trade_ref: str = "",
) -> Optional[str]:
    """PayPal checkout as goods/services — not the personal /send flow.

    ``/paypal.com/send`` lets the buyer pick Friends & Family; we avoid that.
    Prefer a seller ``payment_link`` (PayPal business Payment Link), else the
    legacy ``_xclick`` commercial button URL (services, no shipping).
    """
    p = normalize_profile(profile)
    custom = (p.get("payment_link") or "").strip()
    if custom and ("paypal.com" in custom.lower() or "paypal.me" in custom.lower()):
        return custom
    if not p["email"]:
        return None
    code = (fiat_code or "EUR").strip().upper()
    params: dict[str, str] = {
        "cmd": "_xclick",
        "business": p["email"],
        "currency_code": code,
        "no_shipping": "1",
        "button_subtype": "services",
        "item_name": (trade_ref or p["reference_hint"] or "Trato P2P trade")[:127],
    }
    if fiat_amount is not None and fiat_amount > 0:
        params["amount"] = f"{fiat_amount:.2f}"
    return f"https://www.paypal.com/cgi-bin/webscr?{urlencode(params)}"


def epc_qr_payload(
    profile: dict,
    *,
    fiat_amount: Optional[float] = None,
    fiat_code: str = "",
    reference: str = "",
) -> str:
    """EPC069-12 SEPA credit transfer QR payload (Girocode).

    Scannable in many EU banking apps (DE, AT, …) without a third-party account.
    There is no universal HTTPS “pay this IBAN” link without PSD2 aggregators
    (Klarna, etc.) that require registration — we deliberately do not use those.
    """
    p = normalize_profile(profile)
    if not p["iban"]:
        return ""
    code = (fiat_code or "EUR").strip().upper()
    amount_line = ""
    if fiat_amount is not None and fiat_amount > 0:
        amount_line = f"{code}{fiat_amount:.2f}"
    ref = (reference or p["reference_hint"] or "")[:35]
    bic = p["bic"] or ""
    name = (p["account_name"] or "Beneficiary")[:70]
    lines = [
        "BCD",
        "002",
        "1",
        "SCT",
        bic,
        name,
        p["iban"],
        amount_line,
        "",
        ref,
        "",
    ]
    return "\n".join(lines)


def pay_actions(
    profile: dict,
    *,
    fiat_amount: Optional[float] = None,
    fiat_code: str = "",
    trade_ref: str = "",
) -> list[dict]:
    """Build UI actions: open-in-app links where possible, else copy helpers."""
    p = normalize_profile(profile)
    actions: list[dict] = []
    amt = _amount_path(fiat_amount, fiat_code)
    ref = trade_ref or p["reference_hint"] or ""

    if p["type"] == "paypal" and (p["email"] or p.get("payment_link")):
        gs_url = _paypal_goods_checkout_url(
            p,
            fiat_amount=fiat_amount,
            fiat_code=fiat_code,
            trade_ref=ref,
        )
        if gs_url:
            actions.append(
                {
                    "kind": "open",
                    "label": "Open PayPal (goods & services)",
                    "url": gs_url,
                    "hint": PAYPAL_GS_HINT,
                }
            )
    elif p["type"] == "revolut" and p["username"]:
        url = f"https://revolut.me/{quote(p['username'])}"
        if amt:
            url += f"/{amt}"
        actions.append({"kind": "open", "label": "Open Revolut", "url": url})
    elif p["type"] == "wise" and p["username"]:
        url = f"https://wise.com/pay/me/{quote(p['username'])}"
        actions.append({"kind": "open", "label": "Open Wise", "url": url})
    elif p["type"] == "venmo" and p["username"]:
        actions.append(
            {
                "kind": "open",
                "label": "Open Venmo",
                "url": f"https://account.venmo.com/{quote(p['username'])}",
            }
        )
    elif p["type"] == "cash_app" and p["username"]:
        actions.append(
            {
                "kind": "open",
                "label": "Open Cash App",
                "url": f"https://cash.app/${quote(p['username'])}",
            }
        )
    elif p["type"] == "cash_in_person":
        map_link = meetup_map_url(p)
        if map_link:
            actions.append(
                {
                    "kind": "open",
                    "label": "Open meeting spot (map)",
                    "url": map_link,
                }
            )
            actions.append(
                {
                    "kind": "copy",
                    "label": "Copy map link",
                    "value": map_link,
                }
            )
        elif p["country"]:
            actions.append(
                {
                    "kind": "open",
                    "label": "Open map (country)",
                    "url": osm_country_picker_url(p["country"]),
                }
            )
        if p["place_label"]:
            actions.append(
                {
                    "kind": "copy",
                    "label": "Copy meeting place",
                    "value": p["place_label"],
                }
            )

    if p["type"] in ("sepa", "sepa_instant", "bank_transfer") and p["iban"]:
        epc = epc_qr_payload(
            p, fiat_amount=fiat_amount, fiat_code=fiat_code, reference=ref
        )
        if epc:
            instant = p["type"] == "sepa_instant"
            label = "SEPA Instant (QR)" if instant else "SEPA bank transfer (QR)"
            hint = (
                "Open your bank app → transfer → scan QR (Girocode). "
                "Then choose SEPA Instant / Echtzeitüberweisung if your bank "
                "offers it for this IBAN. Cross-border instant depends on both banks."
                if instant
                else "Open your bank app → transfer → scan QR (Girocode). "
                "Standard SEPA — usually arrives next business day."
            )
            actions.insert(
                0,
                {"kind": "epc", "label": label, "value": epc, "hint": hint},
            )

    if p["type"] in ("usdt", "usdc", "stablecoin"):
        if p.get("wallet_address"):
            actions.append(
                {
                    "kind": "copy",
                    "label": f"Copy {p.get('label') or 'address'}",
                    "value": p["wallet_address"],
                }
            )
        if p.get("lightning_address"):
            actions.append(
                {
                    "kind": "copy",
                    "label": "Copy Lightning address",
                    "value": p["lightning_address"],
                }
            )

    if p["iban"]:
        iban_spaced = " ".join(re.findall(r".{1,4}", p["iban"]))
        actions.append({"kind": "copy", "label": "Copy IBAN", "value": iban_spaced})
    if p["email"] and not any(
        a.get("kind") == "open" and "paypal" in (a.get("url") or "").lower()
        for a in actions
    ):
        actions.append({"kind": "copy", "label": "Copy email", "value": p["email"]})
    if p["phone"]:
        actions.append({"kind": "copy", "label": "Copy phone", "value": p["phone"]})
    if p.get("till_number"):
        actions.append(
            {"kind": "copy", "label": "Copy Till number", "value": p["till_number"]}
        )
    if p.get("paybill"):
        actions.append(
            {"kind": "copy", "label": "Copy Paybill", "value": p["paybill"]}
        )
    if p.get("provider"):
        actions.append(
            {"kind": "copy", "label": "Copy provider", "value": p["provider"]}
        )
    if p["username"] and p["type"] not in ("revolut", "wise", "venmo", "cash_app"):
        actions.append({"kind": "copy", "label": "Copy username", "value": f"@{p['username']}"})

    return actions


def profile_snapshot_for_trade(profile: dict) -> dict:
    p = normalize_profile(profile)
    return {
        "profile": p,
        "chat_text": None,  # filled by caller with amount/ref
        "method_name": PAYMENT_TYPE_SCHEMA.get(p["type"], {}).get("method_name", p["label"]),
    }
