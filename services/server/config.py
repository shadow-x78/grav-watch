# GravWatch - Configuration Settings (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    AGENT_API_KEY: str = os.getenv("AGENT_API_KEY", "gravwatch-agent-secret-key")
    MASTER_API_KEY: str = os.getenv("MASTER_API_KEY", "gravwatch-master-secret-key")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/gravwatch.db")
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")
    ALERT_THRESHOLD_PERCENT: float = float(os.getenv("ALERT_THRESHOLD_PERCENT", "85.0"))

    class Config:
        case_sensitive = True


settings = Settings()
