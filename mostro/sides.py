"""Buy/sell vocabulary: user intent vs maker's public order kind.

On the Mostro wire (NIP-69 kind-38383), ``k=sell`` means the *maker* sells BTC.
A user who wants to **buy** BTC must take those sell orders — the sides are
opposite. Trato's UI and order-book filter always speak from **your** perspective;
only protocol/DB fields keep the maker's ``kind``.
"""

from __future__ import annotations


def opposite_side(side: str) -> str:
    if side == "buy":
        return "sell"
    if side == "sell":
        return "buy"
    raise ValueError(f"side must be buy or sell, got {side!r}")


def user_side_if_take(maker_kind: str) -> str:
    """What the taker does when taking a public book order."""
    return opposite_side(maker_kind)


def maker_kind_for_user_intent(user_intent: str) -> str:
    """Map UI filter 'I want to buy/sell BTC' to maker ``kind`` on the book."""
    return opposite_side(user_intent)


def user_action_label(user_side: str) -> str:
    return "Buy BTC" if user_side == "buy" else "Sell BTC"


def user_action_detail(user_side: str, fiat_code: str = "fiat") -> str:
    code = (fiat_code or "fiat").upper()
    if user_side == "buy":
        return f"Pay {code} · receive BTC"
    return f"Receive {code} · send BTC"


def money_direction(user_side: str) -> str:
    if user_side == "buy":
        return "You receive the sats · send fiat"
    return "You send the sats · receive fiat"
