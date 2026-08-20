"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  KeyRound,
  Server,
} from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GooglePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccountId?: string;
}

export const GooglePairingModal: React.FC<GooglePairingModalProps> = ({
  isOpen,
  onClose,
  initialAccountId,
}) => {
  const { accounts, refreshAllAccounts } = useGravWatch();
  const { t } = useLanguage();

  const [targetAccountId, setTargetAccountId] = useState("acc-1");
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const isReauthMode = Boolean(initialAccountId);

  useEffect(() => {
    if (isOpen) {
      let accId = initialAccountId;
      if (!accId) {
        const existingIds = new Set(accounts.map((a) => a.id));
        let nextNum = 1;
        while (existingIds.has(`acc-${nextNum}`)) {
          nextNum++;
        }
        accId = `acc-${nextNum}`;
      }
      setTargetAccountId(accId);
      setAuthCode("");
      setErrorMsg(null);
      setSuccessEmail(null);
      setAuthUrl(null);

      // Pre-generate URL instantly
      fetch(`/api/v1/auth/url?account_id=${encodeURIComponent(accId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.auth_url) setAuthUrl(data.auth_url);
        })
        .catch(() => {});
    }
  }, [isOpen, accounts, initialAccountId]);

  const handleOpenGoogle = async () => {
    if (!targetAccountId.trim()) {
      setErrorMsg(t("accounts.googlePairingModal.errors.missingId"));
      return;
    }

    if (authUrl) {
      window.open(authUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setLoadingUrl(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/auth/url?account_id=${encodeURIComponent(targetAccountId.trim())}`);
      const data = await res.json();
      if (data.auth_url) {
        setAuthUrl(data.auth_url);
        window.open(data.auth_url, "_blank", "noopener,noreferrer");
      } else {
        window.open(`/api/v1/auth/start?account_id=${encodeURIComponent(targetAccountId.trim())}`, "_blank");
      }
    } catch {
      window.open(`/api/v1/auth/start?account_id=${encodeURIComponent(targetAccountId.trim())}`, "_blank");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleExchangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) {
      setErrorMsg(t("accounts.googlePairingModal.errors.missingCode"));
      return;
    }
    if (!targetAccountId.trim()) {
      setErrorMsg(t("accounts.googlePairingModal.errors.missingId"));
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/exchange-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          account_id: targetAccountId.trim(),
          auth_code: authCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || t("accounts.googlePairingModal.errors.failed"));
      }

      setSuccessEmail(data.email || "Google Account");
      refreshAllAccounts();
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("accounts.googlePairingModal.errors.failed");
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 p-5">
        <DialogHeader className="text-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4285f4]/15 text-[#4285f4]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {t("accounts.googlePairingModal.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            {t("accounts.googlePairingModal.subtitle")}
          </DialogDescription>
        </DialogHeader>

        {successEmail ? (
          <div className="rounded-lg bg-[#34a853]/10 border border-[#34a853]/30 p-4 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-[#34a853] mx-auto" />
            <p className="text-sm font-bold text-white">
              {t("accounts.googlePairingModal.successTitle")}
            </p>
            <p className="text-xs text-slate-300 font-mono">
              {t("accounts.googlePairingModal.successMessage", {
                id: targetAccountId,
                email: successEmail,
              })}
            </p>
            <p className="text-[11px] text-[#34a853] font-semibold">
              {t("accounts.googlePairingModal.successStreaming")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleExchangeCode} className="space-y-4">
            {errorMsg && (
              <div className="rounded-md bg-[#ea4335]/15 border border-[#ea4335]/30 p-2.5 text-xs text-[#ea4335] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs border ${
                isReauthMode
                  ? "bg-[#4285f4]/10 border-[#4285f4]/30"
                  : "bg-[#34a853]/10 border-[#34a853]/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {isReauthMode ? (
                  <KeyRound className="h-4 w-4 text-[#4285f4] shrink-0" />
                ) : (
                  <Server className="h-4 w-4 text-[#34a853] shrink-0" />
                )}
                <span className="font-semibold text-white">
                  {isReauthMode
                    ? t("accounts.googlePairingModal.reAuthNode", { id: targetAccountId })
                    : t("accounts.googlePairingModal.autoAssignedNode", { id: targetAccountId })}
                </span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                  isReauthMode
                    ? "bg-[#4285f4]/20 text-[#4285f4] border-[#4285f4]/30"
                    : "bg-[#34a853]/20 text-[#34a853] border-[#34a853]/30"
                }`}
              >
                gravwatch-{targetAccountId}
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-[#060911]/60 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {t("accounts.googlePairingModal.step1Title")}
                </span>
                <Terminal className="h-3.5 w-3.5 text-slate-500" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenGoogle}
                disabled={loadingUrl}
                className="w-full h-8 text-xs font-semibold justify-between border-white/10 hover:border-[#4285f4]/50"
              >
                <span>
                  {loadingUrl
                    ? t("accounts.googlePairingModal.step1Loading")
                    : t("accounts.googlePairingModal.step1Btn", { id: targetAccountId })}
                </span>
                {loadingUrl ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5 text-[#4285f4]" />
                )}
              </Button>

              <p className="text-[11px] text-slate-500">
                {t("accounts.googlePairingModal.step1Help")}
              </p>

              {authUrl && (
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#4285f4] underline block text-center"
                >
                  {t("accounts.googlePairingModal.step1PopupBlocked")}
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {t("accounts.googlePairingModal.step2Title")}
              </label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder={t("accounts.googlePairingModal.step2Placeholder")}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={loading}
                className="h-8 text-xs"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={loading || !authCode.trim()}
                className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6]"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />}
                {t("accounts.googlePairingModal.completeBtn")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
