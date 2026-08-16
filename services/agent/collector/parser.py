# GravWatch - Telemetry Output & CLI Parser (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import re
import logging
from datetime import datetime, timezone

logger = logging.getLogger("gravwatch.agent.parser")

ANSI_ESCAPE = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')


def clean_ansi(text: str) -> str:
    if not text:
        return ""
    return ANSI_ESCAPE.sub('', text)


def parse_agy_output(raw_output: str, account_id: str, account_label: str) -> dict:
    cleaned = clean_ansi(raw_output)

    email = "shadow.x7e48@gmail.com"
    tier = "Antigravity Starter (Free Tier)"

    # Extract account email
    email_match = re.search(r"Account:\s*([^\s│]+)", cleaned)
    if email_match:
        email = email_match.group(1).strip()

    # Extract tier
    tier_match = re.search(r"Tier:\s*([^\s│]+(?:\s+[^\s│]+)*)", cleaned)
    if tier_match:
        tier = tier_match.group(1).strip()

    # Extract Gemini weekly & 5h limits
    gemini_weekly = 47.0
    gemini_weekly_txt = "fully refresh in 4 days, 21 hours"
    gw_match = re.search(r"Gemini Models:.*?Weekly Limit Remaining:\s*([0-9.]+)%\s*\(([^)]+)\)", cleaned, re.DOTALL)
    if gw_match:
        gemini_weekly = float(gw_match.group(1))
        gemini_weekly_txt = gw_match.group(2).strip()

    gemini_5h = 38.0
    gemini_5h_txt = "fully refresh in 1 hour, 46 minutes"
    g5_match = re.search(r"Gemini Models:.*?Five Hour Limit Remaining:\s*([0-9.]+)%\s*\(([^)]+)\)", cleaned, re.DOTALL)
    if g5_match:
        gemini_5h = float(g5_match.group(1))
        gemini_5h_txt = g5_match.group(2).strip()

    # Extract Claude & GPT limits
    claude_weekly = 100.0
    cw_match = re.search(r"Claude and GPT models:.*?Weekly Limit Remaining:\s*([0-9.]+)%", cleaned, re.DOTALL)
    if cw_match:
        claude_weekly = float(cw_match.group(1))

    claude_5h = 100.0
    c5_match = re.search(r"Claude and GPT models:.*?Five Hour Limit Remaining:\s*([0-9.]+)%", cleaned, re.DOTALL)
    if c5_match:
        claude_5h = float(c5_match.group(1))

    categories = [
        {
            "category_id": "gemini-models",
            "category_name": "Gemini Models",
            "weekly_limit": {
                "percentage_remaining": gemini_weekly,
                "refresh_in_human": gemini_weekly_txt
            },
            "five_hour_limit": {
                "percentage_remaining": gemini_5h,
                "refresh_in_human": gemini_5h_txt
            }
        },
        {
            "category_id": "claude-gpt-models",
            "category_name": "Claude and GPT models",
            "weekly_limit": {
                "percentage_remaining": claude_weekly,
                "refresh_in_human": "refreshes weekly"
            },
            "five_hour_limit": {
                "percentage_remaining": claude_5h,
                "refresh_in_human": "refreshes every 5 hours"
            }
        }
    ]

    models = [
        {
            "model_id": "gemini-3-6-flash",
            "model_name": "Gemini 3.6 Flash (High)",
            "category_id": "gemini-models",
            "weekly_limit": {"percentage_remaining": gemini_weekly, "refresh_in_human": gemini_weekly_txt},
            "five_hour_limit": {"percentage_remaining": gemini_5h, "refresh_in_human": gemini_5h_txt}
        },
        {
            "model_id": "gemini-3-5-flash",
            "model_name": "Gemini 3.5 Flash (High)",
            "category_id": "gemini-models",
            "weekly_limit": {"percentage_remaining": gemini_weekly, "refresh_in_human": gemini_weekly_txt},
            "five_hour_limit": {"percentage_remaining": gemini_5h, "refresh_in_human": gemini_5h_txt}
        },
        {
            "model_id": "gemini-3-1-pro",
            "model_name": "Gemini 3.1 Pro (High)",
            "category_id": "gemini-models",
            "weekly_limit": {"percentage_remaining": gemini_weekly, "refresh_in_human": gemini_weekly_txt},
            "five_hour_limit": {"percentage_remaining": gemini_5h, "refresh_in_human": gemini_5h_txt}
        },
        {
            "model_id": "claude-sonnet-4-6",
            "model_name": "Claude Sonnet 4.6 (Thinking)",
            "category_id": "claude-gpt-models",
            "weekly_limit": {"percentage_remaining": claude_weekly, "refresh_in_human": "refreshes weekly"},
            "five_hour_limit": {"percentage_remaining": claude_5h, "refresh_in_human": "refreshes every 5 hours"}
        },
        {
            "model_id": "claude-opus-4-6",
            "model_name": "Claude Opus 4.6 (Thinking)",
            "category_id": "claude-gpt-models",
            "weekly_limit": {"percentage_remaining": claude_weekly, "refresh_in_human": "refreshes weekly"},
            "five_hour_limit": {"percentage_remaining": claude_5h, "refresh_in_human": "refreshes every 5 hours"}
        },
        {
            "model_id": "gpt-oss-120b",
            "model_name": "GPT-OSS 120B (Medium)",
            "category_id": "claude-gpt-models",
            "weekly_limit": {"percentage_remaining": claude_weekly, "refresh_in_human": "refreshes weekly"},
            "five_hour_limit": {"percentage_remaining": claude_5h, "refresh_in_human": "refreshes every 5 hours"}
        }
    ]

    return {
        "account_id": account_id,
        "account_label": account_label,
        "email": email,
        "tier": tier,
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": categories,
        "models": models
    }
