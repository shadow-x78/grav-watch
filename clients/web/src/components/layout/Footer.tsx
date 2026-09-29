// ─────────────────────────────────────────────
// GravWatch - App Footer Component
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React from "react";
import { useGravWatch } from "@/context";
import { useLanguage } from "@/context/LanguageContext";

export const Footer: React.FC = () => {
  const { accounts, pooledTelemetry } = useGravWatch();
  const { t } = useLanguage();

  const activeCount = accounts.filter((a) => a.containerStatus === "running").length;

  return (
    <footer className="w-full border-t border-white/10 bg-[#060911]/90 backdrop-blur-md shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span>{activeCount} nodes</span>
          <span className="text-slate-700">|</span>
          <span>{pooledTelemetry.overallPooledCapacity}% pool</span>
        </div>
        <span className="text-[11px]">© 2026 GravWatch</span>
      </div>
    </footer>
  );
};