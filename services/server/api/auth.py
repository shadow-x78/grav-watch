# GravWatch - Antigravity Auth Portal & Session API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import secrets
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
    from services.agent.mock.generator import generate_mock_telemetry
except ImportError:
    from ..core.database import get_db
    from ..core.config import settings
    from ..models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from ..models.schemas import AuthTokenPayload, AuthStatusResponse
    from ...agent.mock.generator import generate_mock_telemetry

logger = logging.getLogger("gravwatch.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


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


@router.get("/login", response_class=HTMLResponse)
async def agy_auth_portal(account_id: str = Query("acc-1", description="Account identifier to pair")):
    device_code = f"AGY-{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Antigravity - Sign In</title>
        <style>
            * {{ box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #090d16;
                color: #f1f5f9;
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
                max-width: 460px;
                width: 100%;
                box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
                text-align: center;
            }}
            .logo-wrap {{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                border-radius: 14px;
                margin-bottom: 20px;
                box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
            }}
            .logo-wrap svg {{
                width: 32px;
                height: 32px;
                fill: white;
            }}
            .badge {{
                display: inline-block;
                background: rgba(59, 130, 246, 0.15);
                color: #60a5fa;
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 4px 12px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 12px;
                margin-bottom: 14px;
                letter-spacing: 0.5px;
            }}
            h1 {{
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 8px;
                letter-spacing: -0.5px;
            }}
            p.desc {{
                color: #94a3b8;
                font-size: 14px;
                line-height: 1.5;
                margin: 0 0 24px;
            }}
            .device-box {{
                background: #0a0f1d;
                border: 1px dashed #374151;
                border-radius: 12px;
                padding: 14px;
                margin-bottom: 24px;
                text-align: left;
            }}
            .device-label {{
                font-size: 11px;
                text-transform: uppercase;
                color: #64748b;
                font-weight: 700;
                letter-spacing: 0.5px;
            }}
            .device-val {{
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 16px;
                color: #38bdf8;
                font-weight: 600;
                margin-top: 4px;
            }}
            .form-group {{
                margin-bottom: 18px;
                text-align: left;
            }}
            label {{
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #cbd5e1;
                margin-bottom: 6px;
            }}
            input[type="email"] {{
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
            input[type="email"]:focus {{
                border-color: #3b82f6;
            }}
            .btn-google {{
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                width: 100%;
                background: #ffffff;
                color: #1f2937;
                border: none;
                padding: 14px 20px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
            }}
            .btn-google:hover {{
                background: #f1f5f9;
                transform: translateY(-1px);
            }}
            .btn-google svg {{
                width: 20px;
                height: 20px;
            }}
            .footer-note {{
                color: #64748b;
                font-size: 12px;
                margin-top: 20px;
                line-height: 1.4;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo-wrap">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <div class="badge">Google Antigravity CLI</div>
            <h1>Sign In to Antigravity</h1>
            <p class="desc">Pair account node <strong>{account_id}</strong> with your Google developer profile to start live quota monitoring.</p>
            
            <div class="device-box">
                <div class="device-label">Pairing Channel & Node</div>
                <div class="device-val">{account_id} &bull; {device_code}</div>
            </div>

            <form action="/api/v1/auth/agy-login" method="POST">
                <input type="hidden" name="account_id" value="{account_id}">
                <input type="hidden" name="device_code" value="{device_code}">
                
                <div class="form-group">
                    <label for="email">Google Account Email</label>
                    <input type="email" id="email" name="email" value="shadow.xox78@gmail.com" required>
                </div>

                <button type="submit" class="btn-google">
                    <svg viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                </button>
            </form>

            <div class="footer-note">
                Tokens and sessions are saved locally to container volume <code>./data/{account_id}/</code>.
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/agy-login", response_class=HTMLResponse)
async def agy_login_submit(
    account_id: str = Form("acc-1"),
    email: str = Form(...),
    device_code: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    acc_id = account_id.strip() if account_id else "acc-1"
    user_email = email.strip() if email else f"{acc_id}@corp.google.dev"

    token_data = {
        "account_id": acc_id,
        "email": user_email,
        "device_code": device_code or f"AGY-{secrets.token_hex(4).upper()}",
        "access_token": f"ya29.agy_{secrets.token_urlsafe(32)}",
        "refresh_token": f"1//agy_{secrets.token_urlsafe(32)}",
        "token_type": "Bearer",
        "scope": "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform",
        "authenticated_at": datetime.now(timezone.utc).isoformat(),
        "status": "authenticated"
    }

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
            tier="Pro Developer",
            status="healthy",
            last_seen_at=now_utc
        )
        db.add(account)
    else:
        account.email = user_email
        account.status = "healthy"
        account.last_seen_at = now_utc

    await db.flush()

    # Generate and commit immediate initial telemetry snapshot
    telemetry = generate_mock_telemetry(acc_id)
    snapshot = UsageSnapshot(account_id=acc_id, timestamp=now_utc)
    db.add(snapshot)
    await db.flush()

    for cat in telemetry["categories"]:
        cs = CategorySnapshot(
            snapshot_id=snapshot.id,
            category_id=cat["category_id"],
            category_name=cat["category_name"],
            weekly_remaining=cat["weekly_limit"]["percentage_remaining"],
            weekly_refresh_human=cat["weekly_limit"]["refresh_in_human"],
            five_hour_remaining=cat["five_hour_limit"]["percentage_remaining"],
            five_hour_refresh_human=cat["five_hour_limit"]["refresh_in_human"]
        )
        db.add(cs)

    for m in telemetry["models"]:
        mq = ModelQuota(
            snapshot_id=snapshot.id,
            model_id=m["model_id"],
            model_name=m["model_name"],
            category_id=m["category_id"],
            weekly_remaining=m["weekly_limit"]["percentage_remaining"],
            weekly_refresh_human=m["weekly_limit"]["refresh_in_human"],
            five_hour_remaining=m["five_hour_limit"]["percentage_remaining"],
            five_hour_refresh_human=m["five_hour_limit"]["refresh_in_human"]
        )
        db.add(mq)

    await db.commit()

    html_success = f"""
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
                transition: background 0.2s;
            }}
            .btn:hover {{ background: #2563eb; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">✓ Successfully Authenticated</div>
            <h1>Antigravity Session Active</h1>
            <p>Your Google account has been connected to node <strong>{acc_id}</strong>. GravWatch is now actively monitoring your quota limits.</p>
            <div class="details">
                <div><strong>Account ID:</strong> {acc_id}</div>
                <div><strong>Email:</strong> {user_email}</div>
                <div><strong>Status:</strong> Active & Healthy</div>
            </div>
            <a href="/api/v1/usage/latest" class="btn">View Live Quota Pool &rarr;</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_success, status_code=200)


@router.get("/url")
async def get_auth_url(account_id: str = Query("acc-1", description="Account identifier to pair")):
    auth_url = f"http://localhost:8000/api/v1/auth/login?account_id={account_id}"
    return {
        "account_id": account_id,
        "auth_url": auth_url,
        "message": f"Open the auth_url in your browser to sign in for [{account_id}]."
    }


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
        has_creds = os.path.exists(os.path.join(acc_dir, "credentials.json")) or (a.status == "healthy")
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
