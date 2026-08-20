"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  RefreshCw,
  Power,
  KeyRound,
  Trash2,
  Server,
} from "lucide-react";
import { GravAccount } from "@/types/gravwatch";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCountdownWithDays } from "@/lib/utils";

interface AccountCardProps {
  account: GravAccount;
  onReauth: (account: GravAccount) => void;
  onDelete: (account: GravAccount) => void;
  index?: number;
}

const STATUS_CONFIG = {
  active: { label: "Active", color: "#34a853", badge: "success" as const },
  warning: { label: "Warning", color: "#fbbc05", badge: "warning" as const },
  depleted: { label: "Depleted", color: "#ea4335", badge: "destructive" as const },
  paused: { label: "Paused", color: "#64748b", badge: "outline" as const },
};

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onReauth,
  onDelete,
  index = 0,
}) => {
  const { toggleAccountStatus, refreshAccount } = useGravWatch();
  const { t, language } = useLanguage();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    refreshAccount(account.id);
    setTimeout(() => setIsSpinning(false), 700);
  };

  const status = STATUS_CONFIG[account.status] || STATUS_CONFIG.paused;
  const initial = account.alias ? account.alias.charAt(0).toUpperCase() : "G";

  const geminiWeekly = account.geminiQuota.weekly;
  const gemini5h = account.geminiQuota.fiveHour;
  const claudeWeekly = account.claudeGptQuota.weekly;
  const claude5h = account.claudeGptQuota.fiveHour;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="flex flex-col rounded-xl border border-white/10 bg-[#0b0f1d] overflow-hidden hover:border-white/20 transition-all"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm border border-white/10 bg-[#060911]"
              style={{ color: status.color }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">{account.alias}</span>
                <span className="shrink-0 text-[10px] text-slate-400 font-mono bg-white/5 border border-white/10 px-1.5 py-px rounded">
                  {account.plan.replace("Google AI ", "").replace("Gemini ", "")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">{account.email}</p>
            </div>
          </div>
          <Badge variant={status.badge} className="text-[10px] font-bold shrink-0">
            {t(`common.${account.status}`) || status.label}
          </Badge>
        </div>

        <div className="flex-1 p-4 space-y-3">
          <div className="rounded-lg bg-[#060911]/60 border border-white/[0.08] p-3.5">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#4285f4]" />
              <span className="text-xs font-semibold text-slate-200">{t("accounts.card.geminiModels")}</span>
              <span className="ml-auto text-[10px] font-mono text-slate-500">
                {geminiWeekly.percentRemaining < 100
                  ? formatCountdownWithDays(geminiWeekly.refreshCountdown, language)
                  : t("accounts.card.fullCapacity")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t("accounts.card.weeklyRemaining"), pct: geminiWeekly.percentRemaining, color: "#34a853" },
                { label: t("accounts.card.fiveHourRemaining"), pct: gemini5h.percentRemaining, color: "#4285f4" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center justify-between bg-[#0b0f1d] rounded-md px-2.5 py-2 border border-white/[0.05]">
                  <span className="text-[11px] text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black font-mono" style={{ color }}>{pct}%</span>
                    <ProgressRing value={pct} size={20} thickness={2.5} color={color} trackColor="rgba(255,255,255,0.05)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#060911]/60 border border-white/[0.08] p-3.5">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="h-3.5 w-3.5 text-[#ea4335]" />
              <span className="text-xs font-semibold text-slate-200">{t("accounts.card.claudeGptModels")}</span>
              <span className="ml-auto text-[10px] font-mono text-slate-500">
                {claudeWeekly.percentRemaining < 100
                  ? formatCountdownWithDays(claudeWeekly.refreshCountdown, language)
                  : t("accounts.card.fullCapacity")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t("accounts.card.weeklyRemaining"), pct: claudeWeekly.percentRemaining, color: "#34a853" },
                { label: t("accounts.card.fiveHourRemaining"), pct: claude5h.percentRemaining, color: "#ea4335" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center justify-between bg-[#0b0f1d] rounded-md px-2.5 py-2 border border-white/[0.05]">
                  <span className="text-[11px] text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black font-mono" style={{ color }}>{pct}%</span>
                    <ProgressRing value={pct} size={20} thickness={2.5} color={color} trackColor="rgba(255,255,255,0.05)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-[#060911]/30">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <Server className="h-3 w-3 text-[#4285f4]" />
            <span>{account.containerName}</span>
            <span
              className={`ms-1 inline-flex items-center gap-1 font-semibold ${
                account.containerStatus === "running" ? "text-[#34a853]" : "text-slate-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${account.containerStatus === "running" ? "bg-[#34a853]" : "bg-slate-600"}`} />
              {account.containerStatus === "running" ? t("common.online") : t("common.offline")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSpinning ? "animate-spin text-[#34a853]" : ""}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("accounts.card.tooltips.refresh")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggleAccountStatus(account.id)}
                  className={`h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] transition-all ${
                    account.status === "paused"
                      ? "text-slate-400 hover:text-[#34a853] hover:border-[#34a853]/30 hover:bg-[#34a853]/10"
                      : "text-slate-400 hover:text-[#fbbc05] hover:border-[#fbbc05]/30 hover:bg-[#fbbc05]/10"
                  }`}
                >
                  <Power className="h-3.5 w-3.5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {account.status === "paused" ? t("accounts.card.tooltips.resume") : t("accounts.card.tooltips.pause")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onReauth(account)}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-[#4285f4] hover:border-[#4285f4]/30 hover:bg-[#4285f4]/10 transition-all"
                >
                  <KeyRound className="h-3.5 w-3.5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("accounts.card.tooltips.reauth")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onDelete(account)}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-[#ea4335] hover:border-[#ea4335]/30 hover:bg-[#ea4335]/10 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("accounts.card.tooltips.delete")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
