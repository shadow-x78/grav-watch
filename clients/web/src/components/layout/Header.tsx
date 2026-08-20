"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  RefreshCw,
  Globe,
  PlusCircle,
  LayoutGrid,
  Users,
  Layers,
} from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  onOpenGooglePairing: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGooglePairing,
}) => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    refreshAllAccounts,
    activeTab,
    setActiveTab,
  } = useGravWatch();
  const { language, toggleLanguage, t } = useLanguage();

  const [isSpinning, setIsSpinning] = useState(false);

  const handleManualRefresh = () => {
    setIsSpinning(true);
    refreshAllAccounts();
    setTimeout(() => setIsSpinning(false), 700);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#060911]/95 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setActiveTab("overview")}>
              <div className="relative h-10 w-11 sm:h-11 sm:w-12 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/gravwatch.svg"
                  alt="GravWatch Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-[#4285f4] transition-colors">
                  GravWatch
                </span>
                <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-[#4285f4]" />
                <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                  v2.6.0
                </span>
              </div>
            </div>

            <nav className="hidden sm:flex items-center gap-1 bg-[#0b0f1d] p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "overview"
                    ? "bg-[#4285f4] text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>{t("layout.sidebar.navOverview")}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("accounts")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "accounts"
                    ? "bg-[#4285f4] text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{t("layout.sidebar.navAccounts")}</span>
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === "accounts"
                      ? "bg-white/20 text-white font-bold"
                      : "bg-[#34a853]/20 text-[#34a853] font-semibold"
                  }`}
                >
                  {accounts.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Select
              value={selectedAccountId}
              onValueChange={(val) => setSelectedAccountId(val)}
            >
              <SelectTrigger className="h-9 max-w-[145px] sm:max-w-[210px] text-xs bg-[#0b0f1d] border-white/10">
                <SelectValue placeholder={t("layout.header.allAccountsPooled")} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t("layout.header.allAccountsPooled")}</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.alias} ({acc.plan.replace("Google AI ", "")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLanguage}
                  className="h-9 px-3 text-xs font-semibold text-slate-200 border-white/10 hover:border-white/20 hover:bg-white/5 gap-1.5"
                >
                  <Globe className="h-4 w-4 text-[#4285f4]" />
                  <span>{language === "ar" ? "English" : "العربية"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {language === "ar" ? "Switch to English" : "تبديل إلى اللغة العربية"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleManualRefresh}
                  className="h-9 w-9 shrink-0 aspect-square min-w-[36px] min-h-[36px] text-slate-200 border-white/10 hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${isSpinning ? "animate-spin text-[#34a853]" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("layout.header.refreshTooltip")}</TooltipContent>
            </Tooltip>

            <Button
              variant="default"
              size="sm"
              onClick={onOpenGooglePairing}
              className="h-9 px-3.5 text-xs font-semibold bg-[#4285f4] hover:bg-[#3367d6] text-white gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("layout.header.pairGoogleBtn")}</span>
              <span className="sm:hidden">Google</span>
            </Button>
          </div>
        </div>

        <div className="flex sm:hidden border-t border-white/5 px-3 py-1.5 gap-1 bg-[#0b0f1d]">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-md ${
              activeTab === "overview"
                ? "bg-[#4285f4] text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>{t("layout.sidebar.navOverview")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-md ${
              activeTab === "accounts"
                ? "bg-[#4285f4] text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t("layout.sidebar.navAccounts")} ({accounts.length})</span>
          </button>
        </div>
      </header>
    </TooltipProvider>
  );
};
