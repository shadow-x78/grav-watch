# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
from fastapi import APIRouter
from datetime import datetime, timezone

from services.server.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="gravwatch-server",
        timestamp=datetime.now(timezone.utc),
    )

