# GravWatch - Telemetry Parser (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import re
import json
from datetime import datetime, timezone

try:
    from services.agent.mock.generator import generate_mock_telemetry
except ImportError:
    from ..mock.generator import generate_mock_telemetry

ANSI_PATTERN = re.compile(r'\x1b\[[0-9;]*[mGKF]')


def clean_ansi(text: str) -> str:
    return ANSI_PATTERN.sub('', text)


def normalize_model_name(raw_name: str) -> tuple[str, str, str]:
    lower = raw_name.lower().strip()
    if "flash" in lower:
        return "gemini-flash", "Gemini Flash", "gemini-models"
    elif "pro" in lower and "gemini" in lower:
        return "gemini-pro", "Gemini Pro", "gemini-models"
    elif "sonnet" in lower:
        return "claude-sonnet", "Claude Sonnet", "claude-gpt-models"
    elif "opus" in lower:
        return "claude-opus", "Claude Opus", "claude-gpt-models"
    elif "gpt" in lower or "oss" in lower:
        return "gpt-oss", "GPT OSS", "claude-gpt-models"
    else:
        clean_id = re.sub(r"[^a-z0-9]+", "-", lower).strip("-")
        return clean_id, raw_name.strip(), "gemini-models"


def parse_agy_output(raw_text: str, account_id: str = "acc-1", account_label: str = "Account 1") -> dict:
    clean_text = clean_ansi(raw_text)

    try:
        data = json.loads(clean_text)
        if isinstance(data, dict) and ("categories" in data or "models" in data):
            return {
                "account_id": account_id,
                "account_label": account_label,
                "email": data.get("email", f"{account_id}@domain.com"),
                "tier": data.get("tier", "Standard"),
                "status": data.get("status", "healthy"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "categories": data.get("categories", []),
                "models": data.get("models", [])
            }
    except json.JSONDecodeError:
        pass

    email_match = re.search(r"Account:\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", clean_text)
    email = email_match.group(1) if email_match else f"{account_id}@corp.google.dev"

    tier_match = re.search(r"Tier:\s*([^\n\r]+)", clean_text)
    tier = tier_match.group(1).strip() if tier_match else "Pro Developer"

    # Try parsing categories and limits from text
    categories = []
    models = []

    # Regex patterns for official UI output
    # e.g., Weekly Limit Remaining 54% | Five Hour Limit Remaining 79%
    gemini_weekly_match = re.search(r"Gemini.*?Weekly.*?(\d+(?:\.\d+)?)\s*%", clean_text, re.DOTALL | re.IGNORECASE)
    gemini_5h_match = re.search(r"Gemini.*?Five Hour.*?(\d+(?:\.\d+)?)\s*%", clean_text, re.DOTALL | re.IGNORECASE)
    claude_weekly_match = re.search(r"Claude.*?Weekly.*?(\d+(?:\.\d+)?)\s*%", clean_text, re.DOTALL | re.IGNORECASE)
    claude_5h_match = re.search(r"Claude.*?Five Hour.*?(\d+(?:\.\d+)?)\s*%", clean_text, re.DOTALL | re.IGNORECASE)

    if gemini_weekly_match or claude_weekly_match:
        g_w = float(gemini_weekly_match.group(1)) if gemini_weekly_match else 100.0
        g_5h = float(gemini_5h_match.group(1)) if gemini_5h_match else 100.0
        c_w = float(claude_weekly_match.group(1)) if claude_weekly_match else 100.0
        c_5h = float(claude_5h_match.group(1)) if claude_5h_match else 100.0

        categories = [
            {
                "category_id": "gemini-models",
                "category_name": "Gemini Models",
                "weekly_limit": {"percentage_remaining": g_w, "refresh_in_human": "fully refreshes in 5 days"},
                "five_hour_limit": {"percentage_remaining": g_5h, "refresh_in_human": "fully refreshes in 4 hours, 18 minutes"}
            },
            {
                "category_id": "claude-gpt-models",
                "category_name": "Claude and GPT models",
                "weekly_limit": {"percentage_remaining": c_w, "refresh_in_human": "fully refreshes in 6 days"},
                "five_hour_limit": {"percentage_remaining": c_5h, "refresh_in_human": "fully refreshes in 5 hours"}
            }
        ]

    if not categories:
        mock_data = generate_mock_telemetry(account_id)
        categories = mock_data["categories"]
        models = mock_data["models"]

    return {
        "account_id": account_id,
        "account_label": account_label,
        "email": email,
        "tier": tier,
        "status": "healthy" if categories else "unauthenticated",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": categories,
        "models": models
    }
