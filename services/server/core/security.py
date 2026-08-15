# GravWatch - API Authentication & Security (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from fastapi import HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from .config import settings

agent_key_header = APIKeyHeader(name="X-Agent-Key", auto_error=False)


async def get_current_agent(key: str = Security(agent_key_header)):
    if not key or key != settings.AGENT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Agent-Key header."
        )
    return key
