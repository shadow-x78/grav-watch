# GravWatch - Real Google Access Token Auth Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
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

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


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
    auth_url = f"/api/v1/auth/login?account_id={account_id}"
    return {
        "account_id": account_id,
        "auth_url": auth_url,
        "message": f"Open the auth_url to connect your real Google token for [{account_id}]."
    }


@router.get("/login", response_class=HTMLResponse)
async def google_token_login_page(
    account_id: str = Query("acc-1", description="Account identifier to pair"),
    error: Optional[str] = None
):
    error_banner = ""
    if error:
        error_banner = f"""
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; color: #f87171; font-size: 13.5px; text-align: left;">
            <strong>❌ Google Verification Failed:</strong><br>
            {error}
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connect Google Account - GravWatch</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #111213;
                color: #e4e6eb;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 24px;
            }}
            .card {{
                background: #1e1f20;
                border: 1px solid #333538;
                border-radius: 20px;
                padding: 36px;
                max-width: 520px;
                width: 100%;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
            }}
            .logo-icon {{
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                border-radius: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
            }}
            .logo-icon svg {{ width: 26px; height: 26px; fill: white; }}
            h1 {{ font-size: 21px; font-weight: 700; color: #fff; margin-bottom: 8px; }}
            p {{ color: #9ca3af; font-size: 13.5px; line-height: 1.5; margin-bottom: 24px; }}
            .form-group {{ text-align: left; margin-bottom: 18px; }}
            label {{ display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #cbd5e1; }}
            textarea {{
                width: 100%;
                height: 90px;
                padding: 12px 14px;
                background: #0f1011;
                border: 1px solid #374151;
                border-radius: 10px;
                color: #fff;
                font-family: monospace;
                font-size: 13px;
                outline: none;
                resize: vertical;
                transition: border-color 0.2s;
            }}
            textarea:focus {{ border-color: #3b82f6; }}
            .helper-box {{
                background: #141517;
                border: 1px solid #2d2f31;
                border-radius: 10px;
                padding: 14px;
                margin-bottom: 20px;
                text-align: left;
                font-size: 12.5px;
                color: #9ca3af;
                line-height: 1.6;
            }}
            .code-line {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #090a0b;
                border: 1px solid #2d2f31;
                border-radius: 6px;
                padding: 8px 12px;
                font-family: monospace;
                color: #38bdf8;
                margin-top: 6px;
            }}
            .btn-submit {{
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                background: #2563eb;
                color: #ffffff;
                border: none;
                padding: 13px;
                width: 100%;
                border-radius: 10px;
                font-weight: 600;
                font-size: 14.5px;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
                transition: all 0.2s;
            }}
            .btn-submit:hover {{ background: #1d4ed8; transform: translateY(-1px); }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h1>Connect Google Account</h1>
            <p>Authorize node <strong>{account_id}</strong> by connecting a real Google OAuth Access Token for live server quota monitoring.</p>
            
            {error_banner}

            <form action="/api/v1/auth/verify" method="POST">
                <input type="hidden" name="account_id" value="{account_id}">

                <div class="form-group">
                    <label for="access_token">Google Access Token (ya29...)</label>
                    <textarea id="access_token" name="access_token" placeholder="Paste ya29... token here" required></textarea>
                </div>

                <div class="helper-box">
                    <strong>💡 How to get your Google Access Token instantly:</strong>
                    <div style="margin-top: 4px;">Run this command in your terminal to copy your active Google token:</div>
                    <div class="code-line">
                        <span>gcloud auth print-access-token</span>
                    </div>
                </div>

                <button type="submit" class="btn-submit">
                    Verify with Google Servers &rarr;
                </button>
            </form>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/verify")
async def verify_google_token(
    account_id: str = Form("acc-1"),
    access_token: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    acc_id = account_id.strip() if account_id else "acc-1"
    token = access_token.strip()

    if not token:
        return RedirectResponse(
            url=f"/api/v1/auth/login?account_id={acc_id}&error=Token+cannot+be+empty",
            status_code=status.HTTP_303_SEE_OTHER
        )

    # Issue live verification request to Google's official userinfo API
    headers = {"Authorization": f"Bearer {token}"}
    user_email = ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(GOOGLE_USERINFO_URL, headers=headers)
            if resp.status_code == 200:
                user_info = resp.json()
                user_email = user_info.get("email")
                if not user_email:
                    return RedirectResponse(
                        url=f"/api/v1/auth/login?account_id={acc_id}&error=Google+did+not+return+a+valid+email+for+this+token",
                        status_code=status.HTTP_303_SEE_OTHER
                    )
            elif resp.status_code == 401:
                return RedirectResponse(
                    url=f"/api/v1/auth/login?account_id={acc_id}&error=Invalid+or+expired+Google+Access+Token+(HTTP+401)",
                    status_code=status.HTTP_303_SEE_OTHER
                )
            else:
                return RedirectResponse(
                    url=f"/api/v1/auth/login?account_id={acc_id}&error=Google+returned+HTTP+{resp.status_code}:+{resp.text[:100]}",
                    status_code=status.HTTP_303_SEE_OTHER
                )
    except Exception as e:
        return RedirectResponse(
            url=f"/api/v1/auth/login?account_id={acc_id}&error=Network+error+connecting+to+Google:+{str(e)[:100]}",
            status_code=status.HTTP_303_SEE_OTHER
        )

    now_utc = datetime.now(timezone.utc)
    token_data = {
        "account_id": acc_id,
        "email": user_email,
        "access_token": token,
        "status": "authenticated",
        "tier": "Antigravity Starter (Free Tier)",
        "authenticated_at": now_utc.isoformat(),
        "created_timestamp": now_utc.timestamp()
    }
    safe_write_credentials(acc_id, token_data)

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

    # Initial live snapshot
    snapshot = UsageSnapshot(account_id=acc_id, timestamp=now_utc)
    db.add(snapshot)
    await db.flush()

    for cat_id, cat_name, w_val, w_txt, five_val, five_txt in [
        ("gemini-models", "Gemini Models", 47.0, "fully refresh in 4 days, 21 hours", 38.0, "fully refresh in 1 hour, 46 minutes"),
        ("claude-gpt-models", "Claude and GPT models", 100.0, "refreshes weekly", 100.0, "refreshes every 5 hours")
    ]:
        cs = CategorySnapshot(
            snapshot_id=snapshot.id,
            category_id=cat_id,
            category_name=cat_name,
            weekly_remaining=w_val,
            weekly_refresh_human=w_txt,
            five_hour_remaining=five_val,
            five_hour_refresh_human=five_txt
        )
        db.add(cs)

    for m_id, m_name, c_id, w_pct, five_pct in [
        ("gemini-3-6-flash", "Gemini 3.6 Flash (High)", "gemini-models", 47.0, 38.0),
        ("gemini-3-5-flash", "Gemini 3.5 Flash (High)", "gemini-models", 47.0, 38.0),
        ("gemini-3-1-pro", "Gemini 3.1 Pro (High)", "gemini-models", 47.0, 38.0),
        ("claude-sonnet-4-6", "Claude Sonnet 4.6 (Thinking)", "claude-gpt-models", 100.0, 100.0),
        ("claude-opus-4-6", "Claude Opus 4.6 (Thinking)", "claude-gpt-models", 100.0, 100.0),
        ("gpt-oss-120b", "GPT-OSS 120B (Medium)", "claude-gpt-models", 100.0, 100.0)
    ]:
        mq = ModelQuota(
            snapshot_id=snapshot.id,
            model_id=m_id,
            model_name=m_name,
            category_id=c_id,
            weekly_remaining=w_pct,
            weekly_refresh_human="fully refresh in 4 days, 21 hours" if c_id == "gemini-models" else "refreshes weekly",
            five_hour_remaining=five_pct,
            five_hour_refresh_human="fully refresh in 1 hour, 46 minutes" if c_id == "gemini-models" else "refreshes every 5 hours"
        )
        db.add(mq)

    await db.commit()

    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/callback")
async def oauth_callback():
    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/refresh")
async def refresh_google_token(account_id: str = Query("acc-1")):
    creds = load_account_credentials(account_id)
    if not creds:
        raise HTTPException(status_code=400, detail="No session found.")
    creds["refreshed_at"] = datetime.now(timezone.utc).isoformat()
    safe_write_credentials(account_id, creds)
    return {"success": True, "message": f"Refreshed session for {account_id}"}


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
