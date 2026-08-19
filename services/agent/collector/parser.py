# GravWatch - Antigravity Telemetry Payload Parser (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import re
from typing import Dict, Any, List, Optional

def parse_quota_percentage(raw_val: Any) -> Optional[float]:
    if raw_val is None:
        return None
    if isinstance(raw_val, (int, float)):
        return float(raw_val)
    if isinstance(raw_val, str):
        cleaned = raw_val.replace("%", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            pass
    return None

def parse_time_to_reset(raw_val: Any) -> Optional[str]:
    if not raw_val:
        return None
    val_str = str(raw_val).strip()
    match = re.search(r'(\d+\s*(?:d|days?|h|hours?|m|mins?|minutes?|s|secs?|seconds?))', val_str, re.IGNORECASE)
    if match:
        return match.group(1)
    return val_str

def normalize_category_name(raw_name: str) -> str:
    cleaned = raw_name.lower().strip()
    if "gemini" in cleaned:
        return "gemini-models"
    if "claude" in cleaned or "gpt" in cleaned:
        return "claude-and-gpt-models"
    return re.sub(r'[^a-z0-9_-]', '-', cleaned)

def parse_telemetry_blob(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    categories: List[Dict[str, Any]] = []

    if "categories" in data and isinstance(data["categories"], list):
        for item in data["categories"]:
            cat_id = normalize_category_name(item.get("name") or item.get("category_id") or "unknown")
            w_raw = item.get("weekly_limit") or item.get("weekly") or {}
            f_raw = item.get("five_hour_limit") or item.get("five_hour") or {}

            categories.append({
                "category_id": cat_id,
                "category_name": item.get("name") or item.get("category_name") or cat_id,
                "weekly_limit": {
                    "percentage_remaining": parse_quota_percentage(w_raw.get("percentage_remaining") or w_raw.get("remaining")),
                    "refresh_in_human": parse_time_to_reset(w_raw.get("refresh_in_human") or w_raw.get("reset_time")),
                    "is_exhausted": bool(w_raw.get("is_exhausted", False))
                },
                "five_hour_limit": {
                    "percentage_remaining": parse_quota_percentage(f_raw.get("percentage_remaining") or f_raw.get("remaining")),
                    "refresh_in_human": parse_time_to_reset(f_raw.get("refresh_in_human") or f_raw.get("reset_time")),
                    "is_exhausted": bool(f_raw.get("is_exhausted", False))
                }
            })
    return categories
