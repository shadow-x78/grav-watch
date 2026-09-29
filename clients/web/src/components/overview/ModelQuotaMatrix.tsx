// ─────────────────────────────────────────────
// GravWatch - Model Quota Matrix Component
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Clock } from "lucide-react";
import Image from "next/image";
import { useGravWatch } from "@/context";
import { useLanguage } from "@/context/LanguageContext";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCountdownWithDays } from "@/lib/utils";

const GEMINI_LOGO = "/logos/gemini-logo.svg";
const CLAUDE_LOGO = "/logos/claude-logo.svg";

export const ModelQuotaMatrix: React.FC = () => {
  const { accounts, selectedAccountId, refreshAllAccounts, pooledTelemetry, isLoading } = useGravWatch();
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <TooltipProvider delayDuration={200}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
          className="rounded-xl border border-white/10 bg-[#0b0f1d] overflow-hidden animate-pulse"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-white/[0.06]">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between mb-1 h-8 w-1/2 bg-white/5 rounded" />
              <div className="h-12 w-full bg-white/5 rounded" />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between mb-1 h-8 w-1/2 bg-white/5 rounded" />
              <div className="h-12 w-full bg-white/5 rounded" />
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

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
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#060911]/60 border border-white/[0.06] hover:border-white/10 transition-colors">
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
            <span>{displayPlan}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-white/[0.06]">
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4285f4]/15 text-[#4285f4]">
                  <Image
                    src={GEMINI_LOGO}
                    alt="Gemini"
                    width={20}
                    height={20}
                    className="h-4 w-4"
                    unoptimized
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {t("overview.matrix.geminiModels")}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#4285f4] bg-[#4285f4]/10 px-2 py-0.5 rounded border border-[#4285f4]/20">
                Flash & Pro
              </span>
            </div>

            <QuotaRow
              label={t("overview.matrix.weeklyLimit")}
              pct={geminiWeeklyPct}
              countdown={geminiWeeklyCountdown}
              color="#34a853"
              fullLabel={t("overview.matrix.fullCapacity")}
            />
            <QuotaRow
              label={t("overview.matrix.fiveHourLimit")}
              pct={gemini5hPct}
              countdown={gemini5hCountdown}
              color="#4285f4"
              fullLabel={t("overview.matrix.fullCapacity")}
            />
          </div>

          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ea4335]/15 text-[#ea4335]">
                  <Image
                    src={CLAUDE_LOGO}
                    alt="Claude"
                    width={20}
                    height={20}
                    className="h-4 w-4"
                    unoptimized
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {t("overview.matrix.claudeGptModels")}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#ea4335] bg-[#ea4335]/10 px-2 py-0.5 rounded border border-[#ea4335]/20">
                Sonnet, Opus & GPT
              </span>
            </div>

            <QuotaRow
              label={t("overview.matrix.weeklyLimit")}
              pct={claudeWeeklyPct}
              countdown={claudeWeeklyCountdown}
              color="#34a853"
              fullLabel={t("overview.matrix.fullCapacity")}
            />
            <QuotaRow
              label={t("overview.matrix.fiveHourLimit")}
              pct={claude5hPct}
              countdown={claude5hCountdown}
              color="#ea4335"
              fullLabel={t("overview.matrix.fullCapacity")}
            />
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};