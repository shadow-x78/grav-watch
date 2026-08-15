# GravWatch - Telemetry Parser (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import re
import json
from datetime import datetime, timezone

try:
    from ..mock.generator import generate_mock_models
except ImportError:
    from mock.generator import generate_mock_models

ANSI_PATTERN = re.compile(r'\x1b\[[0-9;]*[mGKF]')


def clean_ansi(text: str) -> str:
    return ANSI_PATTERN.sub('', text)


def normalize_model_name(raw_name: str) -> tuple[str, str]:
    lower = raw_name.lower().strip()
    if "flash" in lower:
        return "gemini-flash", "Gemini Flash"
    elif "pro" in lower and "gemini" in lower:
        return "gemini-pro", "Gemini Pro"
    elif "sonnet" in lower:
        return "claude-sonnet", "Claude Sonnet"
    elif "opus" in lower:
        return "claude-opus", "Claude Opus"
    elif "gpt" in lower or "oss" in lower:
        return "gpt-oss", "GPT OSS"
    else:
        clean_id = re.sub(r"[^a-z0-9]+", "-", lower).strip("-")
        return clean_id, raw_name.strip()


def parse_agy_output(raw_text: str, account_id: str = "acc-1", account_label: str = "Account 1") -> dict:
    clean_text = clean_ansi(raw_text)

    try:
        data = json.loads(clean_text)
        if isinstance(data, dict) and "models" in data:
            return {
                "account_id": account_id,
                "account_label": account_label,
                "email": data.get("email", f"{account_id}@domain.com"),
                "tier": data.get("tier", "Standard"),
                "status": data.get("status", "healthy"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "models": data.get("models", [])
            }
    except json.JSONDecodeError:
        pass

    email_match = re.search(r"Account:\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", clean_text)
    email = email_match.group(1) if email_match else f"{account_id}@corp.google.dev"

    tier_match = re.search(r"Tier:\s*([^\n\r]+)", clean_text)
    tier = tier_match.group(1).strip() if tier_match else "Pro Developer"

    models = []
    for line in clean_text.splitlines():
        if "|" in line or "│" in line:
            parts = [p.strip() for p in re.split(r"[|│]", line) if p.strip()]
            if len(parts) >= 4 and not any(h in parts[0].lower() for h in ["model name", "model", "---"]):
                raw_model_name = parts[0]
                rpm_info = parts[1]
                daily_info = parts[2]
                resets_in = parts[3]

                used, limit, percentage = 0, 100, 0.0

                ratio_match = re.search(r"(\d+)\s*/\s*(\d+)", rpm_info)
                if ratio_match:
                    used = int(ratio_match.group(1))
                    limit = int(ratio_match.group(2))

                pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", daily_info)
                if pct_match:
                    percentage = float(pct_match.group(1))
                elif limit > 0:
                    percentage = round((used / limit) * 100, 1)

                model_id, canonical_name = normalize_model_name(raw_model_name)

                models.append({
                    "model_id": model_id,
                    "model_name": canonical_name,
                    "used": used,
                    "limit": limit,
                    "percentage": min(percentage, 100.0),
                    "unit": "requests",
                    "resets_in_human": resets_in,
                    "resets_at": datetime.now(timezone.utc).isoformat()
                })

    if not models:
        models = generate_mock_models(account_id)

    return {
        "account_id": account_id,
        "account_label": account_label,
        "email": email,
        "tier": tier,
        "status": "healthy" if models else "unauthenticated",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models": models
    }
