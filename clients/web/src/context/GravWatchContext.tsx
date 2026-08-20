"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  GravAccount,
  PooledTelemetry,
  TabView,
  AntigravityPlan,
} from "@/types/gravwatch";

interface GravWatchContextType {
  accounts: GravAccount[];
  selectedAccountId: string;
  activeTab: TabView;
  pooledTelemetry: PooledTelemetry;
  setSelectedAccountId: (id: string) => void;
  setActiveTab: (tab: TabView) => void;
  addAccount: (account: Partial<GravAccount>) => void;
  pairGoogleAccount: (profile: { name: string; email: string; avatarUrl?: string; plan?: GravAccount["plan"] }) => void;
  updateAccount: (id: string, updates: Partial<GravAccount>) => void;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (id: string) => void;
  refreshAccount: (id: string) => Promise<void>;
  refreshAllAccounts: () => Promise<void>;
  resetSampleData: () => void;
}

const GravWatchContext = createContext<GravWatchContextType | undefined>(undefined);

let memoryAccountsCache: GravAccount[] = [];
let isFetchingInProgress = false;

export const GravWatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<GravAccount[]>(() => memoryAccountsCache);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLiveAccounts = useCallback(async () => {
    if (isFetchingInProgress) return;
    isFetchingInProgress = true;

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const [authRes, usageRes] = await Promise.all([
        fetch("/api/v1/auth/status", {
          cache: "no-store",
          signal: abortControllerRef.current.signal,
        }),
        fetch("/api/v1/usage/latest", {
          cache: "no-store",
          signal: abortControllerRef.current.signal,
        }),
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
        } catch {}
      }

      setAccounts((prevAccounts) => {
        const updatedAccounts: GravAccount[] = authData.map((item: any, idx: number) => {
          const id = item.account_id || `acc-${idx + 1}`;
          const isAuth = Boolean(item.authenticated);
          const prev = prevAccounts.find((a) => a.id === id);

          const email = item.email || prev?.email || (isAuth ? `Account ${id}` : "Unauthenticated");
          const alias = item.name || prev?.alias || `Node [${id}]`;
          const avatarUrl = item.picture || prev?.avatarUrl || "";

          const usageAcc = usageAccountsMap[id];
          const geminiCat = usageAcc?.categories?.find((c: any) => c.category_id === "gemini-models");
          const claudeCat = usageAcc?.categories?.find((c: any) => c.category_id === "claude-and-gpt-models");

          const hasNewGeminiWeekly =
            geminiCat?.weekly_limit?.percentage_remaining !== undefined &&
            geminiCat?.weekly_limit?.percentage_remaining !== null;
          const gWeeklyPct = hasNewGeminiWeekly
            ? geminiCat.weekly_limit.percentage_remaining
            : prev?.geminiQuota?.weekly?.percentRemaining ?? 0;
          const gWeeklyCountdown =
            geminiCat?.weekly_limit?.refresh_in_human ||
            (hasNewGeminiWeekly
              ? "Full capacity available"
              : prev?.geminiQuota?.weekly?.refreshCountdown ?? (isAuth ? "Syncing..." : "Offline"));

          const hasNewGemini5h =
            geminiCat?.five_hour_limit?.percentage_remaining !== undefined &&
            geminiCat?.five_hour_limit?.percentage_remaining !== null;
          const g5hPct = hasNewGemini5h
            ? geminiCat.five_hour_limit.percentage_remaining
            : prev?.geminiQuota?.fiveHour?.percentRemaining ?? 0;
          const g5hCountdown =
            geminiCat?.five_hour_limit?.refresh_in_human ||
            (hasNewGemini5h
              ? "Full capacity available"
              : prev?.geminiQuota?.fiveHour?.refreshCountdown ?? (isAuth ? "Syncing..." : "Offline"));

          const hasNewClaudeWeekly =
            claudeCat?.weekly_limit?.percentage_remaining !== undefined &&
            claudeCat?.weekly_limit?.percentage_remaining !== null;
          const cWeeklyPct = hasNewClaudeWeekly
            ? claudeCat.weekly_limit.percentage_remaining
            : prev?.claudeGptQuota?.weekly?.percentRemaining ?? 0;
          const cWeeklyCountdown =
            claudeCat?.weekly_limit?.refresh_in_human ||
            (hasNewClaudeWeekly
              ? "Full capacity available"
              : prev?.claudeGptQuota?.weekly?.refreshCountdown ?? (isAuth ? "Syncing..." : "Offline"));

          const hasNewClaude5h =
            claudeCat?.five_hour_limit?.percentage_remaining !== undefined &&
            claudeCat?.five_hour_limit?.percentage_remaining !== null;
          const c5hPct = hasNewClaude5h
            ? claudeCat.five_hour_limit.percentage_remaining
            : prev?.claudeGptQuota?.fiveHour?.percentRemaining ?? 0;
          const c5hCountdown =
            claudeCat?.five_hour_limit?.refresh_in_human ||
            (hasNewClaude5h
              ? "Full capacity available"
              : prev?.claudeGptQuota?.fiveHour?.refreshCountdown ?? (isAuth ? "Syncing..." : "Offline"));

          const containerState = item.container_status || (isAuth ? "running" : "stopped");
          const isRunning = containerState === "running";

          return {
            id: id,
            alias: alias,
            email: email,
            avatarUrl: avatarUrl,
            plan: "Google AI Pro" as AntigravityPlan,
            containerName: `gravwatch-${id}`,
            containerStatus: isRunning ? ("running" as const) : ("stopped" as const),
            ramUsageMb: isRunning ? 48 : 0,
            ramLimitMb: 256,
            cpuUsagePercent: isRunning ? 1.2 : 0,
            authType: "google_oauth",
            status: isRunning ? ("active" as const) : ("paused" as const),
            totalRequestsToday: 0,
            totalTokensToday: 0,
            geminiQuota: {
              weekly: {
                percentRemaining: gWeeklyPct,
                refreshCountdown: gWeeklyCountdown,
                used: 100 - gWeeklyPct,
                limit: 10000000,
                status: isAuth ? (gWeeklyPct < 15 ? "depleted" : gWeeklyPct < 40 ? "warning" : "healthy") : "warning",
              },
              fiveHour: {
                percentRemaining: g5hPct,
                refreshCountdown: g5hCountdown,
                used: 100 - g5hPct,
                limit: 2000000,
                status: isAuth ? (g5hPct < 15 ? "depleted" : g5hPct < 40 ? "warning" : "healthy") : "warning",
              },
            },
            claudeGptQuota: {
              weekly: {
                percentRemaining: cWeeklyPct,
                refreshCountdown: cWeeklyCountdown,
                used: 100 - cWeeklyPct,
                limit: 5000000,
                status: isAuth ? (cWeeklyPct < 15 ? "depleted" : cWeeklyPct < 40 ? "warning" : "healthy") : "warning",
              },
              fiveHour: {
                percentRemaining: c5hPct,
                refreshCountdown: c5hCountdown,
                used: 100 - c5hPct,
                limit: 1000000,
                status: isAuth ? (c5hPct < 15 ? "depleted" : c5hPct < 40 ? "warning" : "healthy") : "warning",
              },
            },
            lastScrapedAt: item.last_token_update || prev?.lastScrapedAt || new Date().toISOString(),
            tags: [isAuth ? "Online" : "Pending Pairing", "Google Antigravity"],
            createdAt: item.last_token_update || prev?.createdAt || new Date().toISOString(),
          };
        });

        const isUnchanged =
          prevAccounts.length === updatedAccounts.length &&
          prevAccounts.every((prev, i) => {
            const next = updatedAccounts[i];
            return (
              prev.id === next.id &&
              prev.status === next.status &&
              prev.containerStatus === next.containerStatus &&
              prev.email === next.email &&
              prev.alias === next.alias &&
              prev.geminiQuota.weekly.percentRemaining === next.geminiQuota.weekly.percentRemaining &&
              prev.geminiQuota.weekly.refreshCountdown === next.geminiQuota.weekly.refreshCountdown &&
              prev.geminiQuota.fiveHour.percentRemaining === next.geminiQuota.fiveHour.percentRemaining &&
              prev.geminiQuota.fiveHour.refreshCountdown === next.geminiQuota.fiveHour.refreshCountdown &&
              prev.claudeGptQuota.weekly.percentRemaining === next.claudeGptQuota.weekly.percentRemaining &&
              prev.claudeGptQuota.weekly.refreshCountdown === next.claudeGptQuota.weekly.refreshCountdown &&
              prev.claudeGptQuota.fiveHour.percentRemaining === next.claudeGptQuota.fiveHour.percentRemaining &&
              prev.claudeGptQuota.fiveHour.refreshCountdown === next.claudeGptQuota.fiveHour.refreshCountdown
            );
          });

        if (isUnchanged) {
          return prevAccounts;
        }

        memoryAccountsCache = updatedAccounts;
        return updatedAccounts;
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Live sync error:", err);
      }
    } finally {
      isFetchingInProgress = false;
    }
  }, []);

  useEffect(() => {
    fetchLiveAccounts();

    const interval = setInterval(() => {
      fetchLiveAccounts();
    }, 2500);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLiveAccounts]);

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

    setAccounts((prev) => {
      const next = [...prev, newAcc];
      memoryAccountsCache = next;
      return next;
    });
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
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      memoryAccountsCache = next;
      return next;
    });
  };

  const deleteAccount = async (id: string) => {
    setAccounts((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      memoryAccountsCache = remaining;
      return remaining;
    });
    if (selectedAccountId === id) {
      setSelectedAccountId("all");
    }
    try {
      await fetch(`/api/v1/auth/token?account_id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "X-Master-Key": "default-master-key-change-in-production",
        },
      });
    } catch (err) {
      console.warn("Failed to delete account on server:", err);
    }
    await fetchLiveAccounts();
  };

  const toggleAccountStatus = async (id: string) => {
    setAccounts((prev) => {
      const next = prev.map((a) => {
        if (a.id === id) {
          const willBeRunning = a.containerStatus !== "running";
          return {
            ...a,
            containerStatus: willBeRunning ? ("running" as const) : ("stopped" as const),
            status: willBeRunning ? ("active" as const) : ("paused" as const),
            ramUsageMb: willBeRunning ? 48 : 0,
            cpuUsagePercent: willBeRunning ? 1.2 : 0,
          };
        }
        return a;
      });
      memoryAccountsCache = next;
      return next;
    });

    try {
      await fetch(`/api/v1/auth/container/toggle?account_id=${encodeURIComponent(id)}`, {
        method: "POST",
      });
    } catch (err) {
      console.warn("Failed to toggle container on server:", err);
    }

    isFetchingInProgress = false;
    await fetchLiveAccounts();
  };

  const refreshAccount = async (_id: string) => {
    isFetchingInProgress = false;
    await fetchLiveAccounts();
  };

  const refreshAllAccounts = async () => {
    isFetchingInProgress = false;
    await fetchLiveAccounts();
  };

  const resetSampleData = () => {
    fetchLiveAccounts();
  };

  return (
    <GravWatchContext.Provider
      value={{
        accounts,
        selectedAccountId,
        activeTab,
        pooledTelemetry,
        setSelectedAccountId,
        setActiveTab,
        addAccount,
        pairGoogleAccount,
        updateAccount,
        deleteAccount,
        toggleAccountStatus,
        refreshAccount,
        refreshAllAccounts,
        resetSampleData,
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
