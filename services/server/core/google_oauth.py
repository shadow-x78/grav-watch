# GravWatch - Google Identity & Safe Token Persistence (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import secrets
import hashlib
import base64
import urllib.parse
import httpx
from typing import Dict, Any, Optional

try:
    from services.server.core.config import settings
except ImportError:
    from .config import settings

logger = logging.getLogger("gravwatch.google_oauth")

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://antigravity.google/oauth-callback"
GOOGLE_SCOPES = (
    "https://www.googleapis.com/auth/cloud-platform "
    "https://www.googleapis.com/auth/userinfo.email "
    "https://www.googleapis.com/auth/userinfo.profile "
    "https://www.googleapis.com/auth/cclog "
    "https://www.googleapis.com/auth/experimentsandconfigs "
    "https://www.googleapis.com/auth/aicode "
    "openid"
)

def _get_verifiers_file() -> str:
    return os.path.join(settings.DATA_DIR, ".pkce_verifiers.json")


def _load_verifiers() -> Dict[str, str]:
    vf = _get_verifiers_file()
    if os.path.exists(vf):
        try:
            with open(vf, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_verifier(key: str, val: str):
    vmap = _load_verifiers()
    vmap[key] = val
    vf = _get_verifiers_file()
    try:
        os.makedirs(settings.DATA_DIR, mode=0o777, exist_ok=True)
        with open(vf, "w", encoding="utf-8") as f:
            json.dump(vmap, f)
    except Exception:
        pass


def generate_pkce_auth_url(account_id: str) -> str:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    state = secrets.token_urlsafe(32)

    _save_verifier(account_id, verifier)
    _save_verifier(state, verifier)

    params = {
        "access_type": "offline",
        "client_id": GOOGLE_CLIENT_ID,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "prompt": "consent",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "state": state,
    }
    return "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params)


async def exchange_pkce_code(account_id: str, code: str) -> Dict[str, Any]:
    vmap = _load_verifiers()
    verifier = vmap.get(account_id)
    payload = {
        "client_id": GOOGLE_CLIENT_ID,
        "code": code.strip(),
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI,
    }
    if verifier:
        payload["code_verifier"] = verifier

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data=payload)
        if resp.status_code != 200:
            logger.warning("Google Token endpoint returned HTTP %s: %s", resp.status_code, resp.text)
            raise RuntimeError(f"Token exchange failed (HTTP {resp.status_code}): {resp.text}")
        return resp.json()


def safe_write_credentials(account_id: str, data: Dict[str, Any]) -> str:
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

        JETSKI_PRESET = """post_onboarding:  {
  completed_steps:  POST_ONBOARDING_STEP_TYPE_COLOR_SCHEME
  completed_steps:  POST_ONBOARDING_STEP_TYPE_MANAGER_WELCOME
  completed_steps:  POST_ONBOARDING_STEP_TYPE_USAGE_MODE
  completed_steps:  POST_ONBOARDING_STEP_TYPE_AGENT_CONFIGURATION
  completed_steps:  POST_ONBOARDING_STEP_TYPE_ADD_WORKSPACE
}
installation_uuid:  "98d027cc-5310-4b0e-a832-fab3183df8b7"
migrations:  { key:  3 value:  MIGRATION_STATUS_COMPLETED }
migrations:  { key:  4 value:  MIGRATION_STATUS_COMPLETED }
migrations:  { key:  5 value:  MIGRATION_STATUS_COMPLETED }
"""

        dirs = [
            os.path.join(target_dir, ".gemini", "antigravity-cli"),
            os.path.join(target_dir, "antigravity-cli"),
        ]
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
                os.chmod(token_file, 0o666)

                pbtxt = os.path.join(d, "jetski_state.pbtxt")
                with open(pbtxt, "w", encoding="utf-8") as pf:
                    pf.write(JETSKI_PRESET)
                os.chmod(pbtxt, 0o666)

                settings_json = os.path.join(d, "settings.json")
                with open(settings_json, "w", encoding="utf-8") as sf:
                    sf.write('{\n  "trustedWorkspaces": [\n    "/app",\n    "/root",\n    "/",\n    "/tmp"\n  ]\n}\n')
                os.chmod(settings_json, 0o666)

                cache_d = os.path.join(d, "cache")
                os.makedirs(cache_d, mode=0o777, exist_ok=True)
                onboard_json = os.path.join(cache_d, "onboarding.json")
                with open(onboard_json, "w", encoding="utf-8") as of:
                    json.dump({
                        "consumerOnboardingComplete": True,
                        "enterpriseOnboardingComplete": True,
                        "onboardingComplete": True
                    }, of, indent=2)
                os.chmod(onboard_json, 0o666)
            except Exception as e:
                logger.warning("Could not write oauth token/config files in %s: %s", d, e)

    return target_file


def load_account_credentials(account_id: str) -> Optional[Dict[str, Any]]:
    target_file = os.path.abspath(os.path.join(settings.DATA_DIR, account_id, "credentials.json"))
    creds: Dict[str, Any] = {}
    if os.path.exists(target_file):
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                creds = json.load(f) or {}
        except Exception as e:
            logger.warning("Could not read credentials for %s: %s", account_id, e)

    if creds.get("email"):
        return creds

    candidate_tokens = [
        os.path.join(settings.DATA_DIR, account_id, ".gemini", "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(settings.DATA_DIR, account_id, "antigravity-cli", "antigravity-oauth-token"),
    ]
    access_token = None
    for cp in candidate_tokens:
        if os.path.exists(cp):
            try:
                with open(cp, "r", encoding="utf-8") as tf:
                    raw = tf.read().strip()
                    if raw.startswith("{"):
                        t_data = json.loads(raw)
                        access_token = t_data.get("token", {}).get("access_token") or t_data.get("access_token")
                    elif not raw.startswith("4/0A"):
                        access_token = raw
                if access_token:
                    break
            except Exception:
                pass

    if access_token:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code == 200:
                    u_data = resp.json()
                    creds["email"] = u_data.get("email")
                    creds["name"] = u_data.get("name")
                    creds["picture"] = u_data.get("picture")
                    creds["status"] = "authenticated"
                    creds["account_id"] = account_id
                    creds["access_token"] = access_token
                    safe_write_credentials(account_id, creds)
                    return creds
        except Exception as e:
            logger.debug("Failed resolving userinfo for %s: %s", account_id, e)

    return creds if creds else None


def delete_account_credentials(account_id: str) -> bool:
    target_file = os.path.abspath(os.path.join(settings.DATA_DIR, account_id, "credentials.json"))
    if os.path.exists(target_file):
        try:
            os.remove(target_file)
            return True
        except Exception as e:
            logger.warning("Could not delete credentials for %s: %s", account_id, e)
            return False
    return False


async def get_user_info(access_token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Userinfo request failed (HTTP {resp.status_code}): {resp.text}")
        return resp.json()
