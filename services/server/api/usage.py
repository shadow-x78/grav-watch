# GravWatch - Telemetry Usage API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.database import get_db
from ..core.security import get_current_agent
from ..models.db import Account, UsageSnapshot, ModelQuota
from ..models.schemas import UsageIngestRequest, LatestUsageResponse, HistoryResponse
from ..engine.aggregator import compute_latest_pool_summary, query_usage_history

logger = logging.getLogger("gravwatch.api.usage")
router = APIRouter(prefix="/usage", tags=["Telemetry"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_usage(
    payload: UsageIngestRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_agent)
):
    try:
        stmt = select(Account).where(Account.id == payload.account_id)
        result = await db.execute(stmt)
        account = result.scalar_one_or_none()

        now_utc = datetime.now(timezone.utc)
        if not account:
            account = Account(
                id=payload.account_id,
                label=payload.account_label,
                email=payload.email,
                tier=payload.tier,
                status=payload.status,
                last_seen_at=now_utc
            )
            db.add(account)
        else:
            account.label = payload.account_label
            account.email = payload.email
            account.tier = payload.tier
            account.status = payload.status
            account.last_seen_at = now_utc

        await db.flush()

        snapshot_time = payload.timestamp if payload.timestamp else now_utc
        snapshot = UsageSnapshot(
            account_id=payload.account_id,
            timestamp=snapshot_time
        )
        db.add(snapshot)
        await db.flush()

        for m in payload.models:
            mq = ModelQuota(
                snapshot_id=snapshot.id,
                model_id=m.model_id,
                model_name=m.model_name,
                used=m.used,
                limit=m.limit,
                percentage=m.percentage,
                unit=m.unit,
                resets_in_human=m.resets_in_human,
                resets_at=m.resets_at
            )
            db.add(mq)

        await db.commit()
        return {"success": True, "message": f"Recorded telemetry for {payload.account_id}"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error ingesting usage for {payload.account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal database error while recording telemetry")


@router.get("/latest", response_model=LatestUsageResponse)
async def get_latest_usage(db: AsyncSession = Depends(get_db)):
    return await compute_latest_pool_summary(db)


@router.get("/history", response_model=HistoryResponse)
async def get_usage_history(
    account_id: str | None = None,
    range: str = Query("24h", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    return await query_usage_history(db, account_id=account_id, range_str=range)
