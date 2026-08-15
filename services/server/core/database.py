# GravWatch - Database Engine & Session Management (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite"):
    db_path = db_url.replace("sqlite+aiosqlite:///", "")
    if db_path.startswith("./") or db_path.startswith("../"):
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with async_session() as session:
        yield session
