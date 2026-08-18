"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatTokens } from "@/lib/utils";

// ============================================================================
// TODO: [BACKEND INTEGRATION] - Time-Series Token Metrics Query (Prometheus / TimescaleDB)
//
// 1. In-Memory Time-Series State:
//    - Real-time updates accumulate in local state `timelineData`.
//
// 2. Required Backend Endpoint & Query Contract:
//    - `GET http://localhost:8000/api/v1/metrics/timeline?range={timeRange}&account_id={selectedAccountId}&resolution={auto}`
//    - Expected Response: `TimeSeriesDataPoint[]`
//      [
//        { "time": "14:00", "totalTokens": 2890000, "geminiTokens": 1840000, "claudeGptTokens": 1050000, "requests": 1120 }
//      ]
//
// 3. Purpose / Why Needed:
//    - Visualizes historical token consumption trends comparing Gemini vs Claude model families over time.
//
// 4. Edge Cases & Chart Optimization:
//    - [ ] Dynamic Downsampling:
//          * 1h Range  -> 1-minute bucket resolution (60 points).
//          * 24h Range -> 15-minute bucket resolution (96 points).
//          * 7d Range  -> 1-hour bucket resolution (168 points).
//          * 30d Range -> 6-hour bucket resolution (120 points).
//    - [ ] Zero-Filling Inactive Periods: If a sandbox was turned off, backend must return 0 tokens rather than null gaps.
//    - [ ] Live Point Appending: When WebSocket emits an execution event, dynamically increment the most recent time bucket
//          to render real-time upward slopes smoothly without chart flickering.
// ============================================================================

export const UsageTimelineChart: React.FC = () => {
  const { timelineData } = useGravWatch();
  const [activeFilter, setActiveFilter] = useState<"all" | "gemini" | "claude">("all");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-750 bg-dark-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono text-slate-300 font-semibold">
            <span>⏰ {label}</span>
            <span className="text-emerald-400">
              {formatTokens(payload.reduce((acc: number, p: any) => acc + (p.value || 0), 0))} Tokens
            </span>
          </div>
          <div className="space-y-1.5 font-mono">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300">{entry.name}:</span>
                </div>
                <span className="font-semibold text-white">{formatTokens(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
              Pooled Usage Timeline
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
            Token consumption and request volume over time across Antigravity model tiers
          </Typography>
        }
        action={
          <ButtonGroup
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: "rgba(9, 13, 22, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "9999px",
              p: "3px",
              width: { xs: "100%", md: "auto" },
              display: "flex",
            }}
          >
            {(
              [
                { id: "all", label: "All Models" },
                { id: "gemini", label: "Gemini Models" },
                { id: "claude", label: "Claude & GPT" },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                variant={activeFilter === tab.id ? "contained" : "outlined"}
                sx={{
                  flex: { xs: 1, md: "initial" },
                  fontSize: { xs: "0.62rem", sm: "0.68rem" },
                  fontWeight: 700,
                  border: "none !important",
                  borderRadius: "9999px !important",
                  transition: "all 0.2s ease",
                  ...(activeFilter === tab.id
                    ? { background: "#10b981", color: "#ffffff" }
                    : { color: "text.secondary", background: "transparent" }),
                  "&:hover": {
                    background: activeFilter === tab.id ? "#059669" : "rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                {tab.label}
              </Button>
            ))}
          </ButtonGroup>
        }
        sx={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          pb: 1.5,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: { xs: 1.5, md: 0 },
          "& .MuiCardHeader-content": { minWidth: 0, flex: 1 },
          "& .MuiCardHeader-action": { m: 0, width: { xs: "100%", md: "auto" } },
        }}
      />

      <CardContent sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
        <div className="h-[220px] sm:h-[260px] md:h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorClaude" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatTokens(v)}
              />
              <Tooltip content={<CustomTooltip />} />

              {(activeFilter === "all" || activeFilter === "gemini") && (
                <Area
                  type="monotone"
                  dataKey="geminiTokens"
                  name="Gemini Models (Flash/Pro)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGemini)"
                  stackId="1"
                />
              )}

              {(activeFilter === "all" || activeFilter === "claude") && (
                <Area
                  type="monotone"
                  dataKey="claudeGptTokens"
                  name="Claude & GPT (Sonnet/Opus 4.6)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClaude)"
                  stackId="1"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
