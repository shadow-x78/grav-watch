import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return tokens.toString();
}

export function formatRelativeTime(date: Date | string, lang: "ar" | "en" = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 5) return lang === "ar" ? "الآن" : "just now";
  if (diffSec < 60) return lang === "ar" ? `منذ ${diffSec} ثانية` : `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return lang === "ar" ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return lang === "ar" ? `منذ ${diffHour} ساعة` : `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return lang === "ar" ? `منذ ${diffDay} يوم` : `${diffDay}d ago`;
}

export function formatCountdownWithDays(raw: string | undefined | null): string {
  if (!raw) return "Active";
  const str = raw.trim();
  const match = str.match(/^(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
  if (match) {
    const totalHours = parseInt(match[1], 10);
    const minutes = match[2];
    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24);
      const remHours = totalHours % 24;
      if (remHours > 0 && minutes) {
        return `${days}d ${remHours}h ${minutes}m`;
      } else if (remHours > 0) {
        return `${days}d ${remHours}h`;
      } else if (minutes) {
        return `${days}d ${minutes}m`;
      } else {
        return `${days}d`;
      }
    }
  }
  return str;
}
