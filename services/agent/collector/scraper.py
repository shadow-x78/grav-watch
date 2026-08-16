# GravWatch - CLI Scraper & Real agy Subprocess Executor (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import subprocess

logger = logging.getLogger("gravwatch.agent.scraper")


def find_agy_binary() -> str:
    candidates = [
        "/home/shadow-x7/.local/bin/agy",
        "/usr/local/bin/agy",
        "/usr/bin/agy",
        "agy",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packaging/cli/agy"))
    ]
    for c in candidates:
        if os.path.exists(c) and os.access(c, os.X_OK):
            return c
    return "agy"


def load_credentials(account_id: str) -> dict | None:
    candidate_paths = [
        os.path.expanduser("~/.gemini/credentials.json"),
        "/root/.gemini/credentials.json",
        f"./data/{account_id}/credentials.json",
        f"/home/shadow-x7/Projects/Tools/Python/GravWatch/data/{account_id}/credentials.json"
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not read credentials from {p}: {e}")
    return None


def run_agy_usage_command(account_id: str) -> str:
    """
    Executes 'agy usage' using the real system binary and returns the exact stdout string.
    """
    agy_bin = find_agy_binary()

    try:
        proc = subprocess.run(
            [agy_bin, "usage"],
            capture_output=True,
            text=True,
            timeout=10,
            env=os.environ
        )
        if proc.returncode == 0 and proc.stdout:
            return proc.stdout
        elif proc.stdout:
            return proc.stdout
    except Exception as e:
        logger.error(f"Error executing '{agy_bin} usage': {e}")

    # Fallback to direct script execution
    try:
        script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packaging/cli/agy"))
        if os.path.exists(script_path):
            proc = subprocess.run(
                ["python3", script_path, "usage"],
                capture_output=True,
                text=True,
                timeout=10,
                env=os.environ
            )
            if proc.stdout:
                return proc.stdout
    except Exception as e:
        logger.error(f"Fallback script execution error: {e}")

    return ""
