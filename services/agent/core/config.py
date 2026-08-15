# GravWatch - Agent Configuration (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AgentConfig:
    account_id: str = os.getenv("ACCOUNT_ID", "acc-1")
    account_label: str = os.getenv("ACCOUNT_LABEL", "Account 1")
    server_url: str = os.getenv("SERVER_URL", "http://server:8000")
    agent_api_key: str = os.getenv("AGENT_API_KEY", "gravwatch-agent-secret-key")
    poll_interval: int = int(os.getenv("POLL_INTERVAL_SECONDS", "300"))
    use_mock_fallback: bool = os.getenv("USE_MOCK_FALLBACK", "false").lower() in ("true", "1", "yes")


config = AgentConfig()
