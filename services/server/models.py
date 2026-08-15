# GravWatch - Persistence & Data Schemas (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, relationship

from config import settings

if "sqlite" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ==============================================================================
# SQLAlchemy Models
# ==============================================================================

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(64), primary_key=True, index=True)
    label = Column(String(128), nullable=False)
    email = Column(String(256), nullable=False, default="unknown")
    tier = Column(String(64), nullable=False, default="Standard")
    status = Column(String(32), nullable=False, default="healthy")
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    snapshots = relationship("UsageSnapshot", back_populates="account", cascade="all, delete-orphan")


class UsageSnapshot(Base):
    __tablename__ = "usage_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(String(64), ForeignKey("accounts.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    total_models = Column(Integer, default=0)

    account = relationship("Account", back_populates="snapshots")
    models = relationship("ModelQuota", back_populates="snapshot", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_account_timestamp", "account_id", "timestamp"),
    )


class ModelQuota(Base):
    __tablename__ = "model_quotas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(Integer, ForeignKey("usage_snapshots.id"), nullable=False, index=True)
    model_id = Column(String(64), nullable=False, index=True)
    model_name = Column(String(128), nullable=False)
    used = Column(Integer, nullable=False, default=0)
    limit = Column(Integer, nullable=False, default=100)
    percentage = Column(Float, nullable=False, default=0.0)
    unit = Column(String(32), default="requests")
    resets_in_human = Column(String(64), default="")
    resets_at = Column(DateTime, nullable=True)

    snapshot = relationship("UsageSnapshot", back_populates="models")


# ==============================================================================
# Pydantic Schemas
# ==============================================================================

class ModelQuotaItem(BaseModel):
    model_id: str
    model_name: str
    used: int = Field(..., ge=0)
    limit: int = Field(..., ge=0)
    percentage: float = Field(..., ge=0.0, le=100.0)
    unit: str = "requests"
    resets_in_human: str = ""
    resets_at: Optional[datetime] = None


class UsageIngestRequest(BaseModel):
    account_id: str
    account_label: str = "Account 1"
    email: str = "unknown"
    tier: str = "Standard"
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    models: List[ModelQuotaItem] = []


class IngestResponse(BaseModel):
    success: bool
    message: str


class ModelPoolSummary(BaseModel):
    model_id: str
    model_name: str
    total_used: int
    total_limit: int
    pool_percentage: float
    active_accounts_count: int


class PoolSummary(BaseModel):
    total_accounts: int
    online_accounts: int
    total_requests_used: int
    total_requests_limit: int
    overall_percentage: float
    model_summaries: List[ModelPoolSummary] = []


class AccountDetailResponse(BaseModel):
    id: str
    label: str
    email: str
    tier: str
    status: str
    last_seen_at: datetime
    models: List[ModelQuotaItem] = []


class LatestUsageResponse(BaseModel):
    timestamp: datetime
    pool_summary: PoolSummary
    accounts: List[AccountDetailResponse] = []


class TimeSeriesDataPoint(BaseModel):
    timestamp: datetime
    account_id: Optional[str] = None
    model_id: str
    used: int
    percentage: float


class HistoryResponse(BaseModel):
    range: str
    series: List[TimeSeriesDataPoint] = []
