# GravWatch - Auth & Session API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from services.server.core.database import get_db
    from services.server.core.config import settings
    from services.server.models.db import Account
    from services.server.models.schemas import AuthTokenPayload, AuthStatusResponse
except ImportError:
    from ..core.database import get_db
    from ..core.config import settings
    from ..models.db import Account
    from ..models.schemas import AuthTokenPayload, AuthStatusResponse

logger = logging.getLogger("gravwatch.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/token", status_code=status.HTTP_200_OK, response_model=AuthStatusResponse)
async def submit_auth_token(
    payload: AuthTokenPayload,
    db: AsyncSession = Depends(get_db)
):
    acc_id = payload.account_id.strip()
    if not acc_id:
        raise HTTPException(status_code=400, detail="Account ID is required.")

    # Target directory on disk/volume
    base_data_dir = os.getenv("DATA_DIR", "./data")
    acc_data_dir = os.path.join(base_data_dir, acc_id)
    os.makedirs(acc_data_dir, exist_ok=True)

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

    creds_path = os.path.join(acc_data_dir, "credentials.json")
    try:
        with open(creds_path, "w", encoding="utf-8") as f:
            json.dump(token_data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed writing credentials for {acc_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to persist token on disk: {e}")

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
        message=f"Successfully authenticated and paired session for {acc_id} via API."
    )


@router.get("/status", response_model=list[AuthStatusResponse])
async def get_auth_status(db: AsyncSession = Depends(get_db)):
    stmt = select(Account).order_by(Account.id)
    res = await db.execute(stmt)
    accounts = res.scalars().all()

    base_data_dir = os.getenv("DATA_DIR", "./data")
    result = []

    if not accounts:
        # Check default acc-1 directory
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
    base_data_dir = os.getenv("DATA_DIR", "./data")
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
