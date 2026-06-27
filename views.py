"""HTML page route for Trato (the single-page app shell)."""

from __future__ import annotations

import json
from http import HTTPStatus
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from lnbits.core.crud import get_account, get_user_from_account
from lnbits.core.db import db as lnbits_db
from lnbits.core.models import User
from lnbits.decorators import (
    _get_account_from_token,
    check_access_token,
    check_user_extension_access,
)
from lnbits.helpers import template_renderer

from .services.payment_profiles import (
    COUNTRY_NAMES,
    MOBILE_MONEY_COUNTRIES,
    PAYMENT_TYPE_SCHEMA,
    SEPA_IBAN_COUNTRIES,
)

trato_generic_router = APIRouter()

_EXT_ID = "trato"


def trato_renderer():
    return template_renderer(["trato/templates"])


def _index_context(request: Request, *, public_view: bool = False, user=None) -> dict:
    return {
        "request": request,
        "user": user.json() if user else None,
        "public_view": public_view,
        "payment_schema_json": json.dumps(PAYMENT_TYPE_SCHEMA),
        "country_names_json": json.dumps(COUNTRY_NAMES),
        "sepa_countries_json": json.dumps(sorted(SEPA_IBAN_COUNTRIES)),
        "mobile_money_countries_json": json.dumps(sorted(MOBILE_MONEY_COUNTRIES)),
    }


def _gate(
    request: Request,
    *,
    title: str,
    lead: str,
    detail: str = "",
    hint: str = "",
    show_login: bool = False,
    show_extensions: bool = False,
    show_browse: bool = False,
    status_code: int = HTTPStatus.FORBIDDEN,
) -> HTMLResponse:
    return trato_renderer().TemplateResponse(
        "trato/gate.html",
        {
            "request": request,
            "title": title,
            "lead": lead,
            "detail": detail,
            "hint": hint,
            "show_login": show_login,
            "show_extensions": show_extensions,
            "show_browse": show_browse,
        },
        status_code=status_code,
    )


async def _optional_user(
    request: Request,
    access_token: Annotated[str | None, Depends(check_access_token)] = None,
    usr: UUID | None = None,
) -> User | None:
    """Resolve the logged-in user without enforcing extension access."""
    async with lnbits_db.connect() as conn:
        account = None
        if access_token:
            try:
                account = await _get_account_from_token(
                    access_token,
                    request.url.path,
                    request.method,
                    conn=conn,
                )
            except HTTPException:
                return None
        elif usr is not None:
            account = await get_account(usr.hex, conn=conn)
        if not account:
            return None
        return await get_user_from_account(account, conn=conn)


@trato_generic_router.get("/", response_class=HTMLResponse)
async def index(
    request: Request,
    user: User | None = Depends(_optional_user),
):
    """Trato client UI — browse-only redirect when anonymous; full app when enabled."""
    if user is None:
        return RedirectResponse(url="/trato/book", status_code=HTTPStatus.FOUND)

    async with lnbits_db.connect() as conn:
        ext_status = await check_user_extension_access(user.id, _EXT_ID, conn=conn)
    if not ext_status.success:
        return _gate(
            request,
            title="Extension not enabled",
            lead="Enable Trato for your LNbits account to trade here.",
            detail=ext_status.message or "",
            hint="LNbits → Extensions → Trato → Enable. You can browse live offers without enabling.",
            show_extensions=True,
            show_browse=True,
            status_code=HTTPStatus.FORBIDDEN,
        )

    return trato_renderer().TemplateResponse(
        "trato/index.html",
        _index_context(request, user=user),
    )


@trato_generic_router.get("/book", response_class=HTMLResponse)
async def public_orderbook(request: Request):
    """Shareable read-only order book — no LNbits login, no Vue router."""
    trade_url = "/trato/"
    return trato_renderer().TemplateResponse(
        "trato/public_book.html",
        {
            "request": request,
            "trade_url": trade_url,
        },
    )
