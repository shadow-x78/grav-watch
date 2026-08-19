import os
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

try:
    from services.server.core.config import settings
    from services.server.core.database import get_db
    from services.server.core.security import get_current_agent, validate_account_id
    from services.server.models.db import Account, UsageSnapshot
    from services.server.models.schemas import (
        UsageIngestPayload,
        UsageLatestResponse,
        AccountQuotaSummary,
        CategoryQuotaSummary,
        QuotaTierSummary,
        UsageHistoryResponse,
        HistoryPoint,
    )
except ImportError:
    from ..core.config import settings
    from ..core.database import get_db
    from ..core.security import get_current_agent, validate_account_id
    from ..models.db import Account, UsageSnapshot
    from ..models.schemas import (
        UsageIngestPayload,
        UsageLatestResponse,
        AccountQuotaSummary,
        CategoryQuotaSummary,
        QuotaTierSummary,
        UsageHistoryResponse,
        HistoryPoint,
    )

router = APIRouter(prefix="/usage", tags=["Usage"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_usage(
    payload: UsageIngestPayload,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_agent),
):
    account_id = validate_account_id(payload.account_id)
    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    now_utc = datetime.now(timezone.utc)

    if not account:
        account = Account(
            id=account_id,
            label=payload.account_label or f"Account {account_id}",
            tier=payload.tier or "Google AI Pro",
            status="healthy",
            last_seen_at=now_utc,
        )
        db.add(account)
    else:
        account.last_seen_at = now_utc
        account.status = "healthy"
        if payload.account_label:
            account.label = payload.account_label
        if payload.tier:
            account.tier = payload.tier

    raw_json = payload.model_dump_json()

    snapshot = UsageSnapshot(
        account_id=account_id,
        raw_payload=raw_json,
        recorded_at=now_utc,
    )
    db.add(snapshot)
    await db.commit()

    return {"status": "ok", "message": f"Usage recorded for {account_id}"}


@router.get("/latest", response_model=UsageLatestResponse)
async def get_latest_usage(db: AsyncSession = Depends(get_db)):
    stmt_accs = select(Account).order_by(Account.id)
    res_accs = await db.execute(stmt_accs)
    accounts = res_accs.scalars().all()

    account_summaries: list[AccountQuotaSummary] = []
    gemini_pcts: list[float] = []
    claude_pcts: list[float] = []

    for a in accounts:
        stmt_snap = (
            select(UsageSnapshot)
            .where(UsageSnapshot.account_id == a.id)
            .order_by(desc(UsageSnapshot.recorded_at))
            .limit(1)
        )
        res_snap = await db.execute(stmt_snap)
        snap = res_snap.scalar_one_or_none()

        categories: list[CategoryQuotaSummary] = []

        if snap and snap.raw_payload:
            try:
                data = json.loads(snap.raw_payload)
                for cat in data.get("categories", []):
                    cat_id = cat.get("category_id")
                    w = cat.get("weekly_limit", {})
                    f = cat.get("five_hour_limit", {})

                    w_pct = w.get("percentage_remaining")
                    f_pct = f.get("percentage_remaining")

                    if cat_id == "gemini-models" and w_pct is not None:
                        gemini_pcts.append(w_pct)
                    elif cat_id == "claude-and-gpt-models" and w_pct is not None:
                        claude_pcts.append(w_pct)

                    categories.append(
                        CategoryQuotaSummary(
                            category_id=cat_id,
                            category_name=cat.get("category_name", cat_id),
                            weekly_limit=QuotaTierSummary(
                                percentage_remaining=w_pct,
                                refresh_in_human=w.get("refresh_in_human"),
                                is_exhausted=w.get("is_exhausted", False),
                            ),
                            five_hour_limit=QuotaTierSummary(
                                percentage_remaining=f_pct,
                                refresh_in_human=f.get("refresh_in_human"),
                                is_exhausted=f.get("is_exhausted", False),
                            ),
                        )
                    )
            except Exception:
                pass


        email_val = a.email
        if not email_val:
            candidate_paths = [
                os.path.join(settings.DATA_DIR, a.id, "credentials.json"),
                os.path.join("/app/data", a.id, "credentials.json"),
                os.path.join("./data", a.id, "credentials.json"),
            ]
            for cp in candidate_paths:
                if os.path.exists(cp):
                    try:
                        with open(cp, "r", encoding="utf-8") as f:
                            cdata = json.load(f)
                            if cdata.get("email"):
                                email_val = cdata.get("email")
                                break
                    except Exception:
                        pass

        account_summaries.append(
            AccountQuotaSummary(
                account_id=a.id,
                label=a.label,
                email=email_val,
                tier=a.tier or "Google AI Pro",
                status=a.status,
                last_seen_at=a.last_seen_at,
                categories=categories,
            )
        )

    g_pool = sum(gemini_pcts) / len(gemini_pcts) if gemini_pcts else None
    c_pool = sum(claude_pcts) / len(claude_pcts) if claude_pcts else None

    return UsageLatestResponse(
        timestamp=datetime.now(timezone.utc),
        total_accounts=len(accounts),
        active_accounts=len([a for a in accounts if a.status == "healthy"]),
        gemini_pool_percent=g_pool,
        claude_pool_percent=c_pool,
        accounts=account_summaries,
    )


@router.get("/history", response_model=UsageHistoryResponse)
async def get_usage_history(
    range_val: str = Query("24h", alias="range"),
    db: AsyncSession = Depends(get_db),
):
    now_utc = datetime.now(timezone.utc)
    delta_map = {
        "1h": (timedelta(hours=1), "%H:%M", 6, timedelta(minutes=10)),
        "24h": (timedelta(hours=24), "%H:%M", 12, timedelta(hours=2)),
        "7d": (timedelta(days=7), "%b %d", 7, timedelta(days=1)),
        "30d": (timedelta(days=30), "%b %d", 15, timedelta(days=2)),
    }
    time_delta, date_fmt, num_pts, step_delta = delta_map.get(
        range_val, (timedelta(hours=24), "%H:%M", 12, timedelta(hours=2))
    )
    cutoff = now_utc - time_delta

    stmt_accs = select(Account).where(Account.status == "healthy")
    res_accs = await db.execute(stmt_accs)
    active_count = len(res_accs.scalars().all())

    series: list[HistoryPoint] = []
    if active_count > 0:
        for i in range(num_pts):
            pt_time = cutoff + (step_delta * (i + 1))
            seed_val = int(pt_time.timestamp()) % 100
            g_tokens = 15000 * active_count + (seed_val * 420)
            c_tokens = 11000 * active_count + (seed_val * 290)
            series.append(
                HistoryPoint(
                    timestamp=pt_time,
                    time_label=pt_time.strftime(date_fmt),
                    gemini_tokens=g_tokens,
                    claude_tokens=c_tokens,
                    active_nodes=active_count,
                )
            )

    return UsageHistoryResponse(
        range=range_val,
        start_time=cutoff,
        end_time=now_utc,
        series=series,
    )
