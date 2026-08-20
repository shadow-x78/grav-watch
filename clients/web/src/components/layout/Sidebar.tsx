"use client";

import React from "react";
import { LayoutGrid, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: "overview" | "accounts";
  onTabChange: (tab: "overview" | "accounts") => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  return (
    <aside className="w-56 shrink-0 border-r border-white/5 bg-[#060911] p-4 hidden lg:block">
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onTabChange("overview")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors",
            activeTab === "overview"
              ? "bg-[#4285f4] text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>{t("layout.sidebar.navOverview")}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("accounts")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors",
            activeTab === "accounts"
              ? "bg-[#4285f4] text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Users className="h-4 w-4" />
          <span>{t("layout.sidebar.navAccounts")}</span>
        </button>
      </div>
    </aside>
  );
};
