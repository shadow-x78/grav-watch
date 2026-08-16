# GravWatch - CLI Scraper & Subprocess Executor (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import subprocess

logger = logging.getLogger("gravwatch.agent.scraper")


def load_credentials(account_id: str) -> dict | None:
    candidate_paths = [
        f"/root/.gemini/credentials.json",
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
    Executes 'agy usage' inside the Linux container and returns raw CLI output.
    """
    # 1. Try direct agy CLI if in PATH
    try:
        proc = subprocess.run(
            ["agy", "usage"],
            capture_output=True,
            text=True,
            timeout=10,
            env=os.environ
        )
        if proc.returncode == 0 and proc.stdout:
            return proc.stdout
    except Exception as e:
        logger.debug(f"Direct 'agy usage' execution attempt: {e}")

    # 2. Try python module execution
    try:
        proc = subprocess.run(
            ["python3", "/usr/local/bin/agy", "usage"],
            capture_output=True,
            text=True,
            timeout=10,
            env=os.environ
        )
        if proc.returncode == 0 and proc.stdout:
            return proc.stdout
    except Exception as e:
        logger.debug(f"Python agy execution attempt: {e}")

    # 3. Fallback to local packaging script
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
            if proc.returncode == 0 and proc.stdout:
                return proc.stdout
    except Exception as e:
        logger.error(f"Fallback agy execution error: {e}")

    return ""
