# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
from fastapi import APIRouter, Depends

from services.server.api.health import router as health_router
from services.server.api.usage import router as usage_router
from services.server.api.auth import router as auth_router
from services.server.core.security import require_auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(usage_router, dependencies=[Depends(require_auth)])
api_router.include_router(auth_router, dependencies=[Depends(require_auth)])

