# GravWatch - Google Antigravity CLI PTY Automation Bridge (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import pty
import re
import time
import fcntl
import shutil
import termios
import struct
import select
import logging
import subprocess
from dataclasses import dataclass
from typing import Optional, Dict, Any

try:
    from services.server.core.config import settings
except ImportError:
    from .config import settings

logger = logging.getLogger("gravwatch.agy_bridge")

JETSKI_PRESET = """post_onboarding: {
  completed_steps: POST_ONBOARDING_STEP_TYPE_COLOR_SCHEME
  completed_steps: POST_ONBOARDING_STEP_TYPE_MANAGER_WELCOME
  completed_steps: POST_ONBOARDING_STEP_TYPE_USAGE_MODE
  completed_steps: POST_ONBOARDING_STEP_TYPE_AGENT_CONFIGURATION
  completed_steps: POST_ONBOARDING_STEP_TYPE_ADD_WORKSPACE
}
installation_uuid: "afd4ccce-a399-4aa2-8ffc-7c468903a876"
migrations: { key: 3 value: MIGRATION_STATUS_COMPLETED }
migrations: { key: 4 value: MIGRATION_STATUS_COMPLETED }
migrations: { key: 5 value: MIGRATION_STATUS_COMPLETED }
"""


@dataclass
class ActiveAgyLoginSession:
    account_id: str
    proc: subprocess.Popen
    master_fd: int
    auth_url: str
    acc_home: str
    created_at: float
    state: str = "waiting_for_code"


_active_sessions: Dict[str, ActiveAgyLoginSession] = {}


def _get_agy_command(account_id: str) -> list[str]:
    if os.path.exists("/usr/local/bin/agy"):
        return ["/usr/local/bin/agy"]
    return ["docker", "exec", "-it", "-e", "TERM=xterm-256color", f"gravwatch-{account_id}", "agy"]


def _extract_google_oauth_url(text: str) -> Optional[str]:
    osc_matches = re.findall(r"\x1b\]8;[^;]*;(https://accounts\.google\.com/o/oauth2/auth\?[^\x07\r\n]+)\x07", text)
    if osc_matches:
        return osc_matches[0].strip()

    state_match = re.search(r"(https://accounts\.google\.com/o/oauth2/auth\?[^\s\x1b\x07]+state=[a-zA-Z0-9_-]+)", text)
    if state_match:
        return state_match.group(1).strip()

    urls = re.findall(r"https://accounts\.google\.com/o/oauth2/auth\?[a-zA-Z0-9_.~%&=-]+", text)
    if urls:
        return urls[0].strip()

    return None


def _seed_onboarding_state(acc_home: str):
    dirs = [
        os.path.join(acc_home, ".gemini", "antigravity-cli"),
        os.path.join(acc_home, "antigravity-cli"),
    ]
    for d in dirs:
        try:
            os.makedirs(d, mode=0o777, exist_ok=True)
            settings_file = os.path.join(d, "settings.json")
            tmp_settings = settings_file + ".tmp"
            with open(tmp_settings, "w", encoding="utf-8") as f:
                json.dump({
                    "trustedWorkspaces": [
                        "/app",
                        "/root",
                        "/",
                        "/tmp"
                    ]
                }, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp_settings, settings_file)
        except Exception:
            pass


def start_agy_login_flow(account_id: str, timeout_seconds: float = 25.0) -> str:
    cancel_agy_login_flow(account_id)

    acc_home = os.path.abspath(os.path.join(settings.DATA_DIR, account_id))
    os.makedirs(acc_home, exist_ok=True)
    _seed_onboarding_state(acc_home)

    master_fd, slave_fd = pty.openpty()
    fcntl.ioctl(slave_fd, termios.TIOCSWINSZ, struct.pack("HHHH", 24, 80, 0, 0))

    cmd = _get_agy_command(account_id)
    env = {**os.environ, "HOME": acc_home, "TERM": "xterm-256color"}

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
    auth_url: Optional[str] = None
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

                now = time.time()
                if ("Choose your color scheme" in text or "terminal" in text or "color scheme" in text or "[Next]" in text or "Welcome to" in text) and (now - last_enter_time > 0.8):
                    time.sleep(0.2)
                    os.write(master_fd, b"\r\n")
                    last_enter_time = now
                    logger.info("Auto-advanced onboarding screen for %s", account_id)

                if ("Select login method" in text or "Google OAuth" in text) and (now - last_enter_time > 0.8):
                    time.sleep(0.2)
                    os.write(master_fd, b"\r\n")
                    last_enter_time = now
                    logger.info("Auto-selected Google OAuth menu for %s", account_id)

                if "https://accounts.google.com" in text:
                    found = _extract_google_oauth_url(text)
                    if found:
                        auth_url = found
                        logger.info("Captured Google OAuth URL for %s", account_id)
                        break
            except Exception as e:
                logger.warning("Error reading from agy PTY: %s", e)
                break
        else:
            now = time.time()
            if not auth_url and (now - start_time > 1.5) and (now - last_enter_time > 1.0):
                os.write(master_fd, b"\r\n")
                last_enter_time = now

    if not auth_url:
        try:
            proc.terminate()
            os.close(master_fd)
        except Exception:
            pass
        raise RuntimeError(f"Could not extract Google Auth URL from agy CLI: {output.decode('utf-8', errors='ignore')}")

    session = ActiveAgyLoginSession(
        account_id=account_id,
        proc=proc,
        master_fd=master_fd,
        auth_url=auth_url,
        acc_home=acc_home,
        created_at=time.time(),
    )
    _active_sessions[account_id] = session
    return auth_url


def submit_code_to_agy(account_id: str, code: str, timeout_seconds: float = 20.0) -> Dict[str, Any]:
    session = _active_sessions.get(account_id)
    if not session or session.proc.poll() is not None:
        logger.info("No active agy session for %s; starting new flow on demand", account_id)
        start_agy_login_flow(account_id)
        session = _active_sessions.get(account_id)
        if not session:
            raise RuntimeError("Failed to initialize agy CLI authentication session.")

    code_clean = code.strip()
    try:
        time.sleep(0.5)
        os.write(session.master_fd, (code_clean + "\r\n").encode("utf-8"))
        logger.info("Sent authorization code to agy CLI for %s", account_id)
    except Exception as e:
        logger.error("Failed to write code to agy PTY for %s: %s", account_id, e)
        raise RuntimeError(f"Failed to communicate with agy process: {e}")

    start_time = time.time()
    output = b""
    while time.time() - start_time < timeout_seconds:
        if session.proc.poll() is not None:
            logger.info("agy process completed with exit code %s", session.proc.returncode)
            break
        r, _, _ = select.select([session.master_fd], [], [], 0.3)
        if r:
            try:
                chunk = os.read(session.master_fd, 2048)
                if not chunk:
                    break
                output += chunk
                text = output.decode("utf-8", errors="ignore")

                if ("Choose your color scheme" in text or "terminal" in text or "[Next]" in text or "color scheme" in text) and "[Next]" in text:
                    logger.info("Detected onboarding prompt in agy output for %s; auto-sending Enter", account_id)
                    try:
                        os.write(session.master_fd, b"\r\n")
                        time.sleep(0.5)
                    except Exception:
                        pass

                if "Successfully" in text or "logged in" in text.lower() or "Hello!" in text or "available models" in text.lower():
                    logger.info("Detected success in agy output for %s", account_id)
                    break
            except Exception:
                break

    try:
        os.close(session.master_fd)
    except Exception:
        pass
    _active_sessions.pop(account_id, None)

    acc_dir = session.acc_home
    nested_cli = os.path.join(acc_dir, ".gemini", "antigravity-cli")
    target_cli = os.path.join(acc_dir, "antigravity-cli")
    if os.path.exists(nested_cli):
        os.makedirs(target_cli, exist_ok=True)
        for item in os.listdir(nested_cli):
            s = os.path.join(nested_cli, item)
            d = os.path.join(target_cli, item)
            try:
                if os.path.isfile(s):
                    shutil.copy2(s, d)
            except Exception:
                pass

    email = None
    user_name = None
    picture = None
    access_token = None

    token_candidates = [
        os.path.join(nested_cli, "antigravity-oauth-token"),
        os.path.join(target_cli, "antigravity-oauth-token"),
    ]
    for tp in token_candidates:
        if os.path.exists(tp):
            try:
                with open(tp, "r", encoding="utf-8") as tf:
                    raw = tf.read().strip()
                    if raw.startswith("{"):
                        t_data = json.loads(raw)
                        access_token = t_data.get("token", {}).get("access_token") or t_data.get("access_token")
                    elif not raw.startswith("4/0A"):
                        access_token = raw
                if access_token:
                    break
            except Exception:
                pass

    if access_token:
        try:
            with httpx.Client(timeout=8.0) as client:
                u_res = client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if u_res.status_code == 200:
                    u_data = u_res.json()
                    email = u_data.get("email")
                    user_name = u_data.get("name")
                    picture = u_data.get("picture")
                    logger.info("Extracted live Google userinfo for %s: email=%s name=%s", account_id, email, user_name)
        except Exception as e:
            logger.debug("Failed querying Google userinfo: %s", e)

    return {
        "account_id": account_id,
        "email": email,
        "name": user_name,
        "picture": picture,
        "access_token": access_token,
        "status": "authenticated",
        "output": output.decode("utf-8", errors="ignore"),
    }


def cancel_agy_login_flow(account_id: str) -> None:
    session = _active_sessions.pop(account_id, None)
    if session:
        try:
            session.proc.terminate()
            time.sleep(0.2)
            if session.proc.poll() is None:
                session.proc.kill()
            os.close(session.master_fd)
        except Exception:
            pass
