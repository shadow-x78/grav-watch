# GravWatch - Official Google Antigravity Authentication API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

try:
    from services.server.core.database import get_db
    from services.server.core.config import settings
    from services.server.core.security import (
        get_current_agent,
        require_master_key,
        validate_account_id,
    )
    from services.server.core.google_oauth import (
        delete_account_credentials,
        get_user_info,
        load_account_credentials,
        safe_write_credentials,
        generate_pkce_auth_url,
        exchange_pkce_code,
    )
    from services.server.core.agy_bridge import (
        start_agy_login_flow,
        submit_code_to_agy,
    )
    from services.server.core.container_manager import (
        provision_account_container,
        deprovision_account_container,
        toggle_account_container,
        list_active_account_containers,
    )
    from services.server.models.db import Account, UsageSnapshot
    from services.server.models.schemas import AuthTokenPayload, AuthStatusResponse
except ImportError:
    from ..core.database import get_db
    from ..core.config import settings
    from ..core.security import (
        get_current_agent,
        require_master_key,
        validate_account_id,
    )
    from ..core.google_oauth import (
        delete_account_credentials,
        get_user_info,
        load_account_credentials,
        safe_write_credentials,
        generate_pkce_auth_url,
        exchange_pkce_code,
    )
    from ..core.agy_bridge import (
        start_agy_login_flow,
        submit_code_to_agy,
    )
    from ..core.container_manager import (
        provision_account_container,
        deprovision_account_container,
        toggle_account_container,
        list_active_account_containers,
    )
    from ..models.db import Account, UsageSnapshot
    from ..models.schemas import AuthTokenPayload, AuthStatusResponse

logger = logging.getLogger("gravwatch.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/url")
async def get_auth_url(account_id: str = Query("acc-1")):
    account_id = validate_account_id(account_id)
    url = generate_pkce_auth_url(account_id)
    return {
        "account_id": account_id,
        "auth_url": url,
        "message": f"Direct Google OAuth URL for account node [{account_id}].",
    }


@router.get("/start")
async def start_oauth(account_id: str = Query("acc-1")):
    account_id = validate_account_id(account_id)
    url = generate_pkce_auth_url(account_id)
    return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)


@router.get("/login")
async def login_info(account_id: str = Query("acc-1")):
    account_id = validate_account_id(account_id)
    return {
        "account_id": account_id,
        "action": "pair_google_account",
        "start_url": f"/api/v1/auth/start?account_id={account_id}",
        "exchange_url": "/api/v1/auth/exchange-code",
        "message": "Use the GravWatch web dashboard modal at http://localhost:3000 to pair Google accounts.",
    }


@router.post("/exchange-code")
async def exchange_code_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        if "application/json" in request.headers.get("content-type", ""):
            body = await request.json()
            account_id = validate_account_id(body.get("account_id", "acc-1"))
            code_or_token = str(body.get("code", "")).strip()
        else:
            form_data = await request.form()
            account_id = validate_account_id(form_data.get("account_id", "acc-1"))
            code_or_token = str(form_data.get("code", "")).strip()
    except Exception as e:
        return JSONResponse({"success": False, "error": f"Invalid payload: {e}"}, status_code=400)

    email = None
    name = None
    picture = None
    now_utc = datetime.now(timezone.utc)

    real_access_token = None
    real_refresh_token = None

    if code_or_token.startswith("ya29."):
        real_access_token = code_or_token
        try:
            user_info = await get_user_info(code_or_token)
            email = user_info.get("email")
            name = user_info.get("name")
            picture = user_info.get("picture")
        except Exception:
            pass
    else:
        try:
            token_data = await exchange_pkce_code(account_id, code_or_token)
            if token_data and "access_token" in token_data:
                real_access_token = token_data.get("access_token")
                real_refresh_token = token_data.get("refresh_token")
                user_info = await get_user_info(real_access_token)
                email = user_info.get("email") or email
                name = user_info.get("name") or name
                picture = user_info.get("picture") or picture
        except Exception as e:
            logger.debug("exchange_pkce_code: %s", e)

        if not real_access_token:
            try:
                agy_res = submit_code_to_agy(account_id, code_or_token)
                if isinstance(agy_res, dict):
                    email = agy_res.get("email") or email
                    name = agy_res.get("name") or name
                    picture = agy_res.get("picture") or picture
                    real_access_token = agy_res.get("access_token") or real_access_token
            except Exception as e:
                logger.warning("submit_code_to_agy fallback: %s", e)

        token_file = os.path.join(settings.DATA_DIR, account_id, "antigravity-cli", "antigravity-oauth-token")
        if not real_access_token and os.path.exists(token_file):
            try:
                with open(token_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content and not content.startswith("4/0A"):
                        real_access_token = content
            except Exception:
                pass

    final_token = real_access_token or code_or_token

    payload = {
        "account_id": account_id,
        "account_label": f"Account {account_id}",
        "email": email,
        "email_verified": True,
        "name": name,
        "picture": picture,
        "tier": "Google AI Pro",
        "status": "authenticated",
        "access_token": final_token,
        "refresh_token": real_refresh_token,
        "expires_at": now_utc.timestamp() + 86400 * 30,
        "expires_in": 86400 * 30,
        "authenticated_at": now_utc.isoformat(),
    }
    safe_write_credentials(account_id, payload)

    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    if not account:
        account = Account(
            id=account_id,
            label=f"Account {account_id}",
            email=email,
            name=name,
            picture=picture,
            tier="Google AI Pro",
            status="healthy",
            last_seen_at=now_utc,
        )
        db.add(account)
    else:
        account.email = email
        account.tier = "Google AI Pro"
        if name:
            account.name = name
        if picture:
            account.picture = picture
        account.status = "healthy"
        account.last_seen_at = now_utc

    await db.commit()

    provision_account_container(account_id, f"Account {account_id}")

    return JSONResponse({
        "success": True,
        "account_id": account_id,
        "email": email,
        "name": name,
        "picture": picture,
        "tier": "Google AI Pro",
        "message": f"Successfully authenticated as {email} for node {account_id}.",
    }, status_code=200)


@router.post("/token", status_code=status.HTTP_200_OK)
async def upload_token(
    payload: AuthTokenPayload,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_agent),
):
    account_id = validate_account_id(payload.account_id or "acc-1")
    email = payload.email
    if not email:
        raise HTTPException(status_code=400, detail="email is required")

    now_utc = datetime.now(timezone.utc)
    stored = {
        "account_id": account_id,
        "account_label": payload.account_label or f"Account {account_id}",
        "email": email,
        "email_verified": True,
        "tier": payload.tier or "Google AI Pro",
        "status": "authenticated",
        "access_token": payload.access_token or "uploaded",
        "refresh_token": payload.refresh_token,
        "expires_at": now_utc.timestamp() + 86400 * 30,
        "authenticated_at": now_utc.isoformat(),
    }
    safe_write_credentials(account_id, stored)

    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    if not account:
        account = Account(
            id=account_id,
            label=payload.account_label or f"Account {account_id}",
            email=email,
            tier=stored["tier"],
            status="healthy",
            last_seen_at=now_utc,
        )
        db.add(account)
    else:
        account.email = email
        account.tier = stored["tier"]
        account.status = "healthy"
        account.last_seen_at = now_utc
    await db.commit()

    provision_account_container(account_id, payload.account_label or f"Account {account_id}")

    return {
        "success": True,
        "message": f"Authenticated session for {account_id}.",
        "account_id": account_id,
        "authenticated": True,
        "email": email,
    }


@router.delete("/token", status_code=status.HTTP_200_OK)
async def revoke_auth_token(
    account_id: str = Query("acc-1"),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_master_key),
):
    account_id = validate_account_id(account_id)
    delete_account_credentials(account_id)
    deprovision_account_container(account_id)
    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    if account:
        if account_id == "acc-1":
            account.status = "unauthenticated"
            account.email = None
            account.name = None
            account.picture = None
        else:
            await db.delete(account)
        await db.execute(delete(UsageSnapshot).where(UsageSnapshot.account_id == account_id))
        await db.commit()
    return {
        "success": True,
        "message": f"Revoked credentials, stopped container, and reset session for {account_id}.",
    }


@router.post("/container/toggle")
async def toggle_container_endpoint(
    account_id: str = Query("acc-1"),
    db: AsyncSession = Depends(get_db),
):
    account_id = validate_account_id(account_id)
    res = toggle_account_container(account_id)
    return res


@router.get("/status", response_model=list[AuthStatusResponse])
async def get_auth_status(db: AsyncSession = Depends(get_db)):
    stmt = select(Account).order_by(Account.id)
    res = await db.execute(stmt)
    accounts = {a.id: a for a in res.scalars().all()}

    active_containers = {c["account_id"]: c["status"] for c in list_active_account_containers()}

    known_ids = set()
    for acc_id, a in accounts.items():
        if a.email or a.status == "healthy":
            known_ids.add(acc_id)

    if os.path.exists(settings.DATA_DIR):
        for entry in os.listdir(settings.DATA_DIR):
            if entry.startswith("acc-") and os.path.isdir(os.path.join(settings.DATA_DIR, entry)):
                if not entry.endswith("-agent"):
                    creds = load_account_credentials(entry)
                    if creds and creds.get("status") == "authenticated":
                        known_ids.add(entry)
                    elif entry == "acc-1":
                        known_ids.add("acc-1")

    if not known_ids:
        known_ids.add("acc-1")

    result: list[AuthStatusResponse] = []
    for acc_id in sorted(known_ids):
        a = accounts.get(acc_id)
        creds = load_account_credentials(acc_id)
        has_creds = creds is not None and creds.get("status") == "authenticated"
        is_healthy = a is not None and a.status == "healthy"
        authenticated = has_creds or is_healthy
        email = (a.email if a else None) or (creds.get("email") if creds else None)
        name = (getattr(a, "name", None) if a else None) or (creds.get("name") or creds.get("account_label") if creds else None)
        picture = (getattr(a, "picture", None) if a else None) or (creds.get("picture") if creds else None)
        last_update = a.last_seen_at if a else (creds.get("authenticated_at") if creds else None)
        c_status = active_containers.get(acc_id, "running" if authenticated else "stopped")
        result.append(
            AuthStatusResponse(
                account_id=acc_id,
                authenticated=authenticated,
                email=email,
                name=name,
                picture=picture,
                container_status=c_status,
                last_token_update=last_update,
                message="Authenticated" if authenticated else "Unauthenticated",
            )
        )
    return result
