"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Layers, Sparkles, Zap, Server, TrendingUp } from "lucide-react";
import { useGravWatch } from "@/context/GravWatchContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProgressRing } from "@/components/ui/progress-ring";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
};

export const MetricCardsGrid: React.FC = () => {
  const { pooledTelemetry, accounts } = useGravWatch();
  const { t } = useLanguage();

  const activeCount = accounts.filter((a) => a.status === "active").length;
  const attentionCount = accounts.filter(
    (a) => a.status === "depleted" || a.status === "warning"
  ).length;

  const cards = [
    {
      title: t("overview.metricCards.pooledCapacity.title"),
      display: `${pooledTelemetry.overallPooledCapacity}%`,
      subValue: t("overview.metricCards.pooledCapacity.subValue"),
      badge: t("overview.metricCards.pooledCapacity.badge"),
      ringValue: pooledTelemetry.overallPooledCapacity,
      icon: Layers,
      color: "#34a853",
      badgeClass: "bg-[#34a853]/10 text-[#34a853] border-[#34a853]/30",
    },
    {
      title: t("overview.metricCards.gemini5h.title"),
      display: `${pooledTelemetry.geminiFiveHourPooledPercent}%`,
      subValue: t("overview.metricCards.gemini5h.subValue"),
      badge: t("overview.metricCards.gemini5h.badge"),
      ringValue: pooledTelemetry.geminiFiveHourPooledPercent,
      icon: Sparkles,
      color: "#4285f4",
      badgeClass: "bg-[#4285f4]/10 text-[#4285f4] border-[#4285f4]/30",
    },
    {
      title: t("overview.metricCards.claude5h.title"),
      display: `${pooledTelemetry.claudeGptFiveHourPooledPercent}%`,
      subValue: t("overview.metricCards.claude5h.subValue"),
      badge: t("overview.metricCards.claude5h.badge"),
      ringValue: pooledTelemetry.claudeGptFiveHourPooledPercent,
      icon: Zap,
      color: "#ea4335",
      badgeClass: "bg-[#ea4335]/10 text-[#ea4335] border-[#ea4335]/30",
    },
    {
      title: t("overview.metricCards.activeAccounts.title"),
      display: `${activeCount}/${accounts.length}`,
      subValue:
        attentionCount > 0
          ? t("overview.metricCards.activeAccounts.depletedSubValue", { count: attentionCount })
          : t("overview.metricCards.activeAccounts.allHealthySubValue"),
      badge: t("overview.metricCards.activeAccounts.badge"),
      ringValue: accounts.length > 0 ? (activeCount / accounts.length) * 100 : 100,
      icon: Server,
      color: "#fbbc05",
      badgeClass: "bg-[#fbbc05]/10 text-[#fbbc05] border-[#fbbc05]/30",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-xl border border-white/10 bg-[#0b0f1d] p-5 cursor-default hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-3.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#060911]"
                style={{ color: card.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">{card.title}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black tracking-tight text-white leading-none">
                    {card.display}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 shrink-0" style={{ color: card.color }} />
                    <span className="truncate">{card.subValue}</span>
                  </p>
                </div>
                <ProgressRing
                  value={card.ringValue}
                  size={50}
                  thickness={3.5}
                  color={card.color}
                  trackColor="rgba(255,255,255,0.06)"
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
