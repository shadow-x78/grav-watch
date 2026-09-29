// ─────────────────────────────────────────────
// GravWatch - Account Card Component
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Power,
  KeyRound,
  Trash2,
  Server,
  Activity,
  UserCircle,
  Terminal,
} from "lucide-react";
import Image from "next/image";
import { GravAccount } from "@/types/gravwatch";
import { useGravWatch } from "@/context";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { formatCountdownWithDays } from "@/lib/utils";

const GEMINI_LOGO = "/logos/gemini-logo.svg";
const CLAUDE_LOGO = "/logos/claude-logo.svg";

const STATUS_CONFIG = {
  active: { label: "Active", color: "#34a853" },
  warning: { label: "Warning", color: "#fbbc05" },
  depleted: { label: "Depleted", color: "#ea4335" },
  paused: { label: "Paused", color: "#64748b" },
};

interface AccountCardProps {
  account: GravAccount;
  onReauth: (account: GravAccount) => void;
  onDelete: (account: GravAccount) => void;
  onToggleContainer: (account: GravAccount) => void;
  onTerminal?: (accountId: string) => void;
  index?: number;
}

const formatRelativeAge = (ageMs: number, language: string): string => {
  const s = Math.floor(ageMs / 1000);
  if (s < 60) return language === "ar" ? `${s}ث` : `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return language === "ar" ? `${m}د` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) {
    const rm = m % 60;
    return language === "ar" ? (rm ? `${h}س ${rm}د` : `${h}س`) : rm ? `${h}h ${rm}m` : `${h}h`;
  }
  const d = Math.floor(h / 24);
  return language === "ar" ? `${d}ي` : `${d}d`;
};

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onReauth,
  onDelete,
  onToggleContainer,
  onTerminal,
  index = 0,
}) => {
  const { refreshAccount } = useGravWatch();
  const { t, language } = useLanguage();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    refreshAccount(account.id);
    setTimeout(() => setIsSpinning(false), 700);
  };

  const status = STATUS_CONFIG[account.status] || STATUS_CONFIG.paused;
  const initial = account.alias ? account.alias.charAt(0).toUpperCase() : "G";

  const snapshotAgeMs = account.lastSnapshotAt
    ? Date.now() - new Date(account.lastSnapshotAt).getTime()
    : null;
  const isFresh = snapshotAgeMs !== null && snapshotAgeMs < 2 * 60 * 1000;
  const isStale = snapshotAgeMs === null || snapshotAgeMs > 10 * 60 * 1000;
  const freshnessColor = isFresh ? "#34a853" : isStale ? "#ea4335" : "#fbbc05";
  const freshnessLabel =
    snapshotAgeMs === null
      ? t("accounts.card.noSnapshots")
      : t("accounts.card.lastSnapshot", { time: formatRelativeAge(snapshotAgeMs, language) });

  const geminiWeekly = account.geminiQuota.weekly;
  const gemini5h = account.geminiQuota.fiveHour;
  const claudeWeekly = account.claudeGptQuota.weekly;
  const claude5h = account.claudeGptQuota.fiveHour;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.05 }}
      className="flex flex-col rounded-xl border border-white/10 bg-[#0b0f1d] overflow-hidden hover:border-white/20 transition-all"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm border border-white/10 bg-[#060911]" style={{ color: status.color }}>
            {account.avatarUrl ? (
              <Image
                src={account.avatarUrl}
                alt={account.alias}
                width={32}
                height={32}
                className="h-9 w-9 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white truncate">{account.alias}</span>
              <span className="shrink-0 text-[10px] text-slate-400 font-mono bg-white/5 border border-white/10 px-1.5 py-px rounded">
                {account.plan.replace("Google AI ", "").replace("Gemini ", "")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{account.email}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold shrink-0" style={{ borderColor: status.color, color: status.color }}>
          {status.label}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <div className="rounded-lg bg-[#060911]/60 border border-white/[0.08] p-3.5">
          <div className="flex items-center gap-1.5 mb-3">
            <Image src={GEMINI_LOGO} alt="Gemini" width={32} height={32} className="h-6 w-6" unoptimized />
            <span className="text-xs font-semibold text-slate-200">{t("accounts.card.geminiModels")}</span>
            <span className="ml-auto text-[10px] font-mono text-slate-500">
              {geminiWeekly.percentRemaining < 100
                ? formatCountdownWithDays(geminiWeekly.refreshCountdown, language)
                : t("accounts.card.fullCapacity")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t("accounts.card.weeklyRemaining"), pct: geminiWeekly.percentRemaining, cd: geminiWeekly.refreshCountdown, color: "#34a853" },
              { label: t("accounts.card.fiveHourRemaining"), pct: gemini5h.percentRemaining, cd: gemini5h.refreshCountdown, color: "#4285f4" },
            ].map(({ label, pct, cd, color }) => (
              <div key={label} className="flex items-center justify-between bg-[#0b0f1d] rounded-md px-2.5 py-2 border border-white/[0.05]">
                <div className="min-w-0 flex flex-col">
                  <span className="text-[11px] text-slate-400">{label}</span>
                  <span className="text-[9px] font-mono text-slate-600 truncate">{formatCountdownWithDays(cd, language)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black font-mono" style={{ color }}>{pct}%</span>
                  <ProgressRing value={pct} size={20} thickness={2.5} color={color} trackColor="rgba(255,255,255,0.05)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-[#060911]/60 border border-white/[0.08] p-3.5">
          <div className="flex items-center gap-1.5 mb-3">
            <Image src={CLAUDE_LOGO} alt="Claude" width={32} height={32} className="h-6 w-6" unoptimized />
            <span className="text-xs font-semibold text-slate-200">{t("accounts.card.claudeGptModels")}</span>
            <span className="ml-auto text-[10px] font-mono text-slate-500">
              {claudeWeekly.percentRemaining < 100
                ? formatCountdownWithDays(claudeWeekly.refreshCountdown, language)
                : t("accounts.card.fullCapacity")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t("accounts.card.weeklyRemaining"), pct: claudeWeekly.percentRemaining, cd: claudeWeekly.refreshCountdown, color: "#34a853" },
              { label: t("accounts.card.fiveHourRemaining"), pct: claude5h.percentRemaining, cd: claude5h.refreshCountdown, color: "#ea4335" },
            ].map(({ label, pct, cd, color }) => (
              <div key={label} className="flex items-center justify-between bg-[#0b0f1d] rounded-md px-2.5 py-2 border border-white/[0.05]">
                <div className="min-w-0 flex flex-col">
                  <span className="text-[11px] text-slate-400">{label}</span>
                  <span className="text-[9px] font-mono text-slate-600 truncate">{formatCountdownWithDays(cd, language)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black font-mono" style={{ color }}>{pct}%</span>
                  <ProgressRing value={pct} size={20} thickness={2.5} color={color} trackColor="rgba(255,255,255,0.05)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-white/[0.06] bg-[#060911]/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: freshnessColor }}>
          <Activity className={`h-3 w-3 shrink-0 ${isFresh ? "animate-pulse" : ""}`} />
          <span className="truncate">{freshnessLabel}</span>
          {account.snapshotCount && account.snapshotCount > 0 && (
            <span className="ms-auto shrink-0 text-slate-500">
              {account.snapshotCount.toLocaleString()} snapshots
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTerminal?.(account.id)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-[#4285f4] hover:border-[#4285f4]/30 hover:bg-[#4285f4]/10 transition-all"
          >
            <Terminal className="h-3.5 w-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className={`h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all ${isSpinning ? "text-[#34a853]" : ""}`}
            disabled={isSpinning}
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSpinning ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => onToggleContainer(account)}
            className={`h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] transition-all ${
              account.status === "paused"
                ? "text-slate-400 hover:text-[#34a853] hover:border-[#34a853]/30 hover:bg-[#34a853]/10"
                : "text-slate-400 hover:text-[#fbbc05] hover:border-[#fbbc05]/30 hover:bg-[#fbbc05]/10"
            }`}
          >
            <Power className="h-3.5 w-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onReauth(account)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-[#4285f4] hover:border-[#4285f4]/30 hover:bg-[#4285f4]/10 transition-all"
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-white/[0.06] bg-[#060911] text-slate-400 hover:text-[#ea4335] hover:border-[#ea4335]/30 hover:bg-[#ea4335]/10 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};