# GravWatch - FastAPI Application Entrypoint (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from services.server.core.config import settings
    from services.server.core.database import init_db
    from services.server.api.router import api_router
except ImportError:
    try:
        from .core.config import settings
        from .core.database import init_db
        from .api.router import api_router
    except ImportError:
        from core.config import settings
        from core.database import init_db
        from api.router import api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gravwatch.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GravWatch Database...")
    await init_db()
    yield
    logger.info("Shutting down GravWatch Server...")


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Multi-account Google Antigravity CLI quota monitoring & telemetry engine",
        lifespan=lifespan
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router)
    return application


app = create_app()
