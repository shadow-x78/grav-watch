"use client";

import React from "react";
import { Activity, Server } from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";

export const Footer: React.FC = () => {
  const { accounts, pooledTelemetry } = useGravWatch();
  const { t } = useLanguage();

  const activeCount = accounts.filter((a) => a.containerStatus === "running").length;

  return (
    <footer className="w-full border-t border-white/10 bg-[#060911]/90 backdrop-blur-md shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34a853] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34a853]"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-200">
              {t("layout.footer.statusOperational")}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Server className="h-3 w-3 text-[#4285f4]" />
            <span>
              {t("layout.footer.clusterActive", { count: activeCount })}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500">
            <Activity className="h-3 w-3 text-[#34a853]" />
            <span>{pooledTelemetry.averageLatencyMs}ms {t("layout.footer.realtimeTelemetry")}</span>
          </div>
        </div>

        <div className="flex items-center text-[11px] text-slate-400 font-mono">
          <span>© 2026 GravWatch. {t("layout.footer.rights")}</span>
        </div>
      </div>
    </footer>
  );
};
