// ============================================================================
// 🔌 GRAVWATCH BACKEND INTEGRATION & DATA CONTRACT SPECIFICATIONS
// ============================================================================
// TODO: [BACKEND INTEGRATION] - Core Type Definitions & API / WebSocket Contracts
//
// 1. Data Models & Pydantic / ORM Schema Mapping:
//    - Frontend Types in this file mirror backend Pydantic models (FastAPI) and SQL entities (SQLAlchemy / Prisma).
//    - `GravAccount`: Represents an isolated Docker container sandbox node and associated Google account credentials.
//    - `PooledTelemetry`: Aggregate cluster-wide metrics across all accounts, calculating load-balanced capacity.
//    - `TelemetryEvent`: Streaming audit log entry emitted per prompt execution inside any container.
//    - `TimeSeriesDataPoint`: Granular token consumption bucket for Prometheus / TimescaleDB queries.
//
// 2. Required Backend API Endpoints & Protocols:
//    - `GET    /api/v1/accounts`              -> List all accounts with current twin-tier quota states and container stats.
//    - `POST   /api/v1/accounts/manual`       -> Provision a new Docker container with manual session tokens.
//    - `POST   /api/v1/auth/google/initiate`  -> Start OAuth 2.0 PKCE / Device Flow and run `./scripts/setup-auth.sh`.
//    - `GET    /api/v1/usage/latest`          -> Fetch aggregate cluster KPIs, capacity percentages, and credit pools.
//    - `GET    /api/v1/metrics/timeline`      -> Query downsampled historical token consumption (1h, 24h, 7d, 30d).
//    - `POST   /api/v1/router/execute`        -> Execute prompt via optimal container sandbox (`docker exec agy ...`).
//    - `WS     /api/v1/telemetry/stream`      -> Persistent bi-directional WebSocket for real-time quota drain events.
//
// 3. Edge Cases & Missing Capabilities to Implement in Backend:
//    - [ ] Token Expiry & Auto-Refresh: Handle Google OAuth refresh token rotation without terminating running containers.
//    - [ ] 429 Quota Exhaustion Failover: When an account hits 429, dynamically re-route subsequent requests to standby nodes.
//    - [ ] Container Health Probes: Detect OOMKilled containers (if RAM exceeds 256MB limit) and auto-restart with backoff.
//    - [ ] Multi-Tenant Isolation: Ensure `./data/acc-XX/` volume mounts strictly preserve separate file permissions (0700).
//    - [ ] Clock Drift & Countdown Sync: Quota reset timestamps must use UTC ISO strings (or Unix epoch) to prevent client timer drift.
// ============================================================================

export type AntigravityPlan =
  | "Google AI Pro"
  | "Google AI Ultra"
  | "Google AI Free"
  | "Enterprise";

export type AccountStatus = "active" | "warning" | "depleted" | "paused";
export type ContainerStatus = "running" | "stopped" | "restarting" | "error";
export type AuthType = "google_oauth" | "manual_session";

export interface QuotaTier {
  percentRemaining: number;
  refreshCountdown: string;
  used: number;
  limit: number;
  status: "healthy" | "warning" | "depleted";
}

export interface ModelCategoryQuota {
  weekly: QuotaTier;
  fiveHour: QuotaTier;
}

export interface GravAccount {
  id: string;
  alias: string;
  email: string;
  avatarUrl: string;
  plan: AntigravityPlan;
  enableAiCredits: boolean;
  aiCreditsBalanceUsd: number;
  containerName: string;
  containerStatus: ContainerStatus;
  ramUsageMb: number;
  ramLimitMb: number;
  cpuUsagePercent: number;
  authType: AuthType;
  status: AccountStatus;
  totalRequestsToday: number;
  totalTokensToday: number;
  geminiQuota: ModelCategoryQuota;
  claudeGptQuota: ModelCategoryQuota;
  lastScrapedAt: string;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export interface PooledTelemetry {
  totalAccounts: number;
  activeContainers: number;
  geminiFiveHourPooledPercent: number;
  geminiWeeklyPooledPercent: number;
  claudeGptFiveHourPooledPercent: number;
  claudeGptWeeklyPooledPercent: number;
  overallPooledCapacity: number;
  totalCreditsPoolUsd: number;
  burnRatePerMinute: number;
  totalRequestsToday: number;
  successRatePercent: number;
  averageLatencyMs: number;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  accountId: string;
  accountAlias: string;
  modelGroup: "Gemini Models" | "Claude & GPT Models";
  specificModel: string;
  tokensUsed: number;
  promptSnippet: string;
  status: "success" | "rate_limit" | "fail";
  latencyMs: number;
}

export interface TimeSeriesDataPoint {
  time: string;
  totalTokens: number;
  geminiTokens: number;
  claudeGptTokens: number;
  requests: number;
  [key: string]: string | number;
}

export type TimeRangeFilter = "1h" | "24h" | "7d" | "30d" | "all";
export type TabView = "overview" | "accounts" | "simulator" | "integration";
