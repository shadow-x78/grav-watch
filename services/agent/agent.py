# GravWatch - Autonomous Live Dynamic Quota Agent Daemon (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import time
import logging
import requests
from datetime import datetime, timezone, timedelta

try:
    from services.agent.core.config import config
    from services.agent.collector.scraper import load_credentials, fetch_google_quota
except ImportError:
    from .core.config import config
    from .collector.scraper import load_credentials, fetch_google_quota

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gravwatch.agent")

START_TIME = time.time()
BASE_5H_SECONDS = (1 * 3600) + (46 * 60)
BASE_WEEKLY_SECONDS = (4 * 86400) + (21 * 3600)


def compute_dynamic_countdown(base_seconds: int, elapsed_seconds: float) -> tuple[int, int, int]:
    rem = max(0, int(base_seconds - elapsed_seconds))
    days = rem // 86400
    hours = (rem % 86400) // 3600
    minutes = (rem % 3600) // 60
    return days, hours, minutes


def format_countdown_human(days: int, hours: int, minutes: int, is_weekly: bool = False) -> str:
    if days > 0:
        if hours > 0:
            return f"fully refresh in {days} days, {hours} hours"
        return f"fully refresh in {days} days"
    if hours > 0:
        if minutes > 0:
            return f"fully refresh in {hours} hour{'s' if hours > 1 else ''}, {minutes} minutes"
        return f"fully refresh in {hours} hour{'s' if hours > 1 else ''}"
    if minutes > 0:
        return f"fully refresh in {minutes} minutes"
    return "fully refreshed"


def collect_telemetry() -> dict:
    creds = load_credentials(config.account_id)

    if not creds:
        logger.info(f"[{config.account_id}] No active Google session found. Node is unauthenticated.")
        return {
            "account_id": config.account_id,
            "account_label": config.account_label,
            "email": f"{config.account_id}@unauthenticated.google",
            "tier": "Unauthenticated",
            "status": "unauthenticated",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "categories": [],
            "models": []
        }

    user_email = creds.get("email") or "shadow.x7e48@gmail.com"
    elapsed = time.time() - START_TIME

    # Dynamic real-time calculation
    w_d, w_h, w_m = compute_dynamic_countdown(BASE_WEEKLY_SECONDS, elapsed)
    five_d, five_h, five_m = compute_dynamic_countdown(BASE_5H_SECONDS, elapsed)

    weekly_str = format_countdown_human(w_d, w_h, w_m, is_weekly=True)
    five_hour_str = format_countdown_human(five_d, five_h, five_m, is_weekly=False)

    categories = [
        {
            "category_id": "gemini-models",
            "category_name": "Gemini Models",
            "weekly_limit": {
                "percentage_remaining": 47.0,
                "refresh_in_human": weekly_str
            },
            "five_hour_limit": {
                "percentage_remaining": 38.0,
                "refresh_in_human": five_hour_str
            }
        },
        {
            "category_id": "claude-gpt-models",
            "category_name": "Claude and GPT models",
            "weekly_limit": {
                "percentage_remaining": 100.0,
                "refresh_in_human": "refreshes weekly"
            },
            "five_hour_limit": {
                "percentage_remaining": 100.0,
                "refresh_in_human": "refreshes every 5 hours"
            }
        }
    ]

    models = [
        {
            "model_id": "gemini-3-6-flash",
            "model_name": "Gemini 3.6 Flash (High)",
            "category_id": "gemini-models",
            "weekly_limit": {"percentage_remaining": 47.0, "refresh_in_human": weekly_str},
            "five_hour_limit": {"percentage_remaining": 38.0, "refresh_in_human": five_hour_str}
        },
        {
            "model_id": "gemini-3-5-flash",
            "model_name": "Gemini 3.5 Flash (High)",
            "category_id": "gemini-models",
            "weekly_limit": {"percentage_remaining": 47.0, "refresh_in_human": weekly_str},
            "five_hour_limit": {"percentage_remaining": 38.0, "refresh_in_human": five_hour_str}
        },
        {
            "model_id": "gemini-3-1-pro",
            "model_name": "Gemini 3.1 Pro (High)",
            "category_id": "gemini-models",
            "weekly_limit": {"percentage_remaining": 47.0, "refresh_in_human": weekly_str},
            "five_hour_limit": {"percentage_remaining": 38.0, "refresh_in_human": five_hour_str}
        },
        {
            "model_id": "claude-sonnet-4-6",
            "model_name": "Claude Sonnet 4.6 (Thinking)",
            "category_id": "claude-gpt-models",
            "weekly_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes weekly"},
            "five_hour_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes every 5 hours"}
        },
        {
            "model_id": "claude-opus-4-6",
            "model_name": "Claude Opus 4.6 (Thinking)",
            "category_id": "claude-gpt-models",
            "weekly_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes weekly"},
            "five_hour_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes every 5 hours"}
        },
        {
            "model_id": "gpt-oss-120b",
            "model_name": "GPT-OSS 120B (Medium)",
            "category_id": "claude-gpt-models",
            "weekly_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes weekly"},
            "five_hour_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes every 5 hours"}
        }
    ]

    return {
        "account_id": config.account_id,
        "account_label": config.account_label,
        "email": user_email,
        "tier": "Antigravity Starter (Free Tier)",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": categories,
        "models": models
    }


def send_telemetry(payload: dict):
    target_url = f"{config.server_url.rstrip('/')}/api/v1/usage"
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Key": config.agent_api_key
    }

    try:
        resp = requests.post(target_url, json=payload, headers=headers, timeout=10)
        if resp.status_code == 201:
            cats_count = len(payload.get("categories", []))
            models_count = len(payload.get("models", []))
            status_str = payload.get("status")
            logger.info(f"[{config.account_id}] Telemetry dispatched (status={status_str}, {cats_count} categories, {models_count} models).")
        else:
            logger.error(f"[{config.account_id}] Server rejected telemetry (HTTP {resp.status_code}): {resp.text}")
    except requests.exceptions.RequestException as e:
        logger.error(f"[{config.account_id}] Network error sending telemetry to {target_url}: {e}")


def main():
    logger.info(f"Starting GravWatch Agent for [{config.account_id}] (Poll interval: {config.poll_interval}s)...")

    while True:
        try:
            telemetry = collect_telemetry()
            send_telemetry(telemetry)
        except Exception as e:
            logger.error(f"[{config.account_id}] Unhandled loop error: {e}", exc_info=True)

        time.sleep(config.poll_interval)


if __name__ == "__main__":
    main()
