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
            "email": None,
            "tier": "Unauthenticated",
            "status": "unauthenticated",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "categories": [],
            "models": []
        }

    # Execute 'agy usage' using the real system binary
    raw_output = run_agy_usage_command(config.account_id)
    if raw_output:
        logger.info(f"[{config.account_id}] Scraped real 'agy usage' output.")
        parsed = parse_agy_output(raw_output, config.account_id, config.account_label)
        if parsed.get("categories"):
            return parsed

    # If CLI execution had no categories, do not fake them
    return {
        "account_id": config.account_id,
        "account_label": config.account_label,
        "email": creds.get("email"),
        "tier": creds.get("tier", "Antigravity Starter"),
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": [],
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
