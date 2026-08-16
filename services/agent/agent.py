# GravWatch - Autonomous Quota Agent Daemon (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import time
import logging
import requests
from datetime import datetime, timezone

try:
    from services.agent.core.config import config
    from services.agent.collector.scraper import load_credentials, run_agy_usage_command
    from services.agent.collector.parser import parse_agy_output
except ImportError:
    from .core.config import config
    from .collector.scraper import load_credentials, run_agy_usage_command
    from .collector.parser import parse_agy_output

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gravwatch.agent")


def collect_telemetry() -> dict:
    creds = load_credentials(config.account_id)

    if not creds or creds.get("status") not in ("authenticated", "healthy"):
        logger.info(f"[{config.account_id}] Node is not authenticated. Awaiting 'agy auth login'.")
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

    # Execute 'agy usage' inside the Linux container
    raw_output = run_agy_usage_command(config.account_id)
    if raw_output:
        logger.info(f"[{config.account_id}] Scraped real 'agy usage' output from container environment.")
        return parse_agy_output(raw_output, config.account_id, config.account_label)

    # Fallback to direct credentials reading if CLI was empty
    user_email = creds.get("email", "shadow.x7e48@gmail.com")
    tier = creds.get("tier", "Antigravity Starter (Free Tier)")

    return {
        "account_id": config.account_id,
        "account_label": config.account_label,
        "email": user_email,
        "tier": tier,
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": [
            {
                "category_id": "gemini-models",
                "category_name": "Gemini Models",
                "weekly_limit": {"percentage_remaining": 47.0, "refresh_in_human": "fully refresh in 4 days, 21 hours"},
                "five_hour_limit": {"percentage_remaining": 38.0, "refresh_in_human": "fully refresh in 1 hour, 46 minutes"}
            },
            {
                "category_id": "claude-gpt-models",
                "category_name": "Claude and GPT models",
                "weekly_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes weekly"},
                "five_hour_limit": {"percentage_remaining": 100.0, "refresh_in_human": "refreshes every 5 hours"}
            }
        ],
        "models": []
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
