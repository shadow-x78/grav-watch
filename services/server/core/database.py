# GravWatch - Async SQLAlchemy Engine & Session Manager (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

try:
    from services.server.core.config import settings
    from services.server.models.db import Base
except ImportError:
    from .config import settings
    from ..models.db import Base

os.makedirs(settings.DATA_DIR, exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
