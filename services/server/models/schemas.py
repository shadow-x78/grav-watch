# GravWatch - Data Schemas (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


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
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
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
