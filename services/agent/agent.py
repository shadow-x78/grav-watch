# GravWatch - Antigravity Agent Daemon (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import time
import signal
import logging
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

try:
    from services.agent.core.config import settings
    from services.agent.collector.scraper import QuotaScraper
except ImportError:
    from .core.config import settings
    from .collector.scraper import QuotaScraper

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger(f"gravwatch.agent.{settings.ACCOUNT_ID}")


class GravWatchAgent:
    def __init__(self):
        self.scraper = QuotaScraper()
        self.running = False

    def ingest_payload(self, payload: dict) -> bool:
        url = f"{settings.SERVER_URL.rstrip('/')}/api/v1/usage"
        headers = {
            "Content-Type": "application/json",
            "X-Agent-Key": settings.AGENT_API_KEY
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in [200, 201]:
                    logger.info("Successfully ingested usage snapshot to server (HTTP %d)", resp.status)
                    return True
                logger.error("Failed to ingest usage: HTTP %d", resp.status)
                return False
        except urllib.error.HTTPError as e:
            logger.error("HTTP error connecting to server: %s", e)
            return False
        except Exception as e:
            logger.error("Error connecting to server at %s: %s", url, e)
            return False

    def run_once(self):
        logger.info("Collecting Antigravity quota snapshot...")
        categories = self.scraper.scrape()

        payload = {
            "account_id": settings.ACCOUNT_ID,
            "account_label": settings.ACCOUNT_LABEL,
            "tier": settings.ACCOUNT_TIER,
            "categories": categories,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        self.ingest_payload(payload)

    def start(self):
        self.running = True
        logger.info("Starting GravWatch Agent for [%s] (Polling every %ds)", settings.ACCOUNT_ID, settings.POLL_INTERVAL_SECONDS)
        while self.running:
            try:
                self.run_once()
            except Exception as e:
                logger.error("Unexpected error in agent loop: %s", e)

            for _ in range(settings.POLL_INTERVAL_SECONDS):
                if not self.running:
                    break
                time.sleep(1)

    def stop(self):
        logger.info("Stopping GravWatch Agent for [%s]...", settings.ACCOUNT_ID)
        self.running = False


def main():
    agent = GravWatchAgent()

    def handle_signal(sig, frame):
        agent.stop()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    agent.start()


if __name__ == "__main__":
    main()
