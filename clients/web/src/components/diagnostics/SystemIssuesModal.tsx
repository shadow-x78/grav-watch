"use client";

import React from "react";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface SystemIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemIssuesModal: React.FC<SystemIssuesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accounts, refreshAllAccounts } = useGravWatch();
  const { t } = useLanguage();

  const issues = accounts.filter(
    (a) => a.status === "depleted" || a.status === "warning" || a.containerStatus !== "running"
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 p-5">
        <DialogHeader className="text-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#fbbc05]/15 text-[#fbbc05]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {t("diagnostics.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            {t("diagnostics.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 my-2 max-h-72 overflow-y-auto">
          {issues.length === 0 ? (
            <div className="p-4 text-center rounded-lg bg-[#34a853]/10 border border-[#34a853]/20">
              <CheckCircle className="h-6 w-6 text-[#34a853] mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-white">
                {t("diagnostics.healthyCard.title")}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t("diagnostics.healthyCard.description")}
              </p>
            </div>
          ) : (
            issues.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-lg border border-white/10 bg-[#060911]/60 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{acc.alias}</span>
                    <span className="text-[10px] font-mono text-slate-400">({acc.id})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.email}</p>
                </div>
                <Badge
                  variant={acc.status === "depleted" ? "destructive" : "warning"}
                  className="text-[10px] uppercase font-bold"
                >
                  {t(`common.${acc.status}`) || acc.status}
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllAccounts}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t("common.refresh")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
