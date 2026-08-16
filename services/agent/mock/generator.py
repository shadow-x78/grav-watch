# GravWatch - Mock Telemetry Generator (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import random
from datetime import datetime, timezone


def generate_mock_telemetry(account_id: str) -> dict:
    seed_offset = sum(ord(c) for c in account_id)
    random.seed(seed_offset + int(datetime.now().timestamp() // 300))

    # Real Antigravity category quotas as shown in official UI
    gemini_weekly_pct = round(random.uniform(40.0, 95.0), 1)
    gemini_5h_pct = round(random.uniform(60.0, 100.0), 1)
    claude_weekly_pct = round(random.uniform(70.0, 100.0), 1)
    claude_5h_pct = round(random.uniform(80.0, 100.0), 1)

    categories = [
        {
            "category_id": "gemini-models",
            "category_name": "Gemini Models",
            "weekly_limit": {
                "percentage_remaining": gemini_weekly_pct,
                "refresh_in_human": "fully refreshes in 5 days",
                "refreshes_at": datetime.now(timezone.utc).isoformat()
            },
            "five_hour_limit": {
                "percentage_remaining": gemini_5h_pct,
                "refresh_in_human": "fully refreshes in 4 hours, 18 minutes",
                "refreshes_at": datetime.now(timezone.utc).isoformat()
            }
        },
        {
            "category_id": "claude-gpt-models",
            "category_name": "Claude and GPT models",
            "weekly_limit": {
                "percentage_remaining": claude_weekly_pct,
                "refresh_in_human": "fully refreshes in 6 days",
                "refreshes_at": datetime.now(timezone.utc).isoformat()
            },
            "five_hour_limit": {
                "percentage_remaining": claude_5h_pct,
                "refresh_in_human": "fully refreshes in 5 hours",
                "refreshes_at": datetime.now(timezone.utc).isoformat()
            }
        }
    ]

    specs = [
        ("gemini-flash", "Gemini Flash", "gemini-models", gemini_weekly_pct, gemini_5h_pct),
        ("gemini-pro", "Gemini Pro", "gemini-models", max(0.0, gemini_weekly_pct - 10), gemini_5h_pct),
        ("claude-sonnet", "Claude Sonnet", "claude-gpt-models", claude_weekly_pct, claude_5h_pct),
        ("claude-opus", "Claude Opus", "claude-gpt-models", max(0.0, claude_weekly_pct - 15), claude_5h_pct),
        ("gpt-oss", "GPT OSS", "claude-gpt-models", claude_weekly_pct, claude_5h_pct)
    ]

    models = []
    for m_id, name, cat_id, w_pct, fh_pct in specs:
        models.append({
            "model_id": m_id,
            "model_name": name,
            "category_id": cat_id,
            "weekly_limit": {
                "percentage_remaining": min(w_pct, 100.0),
                "refresh_in_human": "fully refreshes in 5 days",
                "refreshes_at": datetime.now(timezone.utc).isoformat()
            },
            "five_hour_limit": {
                "percentage_remaining": min(fh_pct, 100.0),
                "refresh_in_human": "fully refreshes in 4 hours, 18 minutes",
                "refreshes_at": datetime.now(timezone.utc).isoformat()
            }
        })

    return {
        "categories": categories,
        "models": models
    }
