# GravWatch - Security & Authentication Helpers (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import re
import secrets
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

try:
    from services.server.core.config import settings
except ImportError:
    from .config import settings

SAFE_ACCOUNT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
ACCOUNT_ID_PATTERN = SAFE_ACCOUNT_ID_PATTERN

api_key_header = APIKeyHeader(name="X-Agent-Key", auto_error=False)
master_key_header = APIKeyHeader(name="X-Master-Key", auto_error=False)


def validate_account_id(account_id: str) -> str:
    if not account_id or not SAFE_ACCOUNT_ID_PATTERN.match(account_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid account_id [{account_id}]. Must be 1-64 alphanumeric, dash, or underscore characters.",
        )
    return account_id


def get_current_agent(api_key: str = Security(api_key_header)) -> str:
    expected_key = settings.AGENT_API_KEY
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AGENT_API_KEY is not configured on the server.",
        )
    if not api_key or not secrets.compare_digest(api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Agent-Key header.",
        )
    return api_key


def require_master_key(master_key: str = Security(master_key_header)) -> str:
    expected_key = settings.MASTER_API_KEY
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MASTER_API_KEY is not configured on the server.",
        )
    if not master_key or not secrets.compare_digest(master_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Master-Key header.",
        )
    return master_key
