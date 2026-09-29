# ─────────────────────────────────────────────
# GravWatch - Antigravity Agent Daemon (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import subprocess
import os
import time
import signal
import logging
import json
import threading
import urllib.request
import urllib.error
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
import re
import pty
import select
import struct
import fcntl
import termios
import urllib.parse

from services.agent.core.config import settings
from services.agent.collector.scraper import QuotaScraper

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger(f"gravwatch.agent.{settings.ACCOUNT_ID}")


def _strip_ansi(text: str) -> str:
    text = re.sub(r'\x1b\[[^a-zA-Z]*[a-zA-Z]', '', text)
    text = re.sub(r'\x1b\][^\x07\x1b]*[\x07\x1b]', '', text)
    text = re.sub(r'\x1b[PX^_][^\x07\x1b]*[\x07\x1b]', '', text)
    return text


def _extract_google_oauth_url(text: str) -> str | None:
    lines = text.split('\n')
    joined_text = ''
    for i, line in enumerate(lines):
        stripped = line.strip()
        if i > 0 and joined_text and (joined_text.endswith('=') or joined_text.endswith('&')) and stripped:
            joined_text += stripped
        else:
            if joined_text:
                joined_text += '\n'
            joined_text += line

    joined_no_newlines = joined_text.replace('\n', '').replace(' ', '')

    urls = re.findall(r'https://accounts\.google\.com/o/oauth2/auth\?[a-zA-Z0-9_.~%&=-]+', joined_no_newlines)
    for url in urls:
        if url.endswith('&response_type') or url.endswith('&response_type%3D'):
            url = url + '=code'
        elif url.endswith('&response_type='):
            url = url + 'code'
        elif '&response_type=' in url and not re.search(r'response_type=[^&]*code', url):
            url = re.sub(r'response_type=[^&]*', 'response_type=code', url)

        if 'response_type=code' in url:
            if 'scope=' not in url or url.endswith('&scope=') or re.search(r'&scope=[^&]*$', url):
                required_scopes = (
                    "https://www.googleapis.com/auth/cloud-platform "
                    "https://www.googleapis.com/auth/userinfo.email "
                    "https://www.googleapis.com/auth/userinfo.profile "
                    "https://www.googleapis.com/auth/cclog "
                    "https://www.googleapis.com/auth/experimentsandconfigs "
                    "https://www.googleapis.com/auth/aicode "
                    "openid"
                )
                url = url + "&scope=" + urllib.parse.quote(required_scopes)
            return url.strip()

    osc_matches = re.findall(r"\x1b\]8;[^;]*;(https://accounts\.google\.com/o/oauth2/auth\?[^\x07\r\n\x1b]+)", text)
    if osc_matches:
        url = osc_matches[0].strip()
        if url.endswith('&response_type') or url.endswith('&response_type%3D'):
            url = url + '=code'
        elif url.endswith('&response_type='):
            url = url + 'code'
        if 'scope=' not in url:
            required_scopes = (
                "https://www.googleapis.com/auth/cloud-platform "
                "https://www.googleapis.com/auth/userinfo.email "
                "https://www.googleapis.com/auth/userinfo.profile "
                "https://www.googleapis.com/auth/cclog "
                "https://www.googleapis.com/auth/experimentsandconfigs "
                "https://www.googleapis.com/auth/aicode "
                "openid"
            )
            url = url + "&scope=" + urllib.parse.quote(required_scopes)
        return url

    state_match = re.search(r"(https://accounts\.google\.com/o/oauth2/auth\?[^\s\x1b\x07]+state=[a-zA-Z0-9_-]+)", text)
    if state_match:
        url = state_match.group(1).strip()
        if url.endswith('&response_type') or url.endswith('&response_type%3D'):
            url = url + '=code'
        elif url.endswith('&response_type='):
            url = url + 'code'
        if 'scope=' not in url:
            required_scopes = (
                "https://www.googleapis.com/auth/cloud-platform "
                "https://www.googleapis.com/auth/userinfo.email "
                "https://www.googleapis.com/auth/userinfo.profile "
                "https://www.googleapis.com/auth/cclog "
                "https://www.googleapis.com/auth/experimentsandconfigs "
                "https://www.googleapis.com/auth/aicode "
                "openid"
            )
            url = url + "&scope=" + urllib.parse.quote(required_scopes)
        return url

    urls = re.findall(r'https://accounts\.google\.com/o/oauth2/auth\?[a-zA-Z0-9_.~%&=-]+', text)
    if urls:
        url = urls[0].strip()
        if url.endswith('&response_type') or url.endswith('&response_type%3D'):
            url = url + '=code'
        elif url.endswith('&response_type='):
            url = url + 'code'
        if 'scope=' not in url:
            required_scopes = (
                "https://www.googleapis.com/auth/cloud-platform "
                "https://www.googleapis.com/auth/userinfo.email "
                "https://www.googleapis.com/auth/userinfo.profile "
                "https://www.googleapis.com/auth/cclog "
                "https://www.googleapis.com/auth/experimentsandconfigs "
                "https://www.googleapis.com/auth/aicode "
                "openid"
            )
            url = url + "&scope=" + urllib.parse.quote(required_scopes)
        return url

    return None


def run_agy_auth_flow(timeout_seconds: float = 60.0) -> dict:
    """Run agy CLI PTY flow to capture Google OAuth URL."""
    cmd = ["/usr/local/bin/agy"]
    env = {**os.environ, "TERM": "xterm-256color"}

    master_fd, slave_fd = pty.openpty()
    fcntl.ioctl(slave_fd, termios.TIOCSWINSZ, struct.pack("HHHH", 24, 80, 0, 0))

    proc = subprocess.Popen(
        cmd,
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        close_fds=True,
        env=env,
    )
    os.close(slave_fd)

    output = b""
    auth_url = None
    start_time = time.time()
    last_enter_time = 0.0

    while time.time() - start_time < timeout_seconds:
        r, _, _ = select.select([master_fd], [], [], 0.3)
        if r:
            try:
                chunk = os.read(master_fd, 2048)
                if not chunk:
                    break
                output += chunk
                text = output.decode("utf-8", errors="ignore")
                clean_text = _strip_ansi(text)
                recent_text = clean_text[-500:] if len(clean_text) > 500 else clean_text

                now = time.time()
                if ("Choose your color scheme" in recent_text or "terminal" in recent_text or "color scheme" in recent_text or "[Next]" in recent_text or "Welcome to" in recent_text) and (now - last_enter_time > 0.8):
                    time.sleep(0.2)
                    os.write(master_fd, b"\r\n")
                    last_enter_time = now
                    logger.info("Auto-advanced onboarding screen")

                if ("Select login method" in recent_text or "Google OAuth" in recent_text) and (now - last_enter_time > 0.8):
                    time.sleep(0.2)
                    os.write(master_fd, b"\r\n")
                    last_enter_time = now
                    logger.info("Auto-selected Google OAuth menu")

                if ("available models" in recent_text.lower() or "model:" in recent_text.lower() or "quota" in recent_text.lower()) and (now - start_time > 10.0):
                    logger.info("agy CLI already authenticated (main TUI detected)")
                    return {"already_authenticated": True}

                if "https://accounts.google.com" in recent_text:
                    found = _extract_google_oauth_url(clean_text)
                    if found:
                        auth_url = found
                        logger.info("Captured Google OAuth URL")
                        break
            except Exception as e:
                logger.warning("Error reading from agy PTY: %s", e)
                break
        else:
            now = time.time()
            if not auth_url and (now - start_time > 1.5) and (now - last_enter_time > 1.0):
                os.write(master_fd, b"\r\n")
                last_enter_time = now

    if auth_url:
        return {"auth_url": auth_url}
    
    if auth_url == "ALREADY_AUTHENTICATED":
        return {"already_authenticated": True}

    raise RuntimeError(f"Could not extract Google Auth URL from agy CLI: {output.decode('utf-8', errors='ignore')}")


class AuthFlowHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/auth/start":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            try:
                result = run_agy_auth_flow()
                self.wfile.write(json.dumps(result).encode())
            except Exception as e:
                self.send_response(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        elif self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        logger.info("%s - %s", self.address_string(), format % args)


class GravWatchAgent:
    def __init__(self):
        self.scraper = QuotaScraper()
        self.running = False

    def ingest_payload(self, payload: dict) -> bool:
        url = f"{settings.SERVER_URL.rstrip('/')}/api/v1/usage"
        headers = {
            "Content-Type": "application/json",
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

            if self.running:
                time.sleep(settings.POLL_INTERVAL_SECONDS)

    def stop(self):
        logger.info("Stopping GravWatch Agent for [%s]...", settings.ACCOUNT_ID)
        self.running = False


def main():
    agent = GravWatchAgent()

    # Start HTTP server for auth flow in background
    auth_port = int(os.environ.get("AGENT_AUTH_PORT", "8081"))
    auth_server = HTTPServer(("0.0.0.0", auth_port), AuthFlowHandler)
    auth_thread = threading.Thread(target=auth_server.serve_forever, daemon=True)
    auth_thread.start()
    logger.info("Auth flow HTTP server started on port %d", auth_port)

    def handle_signal(sig, frame):
        agent.stop()
        auth_server.shutdown()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    agent.start()


if __name__ == "__main__":
    main()

