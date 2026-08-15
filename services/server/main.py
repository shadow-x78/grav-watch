# GravWatch - Central API Server (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import httpx
from fastapi import FastAPI, Depends, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from config import settings
from models import (
    Account, UsageSnapshot, ModelQuota, get_db, init_db,
    UsageIngestRequest, IngestResponse, LatestUsageResponse,
    PoolSummary, ModelPoolSummary, AccountDetailResponse,
    ModelQuotaItem, HistoryResponse, TimeSeriesDataPoint
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("gravwatch.server")
_alert_cache = {}


# ==============================================================================
# Notification Engine
# ==============================================================================

async def dispatch_discord_alert(account_label: str, model_name: str, percentage: float, used: int, limit: int, resets_in: str) -> bool:
    if not settings.DISCORD_WEBHOOK_URL:
        return False

    color = 0xEA4335 if percentage >= 95.0 else 0xFBBC05
    payload = {
        "username": "GravWatch",
        "embeds": [{
            "title": "🚨 GravWatch Quota Warning",
            "description": f"Model **{model_name}** on **{account_label}** reached **{percentage}%** capacity.",
            "color": color,
            "fields": [
                {"name": "Account", "value": account_label, "inline": True},
                {"name": "Model", "value": model_name, "inline": True},
                {"name": "Utilization", "value": f"`{used} / {limit}` ({percentage}%)", "inline": True},
                {"name": "Reset In", "value": resets_in or "N/A", "inline": True}
            ],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(settings.DISCORD_WEBHOOK_URL, json=payload)
            return resp.status_code in (200, 204)
    except Exception as e:
        logger.error(f"Failed to dispatch Discord webhook: {e}")
        return False


async def evaluate_quota_alerts(payload: UsageIngestRequest):
    if not settings.DISCORD_WEBHOOK_URL:
        return

    now = datetime.now(timezone.utc)
    for model in payload.models:
        if model.percentage >= settings.ALERT_THRESHOLD_PERCENT:
            cache_key = f"{payload.account_id}:{model.model_id}"
            last_alerted = _alert_cache.get(cache_key)

            if not last_alerted or (now - last_alerted).total_seconds() > 1800:
                success = await dispatch_discord_alert(
                    account_label=payload.account_label,
                    model_name=model.model_name,
                    percentage=model.percentage,
                    used=model.used,
                    limit=model.limit,
                    resets_in=model.resets_in_human
                )
                if success:
                    _alert_cache[cache_key] = now


# ==============================================================================
# Aggregation Engine
# ==============================================================================

async def compute_latest_pool_summary(db: AsyncSession) -> LatestUsageResponse:
    acc_stmt = select(Account).order_by(Account.id)
    acc_res = await db.execute(acc_stmt)
    accounts = acc_res.scalars().all()

    account_details = []
    model_aggregation = defaultdict(lambda: {"name": "", "used": 0, "limit": 0, "accounts_count": 0})
    total_pool_used, total_pool_limit, online_count = 0, 0, 0

    for acc in accounts:
        snap_stmt = select(UsageSnapshot).where(
            UsageSnapshot.account_id == acc.id
        ).order_by(UsageSnapshot.timestamp.desc()).limit(1).options(
            selectinload(UsageSnapshot.models)
        )
        snap_res = await db.execute(snap_stmt)
        latest_snap = snap_res.scalar_one_or_none()

        models_list = []
        if latest_snap and latest_snap.models:
            online_count += 1
            for m in latest_snap.models:
                models_list.append(ModelQuotaItem(
                    model_id=m.model_id,
                    model_name=m.model_name,
                    used=m.used,
                    limit=m.limit,
                    percentage=m.percentage,
                    unit=m.unit,
                    resets_in_human=m.resets_in_human,
                    resets_at=m.resets_at
                ))
                agg = model_aggregation[m.model_id]
                agg["name"] = m.model_name
                agg["used"] += m.used
                agg["limit"] += m.limit
                agg["accounts_count"] += 1
                total_pool_used += m.used
                total_pool_limit += m.limit

        account_details.append(AccountDetailResponse(
            id=acc.id,
            label=acc.label,
            email=acc.email,
            tier=acc.tier,
            status=acc.status,
            last_seen_at=acc.last_seen_at or datetime.now(timezone.utc),
            models=models_list
        ))

    model_summaries = []
    for model_id, agg in model_aggregation.items():
        used, limit = agg["used"], agg["limit"]
        pct = round((used / limit) * 100, 1) if limit > 0 else 0.0
        model_summaries.append(ModelPoolSummary(
            model_id=model_id,
            model_name=agg["name"],
            total_used=used,
            total_limit=limit,
            pool_percentage=min(pct, 100.0),
            active_accounts_count=agg["accounts_count"]
        ))

    overall_pct = round((total_pool_used / total_pool_limit) * 100, 1) if total_pool_limit > 0 else 0.0

    return LatestUsageResponse(
        timestamp=datetime.now(timezone.utc),
        pool_summary=PoolSummary(
            total_accounts=len(accounts),
            online_accounts=online_count,
            total_requests_used=total_pool_used,
            total_requests_limit=total_pool_limit,
            overall_percentage=min(overall_pct, 100.0),
            model_summaries=model_summaries
        ),
        accounts=account_details
    )


# ==============================================================================
# FastAPI Application & Endpoints
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("GravWatch API Server online.")
    yield
    logger.info("GravWatch API Server shutdown.")


app = FastAPI(
    title="GravWatch API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", tags=["Diagnostic"])
async def health_check():
    return {
        "status": "healthy",
        "service": "gravwatch-server",
        "version": "1.0.0"
    }


@app.post("/api/v1/usage", response_model=IngestResponse, status_code=status.HTTP_201_CREATED, tags=["Usage"])
async def ingest_telemetry(
    payload: UsageIngestRequest,
    x_agent_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if x_agent_key != settings.AGENT_API_KEY:
        logger.warning(f"Unauthorized telemetry attempt from [{payload.account_id}]")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Agent-Key header"
        )

    acc_stmt = select(Account).where(Account.id == payload.account_id)
    acc_res = await db.execute(acc_stmt)
    account = acc_res.scalar_one_or_none()

    if not account:
        account = Account(
            id=payload.account_id,
            label=payload.account_label,
            email=payload.email,
            tier=payload.tier,
            status=payload.status,
            last_seen_at=payload.timestamp
        )
        db.add(account)
    else:
        account.label = payload.account_label
        account.email = payload.email
        account.tier = payload.tier
        account.status = payload.status
        account.last_seen_at = payload.timestamp

    snapshot = UsageSnapshot(
        account_id=payload.account_id,
        timestamp=payload.timestamp,
        total_models=len(payload.models)
    )
    db.add(snapshot)
    await db.flush()

    for m in payload.models:
        quota_row = ModelQuota(
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
        db.add(quota_row)

    await db.commit()

    try:
        await evaluate_quota_alerts(payload)
    except Exception as e:
        logger.error(f"Alert evaluation error: {e}")

    return IngestResponse(
        success=True,
        message=f"Recorded telemetry for {payload.account_id}"
    )


@app.get("/api/v1/usage/latest", response_model=LatestUsageResponse, tags=["Usage"])
async def get_latest_usage(db: AsyncSession = Depends(get_db)):
    return await compute_latest_pool_summary(db)


@app.get("/api/v1/usage/history", response_model=HistoryResponse, tags=["Usage"])
async def get_usage_history(
    account_id: Optional[str] = Query(None),
    range: str = Query("24h", pattern="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    delta_map = {
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30)
    }
    cutoff = now - delta_map[range]

    stmt = select(UsageSnapshot).where(UsageSnapshot.timestamp >= cutoff).options(
        selectinload(UsageSnapshot.models)
    ).order_by(UsageSnapshot.timestamp.asc())

    if account_id:
        stmt = stmt.where(UsageSnapshot.account_id == account_id)

    result = await db.execute(stmt)
    snapshots = result.scalars().all()

    series = [
        TimeSeriesDataPoint(
            timestamp=snap.timestamp,
            account_id=snap.account_id,
            model_id=m.model_id,
            used=m.used,
            percentage=m.percentage
        )
        for snap in snapshots
        for m in snap.models
    ]

    return HistoryResponse(range=range, series=series)


@app.get("/api/v1/accounts", response_model=List[AccountDetailResponse], tags=["Accounts"])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    stmt = select(Account).order_by(Account.id)
    result = await db.execute(stmt)
    accounts = result.scalars().all()
    
    return [
        AccountDetailResponse(
            id=acc.id,
            label=acc.label,
            email=acc.email,
            tier=acc.tier,
            status=acc.status,
            last_seen_at=acc.last_seen_at,
            models=[]
        )
        for acc in accounts
    ]


@app.post("/api/v1/accounts/test-alert", tags=["Diagnostic"])
async def trigger_test_alert():
    success = await dispatch_discord_alert(
        account_label="Account 1 (Test)",
        model_name="Gemini 3.5 Flash",
        percentage=88.5,
        used=885,
        limit=1000,
        resets_in="03h 12m"
    )
    if not success:
        raise HTTPException(status_code=502, detail="Failed to dispatch test alert.")
    return {"success": True, "message": "Test alert dispatched successfully."}
