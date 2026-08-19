"use client";

import React from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { ProgressRing } from "@/components/ui/progress-ring";
import LayersIcon from "@mui/icons-material/Layers";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import StorageIcon from "@mui/icons-material/Dns";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { useLanguage } from "@/context/LanguageContext";

export const MetricCardsGrid: React.FC = () => {
  const { pooledTelemetry, accounts } = useGravWatch();
  const { t, direction } = useLanguage();

  const depletedCount = accounts.filter(
    (a) => a.status === "depleted" || a.status === "warning"
  ).length;

  const cards = [
    {
      title: t("overview.metricCards.pooledCapacity.title"),
      value: `${pooledTelemetry.overallPooledCapacity}%`,
      subValue: t("overview.metricCards.pooledCapacity.subValue"),
      badge: t("overview.metricCards.pooledCapacity.badge"),
      badgeColor: "success" as const,
      ringValue: pooledTelemetry.overallPooledCapacity,
      icon: LayersIcon,
      accentColor: "#10b981",
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
    {
      title: t("overview.metricCards.gemini5h.title"),
      value: `${pooledTelemetry.geminiFiveHourPooledPercent}%`,
      subValue: t("overview.metricCards.gemini5h.subValue"),
      badge: t("overview.metricCards.gemini5h.badge"),
      badgeColor: "secondary" as const,
      ringValue: pooledTelemetry.geminiFiveHourPooledPercent,
      icon: SparklesIcon,
      accentColor: "#06b6d4",
      gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
    {
      title: t("overview.metricCards.claude5h.title"),
      value: `${pooledTelemetry.claudeGptFiveHourPooledPercent}%`,
      subValue: t("overview.metricCards.claude5h.subValue"),
      badge: t("overview.metricCards.claude5h.badge"),
      badgeColor: "warning" as const,
      ringValue: pooledTelemetry.claudeGptFiveHourPooledPercent,
      icon: BoltIcon,
      accentColor: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
    {
      title: t("overview.metricCards.dockerSandboxes.title"),
      value: `${pooledTelemetry.activeContainers} / ${pooledTelemetry.totalAccounts}`,
      subValue: t("overview.metricCards.dockerSandboxes.subValue"),
      badge: depletedCount > 0 ? t("overview.metricCards.dockerSandboxes.badgeWarnings", { count: depletedCount }) : t("overview.metricCards.dockerSandboxes.badgeAllRunning"),
      badgeColor: (depletedCount > 0 ? "warning" : "success") as "warning" | "success",
      ringValue: Math.round((pooledTelemetry.activeContainers / Math.max(1, pooledTelemetry.totalAccounts)) * 100),
      icon: StorageIcon,
      accentColor: "#8b5cf6",
      gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        return (
          <Card
            key={idx}
            sx={{
              background: card.gradient,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              transition: "transform 0.25s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: `${card.accentColor}55`,
                boxShadow: "none",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5 },
                "&:last-child": { pb: { xs: 2, sm: 2.5 } },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        fontSize: { xs: "0.65rem", sm: "0.7rem" },
                        letterSpacing: "0.05em",
                        display: "block",
                      }}
                      noWrap
                    >
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#ffffff", my: 0.5, fontFamily: "monospace", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                      {card.value}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", ml: direction === "rtl" ? 0 : 1, mr: direction === "rtl" ? 1 : 0, flexShrink: 0 }}>
                    <ProgressRing value={card.ringValue} size={42} thickness={4} />
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: 34,
                    lineHeight: 1.35,
                    fontSize: "0.75rem",
                    mt: 0.5,
                  }}
                >
                  {card.subValue}
                </Typography>
              </Box>

              <Box>
                <Divider sx={{ my: 1.5, borderColor: "rgba(255, 255, 255, 0.06)" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Chip
                    label={card.badge}
                    color={card.badgeColor}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, fontFamily: "monospace" }}>
                    <ArrowOutwardIcon sx={{ fontSize: 13, transform: direction === "rtl" ? "scaleX(-1)" : "none" }} />
                    {t("overview.metricCards.dockerSandboxes.liveHub")}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
