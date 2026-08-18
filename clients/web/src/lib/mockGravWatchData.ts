import { GravAccount, TelemetryEvent, TimeSeriesDataPoint } from "@/types/gravwatch";

// ============================================================================
// 📦 MOCK & SEED DATA ARCHITECTURE (FALLBACK STORE)
// ============================================================================
// TODO: [BACKEND INTEGRATION] - Database Models, Persistence, & Initial Seed Data
//
// 1. INITIAL_ACCOUNTS (Accounts List & Quotas):
//    - Static / Mock Data: Hardcoded account profiles, twin-tier model quotas (Gemini & Claude/GPT),
//      isolated container resource statistics (RAM/CPU), and quota refresh countdown timers.
//    - Required Backend Endpoint: `GET http://localhost:8000/api/v1/accounts`
//    - Required Database Tables:
//      * `accounts`: (id UUID PRIMARY KEY, alias VARCHAR, email VARCHAR UNIQUE, plan VARCHAR, auth_type VARCHAR,
//                    container_name VARCHAR, status VARCHAR, created_at TIMESTAMPTZ)
//      * `account_quotas`: (id UUID, account_id UUID REFERENCES accounts, model_group VARCHAR,
//                           tier_type VARCHAR, percent_remaining INT, reset_at TIMESTAMPTZ, used_tokens INT, limit_tokens INT)
//      * `container_metrics`: (account_id UUID, ram_usage_mb INT, cpu_percent FLOAT, last_health_ping TIMESTAMPTZ)
//    - Purpose / Why Needed: Fetch live account inventory and active Docker container metrics directly
//      from the PostgreSQL/SQLite database and Docker engine daemon.
//
// 2. INITIAL_EVENTS (Real-Time Activity Feed):
//    - Static / Mock Data: Mock token consumption logs, simulated agy CLI commands, and 429 rate limit events.
//    - Required Backend Protocol: WebSocket `ws://localhost:8000/api/v1/telemetry/events/stream` or `GET /api/v1/telemetry/events`
//    - Event Ingestion Pipeline:
//      * Antigravity CLI wrapper intercepts stdout/stderr & token usage stats per request.
//      * Daemon writes event packet to Redis Pub/Sub channel `telemetry:events`.
//      * FastAPI WebSocket handler broadcasts packets to connected GravWatch frontend clients.
//    - Purpose / Why Needed: Stream real-time token deduction packets as autonomous subagents and IDE tasks
//      execute commands inside isolated container sandboxes.
//
// 3. INITIAL_TIMELINE_DATA (Historical Token Consumption Chart):
//    - Static / Mock Data: Static time-series bucket aggregates comparing Gemini vs Claude tokens.
//    - Required Backend Endpoint: `GET http://localhost:8000/api/v1/metrics/timeline?range=24h&interval=1h`
//    - Data Aggregation Layer:
//      * Prometheus metrics / TimescaleDB continuous aggregates downsample token counts.
//      * Bucketing intervals: 1m for 1h range, 15m for 24h range, 1h for 7d range, 6h for 30d range.
//    - Purpose / Why Needed: Aggregate historical token usage to render accurate burn rate graphs and trends.
//
// 4. Edge Cases & Missing Capabilities to Handle:
//    - [ ] Local Offline Mode: If FastAPI backend is unreachable, gracefully fallback to in-memory mock store.
//    - [ ] Stale Quota Invalidation: Invalidate and re-fetch quota whenever a Docker container is paused or resumed.
//    - [ ] Negative Credit Handling: If AI credit balances drop below $0.00, prevent prompt routing until recharged.
//    - [ ] Quota Clock Drift: Calculate remaining percentage and countdowns on the backend using UTC timestamps.
// ============================================================================

export const INITIAL_ACCOUNTS: GravAccount[] = [
  {
    id: "acc-01",
    alias: "Mohamed Hegazy (Core Dev)",
    email: "mohamed.hegazy.dev@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    plan: "Google AI Pro",
    enableAiCredits: false,
    aiCreditsBalanceUsd: 45.0,
    containerName: "gravwatch-acc-01",
    containerStatus: "running",
    ramUsageMb: 142,
    ramLimitMb: 256,
    cpuUsagePercent: 2.1,
    authType: "google_oauth",
    status: "active",
    totalRequestsToday: 1480,
    totalTokensToday: 1890000,
    lastScrapedAt: new Date().toISOString(),
    createdAt: "2026-08-01T10:00:00Z",
    tags: ["Primary", "Google AI Pro", "Active Hub"],
    notes: "Main developer account mounted into isolated docker sandbox",
    geminiQuota: {
      weekly: {
        percentRemaining: 83,
        refreshCountdown: "4 days, 1 hour",
        used: 170000,
        limit: 1000000,
        status: "healthy",
      },
      fiveHour: {
        percentRemaining: 91,
        refreshCountdown: "4 hours, 7 minutes",
        used: 18000,
        limit: 200000,
        status: "healthy",
      },
    },
    claudeGptQuota: {
      weekly: {
        percentRemaining: 100,
        refreshCountdown: "6 days, 22 hours",
        used: 0,
        limit: 800000,
        status: "healthy",
      },
      fiveHour: {
        percentRemaining: 100,
        refreshCountdown: "4 hours, 58 minutes",
        used: 0,
        limit: 150000,
        status: "healthy",
      },
    },
  },
  {
    id: "acc-02",
    alias: "Sarah Fast Prototyper",
    email: "sarah.antigravity@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    plan: "Google AI Pro",
    enableAiCredits: true,
    aiCreditsBalanceUsd: 120.0,
    containerName: "gravwatch-acc-02",
    containerStatus: "running",
    ramUsageMb: 168,
    ramLimitMb: 256,
    cpuUsagePercent: 3.8,
    authType: "google_oauth",
    status: "active",
    totalRequestsToday: 2190,
    totalTokensToday: 2840000,
    lastScrapedAt: new Date().toISOString(),
    createdAt: "2026-08-03T14:00:00Z",
    tags: ["High Speed", "Flash Priority"],
    notes: "High concurrency node for fast agent subroutines",
    geminiQuota: {
      weekly: {
        percentRemaining: 92,
        refreshCountdown: "5 days, 8 hours",
        used: 80000,
        limit: 1000000,
        status: "healthy",
      },
      fiveHour: {
        percentRemaining: 96,
        refreshCountdown: "4 hours, 45 minutes",
        used: 8000,
        limit: 200000,
        status: "healthy",
      },
    },
    claudeGptQuota: {
      weekly: {
        percentRemaining: 94,
        refreshCountdown: "5 days, 14 hours",
        used: 48000,
        limit: 800000,
        status: "healthy",
      },
      fiveHour: {
        percentRemaining: 88,
        refreshCountdown: "3 hours, 20 minutes",
        used: 18000,
        limit: 150000,
        status: "healthy",
      },
    },
  },
  {
    id: "acc-03",
    alias: "Heavy Reasoning Lab",
    email: "research.reasoner.lab@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    plan: "Google AI Ultra",
    enableAiCredits: true,
    aiCreditsBalanceUsd: 350.0,
    containerName: "gravwatch-acc-03",
    containerStatus: "running",
    ramUsageMb: 228,
    ramLimitMb: 256,
    cpuUsagePercent: 11.2,
    authType: "google_oauth",
    status: "warning",
    totalRequestsToday: 4210,
    totalTokensToday: 7420000,
    lastScrapedAt: new Date().toISOString(),
    createdAt: "2026-08-08T09:00:00Z",
    tags: ["Ultra Tier", "Claude 4.6 Thinking", "Reasoning"],
    notes: "Under heavy continuous load for multi-file autonomous reasoning",
    geminiQuota: {
      weekly: {
        percentRemaining: 68,
        refreshCountdown: "2 days, 12 hours",
        used: 640000,
        limit: 2000000,
        status: "warning",
      },
      fiveHour: {
        percentRemaining: 42,
        refreshCountdown: "1 hour, 18 minutes",
        used: 232000,
        limit: 400000,
        status: "warning",
      },
    },
    claudeGptQuota: {
      weekly: {
        percentRemaining: 45,
        refreshCountdown: "2 days, 05 hours",
        used: 825000,
        limit: 1500000,
        status: "warning",
      },
      fiveHour: {
        percentRemaining: 31,
        refreshCountdown: "0 hours, 54 minutes",
        used: 207000,
        limit: 300000,
        status: "warning",
      },
    },
  },
  {
    id: "acc-04",
    alias: "Batch Evaluation Daemon",
    email: "batch.pipeline.daemon@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    plan: "Google AI Pro",
    enableAiCredits: false,
    aiCreditsBalanceUsd: 15.0,
    containerName: "gravwatch-acc-04",
    containerStatus: "running",
    ramUsageMb: 110,
    ramLimitMb: 256,
    cpuUsagePercent: 1.4,
    authType: "google_oauth",
    status: "active",
    totalRequestsToday: 920,
    totalTokensToday: 1100000,
    lastScrapedAt: new Date().toISOString(),
    createdAt: "2026-08-11T16:00:00Z",
    tags: ["Batch Tests", "Stable"],
    notes: "Allocated for background unit-test generators",
    geminiQuota: {
      weekly: {
        percentRemaining: 80,
        refreshCountdown: "4 days, 18 hours",
        used: 200000,
        limit: 1000000,
        status: "healthy",
      },
      fiveHour: {
        percentRemaining: 74,
        refreshCountdown: "3 hours, 40 minutes",
        used: 52000,
        limit: 200000,
        status: "healthy",
      },
    },
    claudeGptQuota: {
      weekly: {
        percentRemaining: 98,
        refreshCountdown: "6 days, 10 hours",
        used: 16000,
        limit: 800000,
        status: "healthy",
      },
      fiveHour: {
        percentRemaining: 95,
        refreshCountdown: "4 hours, 30 minutes",
        used: 7500,
        limit: 150000,
        status: "healthy",
      },
    },
  },
  {
    id: "acc-05",
    alias: "Nightly Sandbox Node",
    email: "nightly.sandbox99@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    plan: "Google AI Free",
    enableAiCredits: false,
    aiCreditsBalanceUsd: 0.0,
    containerName: "gravwatch-acc-05",
    containerStatus: "running",
    ramUsageMb: 95,
    ramLimitMb: 256,
    cpuUsagePercent: 0.3,
    authType: "google_oauth",
    status: "depleted",
    totalRequestsToday: 3100,
    totalTokensToday: 4800000,
    lastScrapedAt: new Date().toISOString(),
    createdAt: "2026-08-14T02:00:00Z",
    tags: ["Rate Limited", "Auto Paused"],
    notes: "Triggered 429 quota exhaustion during nightly test runs",
    geminiQuota: {
      weekly: {
        percentRemaining: 12,
        refreshCountdown: "0 days, 22 hours",
        used: 440000,
        limit: 500000,
        status: "depleted",
      },
      fiveHour: {
        percentRemaining: 5,
        refreshCountdown: "0 hours, 28 minutes",
        used: 95000,
        limit: 100000,
        status: "depleted",
      },
    },
    claudeGptQuota: {
      weekly: {
        percentRemaining: 8,
        refreshCountdown: "1 day, 04 hours",
        used: 276000,
        limit: 300000,
        status: "depleted",
      },
      fiveHour: {
        percentRemaining: 0,
        refreshCountdown: "0 hours, 28 minutes",
        used: 50000,
        limit: 50000,
        status: "depleted",
      },
    },
  },
];

export const INITIAL_EVENTS: TelemetryEvent[] = [
  {
    id: "evt-01",
    timestamp: new Date(Date.now() - 1000 * 20).toISOString(),
    accountId: "acc-01",
    accountAlias: "Mohamed Hegazy (Core Dev)",
    modelGroup: "Gemini Models",
    specificModel: "Gemini 3.6 Flash (High)",
    tokensUsed: 3840,
    promptSnippet: "Antigravity CLI workspace analysis with recursive file tree indexing...",
    status: "success",
    latencyMs: 340,
  },
  {
    id: "evt-02",
    timestamp: new Date(Date.now() - 1000 * 50).toISOString(),
    accountId: "acc-03",
    accountAlias: "Heavy Reasoning Lab",
    modelGroup: "Claude & GPT Models",
    specificModel: "Claude Sonnet 4.6 (Thinking)",
    tokensUsed: 8920,
    promptSnippet: "Multi-file architectural refactoring and formal verification pass...",
    status: "success",
    latencyMs: 1240,
  },
  {
    id: "evt-03",
    timestamp: new Date(Date.now() - 1000 * 95).toISOString(),
    accountId: "acc-02",
    accountAlias: "Sarah Fast Prototyper",
    modelGroup: "Gemini Models",
    specificModel: "Gemini 3.1 Pro (High)",
    tokensUsed: 4120,
    promptSnippet: "Evaluate streaming token rates from isolated Docker daemons...",
    status: "success",
    latencyMs: 510,
  },
  {
    id: "evt-04",
    timestamp: new Date(Date.now() - 1000 * 140).toISOString(),
    accountId: "acc-05",
    accountAlias: "Nightly Sandbox Node",
    modelGroup: "Claude & GPT Models",
    specificModel: "Claude Opus 4.6 (Thinking)",
    tokensUsed: 0,
    promptSnippet: "Execute nightly benchmark evaluation across subagent suite...",
    status: "rate_limit",
    latencyMs: 190,
  },
];

export const INITIAL_TIMELINE_DATA: TimeSeriesDataPoint[] = [
  { time: "00:00", totalTokens: 420000, geminiTokens: 290000, claudeGptTokens: 130000, requests: 210 },
  { time: "03:00", totalTokens: 210000, geminiTokens: 140000, claudeGptTokens: 70000, requests: 110 },
  { time: "06:00", totalTokens: 350000, geminiTokens: 240000, claudeGptTokens: 110000, requests: 180 },
  { time: "09:00", totalTokens: 1480000, geminiTokens: 960000, claudeGptTokens: 520000, requests: 640 },
  { time: "12:00", totalTokens: 2890000, geminiTokens: 1840000, claudeGptTokens: 1050000, requests: 1120 },
  { time: "15:00", totalTokens: 3450000, geminiTokens: 2180000, claudeGptTokens: 1270000, requests: 1490 },
  { time: "18:00 (Now)", totalTokens: 3820000, geminiTokens: 2430000, claudeGptTokens: 1390000, requests: 1680 },
];
