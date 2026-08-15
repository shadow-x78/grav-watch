# GravWatch - Pool Aggregator Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.db import Account, UsageSnapshot, ModelQuota
from ..models.schemas import (
    ModelQuotaItem, ModelPoolSummary, PoolSummary,
    AccountDetailResponse, LatestUsageResponse,
    TimeSeriesDataPoint, HistoryResponse
)


async def compute_latest_pool_summary(db: AsyncSession) -> LatestUsageResponse:
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


async def query_usage_history(db: AsyncSession, account_id: str | None, range_str: str) -> HistoryResponse:
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
        range=range_str,
        series=list(reversed(points))
    )
