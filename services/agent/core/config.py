# ─────────────────────────────────────────────
# GravWatch - Agent Configuration (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import os

class AgentSettings:
    ACCOUNT_ID: str = os.getenv("ACCOUNT_ID", "acc-1")
    ACCOUNT_LABEL: str = os.getenv("ACCOUNT_LABEL", "Account 1")
    ACCOUNT_TIER: str = os.getenv("ACCOUNT_TIER", "Antigravity Starter")
    ACCOUNT_IS_FREE: bool = os.getenv("ACCOUNT_IS_FREE", "false").lower() == "true"
    SERVER_URL: str = os.getenv("SERVER_URL", "http://localhost:8000")
    MASTER_API_KEY: str = os.getenv("MASTER_API_KEY", "")
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "300"))
    GEMINI_DIR: str = os.getenv("GEMINI_DIR", os.path.expanduser("~/.gemini"))
    HOST_ANTIGRAVITY_STATE_PATH: str = os.getenv("HOST_ANTIGRAVITY_STATE_PATH", "/root/.config/antigravity/state.vscdb")

settings = AgentSettings()
