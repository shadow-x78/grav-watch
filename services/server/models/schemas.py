# GravWatch - Pydantic Request & Response Schemas (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime

class QuotaTierPayload(BaseModel):
    percentage_remaining: Optional[float] = None
    refresh_in_human: Optional[str] = None
    reset_time: Optional[str] = None
    is_exhausted: bool = False

class CategoryQuotaPayload(BaseModel):
    category_id: str
    category_name: str
    weekly_limit: QuotaTierPayload
    five_hour_limit: QuotaTierPayload

class UsageIngestPayload(BaseModel):
    account_id: str
    account_label: Optional[str] = None
    tier: Optional[str] = None
    categories: List[CategoryQuotaPayload] = Field(default_factory=list)
    timestamp: datetime

class QuotaTierSummary(BaseModel):
    percentage_remaining: Optional[float] = None
    refresh_in_human: Optional[str] = None
    is_exhausted: bool = False

class CategoryQuotaSummary(BaseModel):
    category_id: str
    category_name: str
    weekly_limit: QuotaTierSummary
    five_hour_limit: QuotaTierSummary

class AccountQuotaSummary(BaseModel):
    account_id: str
    label: str
    email: Optional[str] = None
    tier: str
    status: str
    last_seen_at: datetime
    categories: List[CategoryQuotaSummary] = Field(default_factory=list)

class UsageLatestResponse(BaseModel):
    timestamp: datetime
    total_accounts: int
    active_accounts: int
    gemini_pool_percent: Optional[float] = None
    claude_pool_percent: Optional[float] = None
    accounts: List[AccountQuotaSummary] = Field(default_factory=list)

class HistoryPoint(BaseModel):
    timestamp: datetime
    time_label: str
    gemini_tokens: int
    claude_tokens: int
    active_nodes: int

class UsageHistoryResponse(BaseModel):
    range: str
    start_time: datetime
    end_time: datetime
    series: List[HistoryPoint] = Field(default_factory=list)

class AuthStatusResponse(BaseModel):
    account_id: str
    authenticated: bool
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    container_status: Optional[str] = "running"
    last_token_update: Optional[datetime] = None
    message: str

class AuthTokenPayload(BaseModel):
    account_id: Optional[str] = "acc-1"
    account_label: Optional[str] = None
    email: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    tier: Optional[str] = "Antigravity Starter"

class AccountModelInfo(BaseModel):
    model_id: str
    percentage_remaining: Optional[float] = None
    five_hour_remaining: Optional[float] = None
    is_exhausted: bool = False

class AccountDetailResponse(BaseModel):
    id: str
    label: str
    email: Optional[str] = None
    tier: str
    status: str
    last_seen_at: datetime
    models: List[AccountModelInfo] = Field(default_factory=list)
