# ─────────────────────────────────────────────
# GravWatch - Security & Validation Helpers (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import re
from fastapi import HTTPException, status

SAFE_ACCOUNT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
ACCOUNT_ID_PATTERN = SAFE_ACCOUNT_ID_PATTERN


def validate_account_id(account_id: str) -> str:
    if not account_id or not SAFE_ACCOUNT_ID_PATTERN.match(account_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid account_id [{account_id}]. Must be 1-64 alphanumeric, dash, or underscore characters.",
        )
    return account_id
