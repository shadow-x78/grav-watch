# GravWatch - Application Settings (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "GravWatch"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/gravwatch.db")
    AGENT_API_KEY: str = os.getenv("AGENT_API_KEY", "gravwatch-agent-secret-key")
    MASTER_API_KEY: str = os.getenv("MASTER_API_KEY", "gravwatch-master-secret-key")


settings = Settings()
