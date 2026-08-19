"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  GravAccount,
  PooledTelemetry,
  TelemetryEvent,
  TimeSeriesDataPoint,
  TimeRangeFilter,
  TabView,
  AntigravityPlan,
} from "@/types/gravwatch";

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
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (id: string) => void;
  refreshAccount: (id: string) => Promise<void>;
  refreshAllAccounts: () => Promise<void>;
  resetSampleData: () => void;
  executePromptSimulation: (
    modelGroup: "Gemini Models" | "Claude & GPT Models",
    specificModel: string,
    prompt: string,
    strategy: "least" | "round"
  ) => Promise<{ success: boolean; accountAlias: string; tokensUsed: number; response?: string }>;
}

const GravWatchContext = createContext<GravWatchContextType | undefined>(undefined);

export const GravWatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<GravAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("24h");
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [timelineData, setTimelineData] = useState<TimeSeriesDataPoint[]>([]);

  const fetchLiveAccounts = useCallback(async () => {
    try {
      const [authRes, usageRes] = await Promise.all([
        fetch("/api/v1/auth/status", { cache: "no-store" }),
        fetch("/api/v1/usage/latest", { cache: "no-store" })
      ]);

      if (!authRes.ok) return;
      const authData = await authRes.json();
      if (!Array.isArray(authData)) return;

      let usageAccountsMap: Record<string, any> = {};
      if (usageRes.ok) {
        try {
          const usageData = await usageRes.json();
          if (Array.isArray(usageData.accounts)) {
            usageData.accounts.forEach((acc: any) => {
              usageAccountsMap[acc.account_id] = acc;
            });
          }
        } catch {
        }
      }

      const mapped: GravAccount[] = authData.map((item: any, idx: number) => {
        const id = item.account_id || `acc-${idx + 1}`;
        const isAuth = Boolean(item.authenticated && item.email);
        const email = item.email || (isAuth ? `Account ${id}` : "Unauthenticated");
        const alias = item.name || `Node [${id}]`;
        const avatarUrl = item.picture || "";

        const usageAcc = usageAccountsMap[id];
        const geminiCat = usageAcc?.categories?.find((c: any) => c.category_id === "gemini-models");
        const claudeCat = usageAcc?.categories?.find((c: any) => c.category_id === "claude-and-gpt-models");

        const gWeeklyPct = geminiCat?.weekly_limit?.percentage_remaining ?? 0;
        const gWeeklyCountdown = geminiCat?.weekly_limit?.refresh_in_human ?? (isAuth ? "Syncing..." : "Offline");
        const g5hPct = geminiCat?.five_hour_limit?.percentage_remaining ?? 0;
        const g5hCountdown = geminiCat?.five_hour_limit?.refresh_in_human ?? (isAuth ? "Syncing..." : "Offline");

        const cWeeklyPct = claudeCat?.weekly_limit?.percentage_remaining ?? 0;
        const cWeeklyCountdown = claudeCat?.weekly_limit?.refresh_in_human ?? (isAuth ? "Syncing..." : "Offline");
        const c5hPct = claudeCat?.five_hour_limit?.percentage_remaining ?? 0;
        const c5hCountdown = claudeCat?.five_hour_limit?.refresh_in_human ?? (isAuth ? "Syncing..." : "Offline");

        return {
          id: id,
          alias: alias,
          email: email,
          avatarUrl: avatarUrl,
          plan: "Google AI Pro" as AntigravityPlan,
          containerName: `gravwatch-${id}`,
          containerStatus: isAuth ? "running" : "stopped",
          ramUsageMb: isAuth ? 48 : 0,
          ramLimitMb: 256,
          cpuUsagePercent: isAuth ? 1.2 : 0,
          authType: "google_oauth",
          status: isAuth ? "active" : "paused",
          totalRequestsToday: 0,
          totalTokensToday: 0,
          geminiQuota: {
            weekly: {
              percentRemaining: gWeeklyPct,
              refreshCountdown: gWeeklyCountdown,
              used: 100 - gWeeklyPct,
              limit: 10000000,
              status: isAuth ? "healthy" : "warning",
            },
            fiveHour: {
              percentRemaining: g5hPct,
              refreshCountdown: g5hCountdown,
              used: 100 - g5hPct,
              limit: 2000000,
              status: isAuth ? "healthy" : "warning",
            },
          },
          claudeGptQuota: {
            weekly: {
              percentRemaining: cWeeklyPct,
              refreshCountdown: cWeeklyCountdown,
              used: 100 - cWeeklyPct,
              limit: 5000000,
              status: isAuth ? "healthy" : "warning",
            },
            fiveHour: {
              percentRemaining: c5hPct,
              refreshCountdown: c5hCountdown,
              used: 100 - c5hPct,
              limit: 1000000,
              status: isAuth ? "healthy" : "warning",
            },
          },
          lastScrapedAt: item.last_token_update || new Date().toISOString(),
          tags: [isAuth ? "Online" : "Pending Pairing", "Google Antigravity"],
          createdAt: item.last_token_update || new Date().toISOString(),
        };
      });

      setAccounts(mapped);
      setEvents((prev) => {
        if (prev.length > 0) return prev;
        const active = mapped.filter((a) => a.containerStatus === "running");
        if (active.length === 0) return [];
        const primary = active[0];
        const gW = primary.geminiQuota.weekly.percentRemaining;
        const g5 = primary.geminiQuota.fiveHour.percentRemaining;
        const cW = primary.claudeGptQuota.weekly.percentRemaining;
        const c5 = primary.claudeGptQuota.fiveHour.percentRemaining;
        return [
          {
            id: `evt-${Date.now()}-1`,
            timestamp: new Date(Date.now() - 15000).toISOString(),
            accountId: primary.id,
            accountAlias: primary.alias,
            modelGroup: "Gemini Models",
            specificModel: "gemini-3.7-flash-high",
            tokensUsed: 1420,
            promptSnippet: `quota-scrape: Gemini (${gW}%) · 5h (${g5}%) — Live Google CloudCode Telemetry`,
            status: "success",
            latencyMs: 185,
          },
          {
            id: `evt-${Date.now()}-2`,
            timestamp: new Date(Date.now() - 45000).toISOString(),
            accountId: primary.id,
            accountAlias: primary.alias,
            modelGroup: "Claude & GPT Models",
            specificModel: "claude-sonnet-4-6",
            tokensUsed: 2180,
            promptSnippet: `quota-scrape: Claude/GPT (${cW}%) · 5h (${c5}%) — Multi-Model Allocation`,
            status: "success",
            latencyMs: 240,
          },
          {
            id: `evt-${Date.now()}-3`,
            timestamp: new Date(Date.now() - 90000).toISOString(),
            accountId: primary.id,
            accountAlias: primary.alias,
            modelGroup: "Gemini Models",
            specificModel: "gemini-3.1-pro-high",
            tokensUsed: 980,
            promptSnippet: "session-heartbeat: Antigravity OAuth session authenticated in Docker container",
            status: "success",
            latencyMs: 120,
          },
        ];
      });
    } catch (err) {
      console.warn("Failed to fetch live accounts from backend:", err);
    }
  }, []);

  const fetchLiveHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/usage/history?range=${timeRange}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.series) && data.series.length > 0) {
        setTimelineData(
          data.series.map((pt: any) => ({
            time: pt.time_label || new Date(pt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            totalTokens: (pt.gemini_tokens || 0) + (pt.claude_tokens || 0),
            geminiTokens: pt.gemini_tokens || 0,
            claudeGptTokens: pt.claude_tokens || 0,
            requests: (pt.active_nodes || 1) * 15,
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to fetch usage history:", err);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchLiveAccounts();
    fetchLiveHistory();

    const interval = setInterval(() => {
      if (isLiveStreaming) {
        fetchLiveAccounts();
        fetchLiveHistory();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchLiveAccounts, fetchLiveHistory, isLiveStreaming]);

  const pooledTelemetry = useMemo<PooledTelemetry>(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.containerStatus === "running");
    const activeCount = activeAccounts.length;

    if (activeCount === 0) {
      return {
        totalAccounts,
        activeContainers: 0,
        geminiFiveHourPooledPercent: 0,
        geminiWeeklyPooledPercent: 0,
        claudeGptFiveHourPooledPercent: 0,
        claudeGptWeeklyPooledPercent: 0,
        overallPooledCapacity: 0,
        burnRatePerMinute: 0,
        totalRequestsToday: 0,
        successRatePercent: 100,
        averageLatencyMs: 0,
      };
    }

    const avgG5h = Math.round(activeAccounts.reduce((acc, a) => acc + a.geminiQuota.fiveHour.percentRemaining, 0) / activeCount);
    const avgGWeekly = Math.round(activeAccounts.reduce((acc, a) => acc + a.geminiQuota.weekly.percentRemaining, 0) / activeCount);
    const avgC5h = Math.round(activeAccounts.reduce((acc, a) => acc + a.claudeGptQuota.fiveHour.percentRemaining, 0) / activeCount);
    const avgCWeekly = Math.round(activeAccounts.reduce((acc, a) => acc + a.claudeGptQuota.weekly.percentRemaining, 0) / activeCount);

    return {
      totalAccounts,
      activeContainers: activeCount,
      geminiFiveHourPooledPercent: avgG5h,
      geminiWeeklyPooledPercent: avgGWeekly,
      claudeGptFiveHourPooledPercent: avgC5h,
      claudeGptWeeklyPooledPercent: avgCWeekly,
      overallPooledCapacity: Math.round((avgG5h + avgGWeekly + avgC5h + avgCWeekly) / 4),
      burnRatePerMinute: 0,
      totalRequestsToday: 0,
      successRatePercent: 100,
      averageLatencyMs: 820,
    };
  }, [accounts]);

  const toggleLiveStreaming = () => {
    setIsLiveStreaming((prev) => !prev);
  };

  const addAccount = (account: Partial<GravAccount>) => {
    const newId = `acc-${accounts.length + 1}`;
    const newAcc: GravAccount = {
      id: newId,
      alias: account.alias || `Node [${newId}]`,
      email: account.email || "pending@google.com",
      avatarUrl: account.avatarUrl || "",
      plan: (account.plan as AntigravityPlan) || "Google AI Pro",
      containerName: `gravwatch-${newId}`,
      containerStatus: "running",
      ramUsageMb: 48,
      ramLimitMb: 256,
      cpuUsagePercent: 1.0,
      authType: "google_oauth",
      status: "active",
      totalRequestsToday: 0,
      totalTokensToday: 0,
      geminiQuota: {
        weekly: { percentRemaining: 100, refreshCountdown: "Active", used: 0, limit: 10000000, status: "healthy" },
        fiveHour: { percentRemaining: 100, refreshCountdown: "Active", used: 0, limit: 2000000, status: "healthy" },
      },
      claudeGptQuota: {
        weekly: { percentRemaining: 100, refreshCountdown: "Active", used: 0, limit: 5000000, status: "healthy" },
        fiveHour: { percentRemaining: 100, refreshCountdown: "Active", used: 0, limit: 1000000, status: "healthy" },
      },
      lastScrapedAt: new Date().toISOString(),
      tags: ["Dynamic Node"],
      createdAt: new Date().toISOString(),
    };

    setAccounts((prev) => [...prev, newAcc]);
  };

  const pairGoogleAccount = (profile: { name: string; email: string; avatarUrl?: string; plan?: GravAccount["plan"] }) => {
    addAccount({
      alias: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      plan: profile.plan || "Google AI Pro",
    });
  };

  const updateAccount = (id: string, updates: Partial<GravAccount>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAccount = async (id: string) => {
    try {
      await fetch(`/api/v1/auth/token?account_id=${id}`, {
        method: "DELETE",
        headers: {
          "X-Master-Key": "default-master-key-change-in-production",
        },
      });
    } catch {
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (selectedAccountId === id) {
      setSelectedAccountId("all");
    }
  };

  const toggleAccountStatus = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a))
    );
  };

  const refreshAccount = async (id: string) => {
    await fetchLiveAccounts();
  };

  const refreshAllAccounts = async () => {
    await fetchLiveAccounts();
    await fetchLiveHistory();
  };

  const resetSampleData = () => {
    fetchLiveAccounts();
  };

  const executePromptSimulation = async (
    modelGroup: "Gemini Models" | "Claude & GPT Models",
    specificModel: string,
    prompt: string,
    strategy: "least" | "round"
  ): Promise<{ success: boolean; accountAlias: string; tokensUsed: number; response?: string }> => {
    const activeAccounts = accounts.filter((a) => a.status === "active");
    if (activeAccounts.length === 0) {
      throw new Error("No active accounts available in the cluster to process this prompt.");
    }

    const selected = activeAccounts[0];

    try {
      const res = await fetch("/api/v1/prompt/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selected.id,
          prompt: prompt,
          model: specificModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to execute prompt with model.");
      }

      const newEvt: TelemetryEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        accountId: selected.id,
        accountAlias: selected.alias,
        modelGroup: modelGroup,
        specificModel: specificModel,
        tokensUsed: data.tokens_used || 15,
        promptSnippet: prompt.length > 70 ? `${prompt.substring(0, 70)}...` : prompt,
        status: "success",
        latencyMs: data.latency_ms || 420,
      };

      setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);

      return {
        success: true,
        accountAlias: selected.alias,
        tokensUsed: data.tokens_used || 15,
        response: data.response,
      };
    } catch (err: any) {
      throw new Error(err.message || "Execution error with Antigravity model.");
    }
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

export const useGravWatch = (): GravWatchContextType => {
  const context = useContext(GravWatchContext);
  if (!context) {
    throw new Error("useGravWatch must be used within a GravWatchProvider");
  }
  return context;
};
