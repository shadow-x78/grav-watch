# ─────────────────────────────────────────────
# GravWatch - Usage API & Telemetry Router
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import os
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from services.server.core.config import settings
from services.server.core.database import get_db
from services.server.core.security import validate_account_id
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

router = APIRouter(prefix="/usage", tags=["Usage"])


async def _calculate_pool_percentages(accounts, db) -> dict:
    """Dynamically calculate pool percentages from all categories across accounts."""
    category_pcts: dict[str, list[float]] = {}

    for a in accounts:
        stmt_snap = (
            select(UsageSnapshot)
            .where(UsageSnapshot.account_id == a.id)
            .order_by(desc(UsageSnapshot.recorded_at))
            .limit(1)
        )
        res_snap = await db.execute(stmt_snap)
        snap = res_snap.scalar_one_or_none()

        if snap and snap.raw_payload:
            try:
                data = json.loads(snap.raw_payload)
                for cat in data.get("categories", []):
                    cat_id = cat.get("category_id")
                    w = cat.get("weekly_limit", {})
                    w_pct = w.get("percentage_remaining")
                    if w_pct is not None:
                        if cat_id not in category_pcts:
                            category_pcts[cat_id] = []
                        category_pcts[cat_id].append(w_pct)
            except Exception:
                pass

    pool_result = {}
    for cat_id, pcts in category_pcts.items():
        pool_result[cat_id] = sum(pcts) / len(pcts) if pcts else None

    return pool_result


@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_usage(
    payload: UsageIngestPayload,
    db: AsyncSession = Depends(get_db),
):
    account_id = validate_account_id(payload.account_id)
    stmt = select(Account).where(Account.id == account_id)
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    now_utc = datetime.now(timezone.utc)

    if not account:
        email_val = None
        label_val = payload.account_label or f"Account {account_id}"
        creds_path = os.path.join(settings.DATA_DIR, account_id, "credentials.json")
        if os.path.exists(creds_path):
            try:
                with open(creds_path, "r", encoding="utf-8") as f:
                    cdata = json.load(f)
                    email_val = cdata.get("email")
                    label_val = cdata.get("name") or cdata.get("account_label") or label_val
            except Exception:
                pass
        account = Account(
            id=account_id,
            label=label_val,
            email=email_val,
            tier=payload.tier or "Google AI Pro",
            status="healthy",
            last_seen_at=now_utc,
        )
        db.add(account)
    else:
        account.last_seen_at = now_utc
        account.status = "healthy"
        if not account.email:
            creds_path = os.path.join(settings.DATA_DIR, account_id, "credentials.json")
            if os.path.exists(creds_path):
                try:
                    with open(creds_path, "r", encoding="utf-8") as f:
                        cdata = json.load(f)
                        if cdata.get("email"):
                            account.email = cdata.get("email")
                        if cdata.get("name"):
                            account.label = cdata.get("name")
                except Exception:
                    pass
        if payload.account_label and payload.account_label != f"Account {account_id}":
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

    for a in accounts:
        stmt_snap = (
            select(UsageSnapshot)
            .where(UsageSnapshot.account_id == a.id)
            .order_by(desc(UsageSnapshot.recorded_at))
            .limit(1)
        )
        res_snap = await db.execute(stmt_snap)
        snap = res_snap.scalar_one_or_none()

        res_count = await db.execute(
            select(func.count()).select_from(UsageSnapshot).where(UsageSnapshot.account_id == a.id)
        )
        snapshot_count = res_count.scalar() or 0

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

        # SQLite stores naive datetimes; tag them UTC so browsers compute
        # freshness against the correct instant.
        snap_at = snap.recorded_at if snap else None
        if snap_at and snap_at.tzinfo is None:
            snap_at = snap_at.replace(tzinfo=timezone.utc)
        seen_at = a.last_seen_at
        if seen_at and seen_at.tzinfo is None:
            seen_at = seen_at.replace(tzinfo=timezone.utc)

        account_summaries.append(
            AccountQuotaSummary(
                account_id=a.id,
                label=a.label,
                email=email_val,
                tier=a.tier or "Google AI Pro",
                status=a.status,
                last_seen_at=seen_at,
                last_snapshot_at=snap_at,
                snapshot_count=snapshot_count,
                categories=categories,
            )
        )

    pool_percentages = await _calculate_pool_percentages(accounts, db)

    return UsageLatestResponse(
        timestamp=datetime.now(timezone.utc),
        total_accounts=len(accounts),
        active_accounts=len([a for a in accounts if a.status == "healthy"]),
        gemini_pool_percent=pool_percentages.get("gemini-models"),
        claude_pool_percent=pool_percentages.get("claude-and-gpt-models"),
        accounts=account_summaries,
    )


@router.get("/history", response_model=UsageHistoryResponse)
async def get_usage_history(
    range_val: str = Query("24h", alias="range"),
    db: AsyncSession = Depends(get_db),
):
    now_utc = datetime.now(timezone.utc)
    delta_map = {
        "1h": (timedelta(hours=1), "%H:%M", timedelta(minutes=10)),
        "24h": (timedelta(hours=24), "%H:%M", timedelta(hours=2)),
        "7d": (timedelta(days=7), "%b %d", timedelta(days=1)),
        "30d": (timedelta(days=30), "%b %d", timedelta(days=2)),
    }
    time_delta, date_fmt, step_delta = delta_map.get(
        range_val, (timedelta(hours=24), "%H:%M", timedelta(hours=2))
    )
    cutoff = now_utc - time_delta

    stmt = (
        select(UsageSnapshot)
        .where(UsageSnapshot.recorded_at >= cutoff)
        .order_by(UsageSnapshot.recorded_at.asc())
    )
    res = await db.execute(stmt)
    snapshots = res.scalars().all()

    series: list[HistoryPoint] = []
    for snap in snapshots:
        try:
            data = json.loads(snap.raw_payload)
            gemini_tokens = 0
            claude_tokens = 0
            for cat in data.get("categories", []):
                cat_id = cat.get("category_id")
                w = cat.get("weekly_limit", {})
                w_pct = w.get("percentage_remaining")
                if w_pct is not None:
                    if cat_id == "gemini-models":
                        gemini_tokens += int((100 - w_pct) * 10000)
                    elif cat_id == "claude-and-gpt-models":
                        claude_tokens += int((100 - w_pct) * 5000)
        except Exception:
            gemini_tokens = 0
            claude_tokens = 0

        series.append(
            HistoryPoint(
                timestamp=snap.recorded_at,
                time_label=snap.recorded_at.strftime(date_fmt),
                gemini_tokens=gemini_tokens,
                claude_tokens=claude_tokens,
                active_nodes=1,
            )
        )

    return UsageHistoryResponse(
        range=range_val,
        start_time=cutoff,
        end_time=now_utc,
        series=series,
    )

