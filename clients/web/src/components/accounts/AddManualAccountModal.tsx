"use client";

import React, { useState } from "react";
import { Key } from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { AntigravityPlan } from "@/types/gravwatch";
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

interface AddManualAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddManualAccountModal: React.FC<AddManualAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addAccount } = useGravWatch();
  const { t } = useLanguage();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<AntigravityPlan>("Google AI Pro");
  const [sessionToken, setSessionToken] = useState("");
  const [tags, setTags] = useState("Custom Node, Antigravity CLI");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;

    addAccount({
      alias: alias.trim(),
      email: email.trim() || `${alias.toLowerCase().replace(/\s+/g, ".")}@antigravity.org`,
      plan,
      authType: "manual_token",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
    });

    onClose();
    setAlias("");
    setEmail("");
    setSessionToken("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0b0f1d] border-white/10 text-slate-100 p-5">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#34a853]/15 text-[#34a853]">
              <Key className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {t("accounts.manualModal.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            {t("accounts.manualModal.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.manualModal.aliasLabel")}
            </label>
            <Input
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={t("accounts.manualModal.aliasPlaceholder")}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.manualModal.emailLabel")}
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("accounts.manualModal.emailPlaceholder")}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.manualModal.planLabel")}
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
              {t("accounts.manualModal.tokenLabel")}
            </label>
            <Input
              type="password"
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              placeholder="ya29.a0AfH6SM..."
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("accounts.manualModal.tagsLabel")}
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("accounts.manualModal.tagsPlaceholder")}
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
              disabled={!alias.trim()}
              className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6]"
            >
              {t("accounts.manualModal.submitBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
