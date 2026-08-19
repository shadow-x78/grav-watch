# GravWatch - Health Check API (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from fastapi import APIRouter
from datetime import datetime, timezone

try:
    from services.server.models.schemas import HealthResponse
except ImportError:
    from ..models.schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="gravwatch-server",
        timestamp=datetime.now(timezone.utc),
    )
