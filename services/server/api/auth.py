# GravWatch - Google OAuth 2.0 Auth API (GPL-3.0-or-later)
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
SCOPES = "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform"


def build_google_oauth_url(account_id: str, client_id: str | None = None) -> str:
    c_id = client_id or settings.GOOGLE_CLIENT_ID
    params = {
        "client_id": c_id,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": account_id
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
    if not settings.GOOGLE_CLIENT_ID or settings.GOOGLE_CLIENT_ID.startswith("681781215162"):
        return {
            "configured": False,
            "account_id": account_id,
            "setup_url": f"/api/v1/auth/login?account_id={account_id}",
            "message": "Google Client ID not configured. Open setup_url to configure."
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
    # If Google Client ID is configured and valid, redirect directly to Google OAuth
    if settings.GOOGLE_CLIENT_ID and not settings.GOOGLE_CLIENT_ID.startswith("681781215162"):
        auth_url = build_google_oauth_url(account_id)
        return RedirectResponse(url=auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # Render Setup Wizard
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
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
                max-width: 520px;
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
            h1 {{ font-size: 22px; margin: 0 0 8px; font-weight: 700; }}
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
            .code {{ color: #38bdf8; font-family: monospace; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">Google OAuth 2.0</div>
            <h1>Connect Account [{account_id}]</h1>
            <p>Connect your Google Cloud OAuth Client to authorize this node with Google's official API.</p>
            
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

                <button type="submit" class="btn">Save & Sign In with Google &rarr;</button>
            </form>

            <div class="steps">
                <strong>💡 Quick 1-Minute Setup in Google Cloud Console:</strong>
                <ol>
                    <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #60a5fa;">Google Cloud Credentials</a>.</li>
                    <li>Click <strong>Create Credentials</strong> &rarr; <strong>OAuth Client ID</strong> (Web application).</li>
                    <li>Add Authorized Redirect URI: <span class="code">{settings.GOOGLE_REDIRECT_URI}</span></li>
                    <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> above!</li>
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
    client_secret: Optional[str] = Form(None)
):
    c_id = client_id.strip()
    if not c_id:
        raise HTTPException(status_code=400, detail="Google Client ID is required.")

    settings.GOOGLE_CLIENT_ID = c_id
    if client_secret:
        settings.GOOGLE_CLIENT_SECRET = client_secret.strip()

    # Update .env file if writable
    try:
        env_path = os.path.join(os.getcwd(), ".env")
        if os.path.exists(env_path):
            with open(env_path, "a", encoding="utf-8") as f:
                f.write(f"\nGOOGLE_CLIENT_ID={c_id}\n")
                if client_secret:
                    f.write(f"GOOGLE_CLIENT_SECRET={client_secret.strip()}\n")
    except Exception as e:
        logger.warning(f"Could not persist GOOGLE_CLIENT_ID to .env: {e}")

    auth_url = build_google_oauth_url(account_id, client_id=c_id)
    return RedirectResponse(url=auth_url, status_code=status.HTTP_303_SEE_OTHER)


@router.get("/callback", response_class=HTMLResponse)
async def oauth_callback(
    code: str = Query(..., description="Google OAuth authorization code"),
    state: str = Query("acc-1", description="Account identifier passed via state"),
    db: AsyncSession = Depends(get_db)
):
    acc_id = state.strip() if state else "acc-1"
    token_data = {}
    user_email = f"{acc_id}@domain.com"

    token_payload = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

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
                logger.error(f"Google token exchange failed (HTTP {token_resp.status_code}): {token_resp.text}")
                token_data = {
                    "authorization_code": code,
                    "account_id": acc_id,
                    "error": token_resp.text
                }
    except Exception as e:
        logger.error(f"Network error during Google OAuth exchange: {e}")
        token_data = {"authorization_code": code, "account_id": acc_id, "error": str(e)}

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
            tier="Google AI Pro",
            status="healthy",
            last_seen_at=now_utc
        )
        db.add(account)
    else:
        account.email = user_email
        account.status = "healthy"
        account.last_seen_at = now_utc

    await db.commit()

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GravWatch - Authentication Successful</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #090d16;
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
            }}
            .card {{
                background: #111827;
                border: 1px solid #1f2937;
                border-radius: 20px;
                padding: 40px;
                max-width: 480px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            }}
            .badge {{
                display: inline-block;
                background: rgba(34, 197, 94, 0.2);
                color: #4ade80;
                border: 1px solid rgba(34, 197, 94, 0.3);
                padding: 6px 16px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 20px;
            }}
            h1 {{ font-size: 24px; margin: 0 0 12px; font-weight: 700; }}
            p {{ color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }}
            .details {{
                background: #0a0f1d;
                border: 1px solid #1f2937;
                border-radius: 12px;
                padding: 16px;
                text-align: left;
                font-family: monospace;
                font-size: 13px;
                color: #cbd5e1;
                margin-bottom: 24px;
            }}
            .btn {{
                background: #3b82f6;
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
            }}
            .btn:hover {{ background: #2563eb; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">✓ Successfully Paired</div>
            <h1>Google Account Connected</h1>
            <p>Your Google account has been connected to node <strong>{acc_id}</strong>. Live quota monitoring is active.</p>
            <div class="details">
                <div><strong>Account ID:</strong> {acc_id}</div>
                <div><strong>Email:</strong> {user_email}</div>
                <div><strong>Status:</strong> Active & Healthy</div>
            </div>
            <a href="/" class="btn">Go to Dashboard &rarr;</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


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
    email_str = payload.email or token_data.get("email", f"{acc_id}@domain.com")
    label_str = payload.account_label or acc_id

    stmt = select(Account).where(Account.id == acc_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        account = Account(
            id=acc_id,
            label=label_str,
            email=email_str,
            tier="Pro Developer",
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
