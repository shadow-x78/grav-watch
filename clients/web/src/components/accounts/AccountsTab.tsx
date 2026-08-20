"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  PlusCircle,
} from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { GravAccount } from "@/types/gravwatch";
import { useLanguage } from "@/context/LanguageContext";
import { AccountCard } from "./AccountCard";
import { AccountListItemCard } from "./AccountListItemCard";
import { GooglePairingModal } from "./GooglePairingModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AccountsTab: React.FC = () => {
  const { accounts } = useGravWatch();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [reauthAccountId, setReauthAccountId] = useState<string | undefined>(undefined);
  const [deletingAccount, setDeletingAccount] = useState<GravAccount | null>(null);

  const handleStartReauth = (account: GravAccount) => {
    setReauthAccountId(account.id);
    setIsGoogleModalOpen(true);
  };

  const handleCloseGoogleModal = () => {
    setIsGoogleModalOpen(false);
    setReauthAccountId(undefined);
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.containerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <Button
            size="sm"
            onClick={() => {
              setReauthAccountId(undefined);
              setIsGoogleModalOpen(true);
            }}
            className="h-8 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6] text-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t("accounts.page.pairGoogleBtn")}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2.5 rounded-xl border border-white/10 bg-[#0b0f1d] px-3.5 py-3 w-full">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 rtl:left-auto rtl:right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <Input
            placeholder={t("accounts.page.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full pl-8 rtl:pl-3 rtl:pr-8 text-xs bg-[#060911]/60 border-white/[0.08]"
          />
        </div>

        <div className="w-[140px] shrink-0">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
          >
            <SelectTrigger className="h-8 text-xs bg-[#060911]/60 border-white/[0.08]">
              <SelectValue placeholder={t("accounts.page.filterAll", { count: accounts.length })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("accounts.page.filterAll", { count: accounts.length })}</SelectItem>
              <SelectItem value="active">{t("accounts.page.filterActive", { count: activeCount })}</SelectItem>
              <SelectItem value="warning">{t("accounts.page.filterWarning", { count: warningCount })}</SelectItem>
              <SelectItem value="paused">{t("accounts.page.filterPaused")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto rtl:ml-0 rtl:mr-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#34a853]/15 text-[#34a853] border border-[#34a853]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34a853]" />
              {activeCount} {t("common.active")}
            </span>
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fbbc05]/15 text-[#fbbc05] border border-[#fbbc05]/20">
                ⚠ {warningCount}
              </span>
            )}
          </div>

          <div className="flex items-center bg-[#060911] p-0.5 rounded-lg border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#4285f4] text-white" : "text-slate-500 hover:text-slate-200"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#4285f4] text-white" : "text-slate-500 hover:text-slate-200"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0b0f1d] py-16 gap-3">
          <Users className="h-10 w-10 text-slate-700" />
          <p className="text-sm font-semibold text-slate-300">{t("accounts.page.noAccountsFound")}</p>
          <p className="text-xs text-slate-500">{t("accounts.page.tryAdjustingFilters")}</p>
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
            className="mt-1 text-xs text-[#4285f4] hover:underline"
          >
            {t("accounts.page.resetFiltersBtn")}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAccounts.map((account, i) => (
            <AccountCard
              key={account.id}
              account={account}
              index={i}
              onReauth={handleStartReauth}
              onDelete={(acc) => setDeletingAccount(acc)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredAccounts.map((account, i) => (
            <AccountListItemCard
              key={account.id}
              account={account}
              index={i}
              onReauth={handleStartReauth}
              onDelete={(acc) => setDeletingAccount(acc)}
            />
          ))}
        </div>
      )}

      <GooglePairingModal
        isOpen={isGoogleModalOpen}
        onClose={handleCloseGoogleModal}
        initialAccountId={reauthAccountId}
      />
      <DeleteConfirmModal
        account={deletingAccount}
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
      />
    </motion.div>
  );
};
