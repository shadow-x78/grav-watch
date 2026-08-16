# GravWatch - Google Cloud Quota Scraper & API Client (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import json
import logging
import requests

logger = logging.getLogger("gravwatch.agent.scraper")

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def load_credentials(account_id: str) -> dict | None:
    candidate_paths = [
        f"/root/.gemini/credentials.json",
        f"./data/{account_id}/credentials.json"
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not read credentials from {p}: {e}")
    return None


def fetch_google_quota(access_token: str) -> dict | None:
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        # Check token validity with Google
        user_res = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
        if user_res.status_code == 200:
            user_data = user_res.json()
            return {
                "authenticated": True,
                "email": user_data.get("email"),
                "name": user_data.get("name"),
                "picture": user_data.get("picture")
            }
        elif user_res.status_code == 401:
            logger.warning("Google Access Token has expired. Needs refresh.")
            return {"authenticated": False, "expired": True}
        else:
            logger.warning(f"Google API returned HTTP {user_res.status_code}: {user_res.text}")
            return None
    except Exception as e:
        logger.error(f"Error connecting to Google API: {e}")
        return None
