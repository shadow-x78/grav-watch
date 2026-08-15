# GravWatch - FastAPI Central Telemetry Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Security, status, Query
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from .config import settings
    from .models import (
        init_db, get_db,
        Account, UsageSnapshot, ModelQuota,
        UsageIngestRequest, LatestUsageResponse, HistoryResponse,
        AccountDetailResponse, PoolSummary, ModelPoolSummary,
        ModelQuotaItem, TimeSeriesDataPoint
    )
except ImportError:
    from config import settings
    from models import (
        init_db, get_db,
        Account, UsageSnapshot, ModelQuota,
        UsageIngestRequest, LatestUsageResponse, HistoryResponse,
        AccountDetailResponse, PoolSummary, ModelPoolSummary,
        ModelQuotaItem, TimeSeriesDataPoint
    )

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gravwatch.server")

agent_key_header = APIKeyHeader(name="X-Agent-Key", auto_error=False)


async def get_current_agent(key: str = Security(agent_key_header)):
    if not key or key != settings.AGENT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Agent-Key header."
        )
    return key


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GravWatch Database...")
    await init_db()
    yield
    logger.info("Shutting down GravWatch Server...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-account Google Antigravity CLI quota monitoring & telemetry engine",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "gravwatch-server",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/v1/usage", status_code=status.HTTP_201_CREATED, tags=["Telemetry"])
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


@app.get("/api/v1/usage/latest", response_model=LatestUsageResponse, tags=["Telemetry"])
async def get_latest_usage(db: AsyncSession = Depends(get_db)):
    accounts_stmt = select(Account).order_by(Account.id)
    acc_res = await db.execute(accounts_stmt)
    accounts = acc_res.scalars().all()

    account_details = []
    model_pool_map = {}
    total_used_all = 0
    total_limit_all = 0

    for acc in accounts:
        snap_stmt = select(UsageSnapshot).where(
            UsageSnapshot.account_id == acc.id
        ).order_by(UsageSnapshot.timestamp.desc()).limit(1)

        snap_res = await db.execute(snap_stmt)
        latest_snap = snap_res.scalar_one_or_none()

        models_list = []
        if latest_snap:
            m_stmt = select(ModelQuota).where(ModelQuota.snapshot_id == latest_snap.id)
            m_res = await db.execute(m_stmt)
            quotas = m_res.scalars().all()

            for q in quotas:
                models_list.append(ModelQuotaItem(
                    model_id=q.model_id,
                    model_name=q.model_name,
                    used=q.used,
                    limit=q.limit,
                    percentage=q.percentage,
                    unit=q.unit,
                    resets_in_human=q.resets_in_human,
                    resets_at=q.resets_at
                ))

                if q.model_id not in model_pool_map:
                    model_pool_map[q.model_id] = {
                        "name": q.model_name,
                        "used": 0,
                        "limit": 0,
                        "accounts": set()
                    }
                model_pool_map[q.model_id]["used"] += q.used
                model_pool_map[q.model_id]["limit"] += q.limit
                model_pool_map[q.model_id]["accounts"].add(acc.id)

                total_used_all += q.used
                total_limit_all += q.limit

        account_details.append(AccountDetailResponse(
            id=acc.id,
            label=acc.label,
            email=acc.email,
            tier=acc.tier,
            status=acc.status,
            last_seen_at=acc.last_seen_at,
            models=models_list
        ))

    model_summaries = []
    for m_id, data in model_pool_map.items():
        pool_pct = round((data["used"] / data["limit"] * 100), 1) if data["limit"] > 0 else 0.0
        model_summaries.append(ModelPoolSummary(
            model_id=m_id,
            model_name=data["name"],
            total_used=data["used"],
            total_limit=data["limit"],
            pool_percentage=min(pool_pct, 100.0),
            active_accounts_count=len(data["accounts"])
        ))

    overall_pct = round((total_used_all / total_limit_all * 100), 1) if total_limit_all > 0 else 0.0

    pool_summary = PoolSummary(
        total_accounts=len(accounts),
        online_accounts=len([a for a in accounts if a.status == "healthy"]),
        total_requests_used=total_used_all,
        total_requests_limit=total_limit_all,
        overall_percentage=min(overall_pct, 100.0),
        model_summaries=model_summaries
    )

    return LatestUsageResponse(
        timestamp=datetime.now(timezone.utc),
        pool_summary=pool_summary,
        accounts=account_details
    )


@app.get("/api/v1/usage/history", response_model=HistoryResponse, tags=["Telemetry"])
async def get_usage_history(
    account_id: str | None = None,
    range: str = Query("24h", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UsageSnapshot).order_by(UsageSnapshot.timestamp.desc()).limit(50)
    if account_id:
        stmt = stmt.where(UsageSnapshot.account_id == account_id)

    res = await db.execute(stmt)
    snapshots = res.scalars().all()

    points = []
    for s in snapshots:
        m_stmt = select(ModelQuota).where(ModelQuota.snapshot_id == s.id)
        m_res = await db.execute(m_stmt)
        quotas = m_res.scalars().all()

        for q in quotas:
            points.append(TimeSeriesDataPoint(
                timestamp=s.timestamp,
                account_id=s.account_id,
                model_id=q.model_id,
                used=q.used,
                percentage=q.percentage
            ))

    return HistoryResponse(
        range=range,
        series=list(reversed(points))
    )


@app.get("/api/v1/accounts", response_model=list[AccountDetailResponse], tags=["Accounts"])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    stmt = select(Account).order_by(Account.id)
    res = await db.execute(stmt)
    accounts = res.scalars().all()

    resp = []
    for a in accounts:
        resp.append(AccountDetailResponse(
            id=a.id,
            label=a.label,
            email=a.email,
            tier=a.tier,
            status=a.status,
            last_seen_at=a.last_seen_at,
            models=[]
        ))
    return resp
