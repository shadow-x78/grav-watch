# GravWatch - Mock Telemetry Generator (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import random
from datetime import datetime, timezone


def generate_mock_models(account_id: str) -> list[dict]:
    seed_offset = sum(ord(c) for c in account_id)
    random.seed(seed_offset + int(datetime.now().timestamp() // 300))

    specs = [
        ("gemini-flash", "Gemini Flash", 1000, 120, 850, "03h 45m"),
        ("gemini-pro", "Gemini Pro", 100, 10, 80, "03h 45m"),
        ("claude-sonnet", "Claude Sonnet", 200, 20, 180, "08h 15m"),
        ("claude-opus", "Claude Opus", 50, 5, 45, "08h 15m"),
        ("gpt-oss", "GPT OSS", 500, 40, 420, "01h 10m")
    ]

    result = []
    for m_id, name, limit, min_used, max_used, resets in specs:
        used = random.randint(min_used, max_used)
        pct = round((used / limit) * 100, 1)
        result.append({
            "model_id": m_id,
            "model_name": name,
            "used": used,
            "limit": limit,
            "percentage": min(pct, 100.0),
            "unit": "requests",
            "resets_in_human": resets,
            "resets_at": datetime.now(timezone.utc).isoformat()
        })
    return result
