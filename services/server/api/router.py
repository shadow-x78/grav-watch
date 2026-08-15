# GravWatch - Central API Router (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from fastapi import APIRouter
from .health import router as health_router
from .usage import router as usage_router
from .accounts import router as accounts_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(usage_router)
api_router.include_router(accounts_router)
