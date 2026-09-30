# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import os
import json
import re
import time
import logging
import subprocess
from typing import Optional, Dict, Any

from services.server.core.config import JETSKI_PRESET, settings

logger = logging.getLogger("gravwatch.agy_bridge")

AGENT_IMAGE_NAME = os.environ.get("GRAVWATCH_AGENT_IMAGE", "gravwatch-agent")

AGY_HOME_BASE = "/app/data"

BRIDGE_DAEMON_SCRIPT_PATH = "/app/services/server/core/_agy_bridge_daemon.py"

def _find_running_container(account_id: str) -> Optional[str]:
    """Find running container for this account."""
    for image_name in [AGENT_IMAGE_NAME, "gravwatch"]:
        container_name = f"{image_name}-{account_id}"
        try:
            check = subprocess.run(
                ["docker", "inspect", "-f", "{{.State.Running}}", container_name],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5
            )
            if check.returncode == 0 and check.stdout.strip().lower() == "true":
                return container_name
        except Exception:
            pass
    try:
        res = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}|{{.Status}}"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5
        )
        if res.returncode == 0:
            for line in res.stdout.strip().split("\n"):
                if not line.strip():
                    continue
                parts = line.strip().split("|")
                if len(parts) >= 2 and account_id in parts[0] and "Up" in parts[1]:
                    return parts[0]
    except Exception:
        pass
    return None

def _acc_home_on_host(account_id: str) -> str:
    return os.path.abspath(os.path.join(settings.DATA_DIR, account_id))

def _acc_home_in_container(account_id: str) -> str:
    return os.path.join(AGY_HOME_BASE, account_id)

def _read_token_data(account_id: str) -> Optional[Dict[str, Any]]:
    """Read the agy OAuth token file from the mounted account volume.

    Returns the parsed payload (access_token + optional refresh_token).
    """
    acc_dir = _acc_home_on_host(account_id)
    nested_cli = os.path.join(acc_dir, ".gemini", "antigravity-cli")
    flat_cli = os.path.join(acc_dir, "antigravity-cli")
    for tp in [os.path.join(nested_cli, "antigravity-oauth-token"),
               os.path.join(flat_cli, "antigravity-oauth-token")]:
        if not os.path.exists(tp):
            continue
        try:
            with open(tp, "r", encoding="utf-8") as tf:
                raw = tf.read().strip()
            if not raw:
                continue
            if raw.startswith("{"):
                data = json.loads(raw)
                tok = data.get("token", {}) or {}
                access = tok.get("access_token") or data.get("access_token")
                if access:
                    return {
                        "access_token": access,
                        "refresh_token": tok.get("refresh_token") or data.get("refresh_token") or "",
                    }
            elif not raw.startswith(("4/0A", "4/0a")):
                return {"access_token": raw, "refresh_token": ""}
        except Exception:
            continue
    return None

def _read_token_from_disk(account_id: str) -> Optional[str]:
    data = _read_token_data(account_id)
    return data["access_token"] if data else None

def _harvest_token_from_container(account_id: str, container: str) -> bool:
    """Fallback: agy may still write to /root/.gemini — pull the token out
    of the container filesystem onto the mounted volume."""
    try:
        result = subprocess.run(
            ["docker", "exec", container, "sh", "-c",
             "cat /root/.gemini/antigravity-cli/antigravity-oauth-token 2>/dev/null || "
             "cat /root/.config/gemini/antigravity-oauth-token 2>/dev/null || "
             "cat /root/.antigravity/antigravity-oauth-token 2>/dev/null"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10
        )
        raw = (result.stdout or "").strip()
        if not raw or raw.startswith("4/0A"):
            return False
        if raw.startswith("{"):
            json.loads(raw)  # validate
        _write_token_to_volume(account_id, raw, "")
        logger.info("Harvested token from container /root for %s", account_id)
        return True
    except Exception:
        return False

def _write_token_to_volume(account_id: str, access_token: str, refresh_token: str) -> None:
    """Write token payload into agy's expected JSON format on the volume."""
    acc_dir = _acc_home_on_host(account_id)
    token_data = {
        "token": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expiry": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 3600 - 60)
            ),
        },
        "auth_method": "oauth2",
    }
    for cli_dir in [os.path.join(acc_dir, ".gemini", "antigravity-cli"),
                    os.path.join(acc_dir, "antigravity-cli")]:
        try:
            os.makedirs(cli_dir, mode=0o700, exist_ok=True)
            token_file = os.path.join(cli_dir, "antigravity-oauth-token")
            tmp_file = token_file + ".tmp"
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(token_data, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp_file, token_file)
            os.chmod(token_file, 0o600)
        except Exception as e:
            logger.warning("Failed writing token file under %s: %s", cli_dir, e)

def _extract_google_oauth_url(text: str) -> Optional[str]:
    """Pull agy's own Google OAuth URL out of raw TUI output.

    The URL is ~1KB long and bubbletea hard-wraps it across ~10 terminal
    lines; scope values contain '+' separators that earlier regexes cut off
    (producing tokens with lost scopes and Google 400 "missing response_type").
    This harvests character-by-character, stitching wrapped fragments.
    """
    if not text:
        return None

    URLQ = r"A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%"

    def _finalize(cand: str) -> Optional[str]:
        idx = cand.find("https://", 8)
        if idx > 0:
            cand = cand[:idx]
        cand = cand.rstrip(".,;:!?)]}'\"&=")
        if "client_id=" in cand and "response_type=" in cand and "state=" in cand:
            return cand
        return None

    for cand in re.findall(r"https://(?:accounts\.google\.com/o/oauth2/auth|auth\.cloud\.google/authorize)\?[" + URLQ + r"]+", text):
        done = _finalize(cand)
        if done:
            return done

    t = re.sub(r"\x1b\]8;[^;]*;([^\x07\x1b]*)(?:\x07|\x1b\\)", r"\1", text)
    t = re.sub(r"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)", "", t)
    t = re.sub(r"\x1b\[[0-9;?]*[a-zA-Z@^_{}|~]", "", t)
    t = t.replace("\x1b", "").replace("\x07", "")

    for cand in re.findall(r"https://(?:accounts\.google\.com/o/oauth2/auth|auth\.cloud\.google/authorize)\?[" + URLQ + r"]+", t):
        done = _finalize(cand)
        if done:
            return done

    urlchars = set(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        "0123456789-._~:/?#[]@!$&'()*+,;=%"
    )

    best: Optional[str] = None
    for m in re.finditer(
        r"https://(?:accounts\.google\.com/o/oauth2/auth|auth\.cloud\.google/authorize)\?",
        t,
    ):
        i = m.start()
        out: list[str] = []
        n = len(t)
        while i < n and len(out) < 4000:
            c = t[i]
            if c in urlchars:
                out.append(c)
                i += 1
            elif c in "\r\n":
                j = i
                newlines = 0
                while j < n and t[j] in " \t\r\n\x1b\x07":
                    if t[j] in "\r\n":
                        newlines += 1
                    j += 1
                if newlines < 2 and j < n and t[j] in urlchars:
                    i = j
                else:
                    break
            else:
                break

        done = _finalize("".join(out))
        if done:
            return done
        url = "".join(out).rstrip(".,;:!?)]}'\"&=")
        if "client_id=" in url and best is None:
            best = url
    return best

def _strip_ansi(text: str) -> str:
    """Remove ANSI escape sequences."""
    text = re.sub(r'\x1b\[[^a-zA-Z]*[a-zA-Z]', '', text)
    text = re.sub(r'\x1b\][^\x07\x1b]*[\x07\x1b]', '', text)
    text = re.sub(r'\x1b[PX^_][^\x07\x1b]*[\x07\x1b]', '', text)
    return text

def _ensure_pty_bridge(container: str) -> bool:
    """Return True if the bridge daemon is alive inside the container."""
    try:
        check = subprocess.run(
            ["docker", "exec", container, "test", "-f", "/tmp/.agy_bridge_pid"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5
        )
        if check.returncode == 0:
            pid = subprocess.run(
                ["docker", "exec", container, "cat", "/tmp/.agy_bridge_pid"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5
            ).stdout.strip()
            if pid:
                if not re.fullmatch(r"[0-9]{1,7}", pid):
                    logger.warning("Invalid PID '%s' in bridge file for %s", pid, container)
                    return False
                test = subprocess.run(
                    ["docker", "exec", container, "kill", "-0", pid],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5
                )
                return test.returncode == 0
    except Exception:
        pass
    return False

def _start_pty_bridge(container: str, acc_home: str) -> bool:
    """Start the bridge daemon inside the container (docker cp + exec in background)."""
    if _ensure_pty_bridge(container):
        return True

    try:
        cp_result = subprocess.run(
            ["docker", "cp", BRIDGE_DAEMON_SCRIPT_PATH, f"{container}:/tmp/_agy_bridge_daemon.py"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30
        )
        if cp_result.returncode != 0:
            logger.warning("Failed to cp bridge script: %s", (cp_result.stderr or b"")[:200])
            return False

        start_cmd = f"nohup python3 /tmp/_agy_bridge_daemon.py {acc_home} > /dev/null 2>&1 &"
        start_result = subprocess.run(
            ["docker", "exec", container, "sh", "-c", start_cmd],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10
        )
        if start_result.returncode != 0:
            logger.warning("Failed to start bridge daemon: %s", (start_result.stderr or b"")[:200])
            return False

        for _ in range(20):
            time.sleep(0.5)
            if _ensure_pty_bridge(container):
                return True
        logger.warning("Bridge daemon did not start within timeout")
        return False
    except Exception as e:
        logger.warning("Error starting bridge: %s", e)
        return False

def _read_container_output(container: str) -> str:
    try:
        result = subprocess.run(
            ["docker", "exec", container, "cat", "/tmp/agy_output"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout
    except Exception:
        pass
    return ""

def _seed_onboarding_state(acc_home: str):
    """Seed onboarding files on the volume to skip initial setup menus.

    Never overwrites agy's own jetski_state once agy has written it —
    our preset is only a bootstrap for first launch.
    """
    dirs = [
        os.path.join(acc_home, ".gemini", "antigravity-cli"),
        os.path.join(acc_home, "antigravity-cli"),
    ]
    for d in dirs:
        try:
            os.makedirs(d, mode=0o700, exist_ok=True)
            sf = os.path.join(d, "settings.json")
            tmp = sf + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump({"trustedWorkspaces": ["/app", "/root", "/", "/tmp"]}, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp, sf)
            os.chmod(sf, 0o600)

            pbtxt = os.path.join(d, "jetski_state.pbtxt")
            if not os.path.exists(pbtxt):
                tmp2 = pbtxt + ".tmp"
                with open(tmp2, "w", encoding="utf-8") as f:
                    f.write(JETSKI_PRESET)
                    f.flush()
                    os.fsync(f.fileno())
                os.replace(tmp2, pbtxt)
                os.chmod(pbtxt, 0o600)

            cache_dir = os.path.join(d, "cache")
            os.makedirs(cache_dir, mode=0o700, exist_ok=True)
            of = os.path.join(cache_dir, "onboarding.json")
            with open(of, "w", encoding="utf-8") as f:
                json.dump({
                    "consumerOnboardingComplete": True,
                    "enterpriseOnboardingComplete": True,
                    "onboardingComplete": True,
                }, f, indent=2)
            os.chmod(of, 0o600)
        except Exception:
            pass

def _reset_bridge_files(container: str) -> None:
    """Clear stale bridge state so a new session starts clean."""
    try:
        subprocess.run(
            ["docker", "exec", container, "sh", "-c",
             "rm -f /tmp/agy_output /tmp/agy_cmd /tmp/.agy_bridge_pid"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5
        )
    except Exception:
        pass

def start_agy_login_flow(account_id: str, timeout_seconds: float = 90.0) -> str:
    """Start agy inside the account container and capture its real OAuth URL.

    Returns:
        - agy's own Google OAuth URL (always requires explicit user login)

    Raises:
        RuntimeError: if no container runs or the URL cannot be captured.
    """
    from services.server.core.container_manager import provision_account_container

    acc_home = _acc_home_on_host(account_id)
    os.makedirs(acc_home, exist_ok=True)
    _seed_onboarding_state(acc_home)

    container = _find_running_container(account_id)
    if not container:
        logger.info("No running container for %s — provisioning", account_id)
        if not provision_account_container(account_id, f"Account {account_id}"):
            raise RuntimeError(
                f"No running container for {account_id} and provisioning failed. "
                "Check Docker availability and server logs."
            )
        container = _find_running_container(account_id)
        if not container:
            raise RuntimeError(f"Container for {account_id} did not come up.")

    cancel_agy_login_flow(account_id, keep_container=container)
    _wipe_auth_state(account_id, container)
    _reset_bridge_files(container)

    if not _start_pty_bridge(container, _acc_home_in_container(account_id)):
        raise RuntimeError(
            "Failed to start the agy PTY bridge daemon inside the container."
        )

    deadline = time.time() + timeout_seconds
    started = time.time()
    auth_url: Optional[str] = None
    last_output = ""
    while time.time() < deadline:
        time.sleep(1.0)
        last_output = _read_container_output(container)
        if not last_output:
            continue
        auth_url = _extract_google_oauth_url(last_output)
        if auth_url:
            logger.info("Captured agy OAuth URL for %s", account_id)
            break

        if time.time() - started > 20:
            plain = _strip_ansi(last_output)[-800:].lower()
            if "for shortcuts" in plain or "eligibility check failed" in plain:
                tail = _strip_ansi(last_output)[-400:]
                raise RuntimeError(
                    "agy reached the main CLI without showing a login link. "
                    "Start a new pairing attempt. TUI output:\n" + tail
                )

    if not auth_url:
        tail = _strip_ansi(last_output)[-400:]
        raise RuntimeError(
            f"Could not extract Google auth URL from agy CLI. "
            f"Last TUI output:\n{tail or '(no output)'}"
        )
    return auth_url

def submit_code_to_agy(account_id: str, code: str, timeout_seconds: float = 90.0) -> Dict[str, Any]:
    """Submit the Google authorization code into the live agy session.

    Writes the code to the bridge command file; the daemon types it into agy's
    TUI prompt. Monitors output until success/failure, then reads the token
    agy persisted to the mounted volume.
    """
    container = _find_running_container(account_id)
    if not container:
        raise RuntimeError(f"No running container found for {account_id}")

    if not _ensure_pty_bridge(container):
        raise RuntimeError(
            "agy auth session is not active. Start the flow again to get a fresh link."
        )

    with open("/tmp/agy_cmd", "w") as cf:
        cf.write(code.strip())
    try:
        subprocess.run(
            ["docker", "cp", "/tmp/agy_cmd", f"{container}:/tmp/agy_cmd"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10
        )
    except Exception as e:
        raise RuntimeError(f"Failed to send code to container: {e}")
    finally:
        try:
            os.unlink("/tmp/agy_cmd")
        except Exception:
            pass

    success_markers = (
        "welcome to antigravity", "welcome back", "logged in",
        "successfully authenticated", "you are signed in",
        "available models", "hello!",
    )
    failure_markers = (
        "invalid code", "code expired", "code is invalid", "denied",
        "invalid_grant", "malformed auth code", "token exchange failed",
        "failed to exchange", "could not sign in", "sign in failed",
    )

    deadline = time.time() + timeout_seconds
    output = ""
    verdict = "unclear"
    success_marker_seen = False
    token_data = None
    while time.time() < deadline:
        time.sleep(1.5)
        output = _read_container_output(container)
        tail = _strip_ansi(output)[-600:].lower()
        if any(m in tail for m in failure_markers):
            verdict = "failed"
            break

        if any(m in tail for m in success_markers):
            success_marker_seen = True

        token_data = _read_token_data(account_id)
        if not token_data:
            _harvest_token_from_container(account_id, container)
            token_data = _read_token_data(account_id)
        if token_data:
            verdict = "authenticated"
            break

    if success_marker_seen and not token_data:
        token_wait_deadline = time.time() + min(60, deadline - time.time())
        while time.time() < token_wait_deadline:
            time.sleep(1.5)
            token_data = _read_token_data(account_id)
            if not token_data:
                _harvest_token_from_container(account_id, container)
                token_data = _read_token_data(account_id)
            if token_data:
                verdict = "authenticated"
                break

    if not token_data:
        _harvest_token_from_container(account_id, container)
        token_data = _read_token_data(account_id)

    if token_data:
        return {
            "account_id": account_id,
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token", ""),
            "status": "authenticated",
            "output": _strip_ansi(output)[-400:],
        }

    tail = _strip_ansi(output)[-400:]
    if verdict == "failed":
        raise RuntimeError(f"agy rejected the code. TUI output:\n{tail or '(no output)'}")
    raise RuntimeError(
        f"Auth result unclear — no token found on disk. TUI output:\n{tail or '(no output)'}"
    )

def get_agy_output(account_id: str) -> str:
    """Get current agy output from the bridge."""
    container = _find_running_container(account_id)
    if not container:
        return ""
    return _strip_ansi(_read_container_output(container))

def cancel_agy_login_flow(account_id: str, keep_container: Optional[str] = None) -> None:
    """Stop agy and the PTY bridge daemon for this account."""
    container = keep_container or _find_running_container(account_id)
    if not container:
        return
    try:
        subprocess.run(
            ["docker", "exec", container, "sh", "-c", "echo QUIT > /tmp/agy_cmd"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5
        )
    except Exception:
        pass
    time.sleep(1)
    try:
        subprocess.run(
            ["docker", "exec", container, "sh", "-c",
             "pkill -x agy 2>/dev/null; "
             "pkill -f _agy_bridge_daemon 2>/dev/null; "
             "if [ -f /tmp/.agy_bridge_pid ]; then "
             "kill -9 $(cat /tmp/.agy_bridge_pid) 2>/dev/null; fi; "
             "rm -f /tmp/.agy_bridge_pid /tmp/agy_cmd /tmp/agy_output /tmp/bridge_debug.log"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5
        )
    except Exception:
        pass

def _wipe_auth_state(account_id: str, container: Optional[str] = None) -> None:
    """Remove every trace of a previous login so agy starts unauthenticated
    and prints a fresh OAuth URL. Without this, a valid token on the volume
    makes agy skip straight to the main CLI and the login flow hangs."""
    if container:
        try:
            subprocess.run(
                ["docker", "exec", container, "sh", "-c",
                 "agy logout >/dev/null 2>&1 || true"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=8
            )
        except Exception:
            pass

    acc_dir = _acc_home_on_host(account_id)
    targets = [
        os.path.join(acc_dir, ".gemini", "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(acc_dir, "antigravity-cli", "antigravity-oauth-token"),
        os.path.join(acc_dir, ".gemini", "antigravity-cli", "refresh_token"),
        os.path.join(acc_dir, "antigravity-cli", "refresh_token"),
        os.path.join(acc_dir, "credentials.json"),
    ]
    for path in targets:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.warning("Could not wipe %s: %s", path, e)
