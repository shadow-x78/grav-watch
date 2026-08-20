"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Sparkles,
  Zap,
  ArrowRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";

export const ClusterNodesSummary: React.FC = () => {
  const { accounts, setActiveTab, setSelectedAccountId } = useGravWatch();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (accounts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.25 }}
      className="rounded-xl border border-white/10 bg-[#0b0f1d] overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#060911] text-[#34a853] border border-white/10 shrink-0">
            <Server className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">
              {t("overview.clusterNodes.title")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {t("overview.clusterNodes.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-[#060911] p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-[#4285f4] text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[#4285f4] text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("accounts")}
            className="h-7 text-xs font-medium border-white/10 hover:border-white/20 gap-1.5"
          >
            <span>{t("overview.clusterNodes.viewAll")}</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
          {accounts.map((account) => {
            const isOnline = account.containerStatus === "running";
            const gemini5h = account.geminiQuota.fiveHour.percentRemaining;
            const geminiWeekly = account.geminiQuota.weekly.percentRemaining;
            const claude5h = account.claudeGptQuota.fiveHour.percentRemaining;
            const claudeWeekly = account.claudeGptQuota.weekly.percentRemaining;

            return (
              <div
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className="group cursor-pointer rounded-lg border border-white/10 bg-[#060911]/60 p-3.5 hover:border-white/25 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#060911] border border-white/10 text-[#4285f4] font-bold text-xs">
                      {account.alias.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#4285f4] transition-colors">
                        {account.alias}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {account.containerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOnline
                          ? "bg-[#34a853]/15 text-[#34a853] border border-[#34a853]/25"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isOnline ? "bg-[#34a853]" : "bg-slate-500"
                        }`}
                      />
                      {isOnline
                        ? t("overview.clusterNodes.online")
                        : t("overview.clusterNodes.offline")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-[#0b0f1d] p-2 border border-white/[0.04]">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Sparkles className="h-3 w-3 text-[#4285f4]" />
                      <span className="text-[10px] font-semibold text-slate-300">
                        Gemini
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        5h / Wk
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black font-mono text-[#4285f4]">
                          {gemini5h}%
                        </span>
                        <span className="text-[10px] text-slate-600">/</span>
                        <span className="text-[11px] font-bold font-mono text-[#34a853]">
                          {geminiWeekly}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md bg-[#0b0f1d] p-2 border border-white/[0.04]">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Zap className="h-3 w-3 text-[#ea4335]" />
                      <span className="text-[10px] font-semibold text-slate-300">
                        Claude & GPT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        5h / Wk
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black font-mono text-[#ea4335]">
                          {claude5h}%
                        </span>
                        <span className="text-[10px] text-slate-600">/</span>
                        <span className="text-[11px] font-bold font-mono text-[#34a853]">
                          {claudeWeekly}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.06] p-2">
          {accounts.map((account) => {
            const isOnline = account.containerStatus === "running";
            const gemini5h = account.geminiQuota.fiveHour.percentRemaining;
            const geminiWeekly = account.geminiQuota.weekly.percentRemaining;
            const claude5h = account.claudeGptQuota.fiveHour.percentRemaining;
            const claudeWeekly = account.claudeGptQuota.weekly.percentRemaining;

            return (
              <div
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 sm:w-56 shrink-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#060911] border border-white/10 text-[#4285f4] font-bold text-xs">
                    {account.alias.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-[#4285f4] transition-colors">
                      {account.alias}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {account.containerName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="flex items-center gap-2 bg-[#060911]/60 px-3 py-1.5 rounded-md border border-white/[0.06]">
                    <Sparkles className="h-3 w-3 text-[#4285f4] shrink-0" />
                    <span className="text-[11px] text-slate-300 font-medium truncate">Gemini:</span>
                    <div className="flex items-center gap-1.5 ml-auto rtl:ml-0 rtl:mr-auto font-mono text-xs">
                      <span className="text-[#4285f4] font-black">{gemini5h}%</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-[#34a853] font-bold">{geminiWeekly}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#060911]/60 px-3 py-1.5 rounded-md border border-white/[0.06]">
                    <Zap className="h-3 w-3 text-[#ea4335] shrink-0" />
                    <span className="text-[11px] text-slate-300 font-medium truncate">Claude/GPT:</span>
                    <div className="flex items-center gap-1.5 ml-auto rtl:ml-0 rtl:mr-auto font-mono text-xs">
                      <span className="text-[#ea4335] font-black">{claude5h}%</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-[#34a853] font-bold">{claudeWeekly}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isOnline
                        ? "bg-[#34a853]/15 text-[#34a853] border border-[#34a853]/25"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOnline ? "bg-[#34a853]" : "bg-slate-500"
                      }`}
                    />
                    {isOnline
                      ? t("overview.clusterNodes.online")
                      : t("overview.clusterNodes.offline")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
