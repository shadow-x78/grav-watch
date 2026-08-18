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

// ============================================================================
// TODO: [BACKEND INTEGRATION] - Top KPI Cluster Metrics (FastAPI Aggregator)
//
// 1. Client-Side Aggregated Cards:
//    - `Pooled Capacity`: Cluster-wide remaining quota percentage across all accounts (weighted average of all active tiers).
//    - `Gemini 5-Hour Limit`: Aggregated 5-hour rolling limit for Gemini models (Flash 3.6 / Pro 3.1).
//    - `Claude & GPT 5-Hour Limit`: Aggregated 5-hour rolling limit for Claude models (Sonnet 4.6 / Opus 4.6).
//    - `Docker Sandboxes & AI Credits`: Active Docker nodes and aggregate balance pool in USD for fallback overages.
//
// 2. Required Backend Endpoint & Payload Contract:
//    - `GET http://localhost:8000/api/v1/usage/latest`
//    - Response Schema:
//      {
//        "pooled_capacity_percent": 74.2,
//        "gemini_5h_percent": 88.5,
//        "claude_gpt_5h_percent": 65.0,
//        "active_containers": 5,
//        "total_accounts": 5,
//        "total_credits_usd": 190.0,
//        "burn_rate_tokens_per_min": 17400,
//        "total_requests_today": 8900,
//        "success_rate_percent": 99.4,
//        "health_status": "healthy" | "warning" | "critical"
//      }
//
// 3. Purpose / Why Needed:
//    - Provides instant visibility into cluster capacity before dispatching heavy subagent batches or IDE tasks.
//
// 4. Edge Cases & Missing Capabilities:
//    - [ ] Zero Accounts State: When `total_accounts === 0`, display 0% capacity and a prompt to pair Google accounts.
//    - [ ] All Accounts Depleted (429): If `pooled_capacity_percent === 0`, badge should switch to "Cluster Depleted"
//          with an alert indicating the next reset time.
//    - [ ] Currency Localization: Format `total_credits_usd` according to user's browser locale.
//    - [ ] Live Delta Pulsing: Animate progress rings and KPI values when real-time WebSocket token deductions occur.
// ============================================================================

export const MetricCardsGrid: React.FC = () => {
  const { pooledTelemetry, accounts } = useGravWatch();

  const depletedCount = accounts.filter(
    (a) => a.status === "depleted" || a.status === "warning"
  ).length;

  const cards = [
    {
      title: "Pooled Capacity",
      value: `${pooledTelemetry.overallPooledCapacity}%`,
      subValue: "Combined capacity across all accounts",
      badge: "Healthy Pool",
      badgeColor: "success" as const,
      ringValue: pooledTelemetry.overallPooledCapacity,
      icon: LayersIcon,
      accentColor: "#10b981",
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
    {
      title: "Gemini 5-Hour Limit",
      value: `${pooledTelemetry.geminiFiveHourPooledPercent}%`,
      subValue: "Pooled 5-hour rolling limit remaining",
      badge: "High Concurrency",
      badgeColor: "secondary" as const,
      ringValue: pooledTelemetry.geminiFiveHourPooledPercent,
      icon: SparklesIcon,
      accentColor: "#06b6d4",
      gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
    {
      title: "Claude & GPT 5-Hour Limit",
      value: `${pooledTelemetry.claudeGptFiveHourPooledPercent}%`,
      subValue: "Pooled Claude & GPT quota capacity",
      badge: "Sonnet & Opus 4.6",
      badgeColor: "warning" as const,
      ringValue: pooledTelemetry.claudeGptFiveHourPooledPercent,
      icon: BoltIcon,
      accentColor: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(13, 19, 34, 0.8) 100%)",
    },
    {
      title: "Docker Sandboxes",
      value: `${pooledTelemetry.activeContainers} / ${pooledTelemetry.totalAccounts}`,
      subValue: `$${pooledTelemetry.totalCreditsPoolUsd.toFixed(2)} Total AI Credits Pool`,
      badge: depletedCount > 0 ? `${depletedCount} Warnings` : "All Nodes Running",
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
              {/* Top Section */}
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

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", ml: 1, flexShrink: 0 }}>
                    <ProgressRing value={card.ringValue} size={42} thickness={4} />
                  </Box>
                </Box>

                {/* Subtitle with guaranteed identical height */}
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

              {/* Exact Uniform Divider */}
              <Box>
                <Divider sx={{ my: 1.5, borderColor: "rgba(255, 255, 255, 0.06)" }} />

                {/* Bottom Section */}
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
                    <ArrowOutwardIcon sx={{ fontSize: 13 }} />
                    Live Hub
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
