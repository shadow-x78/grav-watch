// ─────────────────────────────────────────────
// GravWatch - Live Terminal Modal
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Loader2, Minimize2, Maximize2, Copy, Check, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountAlias: string;
}

const MAX_RENDER_LINES = 200;

interface StreamPayload {
  success?: boolean;
  output?: string;
  empty?: boolean;
  error?: string;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  isOpen,
  onClose,
  accountId,
  accountAlias,
}) => {
  const { t } = useLanguage();
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const FALLBACK_POLL_MS = 4000;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const applyPayload = (data: StreamPayload) => {
      if (cancelled) return;
      setOutput(typeof data.output === "string" ? data.output : "");
      setError(data.success === false ? (data.error || "stream error") : null);
      setConnected(true);
    };

    const startFallbackPolling = () => {
      if (intervalRef.current || cancelled) return;
      intervalRef.current = setInterval(async () => {
        if (cancelled) return;
        setIsFetching(true);
        try {
          const res = await fetch(
            `/api/v1/auth/agy-output?account_id=${encodeURIComponent(accountId)}`,
            { cache: "no-store" }
          );
          const data = await res.json();
          if (!cancelled) {
            setOutput(typeof data.output === "string" ? data.output : "");
            setError(data.error || null);
            setConnected(false);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "fetch failed");
            setConnected(false);
          }
        } finally {
          if (!cancelled) setIsFetching(false);
        }
      }, FALLBACK_POLL_MS);
    };

    const stopFallbackPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Primary transport: SSE
    try {
      const source = new EventSource(
        `/api/v1/auth/agy-output/stream?account_id=${encodeURIComponent(accountId)}`
      );
      sourceRef.current = source;

      source.onopen = () => {
        if (cancelled) return;
        stopFallbackPolling();
        setConnected(true);
        setError(null);
      };

      source.onmessage = (event) => {
        try {
          applyPayload(JSON.parse(event.data as string));
        } catch {
          // ignore malformed frame
        }
      };

      source.onerror = () => {
        if (cancelled) return;
        setConnected(false);
        startFallbackPolling();
      };
    } catch {
      startFallbackPolling();
    }

    return () => {
      cancelled = true;
      stopFallbackPolling();
      if (sourceRef.current) {
        sourceRef.current.close();
      }
    };
  }, [isOpen, accountId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [output]);

  const handleCopy = async () => {
    const cleanOutput = output
      .split("\n")
      .map((line) =>
        line
          .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "")
          .replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, "")
          .replace(/\r/g, "")
      )
      .filter((line) => line.trim().length > 0)
      .join("\n");

    try {
      await navigator.clipboard.writeText(cleanOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  };

  if (!isOpen) return null;

  const cleanLines = output
    .split("\n")
    .map((line) =>
      line
        // OSC 8 hyperlinks: keep only the link text
        .replace(/\x1b\]8;[^;]*;([^\x07\x1b]*)(?:\x07|\x1b\\)/g, "$1")
        // ANSI CSI sequences: escape codes like [>4m, [<1u, [?2026$p etc.
        .replace(/\x1b\[[0-9;?]*[a-zA-Z@^_{}|~]/g, "")
        // Other ANSI escapes
        .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
        // Remaining raw escape chars
        .replace(/\x1b/g, "")
        .replace(/\x07/g, "")
        .replace(/\r/g, "")
    )
    .filter((line) => line.trim().length > 0);
  const visibleLines = cleanLines.slice(-MAX_RENDER_LINES);

  // Render terminal content based on state
  const renderTerminalContent = () => {
    if (error) {
      return <div className="text-[#ea4335]">{error}</div>;
    }
    if (visibleLines.length === 0) {
      return (
        <div className="text-slate-600 text-center py-10">
          {t("accounts.googlePairingModal.consoleWaiting")}
        </div>
      );
    }
    return (
      <>
        {visibleLines.map((line, i) => (
          <div key={`${i}-${line.slice(0, 12)}`} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          hideCloseButton
          className={`w-full max-w-4xl h-[85vh] max-h-[85vh] bg-[#0b0f1d] border-white/10 text-slate-100 p-0 overflow-hidden flex flex-col ${
            isMaximized ? "max-w-full max-h-full h-[95vh] max-h-[95vh] m-0" : ""
          }`}
        >
          <DialogHeader className="flex flex-row flex-nowrap items-center justify-between gap-3 space-y-0 px-5 py-3 border-b border-white/10 bg-[#060911]/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4285f4]/15 text-[#4285f4] shrink-0">
                <Terminal className="h-4 w-4" />
              </div>
              {/* Equal leading on both nodes so the smaller mono subtitle
                  cannot sit visibly higher than the title (truncate makes
                  baseline alignment unreliable, so we center equal boxes). */}
              <div className="min-w-0 flex items-center gap-2">
                <DialogTitle className="text-sm leading-4 font-bold text-white truncate">
                  {t("accounts.googlePairingModal.consoleTitle")}
                </DialogTitle>
                <span className="text-xs leading-4 text-slate-400 font-mono truncate whitespace-nowrap shrink-0">
                  gravwatch-{accountId} · {accountAlias}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8 text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#34a853]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? t("common.copied") : t("common.copy")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="h-8 w-8 text-slate-400 hover:text-white transition-colors"
                  >
                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMaximized ? t("common.minimize") : t("common.maximize")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </TooltipTrigger>
                <TooltipContent>{t("common.close")}</TooltipContent>
              </Tooltip>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#060911]/30">
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    connected ? "bg-[#34a853] animate-pulse" : "bg-amber-400"
                  }`}
                />
                {connected
                  ? t("accounts.googlePairingModal.consoleLive")
                  : t("accounts.googlePairingModal.consoleReconnecting")}
                {isFetching && <Loader2 className="h-3 w-3 animate-spin text-amber-400" />}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {visibleLines.length} lines
              </span>
            </div>

            <div
              ref={scrollRef}
              dir="ltr"
              className="flex-1 overflow-y-auto p-5 font-mono text-[10px] leading-relaxed text-[#7ee787] bg-black/40"
            >
              {renderTerminalContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};