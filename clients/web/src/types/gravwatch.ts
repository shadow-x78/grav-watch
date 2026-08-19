// GravWatch - Core Type Definitions (GPL-3.0-or-later)
// https://github.com/shadow-x78/grav-watch

export type AntigravityPlan = "Google AI Free" | "Google AI Pro" | "Google AI Ultra" | "Enterprise";
export type ContainerStatus = "running" | "stopped" | "restarting" | "error";
export type AuthType = "google_oauth" | "service_account" | "manual_token";
export type AccountStatus = "active" | "warning" | "depleted" | "paused";

export interface QuotaLimit {
  percentRemaining: number;
  refreshCountdown: string;
  used: number;
  limit: number;
  status: "healthy" | "warning" | "depleted";
}

export interface ModelCategoryQuota {
  weekly: QuotaLimit;
  fiveHour: QuotaLimit;
}

export interface GravAccount {
  id: string;
  alias: string;
  email: string;
  avatarUrl: string;
  plan: AntigravityPlan;
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
export type TabView = "overview" | "accounts" | "simulator";
