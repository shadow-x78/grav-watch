# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import subprocess
import os
import time
import signal
import logging
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

from services.agent.core.config import settings
from services.agent.collector.scraper import QuotaScraper

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
        }
        if settings.MASTER_API_KEY:
            headers["X-API-Key"] = settings.MASTER_API_KEY
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

            if self.running:
                time.sleep(settings.POLL_INTERVAL_SECONDS)

    def stop(self):
        self.running = False
        logger.info("Agent stopped")

if __name__ == "__main__":
    agent = GravWatchAgent()

    def handle_sigterm(signum, frame):
        agent.stop()

    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigterm)

    agent.start()
