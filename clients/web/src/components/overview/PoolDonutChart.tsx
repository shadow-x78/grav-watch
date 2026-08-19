"use client";

import React from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#f43f5e", "#3b82f6"];

export const PoolDonutChart: React.FC = () => {
  const { accounts, pooledTelemetry } = useGravWatch();

  const data = accounts.map((acc, idx) => {
    const avgRemaining = Math.round(
      (acc.geminiQuota.fiveHour.percentRemaining +
        acc.geminiQuota.weekly.percentRemaining +
        acc.claudeGptQuota.fiveHour.percentRemaining +
        acc.claudeGptQuota.weekly.percentRemaining) /
        4
    );
    return {
      name: acc.alias,
      id: acc.id,
      value: avgRemaining,
      plan: acc.plan,
      color: COLORS[idx % COLORS.length],
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-750 bg-dark-900/95 p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <div className="text-slate-300 font-mono">
            Plan: <span className="text-cyan-400 font-semibold">{item.plan}</span>
          </div>
          <div className="text-slate-300 font-mono">
            Average Remaining: <span className="font-bold text-emerald-400">{item.value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DonutLargeIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff" }}>
              Quota Pool Distribution
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Capacity contribution per Google account
          </Typography>
        }
        sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", pb: 1.5 }}
      />

      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ position: "relative", height: 200, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#090d16"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <Box
            sx={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>
              Pool Cap
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "monospace", color: "primary.main" }}>
              {pooledTelemetry.overallPooledCapacity}%
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: "rgba(255, 255, 255, 0.06)" }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {data.slice(0, 4).map((item, idx) => (
            <Box
              key={idx}
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", fontFamily: "monospace", gap: 1 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.primary" }} noWrap>
                  {item.name}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, flexShrink: 0 }}>
                {item.value}% cap
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
