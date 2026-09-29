// ─────────────────────────────────────────────
// GravWatch - Google Account Pairing Modal
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { useState, useEffect, useRef } from "react";
import { GravAccount } from "@/types/gravwatch";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Timer,
  Terminal,
  Server,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useGravWatch } from "@/context";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GooglePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccountId?: string;
  isReauth?: boolean;
}

// Google authorization codes are single-use and short-lived (~10 minutes
// upper bound). The clock starts when the OAuth link is generated.
const CODE_VALIDITY_MS = 10 * 60 * 1000;
const URGENT_THRESHOLD_MS = 2 * 60 * 1000;

export const GooglePairingModal: React.FC<GooglePairingModalProps> = ({
  isOpen,
  onClose,
  initialAccountId,
  isReauth = false,
}) => {
  const { accounts, refreshAllAccounts } = useGravWatch();
  const { t } = useLanguage();

  const [targetAccountId, setTargetAccountId] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const isReauthMode = Boolean(initialAccountId) || isReauth;
  const hasFetchedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN_MS = 5 * 60 * 1000;

  // Determine target account ID when modal opens
  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
      return;
    }
    // Prevent refetch if we already have a valid URL
    if (hasFetchedRef.current && authUrl && codeExpiresAt && codeExpiresAt > Date.now()) {
      return;
    }
    // Prevent refetch if last fetch was less than 5 minutes ago
    const now = Date.now();
    if (lastFetchTimeRef.current > 0 && (now - lastFetchTimeRef.current) < FETCH_COOLDOWN_MS) {
      return;
    }
    hasFetchedRef.current = true;
    lastFetchTimeRef.current = now;

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
    // Only clear URL state if we don't have a valid one
    if (!(authUrl && codeExpiresAt && codeExpiresAt > Date.now())) {
      setAuthUrl(null);
      setCodeExpiresAt(null);
    }
    setLoadingUrl(false);
    fetchAuthUrl(accId);
  }, [isOpen, initialAccountId, isReauth]);

  // Auto-close modal when already authenticated (new pairing only)
  useEffect(() => {
    if (isOpen && successEmail && !isReauthMode) {
      const timer = setTimeout(() => {
        refreshAllAccounts();
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, successEmail, isReauthMode, refreshAllAccounts, onClose]);

  const fetchAuthUrl = async (accountId: string) => {
    setLoadingUrl(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/auth/start-pty?account_id=${encodeURIComponent(accountId.trim())}`);
      const data = await res.json();

      if (data.already_authenticated === true) {
        setSuccessEmail(data.email || "Google Account");
        setAuthUrl(null);
        return;
      }

      if (data.auth_url) {
        if (data.auth_url === "ALREADY_AUTHENTICATED" && !isReauthMode) {
          setSuccessEmail(data.email || "Google Account");
          setAuthUrl(null);
          setCodeExpiresAt(null);
        } else {
          setAuthUrl(data.auth_url);
          setCodeExpiresAt(Date.now() + CODE_VALIDITY_MS);
        }
      } else {
        throw new Error(data.message || (data.error || "Failed to get auth URL"));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("accounts.googlePairingModal.errors.failed");
      setErrorMsg(message);
    } finally {
      setLoadingUrl(false);
    }
  };

  // Tick the countdown once per second while a link is live.
  useEffect(() => {
    if (!isOpen || !codeExpiresAt || successEmail) {
      return;
    }
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen, codeExpiresAt, successEmail]);

  const remainingMs = codeExpiresAt !== null ? Math.max(0, codeExpiresAt - nowTick) : null;
  const isCodeExpired = remainingMs !== null && remainingMs <= 0;
  const isCodeUrgent = remainingMs !== null && !isCodeExpired && remainingMs <= URGENT_THRESHOLD_MS;
  const countdownLabel =
    remainingMs !== null
      ? `${String(Math.floor(remainingMs / 60000)).padStart(2, "0")}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}`
      : "";

  const handleRefreshLink = async () => {
    setErrorMsg(null);
    if (targetAccountId) await fetchAuthUrl(targetAccountId);
  };

  const handleOpenGoogle = async () => {
    if (!targetAccountId) {
      setErrorMsg(t("accounts.googlePairingModal.errors.missingId"));
      return;
    }

    if (authUrl) {
      window.open(authUrl, "_blank", "noopener,noreferrer");
      return;
    }

    await fetchAuthUrl(targetAccountId);
    if (authUrl) {
      window.open(authUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Auto-open URL when authUrl is fetched
  useEffect(() => {
    if (authUrl && !successEmail && isOpen) {
      window.open(authUrl, "_blank", "noopener,noreferrer");
    }
  }, [authUrl, isOpen, successEmail]);

  const handleExchangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) {
      setErrorMsg(t("accounts.googlePairingModal.errors.missingCode"));
      return;
    }
    if (!targetAccountId) {
      setErrorMsg(t("accounts.googlePairingModal.errors.missingId"));
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/submit-code-pty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          account_id: targetAccountId,
          code: authCode.trim(),
        }),
      });

      const data = await res.json();

      // PTY auth endpoint returns { success: true, ... }
      if (data.success === false) {
        throw new Error(data.error || data.message || t("accounts.googlePairingModal.errors.failed"));
      }
      // submit-code-pty returns JSONResponse with 200 OK
      // but doesn't have a 'success' field on success (it's a JSONResponse)
      // So we need to check the HTTP status and look for errors
      if (!res.ok) {
        throw new Error(data.error || data.message || t("accounts.googlePairingModal.errors.failed"));
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

  const provisioning = loadingUrl && !authUrl && !successEmail;

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 p-5 overflow-hidden">
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

          <div className="rounded-lg px-3 py-2.5 text-xs border bg-[#4285f4]/10 border-[#4285f4]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[#34a853] shrink-0" />
                <span className="font-semibold text-white whitespace-nowrap">
                  {t("accounts.googlePairingModal.autoAssignedNode", { id: targetAccountId || "acc-new" })}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border bg-[#34a853]/20 text-[#34a853] border-[#34a853]/30 shrink-0">
                gravwatch-{targetAccountId || "acc-new"}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-1.5 rounded-lg bg-[#ea4335]/15 border border-[#ea4335]/30 p-2 overflow-hidden">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#ea4335] shrink-0" />
                <p className="text-xs text-[#ea4335] flex-1 break-all">{errorMsg}</p>
              </div>
            </div>
          )}

          {successEmail && (
            <div className="mb-1.5 rounded-lg bg-[#34a853]/15 border border-[#34a853]/30 p-2 overflow-hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#34a853] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#34a853]">
                    {t("accounts.googlePairingModal.successTitle")}
                  </p>
                  <p className="text-[11px] text-slate-400 break-all">
                    {t("accounts.googlePairingModal.successMessage", {
                      id: targetAccountId || "acc-new",
                      email: successEmail,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {provisioning ? (
            <div className="rounded-lg border border-white/5 bg-[#060911]/60 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4285f4]/15 text-[#4285f4] shrink-0">
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    {t("accounts.googlePairingModal.provisioningTitle")}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t("accounts.googlePairingModal.provisioningDesc")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4285f4] animate-pulse shrink-0" />
                  {t("accounts.googlePairingModal.provisioningStep1")}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
                  {t("accounts.googlePairingModal.provisioningStep2")}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
                  {t("accounts.googlePairingModal.provisioningStep3")}
                </div>
              </div>

              <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-[#4285f4] animate-pulse" />
              </div>
            </div>
          ) : (
            <>
          <div className="rounded-lg border border-white/5 bg-[#060911]/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                {t("accounts.googlePairingModal.step1Title")}
              </span>
              <Terminal className="h-3.5 w-3.5 text-slate-500" />
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleOpenGoogle}
              disabled={loadingUrl}
              className="w-full h-10 text-xs font-semibold border-white/10 hover:border-[#4285f4]/50 bg-[#4285f4]/10 text-[#4285f4] border"
            >
              <span>
                {loadingUrl
                  ? t("accounts.googlePairingModal.step1Loading")
                  : t("accounts.googlePairingModal.step1Btn", { id: targetAccountId || "acc-new" })}
              </span>
              {loadingUrl ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5 text-[#4285f4]" />
              )}
            </Button>

            <p className="text-[11px] text-slate-500 text-center">
              {t("accounts.googlePairingModal.step1Help")}
            </p>
          </div>

          {authUrl && (
            <div
              className={`rounded-md px-3 py-2 text-xs flex items-center gap-2 border ${
                isCodeExpired
                  ? "bg-[#ea4335]/15 border-[#ea4335]/40 text-[#ea4335]"
                  : isCodeUrgent
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-white/5 border-white/10 text-slate-300"
              }`}
            >
              {isCodeExpired ? (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t("accounts.googlePairingModal.codeExpired")}</span>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={loadingUrl}
                    onClick={handleRefreshLink}
                    className="h-7 text-[11px] font-semibold bg-[#ea4335]/20 hover:bg-[#ea4335]/30 text-[#ea4335] border border-[#ea4335]/40"
                  >
                    {loadingUrl ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {t("accounts.googlePairingModal.newLinkBtn")}
                  </Button>
                </>
              ) : (
                <>
                  <Timer className={`h-4 w-4 shrink-0 ${isCodeUrgent ? "animate-pulse" : ""}`} />
                  <span className="flex-1">
                    {t("accounts.googlePairingModal.codeCountdown", { time: countdownLabel })}
                  </span>
                  <span className="font-mono font-bold tabular-nums">{countdownLabel}</span>
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              {t("accounts.googlePairingModal.step2Title")}
            </label>
            <form onSubmit={handleExchangeCode} className="space-y-2">
              <Input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder={t("accounts.googlePairingModal.step2Placeholder")}
                className="bg-[#060911] border-white/10 text-white placeholder-slate-500 text-xs break-all"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !authCode.trim()}
                className="w-full h-10 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6] text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    {t("accounts.googlePairingModal.completeBtn")}
                  </>
                ) : (
                  t("accounts.googlePairingModal.completeBtn")
                )}
              </Button>
            </form>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};