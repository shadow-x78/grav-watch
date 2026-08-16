# GravWatch - Full Google OAuth 2.0 Client Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import urllib.parse
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

try:
    from services.server.core.database import get_db
    from services.server.core.config import settings
    from services.server.models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from services.server.models.schemas import AuthTokenPayload, AuthStatusResponse
except ImportError:
    from ..core.database import get_db
    from ..core.config import settings
    from ..models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from ..models.schemas import AuthTokenPayload, AuthStatusResponse

logger = logging.getLogger("gravwatch.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
SCOPES = "openid email https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform"


def is_oauth_configured() -> bool:
    c_id = settings.GOOGLE_CLIENT_ID
    c_sec = settings.GOOGLE_CLIENT_SECRET
    return bool(c_id and c_sec and not c_id.startswith("681781215162") and not c_id.startswith("764086051850"))


def build_google_oauth_url(account_id: str) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": account_id,
        "access_type": "offline",
        "prompt": "consent"
    }
    return f"{GOOGLE_AUTH_BASE}?{urllib.parse.urlencode(params)}"


def safe_write_credentials(acc_id: str, token_data: dict):
    base_data_dir = settings.DATA_DIR
    acc_dir = os.path.join(base_data_dir, acc_id)
    try:
        os.makedirs(acc_dir, exist_ok=True)
        creds_path = os.path.join(acc_dir, "credentials.json")
        with open(creds_path, "w", encoding="utf-8") as f:
            json.dump(token_data, f, indent=2)
    except PermissionError:
        logger.warning(f"Could not write credentials file to disk for {acc_id} due to permissions.")
    except Exception as e:
        logger.error(f"Error persisting credentials to disk for {acc_id}: {e}")


def load_account_credentials(acc_id: str) -> dict | None:
    creds_path = os.path.join(settings.DATA_DIR, acc_id, "credentials.json")
    if os.path.exists(creds_path):
        try:
            with open(creds_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None


@router.get("/url")
async def get_auth_url(account_id: str = Query("acc-1", description="Account identifier to pair")):
    if not is_oauth_configured():
        return {
            "configured": False,
            "account_id": account_id,
            "setup_url": f"/api/v1/auth/login?account_id={account_id}",
            "message": "Google Client ID and Secret not configured. Open setup_url."
        }
    auth_url = build_google_oauth_url(account_id)
    return {
        "configured": True,
        "account_id": account_id,
        "auth_url": auth_url,
        "message": f"Open the auth_url to sign in with Google for [{account_id}]."
    }


@router.get("/login", response_class=HTMLResponse)
async def oauth_login_page(account_id: str = Query("acc-1", description="Account identifier to pair")):
    if is_oauth_configured():
        auth_url = build_google_oauth_url(account_id)
        return RedirectResponse(url=auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # Render Clean Google Cloud Credentials Setup Wizard
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GravWatch - Google OAuth Connect</title>
        <style>
            * {{ box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #090d16;
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 24px;
            }}
            .card {{
                background: #111827;
                border: 1px solid #1f2937;
                border-radius: 20px;
                padding: 40px;
                max-width: 540px;
                width: 100%;
                box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
            }}
            .badge {{
                display: inline-block;
                background: rgba(59, 130, 246, 0.15);
                color: #60a5fa;
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 4px 14px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 12px;
                margin-bottom: 16px;
            }}
            h1 {{ font-size: 22px; margin: 0 0 8px; font-weight: 700; color: #fff; }}
            p {{ color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }}
            .form-group {{ margin-bottom: 18px; }}
            label {{ display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #cbd5e1; }}
            input[type="text"], input[type="password"] {{
                width: 100%;
                padding: 12px 14px;
                background: #0a0f1d;
                border: 1px solid #374151;
                border-radius: 10px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }}
            input:focus {{ border-color: #3b82f6; }}
            .btn {{
                background: #2563eb;
                color: white;
                border: none;
                padding: 14px;
                width: 100%;
                border-radius: 10px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                margin-top: 8px;
                transition: background 0.2s;
            }}
            .btn:hover {{ background: #1d4ed8; }}
            .steps {{
                background: #0a0f1d;
                border: 1px solid #1f2937;
                border-radius: 10px;
                padding: 16px;
                margin-top: 24px;
                font-size: 12.5px;
                color: #94a3b8;
                line-height: 1.6;
            }}
            .steps ol {{ margin: 6px 0 0 18px; padding: 0; }}
            .code {{ color: #38bdf8; font-family: monospace; font-weight: 600; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">Google Cloud OAuth Setup</div>
            <h1>Connect Account [{account_id}]</h1>
            <p>Enter your Google Cloud OAuth credentials to authorize node <strong>{account_id}</strong> with Google's official token servers.</p>
            
            <form action="/api/v1/auth/configure" method="POST">
                <input type="hidden" name="account_id" value="{account_id}">
                
                <div class="form-group">
                    <label for="client_id">Google Client ID</label>
                    <input type="text" id="client_id" name="client_id" placeholder="your-client-id.apps.googleusercontent.com" required>
                </div>

                <div class="form-group">
                    <label for="client_secret">Google Client Secret</label>
                    <input type="password" id="client_secret" name="client_secret" placeholder="GOCSPX-..." required>
                </div>

                <button type="submit" class="btn">Save & Authorize with Google &rarr;</button>
            </form>

            <div class="steps">
                <strong>💡 1-Minute Setup in Google Cloud Console:</strong>
                <ol>
                    <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #60a5fa;">Google Cloud Credentials</a>.</li>
                    <li>Click <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong> (Application type: <strong>Web application</strong>).</li>
                    <li>Under <strong>Authorized redirect URIs</strong>, add: <span class="code">{settings.GOOGLE_REDIRECT_URI}</span></li>
                    <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them above!</li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/configure")
async def configure_and_login(
    account_id: str = Form("acc-1"),
    client_id: str = Form(...),
    client_secret: str = Form(...)
):
    c_id = client_id.strip()
    c_sec = client_secret.strip()

    if not c_id or not c_sec:
        raise HTTPException(status_code=400, detail="Both Google Client ID and Client Secret are required.")

    settings.GOOGLE_CLIENT_ID = c_id
    settings.GOOGLE_CLIENT_SECRET = c_sec

    # Update .env file
    try:
        env_path = os.path.join(os.getcwd(), ".env")
        if os.path.exists(env_path):
            with open(env_path, "a", encoding="utf-8") as f:
                f.write(f"\nGOOGLE_CLIENT_ID={c_id}\nGOOGLE_CLIENT_SECRET={c_sec}\n")
    except Exception as e:
        logger.warning(f"Could not append to .env: {e}")

    auth_url = build_google_oauth_url(account_id)
    return RedirectResponse(url=auth_url, status_code=status.HTTP_303_SEE_OTHER)


@router.get("/callback", response_class=HTMLResponse)
async def oauth_callback(
    code: str = Query(..., description="Google OAuth authorization code"),
    state: str = Query("acc-1", description="Account identifier passed via state"),
    db: AsyncSession = Depends(get_db)
):
    acc_id = state.strip() if state else "acc-1"

    token_payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    token_data = {}
    user_email = f"{acc_id}@gmail.com"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(GOOGLE_TOKEN_URL, data=token_payload)
            if token_resp.status_code == 200:
                token_data = token_resp.json()
                token_data["account_id"] = acc_id
                token_data["authenticated_at"] = datetime.now(timezone.utc).isoformat()

                access_token = token_data.get("access_token")
                if access_token:
                    user_resp = await client.get(
                        GOOGLE_USERINFO_URL,
                        headers={"Authorization": f"Bearer {access_token}"}
                    )
                    if user_resp.status_code == 200:
                        user_info = user_resp.json()
                        user_email = user_info.get("email", user_email)
                        token_data["email"] = user_email
            else:
                logger.error(f"Google Token Exchange Error (HTTP {token_resp.status_code}): {token_resp.text}")
                error_html = f"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Google OAuth Error</title>
                    <style>
                        body {{ font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                        .card {{ background: #1e293b; border: 1px solid #ef4444; border-radius: 16px; padding: 36px; max-width: 500px; }}
                        h2 {{ color: #f87171; margin-top: 0; }}
                        pre {{ background: #0f172a; padding: 12px; border-radius: 8px; color: #cbd5e1; font-size: 13px; overflow: auto; }}
                        a {{ color: #38bdf8; text-decoration: none; font-weight: 600; }}
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>Google OAuth Exchange Failed</h2>
                        <p>Google returned the following error response:</p>
                        <pre>{token_resp.text}</pre>
                        <p>Please ensure your <strong>Authorized Redirect URI</strong> on Google Cloud Console matches: <code>{settings.GOOGLE_REDIRECT_URI}</code></p>
                        <a href="/api/v1/auth/login?account_id={acc_id}">&larr; Try Again</a>
                    </div>
                </body>
                </html>
                """
                return HTMLResponse(content=error_html, status_code=400)
    except Exception as e:
        logger.error(f"Network error during Google OAuth exchange: {e}")
        raise HTTPException(status_code=500, detail=f"Network error during Google OAuth: {e}")

    token_data["email"] = user_email
    safe_write_credentials(acc_id, token_data)

    now_utc = datetime.now(timezone.utc)
    stmt = select(Account).where(Account.id == acc_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        account = Account(
            id=acc_id,
            label=f"Account ({acc_id})",
            email=user_email,
            tier="Antigravity Starter (Free Tier)",
            status="healthy",
            last_seen_at=now_utc
        )
        db.add(account)
    else:
        account.email = user_email
        account.status = "healthy"
        account.last_seen_at = now_utc

    await db.commit()

    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/refresh")
async def refresh_google_token(account_id: str = Query("acc-1")):
    creds = load_account_credentials(account_id)
    if not creds or "refresh_token" not in creds:
        raise HTTPException(status_code=400, detail="No refresh token found for this account.")

    refresh_payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data=refresh_payload)
            if resp.status_code == 200:
                new_tokens = resp.json()
                creds["access_token"] = new_tokens["access_token"]
                creds["expires_in"] = new_tokens.get("expires_in", 3600)
                creds["refreshed_at"] = datetime.now(timezone.utc).isoformat()
                safe_write_credentials(account_id, creds)
                return {"success": True, "message": f"Refreshed access token for {account_id}"}
            else:
                logger.error(f"Google token refresh failed: {resp.text}")
                raise HTTPException(status_code=400, detail=f"Token refresh failed: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing token: {e}")


@router.post("/token", status_code=status.HTTP_200_OK, response_model=AuthStatusResponse)
async def submit_auth_token(
    payload: AuthTokenPayload,
    db: AsyncSession = Depends(get_db)
):
    acc_id = payload.account_id.strip()
    if not acc_id:
        raise HTTPException(status_code=400, detail="Account ID is required.")

    token_data = {}
    if payload.oauth_credentials_json:
        token_data = payload.oauth_credentials_json
    else:
        if payload.access_token:
            token_data["access_token"] = payload.access_token
        if payload.refresh_token:
            token_data["refresh_token"] = payload.refresh_token
        if payload.email:
            token_data["email"] = payload.email

    safe_write_credentials(acc_id, token_data)

    now_utc = datetime.now(timezone.utc)
    email_str = payload.email or token_data.get("email", "shadow.x7e48@gmail.com")
    label_str = payload.account_label or acc_id

    stmt = select(Account).where(Account.id == acc_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        account = Account(
            id=acc_id,
            label=label_str,
            email=email_str,
            tier="Antigravity Starter (Free Tier)",
            status="healthy",
            last_seen_at=now_utc
        )
        db.add(account)
    else:
        account.label = label_str
        account.email = email_str
        account.status = "healthy"
        account.last_seen_at = now_utc

    await db.commit()

    return AuthStatusResponse(
        account_id=acc_id,
        authenticated=True,
        email=email_str,
        last_token_update=now_utc,
        message=f"Successfully authenticated and paired session for {acc_id}."
    )


@router.get("/status", response_model=list[AuthStatusResponse])
async def get_auth_status(db: AsyncSession = Depends(get_db)):
    stmt = select(Account).order_by(Account.id)
    res = await db.execute(stmt)
    accounts = res.scalars().all()

    base_data_dir = settings.DATA_DIR
    result = []

    if not accounts:
        acc_1_dir = os.path.join(base_data_dir, "acc-1")
        has_creds = os.path.exists(os.path.join(acc_1_dir, "credentials.json"))
        result.append(AuthStatusResponse(
            account_id="acc-1",
            authenticated=has_creds,
            email=None,
            last_token_update=None,
            message="Authenticated on disk" if has_creds else "Unauthenticated"
        ))
        return result

    for a in accounts:
        acc_dir = os.path.join(base_data_dir, a.id)
        has_creds = os.path.exists(os.path.join(acc_dir, "credentials.json")) and (a.status == "healthy")
        result.append(AuthStatusResponse(
            account_id=a.id,
            authenticated=has_creds,
            email=a.email,
            last_token_update=a.last_seen_at,
            message="Authenticated" if has_creds else "Unauthenticated"
        ))

    return result


@router.delete("/token", status_code=status.HTTP_200_OK)
async def revoke_auth_token(account_id: str, db: AsyncSession = Depends(get_db)):
    base_data_dir = settings.DATA_DIR
    creds_path = os.path.join(base_data_dir, account_id, "credentials.json")
    if os.path.exists(creds_path):
        try:
            os.remove(creds_path)
        except Exception as e:
            logger.warning(f"Error removing credentials file for {account_id}: {e}")

    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    if account:
        account.status = "unauthenticated"
        await db.commit()

    return {"success": True, "message": f"Revoked credentials for {account_id}"}
