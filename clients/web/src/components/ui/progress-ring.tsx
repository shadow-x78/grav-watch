"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  thickness?: number;
  showValue?: boolean;
  colorVariant?: "auto" | "emerald" | "amber" | "rose" | "cyan" | "purple";
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 32,
  thickness = 3.5,
  showValue = false,
  colorVariant = "auto",
  className,
}) => {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  const getColor = () => {
    if (colorVariant === "emerald") return "#22c55e"; // Antigravity Green
    if (colorVariant === "amber") return "#f59e0b";
    if (colorVariant === "rose") return "#ef4444";
    if (colorVariant === "cyan") return "#06b6d4";
    if (colorVariant === "purple") return "#8b5cf6";

    // Auto variant based on remaining quota % matching Antigravity:
    // High capacity: green (#22c55e / #10b981)
    // Moderate capacity: amber (#f59e0b)
    // Low / Critical capacity: red (#ef4444)
    if (safeValue >= 40) return "#22c55e";
    if (safeValue >= 15) return "#f59e0b";
    return "#ef4444";
  };

  const ringColor = getColor();

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      className={className}
    >
      {/* Background Track Circle */}
      <CircularProgress
        variant="determinate"
        sx={{
          color: "rgba(255, 255, 255, 0.08)",
        }}
        size={size}
        thickness={thickness}
        value={100}
      />
      {/* Foreground Active Progress */}
      <CircularProgress
        variant="determinate"
        disableShrink
        sx={{
          color: ringColor,
          position: "absolute",
          left: 0,
          [`& .MuiCircularProgress-circle`]: {
            strokeLinecap: "round",
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          filter: safeValue > 0 ? `drop-shadow(0 0 3px ${ringColor}55)` : "none",
        }}
        size={size}
        thickness={thickness}
        value={safeValue}
      />
      {showValue && (
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            component="div"
            sx={{ fontWeight: 800, fontFamily: "monospace", fontSize: "10px", color: "#ffffff" }}
          >
            {safeValue}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

