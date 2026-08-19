# GravWatch - Pool Aggregator Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from services.server.models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from services.server.models.schemas import (
        LimitWindow, CategoryQuota, ModelQuotaItem,
        CategoryPoolSummary, ModelPoolSummary, PoolSummary,
        AccountDetailResponse, LatestUsageResponse,
        TimeSeriesDataPoint, HistoryResponse
    )
except ImportError:
    from ..models.db import Account, UsageSnapshot, CategorySnapshot, ModelQuota
    from ..models.schemas import (
        LimitWindow, CategoryQuota, ModelQuotaItem,
        CategoryPoolSummary, ModelPoolSummary, PoolSummary,
        AccountDetailResponse, LatestUsageResponse,
        TimeSeriesDataPoint, HistoryResponse
    )

async def compute_latest_pool_summary(db: AsyncSession) -> LatestUsageResponse:
    accounts_stmt = select(Account).order_by(Account.id)
    acc_res = await db.execute(accounts_stmt)
    accounts = acc_res.scalars().all()

    account_details = []
    category_pool_map = {}
    model_pool_map = {}

    total_weekly_remaining = 0.0
    total_5h_remaining = 0.0
    count_active_cats = 0
    any_real_quota = False

    for acc in accounts:
        snap_stmt = select(UsageSnapshot).where(
            UsageSnapshot.account_id == acc.id
        ).order_by(UsageSnapshot.timestamp.desc()).limit(1)

        snap_res = await db.execute(snap_stmt)
        latest_snap = snap_res.scalar_one_or_none()

        cats_list = []
        models_list = []

        if latest_snap:
            c_stmt = select(CategorySnapshot).where(CategorySnapshot.snapshot_id == latest_snap.id)
            c_res = await db.execute(c_stmt)
            categories = c_res.scalars().all()

            for c in categories:
                cats_list.append(CategoryQuota(
                    category_id=c.category_id,
                    category_name=c.category_name,
                    weekly_limit=LimitWindow(
                        percentage_remaining=c.weekly_remaining,
                        refresh_in_human=c.weekly_refresh_human
                    ),
                    five_hour_limit=LimitWindow(
                        percentage_remaining=c.five_hour_remaining,
                        refresh_in_human=c.five_hour_refresh_human
                    )
                ))

                if c.category_id not in category_pool_map:
                    category_pool_map[c.category_id] = {
                        "name": c.category_name,
                        "weekly_sum": 0.0,
                        "five_hour_sum": 0.0,
                        "weekly_refresh": c.weekly_refresh_human,
                        "five_hour_refresh": c.five_hour_refresh_human,
                        "count": 0
                    }
                if c.weekly_remaining is not None:
                    category_pool_map[c.category_id]["weekly_sum"] += c.weekly_remaining
                    category_pool_map[c.category_id]["count"] += 1
                    total_weekly_remaining += c.weekly_remaining
                    any_real_quota = True
                if c.five_hour_remaining is not None:
                    category_pool_map[c.category_id]["five_hour_sum"] += c.five_hour_remaining
                    count_active_cats += 1

            m_stmt = select(ModelQuota).where(ModelQuota.snapshot_id == latest_snap.id)
            m_res = await db.execute(m_stmt)
            quotas = m_res.scalars().all()

            for q in quotas:
                models_list.append(ModelQuotaItem(
                    model_id=q.model_id,
                    model_name=q.model_name,
                    category_id=q.category_id,
                    weekly_limit=LimitWindow(
                        percentage_remaining=q.weekly_remaining,
                        refresh_in_human=q.weekly_refresh_human
                    ),
                    five_hour_limit=LimitWindow(
                        percentage_remaining=q.five_hour_remaining,
                        refresh_in_human=q.five_hour_refresh_human
                    )
                ))

                if q.model_id not in model_pool_map:
                    model_pool_map[q.model_id] = {
                        "name": q.model_name,
                        "category_id": q.category_id,
                        "weekly_sum": 0.0,
                        "five_hour_sum": 0.0,
                        "accounts": set(),
                        "quota_count": 0
                    }
                if q.weekly_remaining is not None:
                    model_pool_map[q.model_id]["weekly_sum"] += q.weekly_remaining
                    model_pool_map[q.model_id]["quota_count"] += 1
                if q.five_hour_remaining is not None:
                    model_pool_map[q.model_id]["five_hour_sum"] += q.five_hour_remaining
                model_pool_map[q.model_id]["accounts"].add(acc.id)

        account_details.append(AccountDetailResponse(
            id=acc.id,
            label=acc.label,
            email=acc.email,
            name=getattr(acc, "name", None),
            picture=getattr(acc, "picture", None),
            tier=acc.tier,
            status=acc.status,
            last_seen_at=acc.last_seen_at,
            categories=cats_list,
            models=models_list
        ))

    category_summaries = []
    for c_id, data in category_pool_map.items():
        cnt = data["count"]
        category_summaries.append(CategoryPoolSummary(
            category_id=c_id,
            category_name=data["name"],
            weekly_limit_remaining=round(data["weekly_sum"] / cnt, 1) if cnt > 0 else None,
            five_hour_limit_remaining=round(data["five_hour_sum"] / cnt, 1) if cnt > 0 else None,
            weekly_refresh_human=data["weekly_refresh"],
            five_hour_refresh_human=data["five_hour_refresh"]
        ))

    model_summaries = []
    for m_id, data in model_pool_map.items():
        q_cnt = data.get("quota_count", 0)
        model_summaries.append(ModelPoolSummary(
            model_id=m_id,
            model_name=data["name"],
            category_id=data["category_id"],
            weekly_limit_remaining=round(data["weekly_sum"] / q_cnt, 1) if q_cnt > 0 else None,
            five_hour_limit_remaining=round(data["five_hour_sum"] / q_cnt, 1) if q_cnt > 0 else None,
            active_accounts_count=len(data["accounts"])
        ))

    overall_w_avg = round(total_weekly_remaining / count_active_cats, 1) if count_active_cats > 0 else None
    overall_5h_avg = round(total_5h_remaining / count_active_cats, 1) if count_active_cats > 0 else None

    pool_summary = PoolSummary(
        total_accounts=len(accounts),
        online_accounts=len([a for a in accounts if a.status == "healthy"]),
        overall_weekly_remaining=overall_w_avg,
        overall_five_hour_remaining=overall_5h_avg,
        quota_available=any_real_quota,
        category_summaries=category_summaries,
        model_summaries=model_summaries
    )

    return LatestUsageResponse(
        timestamp=datetime.now(timezone.utc),
        pool_summary=pool_summary,
        accounts=account_details
    )

async def query_usage_history(db: AsyncSession, account_id: str | None, range_str: str) -> HistoryResponse:
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    range_deltas = {
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    cutoff = now - range_deltas.get(range_str, range_deltas["24h"])

    stmt = select(UsageSnapshot).where(
        UsageSnapshot.timestamp >= cutoff
    ).order_by(UsageSnapshot.timestamp.asc())
    if account_id:
        stmt = stmt.where(UsageSnapshot.account_id == account_id)

    res = await db.execute(stmt)
    snapshots = res.scalars().all()

    points = []
    for s in snapshots:
        c_stmt = select(CategorySnapshot).where(CategorySnapshot.snapshot_id == s.id)
        c_res = await db.execute(c_stmt)
        categories = c_res.scalars().all()

        for c in categories:
            points.append(TimeSeriesDataPoint(
                timestamp=s.timestamp,
                account_id=s.account_id,
                category_id=c.category_id,
                percentage_remaining=c.weekly_remaining
            ))

    return HistoryResponse(
        range=range_str,
        series=points
    )
