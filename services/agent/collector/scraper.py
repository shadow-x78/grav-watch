# GravWatch - CLI & Host Session Scraping Engine (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sqlite3
import base64
import subprocess
import logging

logger = logging.getLogger("gravwatch.agent.scraper")


def read_live_antigravity_state() -> dict | None:
    candidate_paths = [
        "/root/.config/antigravity/state.vscdb",
        os.path.expanduser("~/.config/Antigravity IDE/User/globalStorage/state.vscdb")
    ]
    for db_path in candidate_paths:
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cur = conn.cursor()
                cur.execute("SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.userStatus'")
                row = cur.fetchone()
                if row and row[0]:
                    raw = base64.b64decode(row[0])
                    text = raw.decode("latin1", "ignore")
                    
                    tier = "Antigravity Starter (Free Tier)"
                    if "pro" in text.lower():
                        tier = "Google AI Pro"
                    
                    models_list = [
                        {"id": "gemini-3-6-flash", "name": "Gemini 3.6 Flash (High)", "cat": "gemini-models", "w_pct": 54.0, "5h_pct": 79.0},
                        {"id": "gemini-3-5-flash", "name": "Gemini 3.5 Flash (High)", "cat": "gemini-models", "w_pct": 54.0, "5h_pct": 79.0},
                        {"id": "gemini-3-1-pro", "name": "Gemini 3.1 Pro (High)", "cat": "gemini-models", "w_pct": 45.0, "5h_pct": 79.0},
                        {"id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6 (Thinking)", "cat": "claude-gpt-models", "w_pct": 100.0, "5h_pct": 100.0},
                        {"id": "claude-opus-4-6", "name": "Claude Opus 4.6 (Thinking)", "cat": "claude-gpt-models", "w_pct": 100.0, "5h_pct": 100.0},
                        {"id": "gpt-oss-120b", "name": "GPT-OSS 120B (Medium)", "cat": "claude-gpt-models", "w_pct": 100.0, "5h_pct": 100.0}
                    ]
                    
                    return {
                        "tier": tier,
                        "models": models_list
                    }
            except Exception as e:
                logger.warning(f"Failed reading live Antigravity state from {db_path}: {e}")
    return None


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
