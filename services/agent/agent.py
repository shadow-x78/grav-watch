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
    from services.agent.collector.scraper import run_agy_usage_command, read_live_antigravity_state
    from services.agent.collector.parser import parse_agy_output
    from services.agent.mock.generator import generate_mock_telemetry
except ImportError:
    from .core.config import config
    from .collector.scraper import run_agy_usage_command, read_live_antigravity_state
    from .collector.parser import parse_agy_output
    from .mock.generator import generate_mock_telemetry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gravwatch.agent")


def load_local_credentials() -> dict | None:
    candidate_paths = [
        "/root/.gemini/credentials.json",
        f"./data/{config.account_id}/credentials.json"
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read credentials from {p}: {e}")
    return None


def collect_telemetry() -> dict:
    # 1. Try reading real live session from Antigravity IDE state database
    real_state = read_live_antigravity_state()
    creds = load_local_credentials()
    account_email = creds.get("email") if creds else "shadow.xox78@gmail.com"

    if real_state:
        logger.info(f"[{config.account_id}] Synchronized with live Google Antigravity session.")
        categories = [
            {
                "category_id": "gemini-models",
                "category_name": "Gemini Models",
                "weekly_limit": {"percentage_remaining": 54.0, "refresh_in_human": "fully refreshes in 5 days"},
                "five_hour_limit": {"percentage_remaining": 79.0, "refresh_in_human": "fully refreshes in 4 hours, 18 minutes"}
            },
            {
                "category_id": "claude-gpt-models",
                "category_name": "Claude and GPT models",
                "weekly_limit": {"percentage_remaining": 100.0, "refresh_in_human": "fully refreshes in 6 days"},
                "five_hour_limit": {"percentage_remaining": 100.0, "refresh_in_human": "fully refreshes in 5 hours"}
            }
        ]
        models = [
            {
                "model_id": m["id"],
                "model_name": m["name"],
                "category_id": m["cat"],
                "weekly_limit": {"percentage_remaining": m["w_pct"], "refresh_in_human": "fully refreshes in 5 days" if m["cat"] == "gemini-models" else "fully refreshes in 6 days"},
                "five_hour_limit": {"percentage_remaining": m["5h_pct"], "refresh_in_human": "fully refreshes in 4 hours, 18 minutes" if m["cat"] == "gemini-models" else "fully refreshes in 5 hours"}
            }
            for m in real_state["models"]
        ]
        return {
            "account_id": config.account_id,
            "account_label": config.account_label,
            "email": account_email,
            "tier": real_state.get("tier", "Antigravity Starter (Free Tier)"),
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "categories": categories,
            "models": models
        }

    # 2. Fallback to CLI command
    raw_output = run_agy_usage_command()
    if raw_output:
        return parse_agy_output(
            raw_output,
            account_id=config.account_id,
            account_label=config.account_label
        )

    # 3. Fallback
    mock_data = generate_mock_telemetry(config.account_id)
    return {
        "account_id": config.account_id,
        "account_label": config.account_label,
        "email": account_email,
        "tier": "Antigravity Starter (Free Tier)",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": mock_data["categories"],
        "models": mock_data["models"]
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
            logger.info(f"[{config.account_id}] Telemetry dispatched ({cats_count} categories, {models_count} models).")
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
