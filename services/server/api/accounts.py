# GravWatch - Accounts API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.database import get_db
from ..models.db import Account
from ..models.schemas import AccountDetailResponse

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=list[AccountDetailResponse])
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
