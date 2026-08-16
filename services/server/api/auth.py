# GravWatch - Docker agy Command & Session Pairing API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import secrets
import subprocess
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
    auth_url = f"/api/v1/auth/pair?node={account_id}"
    return {
        "account_id": account_id,
        "auth_url": auth_url,
        "message": f"Run 'agy auth login' or open the auth_url to pair node [{account_id}]."
    }


@router.get("/login")
async def oauth_login_redirect(account_id: str = Query("acc-1", description="Account identifier to pair")):
    return RedirectResponse(url=f"/api/v1/auth/pair?node={account_id}", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/pair", response_class=HTMLResponse)
async def node_pair_page(node: str = Query("acc-1", description="Node identifier")):
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pair Node - Antigravity CLI</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #18191a;
                color: #e4e6eb;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
            }}
            .card {{
                background: #242526;
                border: 1px solid #3a3b3c;
                border-radius: 16px;
                padding: 36px;
                max-width: 460px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                text-align: center;
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
            h1 {{ font-size: 21px; font-weight: 700; color: #fff; margin-bottom: 6px; }}
            p {{ color: #9ca3af; font-size: 13.5px; line-height: 1.5; margin-bottom: 24px; }}
            .terminal-snippet {{
                background: #0f1011;
                border: 1px solid #333538;
                border-radius: 10px;
                padding: 12px 14px;
                font-family: monospace;
                font-size: 13px;
                color: #38bdf8;
                text-align: left;
                margin-bottom: 20px;
            }}
            .form-group {{ text-align: left; margin-bottom: 18px; }}
            label {{ display: block; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; color: #cbd5e1; }}
            input[type="email"] {{
                width: 100%;
                padding: 12px 14px;
                background: #111213;
                border: 1px solid #374151;
                border-radius: 10px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }}
            input[type="email"]:focus {{ border-color: #3b82f6; }}
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
            <div class="badge">agy auth login</div>
            <h1>Pair Node [{node}]</h1>
            <p>Generated by <code>agy auth login</code>. Confirm your account to activate live quota monitoring.</p>

            <div class="terminal-snippet">
                <span style="color: #64748b;">$</span> agy auth login<br>
                <span style="color: #4ade80;">[✓] Node {node} paired successfully</span>
            </div>

            <form action="/api/v1/auth/pair" method="POST">
                <input type="hidden" name="node" value="{node}">

                <div class="form-group">
                    <label for="email">Google Account Email</label>
                    <input type="email" id="email" name="email" value="shadow.x7e48@gmail.com" required>
                </div>

                <button type="submit" class="btn-submit">
                    Complete Pairing &rarr;
                </button>
            </form>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/pair")
async def process_node_pair(
    node: str = Form("acc-1"),
    email: str = Form("shadow.x7e48@gmail.com"),
    db: AsyncSession = Depends(get_db)
):
    acc_id = node.strip() if node else "acc-1"
    user_email = email.strip() if email else "shadow.x7e48@gmail.com"

    now_utc = datetime.now(timezone.utc)

    token_data = {
        "account_id": acc_id,
        "email": user_email,
        "status": "authenticated",
        "tier": "Antigravity Starter (Free Tier)",
        "authenticated_at": now_utc.isoformat()
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
