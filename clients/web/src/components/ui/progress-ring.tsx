"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface ProgressRingProps {
  value: number;
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
  const safeValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : Number(value)));

  const getColor = () => {
    if (colorVariant === "emerald") return "#22c55e";
    if (colorVariant === "amber") return "#f59e0b";
    if (colorVariant === "rose") return "#ef4444";
    if (colorVariant === "cyan") return "#06b6d4";
    if (colorVariant === "purple") return "#8b5cf6";

    if (safeValue >= 40) return "#22c55e";
    if (safeValue >= 15) return "#f59e0b";
    return "#ef4444";
  };

  const ringColor = getColor();
  const radius = Math.max(1, (size - thickness) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flexShrink: 0,
      }}
      className={className}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={thickness}
          fill="transparent"
        />
        {/* Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease",
            filter: safeValue > 0 ? `drop-shadow(0 0 3px ${ringColor}88)` : "none",
          }}
        />
      </svg>
      {showValue && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, fontFamily: "monospace", fontSize: "10px", color: "#ffffff" }}
          >
            {Math.round(safeValue)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};
