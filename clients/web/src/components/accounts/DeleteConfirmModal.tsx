"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { GravAccount } from "@/types/gravwatch";
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

interface DeleteConfirmModalProps {
  account: GravAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const { deleteAccount } = useGravWatch();
  const { t } = useLanguage();

  if (!account) return null;

  const handleDelete = () => {
    deleteAccount(account.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm bg-[#0b0f1d] border-white/10 text-slate-100 p-5">
        <DialogHeader className="text-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ea4335]/15 text-[#ea4335]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {t("accounts.deleteModal.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            {t("accounts.deleteModal.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          <p className="text-xs text-slate-300">
            {t("accounts.deleteModal.confirmText", {
              alias: account.alias,
              email: account.email,
            })}
          </p>

          <div className="rounded-lg bg-[#ea4335]/10 border border-[#ea4335]/25 p-3 text-[11px] font-mono text-slate-300 space-y-1">
            <p className="text-[#ea4335] font-bold">
              {t("accounts.deleteModal.warningContainer", {
                container: account.containerName || `gravwatch-${account.id}`,
                id: account.id,
              })}
            </p>
            <p className="text-slate-400">
              {t("accounts.deleteModal.warningQuota")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="h-8 text-xs font-semibold bg-[#ea4335] hover:bg-[#d93025]"
          >
            {t("accounts.deleteModal.confirmBtn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
