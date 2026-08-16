# GravWatch - Data Schemas (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LimitWindow(BaseModel):
    percentage_remaining: float = Field(..., ge=0.0, le=100.0)
    refresh_in_human: str = ""
    refreshes_at: Optional[datetime] = None


class CategoryQuota(BaseModel):
    category_id: str
    category_name: str
    weekly_limit: LimitWindow
    five_hour_limit: LimitWindow


class ModelQuotaItem(BaseModel):
    model_id: str
    model_name: str
    category_id: str = "gemini-models"
    weekly_limit: LimitWindow
    five_hour_limit: LimitWindow


class UsageIngestRequest(BaseModel):
    account_id: str
    account_label: str = "Account 1"
    email: str = "unknown"
    tier: str = "Standard"
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    categories: List[CategoryQuota] = []
    models: List[ModelQuotaItem] = []


class IngestResponse(BaseModel):
    success: bool
    message: str


class CategoryPoolSummary(BaseModel):
    category_id: str
    category_name: str
    weekly_limit_remaining: float
    five_hour_limit_remaining: float
    weekly_refresh_human: str
    five_hour_refresh_human: str


class ModelPoolSummary(BaseModel):
    model_id: str
    model_name: str
    category_id: str
    weekly_limit_remaining: float
    five_hour_limit_remaining: float
    active_accounts_count: int


class PoolSummary(BaseModel):
    total_accounts: int
    online_accounts: int
    overall_weekly_remaining: float
    overall_five_hour_remaining: float
    category_summaries: List[CategoryPoolSummary] = []
    model_summaries: List[ModelPoolSummary] = []


class AccountDetailResponse(BaseModel):
    id: str
    label: str
    email: str
    tier: str
    status: str
    last_seen_at: datetime
    categories: List[CategoryQuota] = []
    models: List[ModelQuotaItem] = []


class LatestUsageResponse(BaseModel):
    timestamp: datetime
    pool_summary: PoolSummary
    accounts: List[AccountDetailResponse] = []


class TimeSeriesDataPoint(BaseModel):
    timestamp: datetime
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    model_id: Optional[str] = None
    percentage_remaining: float


class HistoryResponse(BaseModel):
    range: str
    series: List[TimeSeriesDataPoint] = []


class AuthTokenPayload(BaseModel):
    account_id: str = "acc-1"
    account_label: Optional[str] = "Account 1"
    email: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    oauth_credentials_json: Optional[Dict[str, Any]] = None


class AuthStatusResponse(BaseModel):
    account_id: str
    authenticated: bool
    email: Optional[str] = None
    last_token_update: Optional[datetime] = None
    message: str
