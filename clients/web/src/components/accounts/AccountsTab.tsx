// ─────────────────────────────────────────────
// GravWatch - Accounts Tab Component
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, PlusCircle, AlertTriangle, Trash2, Power, Play, KeyRound } from "lucide-react";
import { useGravWatch } from "@/context";
import { GravAccount } from "@/types/gravwatch";
import { useLanguage } from "@/context/LanguageContext";
import { AccountCard } from "./AccountCard";
import { GooglePairingModal } from "./GooglePairingModal";
import { TerminalModal } from "./TerminalModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const AccountsTab: React.FC<{ onOpenGooglePairing: () => void }> = ({
  onOpenGooglePairing,
}) => {
  const { accounts, isLoading, refreshAllAccounts, toggleAccountStatus } = useGravWatch();
  const { t } = useLanguage();

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [reauthAccountId, setReauthAccountId] = useState<string | undefined>(undefined);
  const [terminalAccount, setTerminalAccount] = useState<GravAccount | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [toggleTargetId, setToggleTargetId] = useState<string | null>(null);
  const [reauthTarget, setReauthTarget] = useState<GravAccount | null>(null);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col gap-4 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#060911] border border-white/10" />
            <div className="h-5 w-32 bg-white/5 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-[#0b0f1d] p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#060911]" />
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-white/10" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-10 w-full bg-white/5 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 bg-white/5 rounded" />
                  <div className="h-10 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const handleStartReauth = (account: GravAccount) => {
    setReauthTarget(account);
  };

  const confirmReauth = async () => {
    const account = reauthTarget;
    if (!account) return;
    setReauthTarget(null);
    try {
      await fetch(`/api/v1/auth/token?account_id=${encodeURIComponent(account.id)}&deprovision=false`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to logout:", err);
    }
    setReauthAccountId(account.id);
    setIsGoogleModalOpen(true);
  };

  const handleDelete = (account: GravAccount) => {
    setDeleteAccountId(account.id);
  };

  const handleToggleContainer = (account: GravAccount) => {
    setToggleTargetId(account.id);
  };

  const confirmToggle = async () => {
    const id = toggleTargetId;
    if (!id) return;
    setToggleTargetId(null);
    await toggleAccountStatus(id);
  };

  const confirmDelete = async () => {
    const account = accounts.find((a) => a.id === deleteAccountId);
    if (!account) return;
    setDeleteAccountId(null);
    try {
      await fetch(`/api/v1/auth/token?account_id=${encodeURIComponent(account.id)}&deprovision=true`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to delete:", err);
    }
    await refreshAllAccounts();
  };

  const handleCloseGoogleModal = () => {
    setIsGoogleModalOpen(false);
    setReauthAccountId(undefined);
  };

  const activeCount = accounts.filter((a) => a.status === "active").length;
  const warningCount = accounts.filter((a) => a.status === "warning" || a.status === "depleted").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#060911] border border-white/10 text-[#4285f4]">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              {t("accounts.page.title")}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">{t("accounts.page.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#34a853]/15 text-[#34a853] border border-[#34a853]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34a853]" />
            {activeCount} {t("common.active")}
          </span>
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fbbc05]/15 text-[#fbbc05] border border-[#fbbc05]/20">
              {warningCount} {t("common.warning")}
            </span>
          )}
          <Button
            size="sm"
            onClick={onOpenGooglePairing}
            className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6] text-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t("accounts.page.pairGoogleBtn")}</span>
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0b0f1d] py-16 gap-4">
          <Users className="h-10 w-10 text-slate-700" />
          <p className="text-sm font-semibold text-slate-300">{t("accounts.page.noAccountsFound")}</p>
          <p className="text-xs text-slate-500">{t("accounts.page.tryAdjustingFilters")}</p>
          <Button
            size="sm"
            onClick={onOpenGooglePairing}
            className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6] text-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t("accounts.page.pairGoogleBtn")}</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account, i) => (
            <AccountCard
              key={account.id}
              account={account}
              index={i}
              onReauth={handleStartReauth}
              onDelete={handleDelete}
              onToggleContainer={handleToggleContainer}
              onTerminal={(id) => setTerminalAccount(accounts.find((a) => a.id === id) || null)}
            />
          ))}
        </div>
      )}

      <GooglePairingModal
        key={isGoogleModalOpen ? `open-${reauthAccountId || "new"}` : "closed"}
        isOpen={isGoogleModalOpen}
        onClose={handleCloseGoogleModal}
        initialAccountId={reauthAccountId}
        isReauth={Boolean(reauthAccountId)}
      />
      <TerminalModal
        key={terminalAccount ? terminalAccount.id : "closed"}
        isOpen={Boolean(terminalAccount)}
        onClose={() => setTerminalAccount(null)}
        accountId={terminalAccount?.id || ""}
        accountAlias={terminalAccount?.alias || ""}
      />

      <Dialog open={Boolean(deleteAccountId)} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <DialogContent className="w-full max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 rounded-xl">
          {(() => {
            const target = accounts.find((a) => a.id === deleteAccountId);
            return target ? (
              <>
                <DialogHeader className="text-start space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ea4335]/15 text-[#ea4335] shrink-0">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-sm font-bold text-white">
                        {t("accounts.deleteModal.title")}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {t("accounts.deleteModal.subtitle")}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex flex-col gap-2.5 text-start">
                  <p className="text-sm font-semibold text-white">
                    {t("accounts.deleteModal.confirmText", {
                      alias: target.alias || target.id,
                      email: target.email || "",
                    })}
                  </p>
                  <div className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-[#060911]/60 p-3">
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      <Trash2 className="h-3.5 w-3.5 text-[#ea4335] shrink-0" />
                      {t("accounts.deleteModal.warningContainer", {
                        container: target.containerName || `gravwatch-${target.id}`,
                      })}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#fbbc05] shrink-0" />
                      {t("accounts.deleteModal.warningQuota")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteAccountId(null)}
                    className="h-8 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={confirmDelete}
                    className="h-8 text-xs font-semibold bg-[#ea4335] hover:bg-[#d33426] text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("accounts.deleteModal.confirmBtn")}
                  </Button>
                </div>
              </>
            ) : null;
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toggleTargetId)} onOpenChange={(open) => !open && setToggleTargetId(null)}>
        <DialogContent className="w-full max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 rounded-xl">
          {(() => {
            const target = accounts.find((a) => a.id === toggleTargetId);
            if (!target) return null;
            const willRun = target.containerStatus !== "running";
            const accent = willRun ? "#34a853" : "#fbbc05";
            const AccentIcon = willRun ? Play : Power;
            return (
              <>
                <DialogHeader className="text-start space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: `${accent}26`, color: accent }}
                    >
                      <AccentIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-sm font-bold text-white">
                        {t(willRun ? "accounts.powerModal.startTitle" : "accounts.powerModal.stopTitle")}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {t(willRun ? "accounts.powerModal.startSubtitle" : "accounts.powerModal.stopSubtitle")}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex flex-col gap-2.5 text-start">
                  <p className="text-sm font-semibold text-white">
                    {t(willRun ? "accounts.powerModal.startText" : "accounts.powerModal.stopText", {
                      alias: target.alias || target.id,
                    })}
                  </p>
                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#060911]/60 p-3">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
                    <span className="text-xs text-slate-400">
                      {willRun
                        ? t("accounts.powerModal.startWarning", {
                            container: target.containerName || `gravwatch-${target.id}`,
                          })
                        : t("accounts.powerModal.stopWarning")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setToggleTargetId(null)}
                    className="h-8 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={confirmToggle}
                    className="h-8 text-xs font-semibold text-[#060911]"
                    style={{ backgroundColor: accent }}
                  >
                    <AccentIcon className="h-3.5 w-3.5" />
                    {t(willRun ? "accounts.powerModal.startBtn" : "accounts.powerModal.stopBtn")}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reauthTarget)} onOpenChange={(open) => !open && setReauthTarget(null)}>
        <DialogContent className="w-full max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 rounded-xl">
          {reauthTarget && (
            <>
              <DialogHeader className="text-start space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4285f4]/15 text-[#4285f4] shrink-0">
                    <KeyRound className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-sm font-bold text-white">
                      {t("accounts.reauthModal.title")}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {t("accounts.reauthModal.subtitle")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-2.5 text-start">
                <p className="text-sm font-semibold text-white">
                  {t("accounts.reauthModal.confirmText", {
                    alias: reauthTarget.alias || reauthTarget.id,
                    email: reauthTarget.email || "",
                  })}
                </p>
                <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#060911]/60 p-3">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#fbbc05]" />
                  <span className="text-xs text-slate-400">{t("accounts.reauthModal.warning")}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReauthTarget(null)}
                  className="h-8 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={confirmReauth}
                  className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6] text-white"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {t("accounts.reauthModal.confirmBtn")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};