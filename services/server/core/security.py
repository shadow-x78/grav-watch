# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import hmac
import os
import re
from fastapi import HTTPException, Request, status

from services.server.core.config import settings

SAFE_ACCOUNT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
ACCOUNT_ID_PATTERN = SAFE_ACCOUNT_ID_PATTERN

def validate_account_id(account_id: str) -> str:
    if not account_id or not SAFE_ACCOUNT_ID_PATTERN.match(account_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid account_id [{account_id}]. Must be 1-64 alphanumeric, dash, or underscore characters.",
        )
    return account_id

def require_auth(request: Request) -> None:
    master_key = settings.MASTER_API_KEY
    if not master_key:
        return
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
        if hmac.compare_digest(token, master_key):
            return
    api_key = request.headers.get("X-API-Key", "")
    if api_key and hmac.compare_digest(api_key, master_key):
        return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
