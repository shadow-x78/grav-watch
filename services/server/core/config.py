# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    PROJECT_NAME: str = "GravWatch"
    VERSION: str = "2.7.0"
    SERVER_PORT: int = 8000
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/gravwatch.db"
    DATA_DIR: str = "./data"
    HOST_DATA_DIR: str = "./data"
    PUBLIC_ORIGIN: str = "http://localhost:8000"
    POLL_INTERVAL_SECONDS: int = 20
    MASTER_API_KEY: str = os.getenv("MASTER_API_KEY", "gravwatch_default_key_change_me")
    API_BIND_HOST: str = os.getenv("API_BIND_HOST", "127.0.0.1")

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "not-set")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "not-set")
    GOOGLE_REDIRECT_URI: str = "https://antigravity.google/oauth-callback"
    GOOGLE_AUTH_BASE: str = "https://accounts.google.com/o/oauth2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL: str = "https://www.googleapis.com/oauth2/v3/userinfo"
    GOOGLE_SCOPES: str = (
        "https://www.googleapis.com/auth/cloud-platform "
        "https://www.googleapis.com/auth/userinfo.email "
        "https://www.googleapis.com/auth/userinfo.profile "
        "https://www.googleapis.com/auth/cclog "
        "https://www.googleapis.com/auth/experimentsandconfigs "
        "https://www.googleapis.com/auth/aicode "
        "openid"
    )

settings = Settings()

JETSKI_PRESET = """post_onboarding:  {
  completed_steps:  POST_ONBOARDING_STEP_TYPE_MANAGER_WELCOME
  completed_steps:  POST_ONBOARDING_STEP_TYPE_USAGE_MODE
  completed_steps:  POST_ONBOARDING_STEP_TYPE_AGENT_CONFIGURATION
  completed_steps:  POST_ONBOARDING_STEP_TYPE_ADD_WORKSPACE
}
installation_uuid:  "98d027cc-5310-4b0e-a832-fab3183df8b7"
migrations:  {
  key:  3
  value:  MIGRATION_STATUS_COMPLETED
}
migrations:  {
  key:  4
  value:  MIGRATION_STATUS_COMPLETED
}
migrations:  {
  key:  5
  value:  MIGRATION_STATUS_COMPLETED
}
"""
