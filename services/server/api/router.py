# GravWatch - Central API Router (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from fastapi import APIRouter

try:
    from services.server.api.health import router as health_router
    from services.server.api.usage import router as usage_router
    from services.server.api.accounts import router as accounts_router
    from services.server.api.auth import router as auth_router
    from services.server.api.prompt import router as prompt_router
except ImportError:
    from .health import router as health_router
    from .usage import router as usage_router
    from .accounts import router as accounts_router
    from .auth import router as auth_router
    from .prompt import router as prompt_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(usage_router)
api_router.include_router(accounts_router)
api_router.include_router(auth_router)
api_router.include_router(prompt_router)
