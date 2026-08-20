"use client";

import React, { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { GravAccount, AntigravityPlan } from "@/types/gravwatch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditAccountModalProps {
  account: GravAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const { updateAccount } = useGravWatch();
  const { t } = useLanguage();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<AntigravityPlan>("Google AI Pro");
  const [status, setStatus] = useState<"active" | "warning" | "depleted" | "paused">("active");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (account) {
      setAlias(account.alias);
      setEmail(account.email);
      setPlan(account.plan);
      setStatus(account.status);
      setTags(account.tags.join(", "));
      setNotes(account.notes || "");
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccount(account.id, {
      alias: alias.trim(),
      email: email.trim(),
      plan,
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 p-5">
        <DialogHeader className="text-start space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4285f4]/15 text-[#4285f4]">
              <Edit2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {t("accounts.editModal.title", { alias: account.alias })}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            {t("accounts.editModal.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.editModal.aliasLabel")}
            </label>
            <Input
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.editModal.emailLabel")}
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t("accounts.editModal.planLabel")}
              </label>
              <Select
                value={plan}
                onValueChange={(val) => setPlan(val as AntigravityPlan)}
              >
                <SelectTrigger className="h-8 text-xs bg-[#060911]/80 border-white/10">
                  <SelectValue placeholder="Google AI Pro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google AI Ultra">Google AI Ultra</SelectItem>
                  <SelectItem value="Google AI Pro">Google AI Pro</SelectItem>
                  <SelectItem value="Gemini Advanced">Gemini Advanced</SelectItem>
                  <SelectItem value="Free Tier">Free Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t("accounts.editModal.statusLabel")}
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "active" | "warning" | "depleted" | "paused")}
              >
                <SelectTrigger className="h-8 text-xs bg-[#060911]/80 border-white/10">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("common.active")}</SelectItem>
                  <SelectItem value="warning">{t("common.warning")}</SelectItem>
                  <SelectItem value="depleted">{t("common.depleted")}</SelectItem>
                  <SelectItem value="paused">{t("common.paused")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.editModal.tagsLabel")}
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-8 text-xs"
            />
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
              type="submit"
              variant="default"
              size="sm"
              className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6]"
            >
              {t("accounts.editModal.saveBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
