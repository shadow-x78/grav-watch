# ─────────────────────────────────────────────
# GravWatch - Dynamic Account Container Lifecycle Manager (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import os
import json
import shutil
import logging
import subprocess
from typing import Dict, Any, List

from services.server.core.config import settings, JETSKI_PRESET

logger = logging.getLogger("gravwatch.container_manager")

PROJECT_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(__file__))))),
)
AGENT_IMAGE_NAME = os.environ.get("GRAVWATCH_AGENT_IMAGE", "gravwatch-agent")
DOCKERFILE_AGENT = os.path.join(PROJECT_ROOT, "packaging", "docker", "Dockerfile.agent")


def _get_docker_network() -> str:
    try:
        res = subprocess.run(
            ["docker", "network", "ls", "--format", "{{.Name}}"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if res.returncode == 0:
            for net in res.stdout.strip().split("\n"):
                if "gravwatch-net" in net:
                    return net.strip()
    except Exception:
        pass
    return "gravwatch-net"


def _seed_account_dir(local_acc_dir: str):
    dirs = [
        os.path.join(local_acc_dir, "antigravity-cli"),
        os.path.join(local_acc_dir, ".gemini", "antigravity-cli"),
    ]
    for d in dirs:
        try:
            os.makedirs(d, mode=0o777, exist_ok=True)
            pbtxt = os.path.join(d, "jetski_state.pbtxt")
            with open(pbtxt, "w", encoding="utf-8") as f:
                f.write(JETSKI_PRESET)
            os.chmod(pbtxt, 0o666)

            settings_json = os.path.join(d, "settings.json")
            with open(settings_json, "w", encoding="utf-8") as f:
                f.write('{\n  "trustedWorkspaces": [\n    "/app",\n    "/root",\n    "/",\n    "/tmp"\n  ]\n}\n')
            os.chmod(settings_json, 0o666)

            cache_d = os.path.join(d, "cache")
            os.makedirs(cache_d, mode=0o777, exist_ok=True)
            onboard_json = os.path.join(cache_d, "onboarding.json")
            with open(onboard_json, "w", encoding="utf-8") as f:
                json.dump({
                    "consumerOnboardingComplete": True,
                    "enterpriseOnboardingComplete": True,
                    "onboardingComplete": True
                }, f, indent=2)
            os.chmod(onboard_json, 0o666)
        except Exception:
            pass


def provision_account_container(account_id: str, label: str = "Account") -> bool:
    """Dynamically create and start a container for the given account.
    Called from auth exchange-code after user authenticates with Google."""
    container_name = f"{AGENT_IMAGE_NAME}-{account_id}"
    # Bind the HOST path (from the server's perspective the server itself
    # runs inside a container, so DATA_DIR points at its own /app/data).
    local_acc_dir = os.path.abspath(
        os.path.join(settings.HOST_DATA_DIR or settings.DATA_DIR, account_id)
    )
    os.makedirs(local_acc_dir, exist_ok=True)
    _seed_account_dir(local_acc_dir)

    try:
        net_name = _get_docker_network()

        # Build agent image if it doesn't exist
        res = subprocess.run(
            ["docker", "images", "-q", AGENT_IMAGE_NAME],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if not res.stdout.strip():
            logger.info("First provisioning — building agent image %s from Dockerfile.agent", AGENT_IMAGE_NAME)
            build_cmd = [
                "docker", "build", "-t", AGENT_IMAGE_NAME,
                "-f", DOCKERFILE_AGENT,
                PROJECT_ROOT,
            ]
            res = subprocess.run(build_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                logger.error("Failed to build agent image: %s", res.stderr[:500])
                return False
            logger.info("Agent image %s built OK", AGENT_IMAGE_NAME)

        # Check if container already exists
        check_cmd = ["docker", "inspect", container_name]
        check = subprocess.run(check_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check.returncode == 0:
            subprocess.run(["docker", "start", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logger.info("Started existing dynamic container %s", container_name)
            return True

        cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "--network", net_name,
            "--restart", "unless-stopped",
            "-e", f"ACCOUNT_ID={account_id}",
            "-e", f"ACCOUNT_LABEL={label}",
            "-e", "SERVER_URL=http://server:8000",
            "-e", "POLL_INTERVAL_SECONDS=20",
            "-e", f"GEMINI_DIR=/app/data/{account_id}",
            "--dns", "8.8.8.8",
            "--dns", "8.8.4.4",
            "-v", f"{local_acc_dir}:/app/data/{account_id}",
            "--memory", "256M",
            "--cpus", "0.25",
            AGENT_IMAGE_NAME,
        ]

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            logger.info("Provisioned dynamic container %s (image=%s)", container_name, AGENT_IMAGE_NAME)
            return True
        logger.warning("Failed to provision %s: %s", container_name, res.stderr[:500])
        return False
    except Exception as e:
        logger.warning("Docker provision note for %s: %s", container_name, e)
        return False


def deprovision_account_container(account_id: str) -> bool:
    container_name = f"{AGENT_IMAGE_NAME}-{account_id}"
    try:
        # Try to logout from agy inside the container before removing it
        subprocess.run(
            ["docker", "exec", container_name, "agy", "logout"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10
        )
    except Exception:
        pass  # Container might not be running or agy not available
    try:
        subprocess.run(["docker", "rm", "-f", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("Deprovisioned container %s", container_name)
    except Exception as e:
        logger.warning("Error removing container %s: %s", e)

    acc_dir = os.path.abspath(
        os.path.join(settings.HOST_DATA_DIR or settings.DATA_DIR, account_id)
    )
    if os.path.exists(acc_dir):
        try:
            shutil.rmtree(acc_dir, ignore_errors=True)
        except Exception:
            pass

    return True


def list_active_account_containers() -> List[Dict[str, Any]]:
    cmd = [
        "docker", "ps", "-a",
        "--filter", f"name={AGENT_IMAGE_NAME}-acc-",
        "--format", "{{.Names}}|{{.Status}}|{{.Image}}"
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            return []
        results = []
        for line in res.stdout.strip().split("\n"):
            if not line.strip():
                continue
            parts = line.strip().split("|")
            if len(parts) >= 2:
                name = parts[0]
                status = parts[1]
                acc_id = name.replace(f"{AGENT_IMAGE_NAME}-", "")
                results.append({
                    "account_id": acc_id,
                    "container_name": name,
                    "status": "running" if "Up" in status else "stopped",
                    "raw_status": status,
                })
        return results
    except Exception:
        return []


def toggle_account_container(account_id: str) -> Dict[str, Any]:
    container_name = f"{AGENT_IMAGE_NAME}-{account_id}"
    try:
        check_cmd = ["docker", "inspect", "-f", "{{.State.Running}}", container_name]
        check = subprocess.run(check_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        container_exists = check.returncode == 0
        is_running = container_exists and "true" in check.stdout.strip().lower()
        
        if not container_exists:
            logger.info("Container %s does not exist, provisioning...", container_name)
            provision_account_container(account_id, f"Account {account_id}")
            return {"account_id": account_id, "container_status": "running", "status": "active"}
        
        if is_running:
            subprocess.run(["docker", "stop", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logger.info("Stopped/Paused container %s", container_name)
            return {"account_id": account_id, "container_status": "stopped", "status": "paused"}
        else:
            subprocess.run(["docker", "start", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logger.info("Started/Resumed container %s", container_name)
            return {"account_id": account_id, "container_status": "running", "status": "active"}
    except Exception as e:
        logger.warning("Error toggling container %s: %s", container_name, e)
        return {"account_id": account_id, "container_status": "stopped", "status": "paused"}

