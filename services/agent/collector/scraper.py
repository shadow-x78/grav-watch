# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import os
import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx

from services.agent.core.config import settings
from services.agent.collector.parser import normalize_category_name

logger = logging.getLogger("gravwatch.collector.scraper")

def _format_reset_delta(reset_str: Optional[str]) -> str:
    if not reset_str:
        return "Active"
    try:
        reset_dt = datetime.fromisoformat(reset_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff = (reset_dt - now).total_seconds()
        if diff <= 0:
            return "Active"
        hours = int(diff // 3600)
        mins = int((diff % 3600) // 60)
        if hours >= 24:
            days = hours // 24
            rem_hours = hours % 24
            return f"{days} days, {rem_hours} hours"
        elif hours > 0:
            return f"{hours} hours, {mins} mins"
        else:
            return f"{mins} mins"
    except Exception:
        return "Active"

def _list_token_files(acc_id: str) -> List[str]:
    """Return paths where OAuth tokens may be stored."""
    data_dir = os.environ.get("DATA_DIR", "/app/data")
    paths = [
        os.path.join(data_dir, acc_id, ".gemini", "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(data_dir, acc_id, "antigravity-cli", "antigravity-oauth-token"),
        "/root/.gemini/antigravity-cli/antigravity-oauth-token",
    ]
    return [p for p in paths if os.path.exists(p)]

def _read_access_token(acc_id: Optional[str] = None) -> Optional[str]:
    """Extract access_token from the best available token file."""
    _ = acc_id
    candidates = _list_token_files(
        acc_id or os.environ.get("ACCOUNT_ID", "acc-1")
    )
    for path in candidates:
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read().strip()
            if not raw:
                continue
            try:
                data = json.loads(raw)
                tok = (
                    data.get("token", {}).get("access_token")
                    or data.get("access_token")
                )
                if tok:
                    logger.info("Found token at %s", path)
                    return tok
            except json.JSONDecodeError:
                if raw.startswith("ya29.") and len(raw) > 20:
                    logger.info("Found plain text token at %s", path)
                    return raw
        except Exception as e:
            logger.debug("Failed reading %s: %s", path, e)
    return None

def _update_token_file(acc_id: str, new_access: str, new_refresh: str = "") -> None:
    """Persist a freshly refreshed token (overwrite the first file we find)."""
    data_dir = os.environ.get("DATA_DIR", "/app/data")
    target_dir = os.path.join(data_dir, acc_id, "antigravity-cli")

    os.makedirs(target_dir, exist_ok=True)
    path = os.path.join(target_dir, "antigravity-oauth-token")

    payload = {
        "token": {
            "access_token": new_access,
            "token_type": "Bearer",
            "refresh_token": new_refresh,
            "expiry": (datetime.now(timezone.utc).astimezone()).strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        "auth_method": "oauth2",
    }
    with open(path, "w") as f:
        json.dump(payload, f, indent=2)

CLOUDCODE_URL = "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota"
CLOUDCODE_SUMMARY_URL = "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "not-set")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "not-set")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_REFRESH_ENDPOINT = "https://oauth2.googleapis.com/token"

def _get_scoped_refresh_token() -> Optional[str]:
    """Try to fetch a refresh_token from known locations."""
    data_dir = os.environ.get("DATA_DIR", "/app/data")
    acc_id = os.environ.get("ACCOUNT_ID", "acc-1")

    for base in [
        os.path.join(data_dir, acc_id, "antigravity-cli"),
        os.path.join(data_dir, acc_id, ".gemini", "antigravity-cli"),
    ]:
        rt_path = os.path.join(base, "refresh_token")
        if os.path.exists(rt_path):
            with open(rt_path) as f:
                rt = f.read().strip()
            if rt and len(rt) > 10:
                return rt

    tok_path = os.path.join(
        data_dir, acc_id, ".gemini", "antigravity-cli", "antigravity-oauth-token"
    )
    if os.path.exists(tok_path):
        try:
            with open(tok_path) as f:
                data = json.loads(f.read())
            rt = (
                data.get("token", {}).get("refresh_token")
                or data.get("refresh_token")
            )
            if rt and len(rt) > 10:
                return rt
        except Exception:
            pass
    return None

def _refresh_via_google(access_token: str) -> Optional[str]:
    """Use a refresh_token to get a new access_token from Google."""
    rt = _get_scoped_refresh_token()
    if not rt:
        logger.warning("No refresh_token available for token refresh")
        return None

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(GOOGLE_REFRESH_ENDPOINT, data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": rt,
            })
        if resp.status_code != 200:
            logger.warning("Google refresh returned HTTP %d", resp.status_code)
            return None

        tok = resp.json()
        new_ac = tok.get("access_token")
        new_rf = tok.get("refresh_token", rt)
        if new_ac:
            _update_token_file(
                os.environ.get("ACCOUNT_ID", "acc-1"),
                new_ac, new_rf
            )
            logger.info("Token refreshed successfully via Google")
            return new_ac
    except Exception as e:
        logger.warning("Google refresh failed: %s", e)
    return None

def _cloudcode_post(url: str, token: str) -> Optional[Dict[str, Any]]:
    """POST to a CloudCode internal endpoint and return the decoded JSON body."""
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "User-Agent": "antigravity-cli/1.2.9",
                },
                json={},
            )
        if resp.status_code != 200:
            logger.debug("CloudCode %s returned HTTP %d: %s", url.rsplit(":", 1)[-1], resp.status_code, resp.text[:200])
            return None
        return resp.json()
    except Exception as e:
        logger.debug("CloudCode probe %s failed: %s", url.rsplit(":", 1)[-1], e)
        return None

def _tier_from_summary_bucket(bucket: Dict[str, Any]) -> Dict[str, Any]:
    """Map a per-window quota bucket from retrieveUserQuotaSummary to our tier shape.

    A disabled window does not currently apply (e.g. the 5-hour window is
    irrelevant while the weekly limit is exhausted) — report it as full and
    active instead of copying the other window's numbers.
    """
    if bucket.get("disabled"):
        return {"percentage_remaining": 100.0, "refresh_in_human": "Active", "is_exhausted": False}
    frac = bucket.get("remainingFraction")
    pct = round(float(frac) * 100, 1) if isinstance(frac, (int, float)) else None
    reset = bucket.get("resetTime")
    return {
        "percentage_remaining": pct,
        "reset_time": reset,
        "refresh_in_human": _format_reset_delta(reset) if pct is not None else None,
        "is_exhausted": pct is not None and pct <= 0,
    }

_EMPTY_TIER = {"percentage_remaining": None, "refresh_in_human": None, "is_exhausted": False}

def _call_cloudcode_summary(token: str) -> Optional[Dict[str, Any]]:
    """Fetch the real weekly vs 5-hour windows from retrieveUserQuotaSummary."""
    data = _cloudcode_post(CLOUDCODE_SUMMARY_URL, token)
    if not data:
        return None

    cats: List[Dict[str, Any]] = []
    for group in data.get("groups", []):
        by_window: Dict[str, Dict[str, Any]] = {}
        for bucket in group.get("buckets") or []:
            window = (bucket.get("window") or "").strip().lower()
            if window in ("weekly", "5h") and window not in by_window:
                by_window[window] = bucket
        if not by_window:
            continue
        name = group.get("displayName") or "unknown"
        cats.append({
            "category_id": normalize_category_name(name),
            "category_name": name,
            "weekly_limit": _tier_from_summary_bucket(by_window["weekly"]) if "weekly" in by_window else dict(_EMPTY_TIER),
            "five_hour_limit": _tier_from_summary_bucket(by_window["5h"]) if "5h" in by_window else dict(_EMPTY_TIER),
        })

    if cats:
        logger.info("CloudCode summary returned %d groups with per-window quotas", len(cats))
        return {"categories": cats, "raw": data}
    return None

def _call_cloudcode(token: str) -> Optional[Dict[str, Any]]:
    """Legacy model-level probe (retrieveUserQuota). Fallback only: the model
    buckets carry a single effective window, so we map it to weekly and leave
    the 5-hour tier unknown rather than duplicating the same numbers."""
    try:
        data = _cloudcode_post(CLOUDCODE_URL, token)
        if not data:
            return None
        buckets: list = data.get("buckets", [])
        if not buckets:
            return None

        gemini_buckets = [b for b in buckets if "gemini" in b.get("modelId", "").lower()]
        claude_buckets = [b for b in buckets if
                          "claude" in b.get("modelId", "").lower()
                          or "gpt" in b.get("modelId", "").lower()]

        cats: List[Dict[str, Any]] = []

        if gemini_buckets:
            fracs = [b.get("remainingFraction", 1.0) for b in gemini_buckets
                     if b.get("remainingFraction") is not None]
            pct = round(min(fracs) * 100, 1) if fracs else 100.0
            reset = next((b.get("resetTime") for b in gemini_buckets if b.get("resetTime")), None)
            cats.append({
                "category_id": "gemini-models",
                "category_name": "Gemini Models",
                "weekly_limit": {
                    "percentage_remaining": pct,
                    "reset_time": reset,
                    "refresh_in_human": _format_reset_delta(reset),
                    "is_exhausted": pct <= 0,
                },
                "five_hour_limit": dict(_EMPTY_TIER),
            })

        if claude_buckets:
            fracs = [b.get("remainingFraction", 1.0) for b in claude_buckets
                     if b.get("remainingFraction") is not None]
            pct = round(min(fracs) * 100, 1) if fracs else 100.0
            reset = next((b.get("resetTime") for b in claude_buckets if b.get("resetTime")), None)
            cats.append({
                "category_id": "claude-and-gpt-models",
                "category_name": "Claude and GPT models",
                "weekly_limit": {
                    "percentage_remaining": pct,
                    "reset_time": reset,
                    "refresh_in_human": _format_reset_delta(reset),
                    "is_exhausted": pct <= 0,
                },
                "five_hour_limit": dict(_EMPTY_TIER),
            })

        if cats:
            logger.info("CloudCode API returned quota: %d categories", len(cats))
        return {"categories": cats, "raw": data}

    except Exception as e:
        logger.debug("CloudCode PA probe failed: %s", e)
        return None

class QuotaScraper:
    def __init__(self):
        pass

    def scrape(self) -> List[Dict[str, Any]]:
        acc_id = os.environ.get("ACCOUNT_ID", "acc-1")

        token = _read_access_token(acc_id)
        if not token:
            logger.warning("No access_token found — quota scraping disabled")
            return []

        result = _call_cloudcode_summary(token) or _call_cloudcode(token)

        if result is None:
            logger.info("CloudCode returned no data — attempting refresh")
            refreshed = _refresh_via_google(token)
            if refreshed:
                result = _call_cloudcode_summary(refreshed) or _call_cloudcode(refreshed)

        if result and "categories" in result:
            return result["categories"]

        logger.warning("Failed to scrape quota — no data from CloudCode or refresh")
        return []

def scrape() -> List[Dict[str, Any]]:
    """Convenience function for direct calls."""
    return QuotaScraper().scrape()
