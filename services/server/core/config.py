# GravWatch - Application Settings (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "GravWatch"
    VERSION: str = "2.2.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/gravwatch.db")
    AGENT_API_KEY: str = os.getenv("AGENT_API_KEY", "gravwatch-agent-secret-key")
    MASTER_API_KEY: str = os.getenv("MASTER_API_KEY", "gravwatch-master-secret-key")
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")

    # Google OAuth 2.0 Web Flow
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "681781215162-ggk47ep7sugvefa0vfvef6eg8e8egpka.apps.googleusercontent.com")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/callback")


settings = Settings()
