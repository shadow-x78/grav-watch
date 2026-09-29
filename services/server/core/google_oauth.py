# ─────────────────────────────────────────────
# GravWatch - Safe Token Persistence
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import os
import json
import logging
import httpx
import re
import time
from typing import Dict, Any, Optional

from services.server.core.config import settings, JETSKI_PRESET

logger = logging.getLogger("gravwatch.google_oauth")

GOOGLE_USERINFO_URL = settings.GOOGLE_USERINFO_URL
GOOGLE_TOKEN_URL = settings.GOOGLE_TOKEN_URL
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET

ACCOUNT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")

def find_refresh_token_file(account_id: str) -> Optional[str]:
    """Find a file containing a valid refresh_token for the given account."""
    candidates = [
        os.path.join(settings.DATA_DIR, account_id, ".gemini", "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(settings.DATA_DIR, account_id, "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(settings.DATA_DIR, account_id, ".gemini", "antigravity-cli", "credentials.json"),
        os.path.join(settings.DATA_DIR, account_id, "antigravity-cli", "credentials.json"),
    ]
    for path in candidates:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read().strip()
            if raw.startswith("{"):
                data = json.loads(raw)
                token_obj = data.get("token", {})
                rt = token_obj.get("refresh_token") or token_obj.get("refreshToken") or data.get("refresh_token") or data.get("refreshToken")
                if rt and len(rt) > 10:
                    logger.info("Found refresh token in %s", path)
                    return path
            else:
                # Plain text might be a refresh token (starts with "1//" or "4//")
                if raw.startswith("1//") or raw.startswith("4//"):
                    logger.info("Found refresh token in %s (plain text)", path)
                    return path
        except Exception:
            pass
    return None


def find_refresh_token(account_id: str) -> Optional[str]:
    """Read a refresh token value for the given account."""
    path = find_refresh_token_file(account_id)
    if not path:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read().strip()
        if raw.startswith("{"):
            data = json.loads(raw)
            token_obj = data.get("token", {})
            return token_obj.get("refresh_token") or token_obj.get("refreshToken") or data.get("refresh_token") or data.get("refreshToken")
        return raw
    except Exception:
        return None


def save_refresh_token(path: str, new_token: str) -> None:
    """Update a refresh_token in the given file without corrupting other data."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()
        if raw.startswith("{"):
            data = json.loads(raw)
            if "token" in data and isinstance(data["token"], dict):
                data["token"]["refresh_token"] = new_token
            data["refresh_token"] = new_token
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        else:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_token)
    except Exception as e:
        logger.warning("Could not save refresh token to %s: %s", path, e)


def refresh_oauth_token(account_id: str) -> Optional[Dict[str, Any]]:
    """Try to refresh a Google OAuth access_token using stored refresh_token.
    Returns dict with access_token, refresh_token, expires_at on success, or None."""
    refresh_token = find_refresh_token(account_id)
    if not refresh_token:
        logger.info("No refresh token found for %s", account_id)
        return None

    rt_file = find_refresh_token_file(account_id)
    logger.info("Trying to refresh token for %s (refresh_token starting with: %s...)",
                account_id, refresh_token[:20])

    try:
        client = httpx.Client(timeout=10.0)
        resp = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
        )
        client.close()
    except Exception as e:
        logger.warning("Token refresh request failed for %s: %s", account_id, e)
        return None

    if resp.status_code != 200:
        logger.warning("Token refresh returned HTTP %d for %s", resp.status_code, account_id)
        return None

    try:
        token_data = resp.json()
        new_access = token_data.get("access_token")
        new_refresh = token_data.get("refresh_token") or refresh_token
        expires_in = int(token_data.get("expires_in", 3599))

        if not new_access:
            return None

        # Save the new refresh_token if provided
        if rt_file and new_refresh != refresh_token:
            save_refresh_token(rt_file, new_refresh)

        logger.info("Successfully refreshed OAuth token for %s (expires in %ds)", account_id, expires_in)
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "expires_in": expires_in,
        }
    except Exception:
        return None


def _validate_account_id(account_id: str) -> str:
    if not account_id or not ACCOUNT_ID_PATTERN.match(account_id):
        raise ValueError(f"Invalid account_id [{account_id}]. Must be 1-64 alphanumeric, dash, or underscore characters.")
    return account_id


def safe_write_credentials(account_id: str, data: Dict[str, Any]) -> str:
    account_id = _validate_account_id(account_id)
    target_dir = os.path.abspath(os.path.join(settings.DATA_DIR, account_id))
    os.makedirs(target_dir, mode=0o777, exist_ok=True)
    target_file = os.path.join(target_dir, "credentials.json")

    try:
        flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
        fd = os.open(target_file, flags, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.chmod(target_file, 0o600)
    except Exception as e:
        logger.warning("Could not write credentials file %s: %s", target_file, e)

    access_token = data.get("access_token")
    if access_token:
        real_at = access_token
        real_rt = data.get("refresh_token") or ""
        real_exp = "2030-01-01T00:00:00Z"
        real_method = "consumer"

        # agy may have written a token file with a refresh_token during its
        # own login flow. Never clobber it with an empty one (e.g. when a
        # bare ya29.* token is pasted through exchange-code).
        if not real_rt:
            try:
                with open(os.path.join(target_dir, ".gemini", "antigravity-cli", "antigravity-oauth-token"), "r", encoding="utf-8") as ef:
                    existing = json.load(ef)
                    existing_rt = (existing.get("token", {}) or {}).get("refresh_token") or ""
                    if existing_rt:
                        real_rt = existing_rt
                        existing_tok = existing.get("token", {}) or {}
                        if existing_tok.get("expiry"):
                            real_exp = existing_tok["expiry"]
                        real_method = existing.get("auth_method") or real_method
                        logger.info("Preserved existing refresh_token for %s", account_id)
            except Exception:
                pass

        if isinstance(access_token, str) and access_token.strip().startswith("{"):
            try:
                parsed = json.loads(access_token)
                t_block = parsed.get("token", {}) if isinstance(parsed.get("token"), dict) else parsed
                real_at = t_block.get("access_token") or real_at
                real_rt = t_block.get("refresh_token") or real_rt
                real_exp = t_block.get("expiry") or real_exp
                real_method = parsed.get("auth_method") or real_method
            except Exception:
                pass

        # Persist refresh_token to all token files (needed for CloudCode refresh).
        # If the token file already holds a REAL agy-issued expiry (from agy's own
        # login flow), keep it — writing a fake 2030 expiry stops agy from refreshing
        # (it trusts the file and never re-auths).
        dirs = [
            os.path.join(target_dir, ".gemini", "antigravity-cli"),
            os.path.join(target_dir, "antigravity-cli"),
        ]
        for d in dirs:
            try:
                existing_path = os.path.join(d, "antigravity-oauth-token")
                if os.path.exists(existing_path):
                    with open(existing_path, "r", encoding="utf-8") as ef:
                        existing = json.load(ef)
                    ex_tok = existing.get("token", {}) or {}
                    ex_exp = ex_tok.get("expiry") or ""
                    if ex_exp and not ex_exp.startswith("2030"):
                        real_exp = ex_exp
                        break
            except Exception:
                pass
        for d in dirs:
            try:
                os.makedirs(d, mode=0o777, exist_ok=True)
                token_file = os.path.join(d, "antigravity-oauth-token")
                token_payload = {
                    "token": {
                        "access_token": real_at,
                        "token_type": "Bearer",
                        "refresh_token": real_rt,
                        "expiry": real_exp,
                    },
                    "auth_method": real_method,
                }
                with open(token_file, "w", encoding="utf-8") as tf:
                    json.dump(token_payload, tf)
                os.chmod(token_file, 0o600)

                # Also save refresh_token as plain_text in a known location
                rt_file = os.path.join(d, "refresh_token")
                if real_rt:
                    with open(rt_file, "w", encoding="utf-8") as rf:
                        rf.write(real_rt)
                    os.chmod(rt_file, 0o600)

                pbtxt = os.path.join(d, "jetski_state.pbtxt")
                if not os.path.exists(pbtxt):
                    with open(pbtxt, "w", encoding="utf-8") as pf:
                        pf.write(JETSKI_PRESET)
                    os.chmod(pbtxt, 0o644)

                settings_json = os.path.join(d, "settings.json")
                with open(settings_json, "w", encoding="utf-8") as sf:
                    sf.write('{\n  "trustedWorkspaces": [\n    "/app",\n    "/root",\n    "/",\n    "/tmp"\n  ]\n}\n')
                os.chmod(settings_json, 0o644)

                cache_d = os.path.join(d, "cache")
                os.makedirs(cache_d, mode=0o700, exist_ok=True)
                onboard_json = os.path.join(cache_d, "onboarding.json")
                with open(onboard_json, "w", encoding="utf-8") as of:
                    json.dump({
                        "consumerOnboardingComplete": True,
                        "enterpriseOnboardingComplete": True,
                        "onboardingComplete": True
                    }, of, indent=2)
                os.chmod(onboard_json, 0o644)
            except Exception as e:
                logger.warning("Could not write oauth token/config files in %s: %s", d, e)

        # Auto-refresh if token is stale AND we have a refresh_token
        if real_rt and len(real_rt) > 10:
            # Try to validate and refresh immediately
            refresh_result = refresh_oauth_token(account_id)
            if refresh_result:
                logger.info("Auto-refreshed token for %s after credential write", account_id)
                # Update the payload with fresh token
                data["access_token"] = refresh_result["access_token"]
                data["refresh_token"] = refresh_result.get("refresh_token", real_rt)
                data["expires_at"] = (
                    data.get("expires_at", 0) or 
                    (refresh_result.get("expires_in", 3599) + int(time.time()))
                )
                # Re-save with fresh token
                try:
                    with open(target_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2)
                except Exception:
                    pass
            else:
                logger.warning("Auto-refresh failed for %s — existing token may be stale", account_id)
        elif not real_rt:
            logger.info("No refresh_token saved for %s (empty/not provided). Token may expire.", account_id)

    return target_file


def load_account_credentials(account_id: str) -> Optional[Dict[str, Any]]:
    account_id = _validate_account_id(account_id)
    target_file = os.path.abspath(os.path.join(settings.DATA_DIR, account_id, "credentials.json"))
    creds: Dict[str, Any] = {}
    if os.path.exists(target_file):
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                creds = json.load(f) or {}
        except Exception as e:
            logger.warning("Could not read credentials for %s: %s", account_id, e)

    # An explicit login-flow write marks status "authenticated" together with
    # a real token. Email can be unavailable because Google rejects identity
    # endpoints for first-party agy tokens — that must not hide the account.
    if creds.get("status") == "authenticated" and (creds.get("access_token") or creds.get("email")):
        return creds

    return None


def delete_account_credentials(account_id: str) -> bool:
    account_id = _validate_account_id(account_id)
    base = os.path.abspath(os.path.join(settings.DATA_DIR, account_id))
    targets = [
        os.path.join(base, "credentials.json"),
        os.path.join(base, ".gemini", "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(base, "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(base, ".gemini", "antigravity-cli", "refresh_token"),
        os.path.join(base, "antigravity-cli", "refresh_token"),
    ]
    removed = False
    for path in targets:
        if os.path.exists(path):
            try:
                os.remove(path)
                removed = True
            except Exception as e:
                logger.warning("Could not delete %s: %s", path, e)
    return removed


async def get_user_info(access_token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Userinfo request failed (HTTP {resp.status_code}): {resp.text}")
        return resp.json()