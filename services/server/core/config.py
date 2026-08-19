# GravWatch - Core Application Configuration & Runtime Settings (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GravWatch"
    VERSION: str = "2.4.1"
    SERVER_PORT: int = 8000
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/gravwatch.db"
    AGENT_API_KEY: str = ""
    MASTER_API_KEY: str = ""
    DATA_DIR: str = "./data"
    HOST_DATA_DIR: str = "/home/shadow-x7/Projects/Tools/Python/GravWatch/data"
    PUBLIC_ORIGIN: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

def resolve_runtime_secrets() -> None:
    if not settings.AGENT_API_KEY:
        settings.AGENT_API_KEY = os.environ.get("AGENT_API_KEY", "gravwatch-agent-secret-key")

    if not settings.MASTER_API_KEY:
        settings.MASTER_API_KEY = os.environ.get("MASTER_API_KEY", "gravwatch-master-secret-key")
