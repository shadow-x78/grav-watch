# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import os
import json
import logging
import time
import urllib.parse
import hashlib
import base64
import secrets
import subprocess
from datetime import datetime, timezone
from typing import Optional

import httpx
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from services.server.core.database import get_db
from services.server.core.config import settings
from services.server.core.security import validate_account_id
from services.server.core.google_oauth import (
    delete_account_credentials,
    get_user_info,
    load_account_credentials,
    safe_write_credentials,
    refresh_oauth_token,
)
from services.server.core.container_manager import (
    provision_account_container,
    deprovision_account_container,
    toggle_account_container,
    list_active_account_containers,
)
from services.server.core.agy_bridge import (
    start_agy_login_flow,
    submit_code_to_agy,
    cancel_agy_login_flow,
    get_agy_output,
)
from services.server.models.db import Account, UsageSnapshot
from services.server.models.schemas import AuthTokenPayload, AuthStatusResponse

logger = logging.getLogger("gravwatch.api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

_auth_url_cache: dict[str, tuple[str, float]] = {}
_AUTH_URL_CACHE_TTL = 300

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_TOKEN_URL = settings.GOOGLE_TOKEN_URL
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI
GOOGLE_AUTH_BASE = settings.GOOGLE_AUTH_BASE

GOOGLE_SCOPES = settings.GOOGLE_SCOPES

def _encode_base64url(data: bytes) -> str:
    """Base64url-encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def build_auth_url(account_id: Optional[str] = None) -> str:
    """Build a complete Google OAuth 2.0 auth URL with PKCE."""
    code_verifier = _encode_base64url(os.urandom(32))
    code_challenge = _encode_base64url(
        hashlib.sha256(code_verifier.encode("ascii")).digest()
    )
    state = secrets.token_urlsafe(32)

    params = {
        "access_type": "offline",
        "client_id": GOOGLE_CLIENT_ID,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "prompt": "consent",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": GOOGLE_SCOPES.strip(),
        "state": state,
    }
    return GOOGLE_AUTH_BASE + "?" + urllib.parse.urlencode(params)

@router.post("/start")
async def start_auth_flow(account_id: str = Query("acc-1")):
    """Generate OAuth URL. Always requires explicit user login."""
    account_id = validate_account_id(account_id)

    auth_url = build_auth_url(account_id)
    return {
        "account_id": account_id,
        "auth_url": auth_url,
        "message": "Open this URL in your browser, sign in with Google, paste the code back here.",
    }

@router.get("/login")
async def login_info(account_id: str = Query("acc-1")):
    account_id = validate_account_id(account_id)
    return {
        "account_id": account_id,
        "action": "pair_google_account",
        "start_url": f"/api/v1/auth/start-pty?account_id={account_id}",
        "exchange_url": "/api/v1/auth/submit-code-pty",
        "message": "Use the GravWatch web dashboard modal to pair Google accounts.",
    }

@router.get("/agy-output")
async def get_agy_output_endpoint(account_id: str = Query("acc-1")):
    """Stream the live agy TUI output from the account container.

    Used by the dashboard diagnostics panel during Google pairing.
    """
    account_id = validate_account_id(account_id)
    try:
        output = await asyncio.to_thread(get_agy_output, account_id)
        return {
            "success": True,
            "account_id": account_id,
            "output": output,
            "empty": not output.strip(),
            "captured_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Failed reading agy output for %s: %s", account_id, e)
        return {
            "success": False,
            "account_id": account_id,
            "output": "",
            "empty": True,
            "error": str(e),
        }

@router.get("/agy-output/stream")
async def stream_agy_output(account_id: str = Query("acc-1")):
    """Server-Sent Events stream of the live agy TUI output.

    Pushes a full snapshot whenever the container output changes and a
    keep-alive comment otherwise, so the dashboard console renders agy in
    real time without polling. Snapshots (not deltas) make reconnects
    stateless and safe.
    """
    account_id = validate_account_id(account_id)

    async def event_stream():
        last_output: Optional[str] = None
        deadline = time.time() + 600.0
        try:
            while time.time() < deadline:
                try:
                    output = await asyncio.to_thread(get_agy_output, account_id)
                except Exception as e:
                    logger.error("SSE read failed for %s: %s", account_id, e)
                    payload = json.dumps({
                        "success": False,
                        "account_id": account_id,
                        "output": "",
                        "empty": True,
                        "error": str(e),
                    })
                    yield f"data: {payload}\n\n"
                    await asyncio.sleep(3.0)
                    continue

                if output != last_output:
                    last_output = output
                    payload = json.dumps({
                        "success": True,
                        "account_id": account_id,
                        "output": output,
                        "empty": not output.strip(),
                        "captured_at": datetime.now(timezone.utc).isoformat(),
                    })
                    yield f"data: {payload}\n\n"
                else:
                    yield ": keep-alive\n\n"
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            raise

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )

@router.post("/start-pty")
async def start_pyt_auth(account_id: str = Query("acc-1")):
    """Start AGY PTY auth flow in container - returns auth URL."""
    account_id = validate_account_id(account_id)
    
    now = time.time()
    cached = _auth_url_cache.get(account_id)
    if cached:
        auth_url, cached_time = cached
        if time.time() - cached_time < 300:  # 5 minutes
            logger.info("Returning cached auth URL for %s", account_id)
            return {
                "account_id": account_id,
                "auth_url": auth_url,
                "message": "Open the URL in your browser, sign in with Google, and return to paste the authorization code.",
                "cached": True,
            }
        else:
            _auth_url_cache.pop(account_id, None)
    
    try:
        cancel_agy_login_flow(account_id)
        auth_url = await asyncio.to_thread(start_agy_login_flow, account_id)

        if auth_url == "ALREADY_AUTHENTICATED":
            creds = await asyncio.to_thread(load_account_credentials, account_id)
            return {
                "account_id": account_id,
                "auth_url": None,
                "already_authenticated": True,
                "email": creds.get("email") if creds else None,
            }

        _auth_url_cache[account_id] = (auth_url, time.time())

        return {
            "account_id": account_id,
            "auth_url": auth_url,
            "message": "Open the URL in your browser, sign in with Google, and return to paste the authorization code.",
        }
    except TimeoutError:
        return {"success": False, "error": "Could not extract auth URL from agy CLI after timeout", "account_id": account_id}
    except RuntimeError as e:
        return {"success": False, "error": str(e), "account_id": account_id}
    except Exception as e:
        logger.error("start-pty failed for %s: %s", account_id, e)
        return {"success": False, "error": f"start-pty error: {str(e)}", "account_id": account_id}

@router.post("/submit-code-pty", dependencies=[])
async def submit_code_pyt(request: Request, db: AsyncSession = Depends(get_db)):
    """Submit the Google auth code back to AGY CLI PTY."""
    try:
        body = await request.json()
        account_id = validate_account_id(body.get("account_id", "acc-1"))
        code = str(body.get("code", "")).strip()
    except:
        return JSONResponse({"success": False, "error": "Invalid payload"}, status_code=400)

    if not code:
        return JSONResponse({"success": False, "error": "Code is required"}, status_code=400)

    now_utc = datetime.now(timezone.utc)

    try:
        result = await asyncio.to_thread(submit_code_to_agy, account_id, code)
        access_token = result["access_token"]
        refresh_token = result.get("refresh_token", "")
        logger.info("PTY auth successful for %s", account_id)
    except Exception as e:
        logger.error("PTY auth code submission failed: %s", e)
        return JSONResponse({
            "success": False,
            "error": f"Failed to submit code to agy CLI: {str(e)}"
        }, status_code=400)

    email = None
    name = None
    picture = None
    try:
        user_info = await get_user_info(access_token)
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
    except Exception:
        logger.warning("Userinfo lookup failed after PTY auth for %s", account_id)

    payload = {
        "account_id": account_id,
        "account_label": f"Account {account_id}",
        "email": email,
        "email_verified": True,
        "name": name,
        "picture": picture,
        "tier": "Google AI Pro",
        "status": "authenticated",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": now_utc.timestamp() + 86400 * 30,
        "expires_in": 86400 * 30,
        "authenticated_at": now_utc.isoformat(),
    }
    safe_write_credentials(account_id, payload)

    try:
        stmt = select(Account).where(Account.id == account_id)
        res = await db.execute(stmt)
        account = res.scalar_one_or_none()
        if not account:
            account = Account(
                id=account_id,
                label=payload.get("account_label", f"Account {account_id}"),
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
            if name: account.name = name
            if picture: account.picture = picture
            account.status = "healthy"
            account.last_seen_at = now_utc
        await db.commit()
    except Exception as e:
        logger.warning("Failed to update DB for %s: %s", account_id, e)

    provisioned = provision_account_container(account_id, payload.get("account_label", f"Account {account_id}"), tier=payload.get("tier", "Antigravity Starter"))
    if provisioned:
        logger.info("Container provisioned for %s after PTY auth", account_id)

    return JSONResponse({
        "success": True,
        "account_id": account_id,
        "email": email,
        "name": name,
        "picture": picture,
        "provisioned": provisioned,
        "message": f"Authenticated as {email}."
    }, status_code=200)

@router.post("/token", status_code=status.HTTP_200_OK)
async def upload_token(
    payload: AuthTokenPayload,
    db: AsyncSession = Depends(get_db),
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
    provision_account_container(account_id, payload.account_label or f"Account {account_id}", tier=payload.tier)

    return {
        "success": True,
        "message": f"Authenticated session for {account_id}.",
        "account_id": account_id,
        "authenticated": True,
        "email": email,
    }

class AccountCreatePayload(BaseModel):
    alias: str
    email: str
    plan: str = "Google AI Pro"
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

@router.post("/accounts", status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: AccountCreatePayload,
    db: AsyncSession = Depends(get_db),
):
    """Create a new account and provision container dynamically."""
    stmt = select(Account).order_by(Account.id)
    res = await db.execute(stmt)
    existing = res.scalars().all()
    next_num = 1
    for a in existing:
        if a.id.startswith("acc-"):
            try:
                num = int(a.id.split("-")[1])
                if num >= next_num:
                    next_num = num + 1
            except (ValueError, IndexError):
                pass
    account_id = f"acc-{next_num}"

    now_utc = datetime.now(timezone.utc)
    stored = {
        "account_id": account_id,
        "account_label": payload.alias,
        "email": payload.email,
        "email_verified": True,
        "tier": payload.plan,
        "status": "authenticated",
        "access_token": payload.access_token or "manual",
        "refresh_token": payload.refresh_token,
        "expires_at": now_utc.timestamp() + 86400 * 30,
        "authenticated_at": now_utc.isoformat(),
    }
    safe_write_credentials(account_id, stored)

    account = Account(
        id=account_id,
        label=payload.alias,
        email=payload.email,
        tier=payload.plan,
        status="healthy",
        last_seen_at=now_utc,
    )
    db.add(account)
    await db.commit()
    provision_account_container(account_id, payload.alias, tier=payload.plan)

    return {
        "success": True,
        "account_id": account_id,
        "email": payload.email,
        "name": payload.alias,
        "message": f"Created account {account_id} ({payload.alias}).",
    }

@router.post("/refresh-token")
async def refresh_token_endpoint(
    account_id: str = Query("acc-1"),
):
    """Refresh OAuth token for an account."""
    account_id = validate_account_id(account_id)
    result = refresh_oauth_token(account_id)
    if result:
        return JSONResponse({
            "success": True,
            "expires_in": result.get("expires_in", 3600),
            "updated": True,
        }, status_code=200)
    return JSONResponse({
        "success": False,
        "error": "Token refresh failed — no refresh_token stored"
    }, status_code=400)

@router.delete("/token", status_code=status.HTTP_200_OK)
async def revoke_auth_token(
    account_id: str = Query("acc-1"),
    deprovision: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """Revoke auth. If deprovision=true, also remove container and data.
    If deprovision=false (re-auth), only logout from agy and clear credentials."""
    account_id = validate_account_id(account_id)
    
    container_name = f"gravwatch-agent-{account_id}"
    try:
        subprocess.run(
            ["docker", "exec", container_name, "agy", "logout"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10
        )
        logger.info("Executed agy logout in container %s", container_name)
    except Exception as e:
        logger.warning("Could not execute agy logout in %s: %s", container_name, e)
    
    delete_account_credentials(account_id)
    
    if deprovision:
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
            if deprovision:
                await db.delete(account)
            else:
                account.email = None
                account.name = None
                account.picture = None
                account.status = "unauthenticated"
        if deprovision:
            await db.execute(delete(UsageSnapshot).where(UsageSnapshot.account_id == account_id))
        await db.commit()
    
    return {
        "success": True,
        "message": f"Revoked credentials{' and deprovisioned container' if deprovision else ''} for {account_id}.",
    }

@router.post("/container/toggle")
async def toggle_container_endpoint(
    account_id: str = Query("acc-1"),
):
    account_id = validate_account_id(account_id)
    res = toggle_account_container(account_id)
    return res

@router.get("/status")
async def get_auth_status_endpoint(db: AsyncSession = Depends(get_db)):
    """Get auth status for all known accounts."""
    stmt = select(Account).order_by(Account.id)
    res = await db.execute(stmt)
    accounts = {a.id: a for a in res.scalars().all()}

    active_containers = {c["account_id"]: c["status"] for c in list_active_account_containers()}

    known_ids = set()

    if os.path.exists(settings.DATA_DIR):
        for entry in os.listdir(settings.DATA_DIR):
            if entry.startswith("acc-") and os.path.isdir(os.path.join(settings.DATA_DIR, entry)):
                if not entry.endswith("-agent"):
                    creds = load_account_credentials(entry)
                    if creds and creds.get("status") == "authenticated":
                        known_ids.add(entry)

    result: list[AuthStatusResponse] = []
    for acc_id in sorted(known_ids):
        a = accounts.get(acc_id)
        creds = load_account_credentials(acc_id)
        has_creds = creds is not None
        authenticated = has_creds
        email = creds.get("email") if creds else None
        name = (
            (creds.get("name") if creds else None)
            or (getattr(a, "name", None) if a else None)
            or (creds.get("account_label") if creds else None)
            or (getattr(a, "label", None) if a else None)
        )
        picture = creds.get("picture") if creds else None
        last_update = creds.get("authenticated_at") if creds else (a.last_seen_at if a else None)
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
