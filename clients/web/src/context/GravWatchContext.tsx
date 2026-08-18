"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  GravAccount,
  PooledTelemetry,
  TelemetryEvent,
  TimeSeriesDataPoint,
  TimeRangeFilter,
  TabView,
} from "@/types/gravwatch";
import {
  INITIAL_ACCOUNTS,
  INITIAL_EVENTS,
  INITIAL_TIMELINE_DATA,
} from "@/lib/mockGravWatchData";

// ============================================================================
// 🔌 BACKEND INTEGRATION CONTRACT & TYPES
// ============================================================================
// TODO: [BACKEND INTEGRATION] - Global State Management & API Gateway
//
// 1. Static / Mock Data & Local Fallbacks:
//    - Current Implementation: In-memory React state initialized with `INITIAL_ACCOUNTS` and
//      cached in browser `localStorage`. Real-time activity is simulated with randomized timers.
//    - Production Migration: Replace localStorage caching with asynchronous REST API fetches and
//      subscribe to persistent WebSocket / Server-Sent Events (SSE) telemetry streams.
//
// 2. Required Backend Endpoints & Protocols:
//    - `GET  /api/v1/accounts`: Retrieve all active accounts, quotas, and Docker container stats.
//    - `GET  /api/v1/usage/latest`: Fetch cluster-wide aggregate quotas, capacity health, and financial credit pool.
//    - `GET  /api/v1/metrics/timeline?range=24h`: Fetch historical downsampled token time-series buckets.
//    - `WS   ws://localhost:8000/api/v1/telemetry/stream`: Real-time streaming of token drains and logs.
//    - `POST /api/v1/router/execute`: Forward prompt executions to optimal container sandboxes (`agy` CLI wrapper).
//    - `POST /api/v1/auth/google/start`: Initiate OAuth 2.0 PKCE device authorization and isolated Docker volume provisioning.
//
// 3. Edge Cases, Failure Handling, & System Architecture:
//    - [ ] WebSocket Disconnection & Heartbeat: Implement exponential backoff reconnects (1s -> 2s -> 4s -> max 30s)
//          with ping/pong heartbeat probes every 15 seconds.
//    - [ ] Optimistic Updates & Rollbacks: When toggling container status or updating account parameters, optimistically
//          update UI and rollback on HTTP 500 / 400 error responses with toast alerts.
//    - [ ] HTTP 429 Failover Engine: When a container sandbox hits 429 quota exhaustion, instantly route subsequent prompts
//          to healthy fallback accounts and update quota status to "depleted".
//    - [ ] Multi-Tab Synchronization: Use `BroadcastChannel` or `IndexedDB` to ensure multiple open browser tabs share
//          the same WebSocket connection and state without duplicating network traffic.
//    - [ ] Clock Drift Protection: Server must return absolute UTC ISO timestamps for quota refresh countdowns.
// ============================================================================

interface GravWatchContextType {
  accounts: GravAccount[];
  selectedAccountId: string;
  timeRange: TimeRangeFilter;
  activeTab: TabView;
  isLiveStreaming: boolean;
  events: TelemetryEvent[];
  timelineData: TimeSeriesDataPoint[];
  pooledTelemetry: PooledTelemetry;
  setSelectedAccountId: (id: string) => void;
  setTimeRange: (range: TimeRangeFilter) => void;
  setActiveTab: (tab: TabView) => void;
  setIsLiveStreaming: (live: boolean) => void;
  toggleLiveStreaming: () => void;
  addAccount: (account: Partial<GravAccount>) => void;
  pairGoogleAccount: (profile: { name: string; email: string; avatarUrl?: string; plan?: GravAccount["plan"] }) => void;
  updateAccount: (id: string, updates: Partial<GravAccount>) => void;
  deleteAccount: (id: string) => void;
  toggleAccountStatus: (id: string) => void;
  refreshAccount: (id: string) => void;
  refreshAllAccounts: () => void;
  resetSampleData: () => void;
  executePromptSimulation: (
    modelGroup: "Gemini Models" | "Claude & GPT Models",
    specificModel: string,
    prompt: string,
    strategy: "least" | "round"
  ) => { success: boolean; accountAlias: string; tokensUsed: number };
}

const GravWatchContext = createContext<GravWatchContextType | undefined>(undefined);

export const GravWatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<GravAccount[]>(INITIAL_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("24h");
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [events, setEvents] = useState<TelemetryEvent[]>(INITIAL_EVENTS);
  const [timelineData, setTimelineData] = useState<TimeSeriesDataPoint[]>(INITIAL_TIMELINE_DATA);

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Initial Accounts & Baseline Telemetry Fetching
  //
  // 1. Static / Fallback Data:
  //    - Currently loads saved accounts/events from `localStorage` or initial mock records (`INITIAL_ACCOUNTS`).
  //
  // 2. Required Backend Endpoints:
  //    - `GET http://localhost:8000/api/v1/accounts`: Fetches active accounts, quotas, and Docker container state.
  //    - `GET http://localhost:8000/api/v1/telemetry/timeline?range=24h`: Fetches baseline time-series token metrics.
  //
  // 3. Purpose / Why Needed:
  //    - Synchronize the UI immediately upon launch with the upstream FastAPI server and live Docker containers.
  // --------------------------------------------------------------------------
  // API Base URL from environment or default local FastAPI server
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchLiveBackendData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/usage/latest`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data && data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
        setAccounts((prevAccounts) => {
          const updated = [...prevAccounts];
          data.accounts.forEach((serverAcc: any) => {
            const idx = updated.findIndex((a) => a.id === serverAcc.id);
            const geminiCat = serverAcc.categories?.find((c: any) => c.category_id === "gemini-models");
            const claudeCat = serverAcc.categories?.find((c: any) => c.category_id === "claude-and-gpt-models");

            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                email: serverAcc.email || updated[idx].email,
                status: serverAcc.status === "healthy" ? "active" : (serverAcc.status || updated[idx].status),
                lastScrapedAt: serverAcc.last_seen_at || new Date().toISOString(),
                ...(geminiCat && {
                  geminiQuota: {
                    weekly: {
                      ...updated[idx].geminiQuota.weekly,
                      percentRemaining: geminiCat.weekly_limit?.percentage_remaining ?? updated[idx].geminiQuota.weekly.percentRemaining,
                      refreshCountdown: geminiCat.weekly_limit?.refresh_in_human || updated[idx].geminiQuota.weekly.refreshCountdown,
                    },
                    fiveHour: {
                      ...updated[idx].geminiQuota.fiveHour,
                      percentRemaining: geminiCat.five_hour_limit?.percentage_remaining ?? updated[idx].geminiQuota.fiveHour.percentRemaining,
                      refreshCountdown: geminiCat.five_hour_limit?.refresh_in_human || updated[idx].geminiQuota.fiveHour.refreshCountdown,
                    },
                  },
                }),
                ...(claudeCat && {
                  claudeGptQuota: {
                    weekly: {
                      ...updated[idx].claudeGptQuota.weekly,
                      percentRemaining: claudeCat.weekly_limit?.percentage_remaining ?? updated[idx].claudeGptQuota.weekly.percentRemaining,
                      refreshCountdown: claudeCat.weekly_limit?.refresh_in_human || updated[idx].claudeGptQuota.weekly.refreshCountdown,
                    },
                    fiveHour: {
                      ...updated[idx].claudeGptQuota.fiveHour,
                      percentRemaining: claudeCat.five_hour_limit?.percentage_remaining ?? updated[idx].claudeGptQuota.fiveHour.percentRemaining,
                      refreshCountdown: claudeCat.five_hour_limit?.refresh_in_human || updated[idx].claudeGptQuota.fiveHour.refreshCountdown,
                    },
                  },
                }),
              };
            }
          });
          return updated;
        });
        return true;
      }
    } catch {
      // Backend not running or unreachable: graceful fallback to local / mock storage
    }
    return false;
  };

  useEffect(() => {
    try {
      const savedAccounts = localStorage.getItem("gravwatch_accounts_antigravity_v3");
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }
      const savedEvents = localStorage.getItem("gravwatch_events_antigravity_v3");
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }

    // Initial live sync probe
    fetchLiveBackendData();
  }, []);

  const persistAccounts = (newAccs: GravAccount[]) => {
    setAccounts(newAccs);
    try {
      localStorage.setItem("gravwatch_accounts_antigravity_v3", JSON.stringify(newAccs));
    } catch (e) {
      console.error(e);
    }
  };

  const persistEvents = (newEvts: TelemetryEvent[]) => {
    setEvents(newEvts);
    try {
      localStorage.setItem("gravwatch_events_antigravity_v3", JSON.stringify(newEvts));
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Pooled Quota Calculation & Cluster Aggregation Engine
  //
  // 1. Client-Side Calculation:
  //    - Currently aggregates twin-tier percentage averages and simulates random burn rates in-memory using `useMemo`.
  //
  // 2. Required Backend Endpoint:
  //    - `GET http://localhost:8000/api/v1/usage/latest`
  //
  // 3. Purpose / Why Needed:
  //    - The FastAPI backend calculates genuine cluster-wide capacity by reading internal SQLite token stores
  //      inside all active container volumes, providing authoritative burn rates (tokens/min), latency, and error rates.
  // --------------------------------------------------------------------------
  const pooledTelemetry = useMemo<PooledTelemetry>(() => {
    let activeContainers = 0;
    let totalRequests = 0;
    let totalCredits = 0;

    let totalGemini5hPercent = 0;
    let totalGeminiWeeklyPercent = 0;
    let totalClaude5hPercent = 0;
    let totalClaudeWeeklyPercent = 0;

    accounts.forEach((acc) => {
      if (acc.containerStatus === "running") activeContainers++;
      totalRequests += acc.totalRequestsToday;
      totalCredits += acc.aiCreditsBalanceUsd;

      totalGemini5hPercent += acc.geminiQuota.fiveHour.percentRemaining;
      totalGeminiWeeklyPercent += acc.geminiQuota.weekly.percentRemaining;
      totalClaude5hPercent += acc.claudeGptQuota.fiveHour.percentRemaining;
      totalClaudeWeeklyPercent += acc.claudeGptQuota.weekly.percentRemaining;
    });

    const count = Math.max(1, accounts.length);
    const geminiFiveHourPooled = Math.round((totalGemini5hPercent / count) * 10) / 10;
    const geminiWeeklyPooled = Math.round((totalGeminiWeeklyPercent / count) * 10) / 10;
    const claudeGptFiveHourPooled = Math.round((totalClaude5hPercent / count) * 10) / 10;
    const claudeGptWeeklyPooled = Math.round((totalClaudeWeeklyPercent / count) * 10) / 10;

    const overallCapacity = Math.round(
      ((geminiFiveHourPooled + geminiWeeklyPooled + claudeGptFiveHourPooled + claudeGptWeeklyPooled) / 4) * 10
    ) / 10;

    return {
      totalAccounts: accounts.length,
      activeContainers,
      geminiFiveHourPooledPercent: geminiFiveHourPooled,
      geminiWeeklyPooledPercent: geminiWeeklyPooled,
      claudeGptFiveHourPooledPercent: claudeGptFiveHourPooled,
      claudeGptWeeklyPooledPercent: claudeGptWeeklyPooled,
      overallPooledCapacity: overallCapacity,
      totalCreditsPoolUsd: totalCredits,
      burnRatePerMinute: Math.round(16200 + Math.random() * 2200),
      totalRequestsToday: totalRequests,
      successRatePercent: 99.1,
      averageLatencyMs: 380,
    };
  }, [accounts]);

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Real-Time Telemetry Streaming (WebSocket / SSE)
  //
  // 1. Simulated Stream:
  //    - Currently generates randomized token drain packets and mock prompts using a client-side `setInterval` (every 2.4s).
  //
  // 2. Required Backend Protocol:
  //    - WebSocket: `ws://localhost:8000/api/v1/telemetry/stream`
  //
  // 3. Purpose / Why Needed:
  //    - Receives real-time telemetry packets emitted by the `agy` CLI daemon as subagents execute inside
  //      isolated Docker sandboxes, instantly updating quota rings, token counters, and latency figures.
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLiveStreaming) return;

    // Fast live stream simulation interval (runs every 2.4 seconds for instant real-time feel)
    const interval = setInterval(() => {
      const activeAccs = accounts.filter((a) => a.status === "active" && a.containerStatus === "running");
      if (activeAccs.length === 0) return;

      const randomAcc = activeAccs[Math.floor(Math.random() * activeAccs.length)];
      const isGemini = Math.random() > 0.45;
      const modelGroup = isGemini ? "Gemini Models" : "Claude & GPT Models";
      const specificModel = isGemini
        ? (Math.random() > 0.5 ? "Gemini 3.6 Flash (High)" : "Gemini 3.1 Pro (High)")
        : (Math.random() > 0.5 ? "Claude Sonnet 4.6 (Thinking)" : "Claude Opus 4.6 (Thinking)");

      const tokenDrain = Math.floor(800 + Math.random() * 2600);

      const snippets = [
        "Antigravity CLI workspace indexing & subagent dispatch...",
        "Executing automated test suite inside isolated Docker node...",
        "Autonomous code refactoring with Claude Sonnet 4.6 (Thinking)...",
        "Scraping live quota metrics from internal SQLite cache...",
        "Streaming live telemetry chunks from debian:bookworm container...",
        "Subprocess execution: agy --model gemini-3.6-flash ...",
      ];
      const snippet = snippets[Math.floor(Math.random() * snippets.length)];

      const newEvent: TelemetryEvent = {
        id: "evt-" + Date.now().toString().slice(-6),
        timestamp: new Date().toISOString(),
        accountId: randomAcc.id,
        accountAlias: randomAcc.alias,
        modelGroup,
        specificModel,
        tokensUsed: tokenDrain,
        promptSnippet: snippet,
        status: "success",
        latencyMs: Math.floor(180 + Math.random() * 420),
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);

      // Update accounts quota and tokens in real time
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== randomAcc.id) return acc;
          const quotaKey = isGemini ? "geminiQuota" : "claudeGptQuota";
          const currentTier = acc[quotaKey].fiveHour;
          const newPct = Math.max(0, Math.round((currentTier.percentRemaining - 0.3) * 10) / 10);
          return {
            ...acc,
            totalRequestsToday: acc.totalRequestsToday + 1,
            totalTokensToday: acc.totalTokensToday + tokenDrain,
            lastScrapedAt: new Date().toISOString(),
            [quotaKey]: {
              ...acc[quotaKey],
              fiveHour: {
                ...currentTier,
                percentRemaining: newPct,
                used: currentTier.used + tokenDrain,
                status: newPct <= 10 ? "depleted" : newPct <= 30 ? "warning" : "healthy",
              },
            },
          };
        })
      );

      // Real-time timeline chart data point updates
      setTimelineData((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx < 0) return prev;
        const lastPoint = prev[lastIdx];
        const updatedLast = {
          ...lastPoint,
          totalTokens: lastPoint.totalTokens + tokenDrain,
          geminiTokens: isGemini ? lastPoint.geminiTokens + tokenDrain : lastPoint.geminiTokens,
          claudeGptTokens: !isGemini ? lastPoint.claudeGptTokens + tokenDrain : lastPoint.claudeGptTokens,
          requests: lastPoint.requests + 1,
        };
        return [...prev.slice(0, lastIdx), updatedLast];
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isLiveStreaming, accounts]);

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Google OAuth Pairing Daemon (setup-auth.sh)
  //
  // 1. Client-Side Simulation:
  //    - Currently appends a new account object directly to local state with default 100% quota metrics.
  //
  // 2. Required Backend Endpoint:
  //    - `POST http://localhost:8000/api/v1/auth/google/start`
  //
  // 3. Backend Execution Pipeline:
  //    - 1. Provisions an isolated container volume mounted at `./data/acc-XX:/root/.gemini`.
  //    - 2. Executes `./scripts/setup-auth.sh` daemon inside the container and returns Device Code / OAuth URL to the client.
  //    - 3. Exchanges tokens upon approval, stores session credentials, and registers the account in the database.
  // --------------------------------------------------------------------------
  const pairGoogleAccount = (profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    plan?: GravAccount["plan"];
  }) => {
    const nextIndex = accounts.length + 1;
    const padded = nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`;
    const id = `acc-${padded}`;
    const containerName = `gravwatch-acc-${padded}`;

    const newAcc: GravAccount = {
      id,
      alias: profile.name || `Google Account (${padded})`,
      email: profile.email || `dev.${padded}@gmail.com`,
      avatarUrl:
        profile.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      plan: profile.plan || "Google AI Pro",
      enableAiCredits: false,
      aiCreditsBalanceUsd: 25.0,
      containerName,
      containerStatus: "running",
      ramUsageMb: 124,
      ramLimitMb: 256,
      cpuUsagePercent: 1.6,
      authType: "google_oauth",
      status: "active",
      totalRequestsToday: 0,
      totalTokensToday: 0,
      lastScrapedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: ["Google OAuth", "Auto Paired", "Docker Sandbox"],
      notes: "Paired via setup-auth.sh Google OAuth flow",
      geminiQuota: {
        weekly: {
          percentRemaining: 100,
          refreshCountdown: "7 days, 0 hours",
          used: 0,
          limit: 1000000,
          status: "healthy",
        },
        fiveHour: {
          percentRemaining: 100,
          refreshCountdown: "5 hours, 0 minutes",
          used: 0,
          limit: 200000,
          status: "healthy",
        },
      },
      claudeGptQuota: {
        weekly: {
          percentRemaining: 100,
          refreshCountdown: "7 days, 0 hours",
          used: 0,
          limit: 800000,
          status: "healthy",
        },
        fiveHour: {
          percentRemaining: 100,
          refreshCountdown: "5 hours, 0 minutes",
          used: 0,
          limit: 150000,
          status: "healthy",
        },
      },
    };

    persistAccounts([...accounts, newAcc]);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Manual Sandbox Node Provisioning
  //
  // 1. Client-Side Simulation:
  //    - Currently generates a local account without validating bearer credentials or spawning Docker daemons.
  //
  // 2. Required Backend Endpoint:
  //    - `POST http://localhost:8000/api/v1/accounts/manual`
  //    - Request Payload: `{ alias, email, plan, session_token, enable_ai_credits, tags, notes }`
  //
  // 3. Purpose / Why Needed:
  //    - Authenticates the session token against Google Antigravity servers, creates the container sandbox
  //      (`docker run --memory=256m ...`), and triggers initial quota indexing.
  // --------------------------------------------------------------------------
  const addAccount = (partial: Partial<GravAccount>) => {
    const nextIndex = accounts.length + 1;
    const padded = nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`;
    const id = `acc-${padded}`;
    const containerName = `gravwatch-acc-${padded}`;

    const newAcc: GravAccount = {
      id,
      alias: partial.alias || `Custom Node (${padded})`,
      email: partial.email || `custom.${padded}@antigravity.org`,
      avatarUrl:
        partial.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      plan: partial.plan || "Google AI Pro",
      enableAiCredits: partial.enableAiCredits || false,
      aiCreditsBalanceUsd: partial.aiCreditsBalanceUsd || 10.0,
      containerName,
      containerStatus: "running",
      ramUsageMb: 115,
      ramLimitMb: 256,
      cpuUsagePercent: 1.1,
      authType: partial.authType || "manual_session",
      status: "active",
      totalRequestsToday: 0,
      totalTokensToday: 0,
      lastScrapedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: partial.tags || ["Manual Key", "Custom Node"],
      notes: partial.notes || "Configured manually",
      geminiQuota: partial.geminiQuota || INITIAL_ACCOUNTS[0].geminiQuota,
      claudeGptQuota: partial.claudeGptQuota || INITIAL_ACCOUNTS[0].claudeGptQuota,
    };

    persistAccounts([...accounts, newAcc]);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Update Account Metadata & Settings
  //
  // 1. Client-Side Simulation:
  //    - Updates in-memory state and localStorage only.
  //
  // 2. Required Backend Endpoint:
  //    - `PATCH http://localhost:8000/api/v1/accounts/{id}`
  //    - Request Payload: `{ alias, email, plan, enable_ai_credits, status, tags, notes }`
  //
  // 3. Purpose / Why Needed:
  //    - Persist modified account configurations in the DB and inform the router of AI Credits overages settings.
  // --------------------------------------------------------------------------
  const updateAccount = (id: string, updates: Partial<GravAccount>) => {
    // TODO: [MISSING PATTERN] - Optimistic update + rollback:
    //   1. Snapshot current accounts state before the mutation.
    //   2. Apply `updates` to local state immediately (optimistic).
    //   3. Send PATCH /api/v1/accounts/{id} to the backend.
    //   4. If the request fails (HTTP 400 / 500), restore the snapshot and show an error toast.
    //   This pattern prevents the UI from feeling sluggish while waiting for network confirmation.
    const updated = accounts.map((a) => (a.id === id ? { ...a, ...updates } : a));
    persistAccounts(updated);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Delete Account & Teardown Docker Sandbox
  //
  // 1. Client-Side Simulation:
  //    - Filters out the account from local memory array.
  //
  // 2. Required Backend Endpoint:
  //    - `DELETE http://localhost:8000/api/v1/accounts/{id}?purge_volume=true`
  //
  // 3. Purpose / Why Needed:
  //    - Stop and remove the Docker container (`docker stop && docker rm -v`), purge token directory
  //      `./data/acc-XX/`, delete the database record, and trigger quota re-aggregation.
  // --------------------------------------------------------------------------
  const deleteAccount = (id: string) => {
    const remaining = accounts.filter((a) => a.id !== id);
    persistAccounts(remaining);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Toggle Docker Container State (Pause / Resume)
  //
  // 1. Client-Side Simulation:
  //    - Switches the account status between 'active' and 'paused' locally.
  //
  // 2. Required Backend Endpoint:
  //    - `POST http://localhost:8000/api/v1/accounts/{id}/toggle-status`
  //
  // 3. Purpose / Why Needed:
  //    - Executes `docker pause <container>` to free host CPU/memory, or `docker unpause <container>` to resume execution.
  // --------------------------------------------------------------------------
  const toggleAccountStatus = (id: string) => {
    const updated = accounts.map((a) => {
      if (a.id === id) {
        const newStatus = a.status === "paused" ? "active" : "paused";
        const newContainerStatus = newStatus === "paused" ? "stopped" : "running";
        return {
          ...a,
          status: newStatus as GravAccount["status"],
          containerStatus: newContainerStatus as GravAccount["containerStatus"],
        };
      }
      return a;
    });
    persistAccounts(updated);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Force Account Quota Scraping & Sync
  //
  // 1. Client-Side Simulation:
  //    - Updates `lastScrapedAt` timestamp locally.
  //
  // 2. Required Backend Endpoint:
  //    - `POST http://localhost:8000/api/v1/accounts/{id}/sync`
  //
  // 3. Purpose / Why Needed:
  //    - Forces the background daemon to re-inspect internal SQLite quota caches for a specific account node.
  // --------------------------------------------------------------------------
  const refreshAccount = (id: string) => {
    const updated = accounts.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          lastScrapedAt: new Date().toISOString(),
        };
      }
      return a;
    });
    persistAccounts(updated);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Sync All Accounts Cluster
  //
  // 1. Required Backend Endpoint:
  //    - `POST http://localhost:8000/api/v1/accounts/sync-all`
  //
  // 2. Purpose / Why Needed:
  //    - Triggers parallel quota scraping across all active Docker sandboxes to update pooled telemetry.
  // --------------------------------------------------------------------------
  const refreshAllAccounts = () => {
    const now = new Date().toISOString();
    const updated = accounts.map((a) => ({
      ...a,
      lastScrapedAt: now,
    }));
    persistAccounts(updated);
    fetchLiveBackendData();
  };

  const resetSampleData = () => {
    persistAccounts(INITIAL_ACCOUNTS);
    persistEvents(INITIAL_EVENTS);
    setTimelineData(INITIAL_TIMELINE_DATA);
    setSelectedAccountId("all");
  };

  const toggleLiveStreaming = () => {
    setIsLiveStreaming((prev) => !prev);
  };

  // --------------------------------------------------------------------------
  // TODO: [BACKEND INTEGRATION] - Antigravity CLI Load Balancer & Proxy Router
  //
  // 1. Client-Side Simulation:
  //    - Selects target account in JavaScript, calculates random token drains, and updates local state.
  //
  // 2. Required Backend Endpoint:
  //    - `POST http://localhost:8000/api/v1/router/execute`
  //    - Request Payload: `{ model_group, specific_model, prompt, strategy }`
  //
  // 3. Backend Execution Pipeline:
  //    - 1. Evaluates live 5-hour quota percentages to pick the optimal account sandbox.
  //    - 2. Invokes: `docker exec {container} agy -p "{prompt}" --model "{specificModel}"`.
  //    - 3. Streams stdout back and commits token consumption to SQLite DB.
  // --------------------------------------------------------------------------
  const executePromptSimulation = (
    modelGroup: "Gemini Models" | "Claude & GPT Models",
    specificModel: string,
    prompt: string,
    strategy: "least" | "round"
  ) => {
    const isGemini = modelGroup === "Gemini Models";
    const quotaKey = isGemini ? "geminiQuota" : "claudeGptQuota";

    const available = accounts.filter(
      (a) =>
        a.status === "active" &&
        a.containerStatus === "running" &&
        a[quotaKey].fiveHour.percentRemaining > 0
    );

    // TODO: [MISSING GUARD] - Negative AI credit balance: if `enableAiCredits` is true but
    //   `aiCreditsBalanceUsd <= 0`, skip routing to that account even if quota is available.
    //   Show a toast: "Account {alias} has $0.00 credit balance — cannot route overage requests."
    //   Only include accounts where `!enableAiCredits || aiCreditsBalanceUsd > 0` in `available`.

    if (available.length === 0) {
      return { success: false, accountAlias: "None (All Accounts Depleted)", tokensUsed: 0 };
    }

    let targetAccount: GravAccount;
    if (strategy === "least") {
      // Find account with highest percent remaining
      targetAccount = available.reduce((max, curr) => {
        return curr[quotaKey].fiveHour.percentRemaining > max[quotaKey].fiveHour.percentRemaining
          ? curr
          : max;
      }, available[0]);
    } else {
      // Round robin
      targetAccount = available[Math.floor(Math.random() * available.length)];
    }

    const estimatedTokens = Math.floor(1800 + Math.random() * 4200);

    const newEvent: TelemetryEvent = {
      id: "sim-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      accountId: targetAccount.id,
      accountAlias: targetAccount.alias,
      modelGroup,
      specificModel,
      tokensUsed: estimatedTokens,
      promptSnippet: prompt || "Simulated interactive Antigravity CLI execution...",
      status: "success",
      latencyMs: Math.floor(280 + Math.random() * 410),
    };

    setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);

    // Update target account quota
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== targetAccount.id) return acc;
        const currentTier = acc[quotaKey].fiveHour;
        const newPct = Math.max(0, Math.round((currentTier.percentRemaining - 3) * 10) / 10);
        return {
          ...acc,
          totalRequestsToday: acc.totalRequestsToday + 1,
          totalTokensToday: acc.totalTokensToday + estimatedTokens,
          lastScrapedAt: new Date().toISOString(),
          [quotaKey]: {
            ...acc[quotaKey],
            fiveHour: {
              ...currentTier,
              percentRemaining: newPct,
              used: currentTier.used + estimatedTokens,
              status: newPct <= 10 ? "depleted" : newPct <= 30 ? "warning" : "healthy",
            },
          },
        };
      })
    );

    return {
      success: true,
      accountAlias: targetAccount.alias,
      tokensUsed: estimatedTokens,
    };
  };

  return (
    <GravWatchContext.Provider
      value={{
        accounts,
        selectedAccountId,
        timeRange,
        activeTab,
        isLiveStreaming,
        events,
        timelineData,
        pooledTelemetry,
        setSelectedAccountId,
        setTimeRange,
        setActiveTab,
        setIsLiveStreaming,
        toggleLiveStreaming,
        addAccount,
        pairGoogleAccount,
        updateAccount,
        deleteAccount,
        toggleAccountStatus,
        refreshAccount,
        refreshAllAccounts,
        resetSampleData,
        executePromptSimulation,
      }}
    >
      {children}
    </GravWatchContext.Provider>
  );
};

export const useGravWatch = () => {
  const context = useContext(GravWatchContext);
  if (!context) {
    throw new Error("useGravWatch must be used within a GravWatchProvider");
  }
  return context;
};
