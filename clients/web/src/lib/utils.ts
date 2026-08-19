import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, lang: "ar" | "en" = "en"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(num);
}

export function formatCompactNumber(num: number, lang: "ar" | "en" = "en"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
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
  const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));

  if (diffSec < 5) return lang === "ar" ? "الآن" : "just now";
  if (diffSec < 60) return lang === "ar" ? `منذ ${diffSec} ثانية` : `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return lang === "ar" ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return lang === "ar" ? `منذ ${diffHour} ساعة` : `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return lang === "ar" ? `منذ ${diffDay} يوم` : `${diffDay}d ago`;
}

export function formatCountdownWithDays(raw: string | undefined | null, lang: "ar" | "en" = "en"): string {
  if (!raw) return lang === "ar" ? "جاهز ونشط" : "Active";
  const str = raw.trim();

  if (str.toLowerCase() === "active") return lang === "ar" ? "جاهز ونشط" : "Active";
  if (str.toLowerCase() === "offline") return lang === "ar" ? "غير متصل" : "Offline";
  if (str.toLowerCase() === "syncing...") return lang === "ar" ? "جاري المزامنة..." : "Syncing...";
  if (str.toLowerCase().includes("full capacity")) return lang === "ar" ? "كامل السعة متوفرة" : "Full capacity available";

  // Match patterns like "4d 19h 25m", "19h 25m", "19h", "45m", "120h"
  const daysMatch = str.match(/(\d+)\s*d/i);
  const hoursMatch = str.match(/(\d+)\s*h/i);
  const minutesMatch = str.match(/(\d+)\s*m/i);

  if (daysMatch || hoursMatch || minutesMatch) {
    let days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
    let hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    let minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    // Convert excess hours into days if no explicit day was supplied
    if (!daysMatch && hours >= 24) {
      days = Math.floor(hours / 24);
      hours = hours % 24;
    }

    if (lang === "ar") {
      const parts: string[] = [];
      if (days > 0) {
        if (days === 1) parts.push("يوم واحد");
        else if (days === 2) parts.push("يومان");
        else if (days >= 3 && days <= 10) parts.push(`${days} أيام`);
        else parts.push(`${days} يوماً`);
      }
      if (hours > 0) {
        if (hours === 1) parts.push("ساعة واحدة");
        else if (hours === 2) parts.push("ساعتان");
        else if (hours >= 3 && hours <= 10) parts.push(`${hours} ساعات`);
        else parts.push(`${hours} ساعة`);
      }
      if (minutes > 0) {
        if (minutes === 1) parts.push("دقيقة واحدة");
        else if (minutes === 2) parts.push("دقيقتان");
        else if (minutes >= 3 && minutes <= 10) parts.push(`${minutes} دقائق`);
        else parts.push(`${minutes} دقيقة`);
      }

      if (parts.length === 0) return "لحظات معدودة";
      return parts.join(" و ");
    }

    // English formatting
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.length > 0 ? parts.join(" ") : "less than a minute";
  }

  return str;
}
