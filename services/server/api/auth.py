# GravWatch - Real agy CLI Execution & Auth Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import subprocess
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

try:
    from services.server.core.database import get_db
    from services.server.core.config import settings
    from services.server.models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from services.server.models.schemas import AuthTokenPayload, AuthStatusResponse
    from services.agent.collector.scraper import run_agy_usage_command
    from services.agent.collector.parser import parse_agy_output
except ImportError:
    from ..core.database import get_db
    from ..core.config import settings
    from ..models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from ..models.schemas import AuthTokenPayload, AuthStatusResponse
    try:
        from services.agent.collector.scraper import run_agy_usage_command
        from services.agent.collector.parser import parse_agy_output
    except ImportError:
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
        from services.agent.collector.scraper import run_agy_usage_command
        from services.agent.collector.parser import parse_agy_output

logger = logging.getLogger("gravwatch.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


def find_agy_binary() -> str:
    candidates = [
        "/home/shadow-x7/.local/bin/agy",
        "/usr/local/bin/agy",
        "/usr/bin/agy",
        "agy",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packaging/cli/agy"))
    ]
    for c in candidates:
        if os.path.exists(c) and os.access(c, os.X_OK):
            return c
    return "agy"


def execute_agy_auth_login(email: str) -> bool:
    agy_bin = find_agy_binary()
    try:
        proc = subprocess.run(
            [agy_bin, "auth", "login"],
            input=f"{email}\n",
            capture_output=True,
            text=True,
            timeout=10,
            env=os.environ
        )
        logger.info(f"Executed '{agy_bin} auth login' (code {proc.returncode}): {proc.stdout.strip()}")
        return proc.returncode == 0
    except Exception as e:
        logger.error(f"Error executing '{agy_bin} auth login': {e}")
        return False


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
        "message": f"Open the auth_url to sign in with agy for [{account_id}]."
    }


@router.get("/login", response_class=HTMLResponse)
async def login_page(account_id: str = Query("acc-1", description="Account identifier to pair")):
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in with Antigravity (agy) - GravWatch</title>
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
                padding: 24px;
            }}
            .card {{
                background: #242526;
                border: 1px solid #3a3b3c;
                border-radius: 20px;
                padding: 36px;
                max-width: 480px;
                width: 100%;
                box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
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
            .terminal-box {{
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
            .form-group {{ text-align: left; margin-bottom: 20px; }}
            label {{ display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #cbd5e1; }}
            input[type="email"] {{
                width: 100%;
                padding: 13px 15px;
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
            <div class="logo-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h1>Sign in with Antigravity</h1>
            <p>Connect node <strong>{account_id}</strong> to Linux Antigravity CLI to stream live dynamic quotas.</p>

            <div class="terminal-box">
                <span style="color: #64748b;">$</span> agy auth login<br>
                <span style="color: #4ade80;">[Antigravity CLI] Starting Google authentication...</span>
            </div>

            <form action="/api/v1/auth/login" method="POST">
                <input type="hidden" name="account_id" value="{account_id}">

                <div class="form-group">
                    <label for="email">Google Account Email</label>
                    <input type="email" id="email" name="email" placeholder="e.g. shadow.x7e48@gmail.com" required autofocus>
                </div>

                <button type="submit" class="btn-submit">
                    Authenticate & Stream Quota &rarr;
                </button>
            </form>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/login")
async def process_login(
    account_id: str = Form("acc-1"),
    email: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    acc_id = account_id.strip() if account_id else "acc-1"
    user_email = email.strip()

    # 1. Execute authentic host/container 'agy auth login'
    execute_agy_auth_login(user_email)

    # 2. Run authentic 'agy usage' to parse real quota output
    raw_usage = run_agy_usage_command(acc_id)
    parsed = parse_agy_output(raw_usage, acc_id, f"Account ({acc_id})")

    actual_email = parsed.get("email") or user_email
    actual_tier = parsed.get("tier") or "Antigravity Starter"

    now_utc = datetime.now(timezone.utc)

    # 3. Save credentials
    token_data = {
        "account_id": acc_id,
        "email": actual_email,
        "tier": actual_tier,
        "status": "authenticated",
        "authenticated_at": now_utc.isoformat()
    }
    safe_write_credentials(acc_id, token_data)

    # 4. Update Database Account
    stmt = select(Account).where(Account.id == acc_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        account = Account(
            id=acc_id,
            label=f"Account ({acc_id})",
            email=actual_email,
            tier=actual_tier,
            status="healthy",
            last_seen_at=now_utc
        )
        db.add(account)
    else:
        account.email = actual_email
        account.tier = actual_tier
        account.status = "healthy"
        account.last_seen_at = now_utc

    # 5. Save real UsageSnapshot parsed from agy usage
    await db.execute(delete(UsageSnapshot).where(UsageSnapshot.account_id == acc_id))
    snapshot = UsageSnapshot(account_id=acc_id, timestamp=now_utc)
    db.add(snapshot)
    await db.flush()

    for cat in parsed.get("categories", []):
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

    for m in parsed.get("models", []):
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

    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)


@router.delete("/token", status_code=status.HTTP_200_OK)
async def revoke_auth_token(account_id: str = Query("acc-1"), db: AsyncSession = Depends(get_db)):
    base_data_dir = settings.DATA_DIR
    creds_path = os.path.join(base_data_dir, account_id, "credentials.json")
    if os.path.exists(creds_path):
        try:
            os.remove(creds_path)
        except Exception as e:
            logger.warning(f"Error removing credentials file for {account_id}: {e}")

    try:
        gemini_creds = "/root/.gemini/credentials.json"
        if os.path.exists(gemini_creds):
            os.remove(gemini_creds)
    except Exception:
        pass

    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    if account:
        account.status = "unauthenticated"
        account.email = None
        await db.execute(delete(UsageSnapshot).where(UsageSnapshot.account_id == account_id))
        await db.commit()

    return {"success": True, "message": f"Revoked credentials and reset session for {account_id}"}


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
