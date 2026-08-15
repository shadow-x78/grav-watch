# GravWatch - CLI Scraping Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import subprocess
import logging

logger = logging.getLogger("gravwatch.agent.scraper")


def run_agy_usage_command(timeout_seconds: int = 15) -> str:
    try:
        proc = subprocess.run(
            ["agy", "-p", "/usage"],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return proc.stdout
        logger.warning(f"agy CLI exited with code {proc.returncode}: {proc.stderr}")
        return proc.stdout or proc.stderr
    except FileNotFoundError:
        logger.warning("agy binary not found on PATH.")
        return ""
    except subprocess.TimeoutExpired:
        logger.error(f"agy CLI timed out after {timeout_seconds}s.")
        return ""
    except Exception as e:
        logger.error(f"Unexpected error executing agy CLI: {e}")
        return ""
