"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  thickness?: number;
  strokeWidth?: number;
  showValue?: boolean;
  color?: string;
  trackColor?: string;
  colorVariant?: "auto" | "emerald" | "amber" | "rose" | "cyan" | "purple" | "blue";
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 32,
  thickness,
  strokeWidth = 3.5,
  showValue = false,
  color,
  trackColor = "rgba(255, 255, 255, 0.08)",
  colorVariant = "auto",
  className,
}) => {
  const actualThickness = thickness !== undefined ? thickness : strokeWidth;
  const safeValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : Number(value)));

  const getColor = () => {
    if (color) return color;
    if (colorVariant === "blue") return "#4285f4";
    if (colorVariant === "emerald") return "#34a853";
    if (colorVariant === "amber") return "#fbbc05";
    if (colorVariant === "rose") return "#ea4335";
    if (colorVariant === "cyan") return "#06b6d4";
    if (colorVariant === "purple") return "#8b5cf6";

    if (safeValue >= 40) return "#34a853";
    if (safeValue >= 15) return "#fbbc05";
    return "#ea4335";
  };

  const ringColor = getColor();
  const radius = Math.max(1, (size - actualThickness) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 overflow-visible"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={actualThickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={actualThickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <span
          className="absolute font-mono font-bold text-white"
          style={{ fontSize: size < 40 ? "0.65rem" : "0.75rem" }}
        >
          {Math.round(safeValue)}%
        </span>
      )}
    </div>
  );
};
