# GravWatch - Health API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from fastapi import APIRouter
from ..core.config import settings

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "gravwatch-server",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
