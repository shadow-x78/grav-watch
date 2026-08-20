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
} from "lucide-react";
import { GravAccount } from "@/types/gravwatch";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCountdownWithDays } from "@/lib/utils";

interface AccountListItemCardProps {
  account: GravAccount;
  onReauth: (account: GravAccount) => void;
  onDelete: (account: GravAccount) => void;
  index?: number;
}

const STATUS_CONFIG = {
  active: { badge: "success" as const },
  warning: { badge: "warning" as const, color: "#fbbc05" },
  depleted: { badge: "destructive" as const, color: "#ea4335" },
  paused: { badge: "outline" as const, color: "#64748b" },
};

export const AccountListItemCard: React.FC<AccountListItemCardProps> = ({
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

  const statusConfig = STATUS_CONFIG[account.status] || STATUS_CONFIG.paused;

  const g5h = account.geminiQuota.fiveHour;
  const gWeekly = account.geminiQuota.weekly;
  const c5h = account.claudeGptQuota.fiveHour;
  const cWeekly = account.claudeGptQuota.weekly;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="rounded-xl border border-white/10 bg-[#0b0f1d] hover:border-white/20 transition-all overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0 lg:w-52 shrink-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#060911] border border-white/10 text-[#4285f4] font-bold text-sm">
              {account.alias.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{account.alias}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{account.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            <div className="flex flex-col gap-1.5 bg-[#060911]/60 px-3 py-2 rounded-lg border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#4285f4] shrink-0" />
                  <span className="text-[11px] text-slate-200 font-semibold">Gemini</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">5h:</span>
                    <span className="text-[#4285f4] font-black">{g5h.percentRemaining}%</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Wk:</span>
                    <span className="text-[#34a853] font-bold">{gWeekly.percentRemaining}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5 border-t border-white/[0.04]">
                <span className="truncate">{formatCountdownWithDays(g5h.refreshCountdown, language)}</span>
                <span className="truncate">{formatCountdownWithDays(gWeekly.refreshCountdown, language)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-[#060911]/60 px-3 py-2 rounded-lg border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#ea4335] shrink-0" />
                  <span className="text-[11px] text-slate-200 font-semibold">Claude & GPT</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">5h:</span>
                    <span className="text-[#ea4335] font-black">{c5h.percentRemaining}%</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Wk:</span>
                    <span className="text-[#34a853] font-bold">{cWeekly.percentRemaining}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5 border-t border-white/[0.04]">
                <span className="truncate">{formatCountdownWithDays(c5h.refreshCountdown, language)}</span>
                <span className="truncate">{formatCountdownWithDays(cWeekly.refreshCountdown, language)}</span>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
            <Badge variant={statusConfig.badge} className="text-[10px] font-bold">
              {t(`common.${account.status}`) || account.status}
            </Badge>

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
      </div>
    </TooltipProvider>
  );
};
