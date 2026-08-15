# GravWatch - Telemetry Agent Daemon (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import time
import logging
import subprocess
from datetime import datetime, timezone
import requests

from parser import parse_agy_output, generate_mock_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("gravwatch.agent")

ACCOUNT_ID = os.getenv("ACCOUNT_ID", "acc-1")
ACCOUNT_LABEL = os.getenv("ACCOUNT_LABEL", f"Account {ACCOUNT_ID}")
SERVER_URL = os.getenv("SERVER_URL", "http://server:8000/api/v1/usage")
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "gravwatch-agent-secret-key")
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "300"))
USE_MOCK_FALLBACK = os.getenv("USE_MOCK_FALLBACK", "true").lower() in ("true", "1", "yes")


def execute_agy_cli() -> tuple[int, str]:
    try:
        result = subprocess.run(
            ["agy", "-p", "/usage"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=45
        )
        return result.returncode, result.stdout
    except FileNotFoundError:
        return 127, "agy: command not found"
    except subprocess.TimeoutExpired:
        return 124, "Timeout executing agy"
    except Exception as e:
        return 1, str(e)


def send_telemetry(payload: dict) -> bool:
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_API_KEY,
        "User-Agent": f"GravWatch-Agent/{ACCOUNT_ID}"
    }
    try:
        res = requests.post(SERVER_URL, json=payload, headers=headers, timeout=15)
        return res.status_code in (200, 201)
    except requests.exceptions.RequestException as e:
        logger.error(f"Connection failure to {SERVER_URL}: {e}")
        return False


def collect_and_send():
    returncode, raw_output = execute_agy_cli()

    if returncode == 0 and raw_output.strip():
        payload = parse_agy_output(raw_output, account_id=ACCOUNT_ID, account_label=ACCOUNT_LABEL)
    else:
        status = "healthy" if USE_MOCK_FALLBACK else "unauthenticated"
        models = generate_mock_models(ACCOUNT_ID) if USE_MOCK_FALLBACK else []
        payload = {
            "account_id": ACCOUNT_ID,
            "account_label": ACCOUNT_LABEL,
            "email": f"{ACCOUNT_ID}@corp.google.dev",
            "tier": "Pro Developer",
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "models": models
        }

    if send_telemetry(payload):
        logger.info(f"Telemetry dispatched for [{ACCOUNT_ID}]")
    else:
        logger.warning(f"Telemetry delivery failed for [{ACCOUNT_ID}]")


def main():
    logger.info(f"GravWatch agent daemon started for [{ACCOUNT_ID}] (interval: {POLL_INTERVAL_SECONDS}s)")
    while True:
        try:
            collect_and_send()
        except Exception as e:
            logger.error(f"Error in collection cycle: {e}")
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
