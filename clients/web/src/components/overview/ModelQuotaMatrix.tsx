"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, RefreshCw, Info, ShieldCheck, Clock } from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCountdownWithDays } from "@/lib/utils";

export const ModelQuotaMatrix: React.FC = () => {
  const { accounts, selectedAccountId, refreshAllAccounts, pooledTelemetry } = useGravWatch();
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedAccount =
    selectedAccountId === "all"
      ? null
      : accounts.find((a) => a.id === selectedAccountId);

  const displayPlan = selectedAccount
    ? selectedAccount.plan
    : language === "ar"
    ? "مجمع الحسابات"
    : "Pooled Cluster";

  const geminiWeeklyPct = selectedAccount
    ? selectedAccount.geminiQuota.weekly.percentRemaining
    : pooledTelemetry.geminiWeeklyPooledPercent;

  const geminiWeeklyCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.geminiQuota.weekly.refreshCountdown
      : accounts[0]?.geminiQuota.weekly.refreshCountdown || "Active",
    language
  );

  const gemini5hPct = selectedAccount
    ? selectedAccount.geminiQuota.fiveHour.percentRemaining
    : pooledTelemetry.geminiFiveHourPooledPercent;

  const gemini5hCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.geminiQuota.fiveHour.refreshCountdown
      : accounts[0]?.geminiQuota.fiveHour.refreshCountdown || "Active",
    language
  );

  const claudeWeeklyPct = selectedAccount
    ? selectedAccount.claudeGptQuota.weekly.percentRemaining
    : pooledTelemetry.claudeGptWeeklyPooledPercent;

  const claudeWeeklyCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.claudeGptQuota.weekly.refreshCountdown
      : accounts[0]?.claudeGptQuota.weekly.refreshCountdown || "Active",
    language
  );

  const claude5hPct = selectedAccount
    ? selectedAccount.claudeGptQuota.fiveHour.percentRemaining
    : pooledTelemetry.claudeGptFiveHourPooledPercent;

  const claude5hCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.claudeGptQuota.fiveHour.refreshCountdown
      : accounts[0]?.claudeGptQuota.fiveHour.refreshCountdown || "Active",
    language
  );

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshAllAccounts();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const QuotaRow = ({
    label,
    pct,
    countdown,
    color,
    fullLabel,
  }: {
    label: string;
    pct: number;
    countdown: string;
    color: string;
    fullLabel: string;
  }) => (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-lg bg-[#060911]/60 border border-white/[0.06] hover:border-white/10 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-200 block">{label}</span>
        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
          <Clock className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">
            {pct < 100 ? countdown : fullLabel}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-lg font-black font-mono" style={{ color }}>
          {pct}%
        </span>
        <ProgressRing
          value={pct}
          size={36}
          thickness={3.5}
          color={color}
          trackColor="rgba(255,255,255,0.06)"
        />
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
        className="rounded-xl border border-white/10 bg-[#0b0f1d] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">{t("overview.matrix.title")}</h2>
          </div>
          <div>
            <p className="text-xs text-slate-400">
              {selectedAccount
                ? t("overview.matrix.subheaderManaging", {
                    alias: selectedAccount.alias,
                    email: selectedAccount.email,
                  })
                : t("overview.matrix.subheaderPooled")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-[#4285f4]/15 text-[#4285f4] border-[#4285f4]/25">
            <ShieldCheck className="h-3 w-3" />
            {displayPlan}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-white/[0.06]">
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4285f4]/15 text-[#4285f4]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-white">
                  {t("overview.matrix.geminiModels")}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-slate-600 cursor-pointer hover:text-slate-400 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>{t("overview.matrix.geminiTooltip")}</TooltipContent>
                </Tooltip>
              </div>
              <span className="text-[10px] font-mono text-[#4285f4] bg-[#4285f4]/10 px-2 py-0.5 rounded border border-[#4285f4]/20">
                Flash & Pro
              </span>
            </div>

            <QuotaRow
              label={t("overview.matrix.weeklyLimitRemaining")}
              pct={geminiWeeklyPct}
              countdown={geminiWeeklyCountdown}
              color="#34a853"
              fullLabel={t("overview.matrix.fullWeeklyCapacity")}
            />
            <QuotaRow
              label={t("overview.matrix.fiveHourLimitRemaining")}
              pct={gemini5hPct}
              countdown={gemini5hCountdown}
              color="#4285f4"
              fullLabel={t("overview.matrix.fullFiveHourCapacity")}
            />
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ea4335]/15 text-[#ea4335]">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-white">
                  {t("overview.matrix.claudeGptModels")}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-slate-600 cursor-pointer hover:text-slate-400 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>{t("overview.matrix.claudeTooltip")}</TooltipContent>
                </Tooltip>
              </div>
              <span className="text-[10px] font-mono text-[#ea4335] bg-[#ea4335]/10 px-2 py-0.5 rounded border border-[#ea4335]/20">
                Sonnet, Opus & GPT
              </span>
            </div>

            <QuotaRow
              label={t("overview.matrix.weeklyLimitRemaining")}
              pct={claudeWeeklyPct}
              countdown={claudeWeeklyCountdown}
              color="#34a853"
              fullLabel={t("overview.matrix.fullWeeklyCapacity")}
            />
            <QuotaRow
              label={t("overview.matrix.fiveHourLimitRemaining")}
              pct={claude5hPct}
              countdown={claude5hCountdown}
              color="#ea4335"
              fullLabel={t("overview.matrix.fullFiveHourCapacity")}
            />
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};
