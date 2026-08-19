# GravWatch - Dynamic Account Container Lifecycle Manager (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import shutil
import logging
import subprocess
from typing import Dict, Any, List

try:
    from services.server.core.config import settings
except ImportError:
    from .config import settings

logger = logging.getLogger("gravwatch.container_manager")


def _get_docker_network() -> str:
    try:
        res = subprocess.run(["docker", "network", "ls", "--format", "{{.Name}}"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            for net in res.stdout.strip().split("\n"):
                if "gravwatch-net" in net:
                    return net.strip()
    except Exception:
        pass
    return "gravwatch-net"


def provision_account_container(account_id: str, label: str = "Account") -> bool:
    container_name = f"gravwatch-{account_id}"
    local_acc_dir = os.path.abspath(os.path.join(settings.DATA_DIR, account_id))
    host_mount_dir = os.path.join(settings.HOST_DATA_DIR, account_id)
    os.makedirs(local_acc_dir, exist_ok=True)

    try:
        check_cmd = ["docker", "inspect", container_name]
        check = subprocess.run(check_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check.returncode == 0:
            subprocess.run(["docker", "start", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logger.info("Started existing dynamic container %s", container_name)
            return True

        image_name = "gravwatch-agent:latest"
        net_name = _get_docker_network()

        cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "--network", net_name,
            "--restart", "unless-stopped",
            "-e", f"ACCOUNT_ID={account_id}",
            "-e", f"ACCOUNT_LABEL={label}",
            "-e", "SERVER_URL=http://server:8000",
            "-e", f"AGENT_API_KEY={settings.AGENT_API_KEY}",
            "-e", "POLL_INTERVAL_SECONDS=20",
            "-e", "GEMINI_DIR=/root/.gemini",
            "--dns", "8.8.8.8",
            "--dns", "8.8.4.4",
            "-v", f"{host_mount_dir}:/root/.gemini",
            "--memory", "256M",
            "--cpus", "0.25",
            image_name,
        ]

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            logger.info("Provisioned dynamic container %s", container_name)
            return True
        logger.warning("Failed to provision %s: %s", container_name, res.stderr)
        return False
    except Exception as e:
        logger.warning("Docker provision note for %s: %s", container_name, e)
        return False


def deprovision_account_container(account_id: str) -> bool:
    container_name = f"gravwatch-{account_id}"
    try:
        subprocess.run(["docker", "stop", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run(["docker", "rm", "-f", container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("Deprovisioned container %s", container_name)
    except Exception as e:
        logger.warning("Error stopping container %s: %s", container_name, e)

    acc_dir = os.path.abspath(os.path.join(settings.DATA_DIR, account_id))
    if os.path.exists(acc_dir):
        try:
            shutil.rmtree(acc_dir, ignore_errors=True)
        except Exception:
            pass
        if os.path.exists(acc_dir):
            try:
                subprocess.run(
                    ["docker", "run", "--rm", "-v", f"{settings.HOST_DATA_DIR}:/host_data", "alpine", "rm", "-rf", f"/host_data/{account_id}"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            except Exception:
                pass

    return True


def list_active_account_containers() -> List[Dict[str, Any]]:
    cmd = [
        "docker", "ps",
        "--filter", "name=gravwatch-acc-",
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
                acc_id = name.replace("gravwatch-", "")
                results.append({
                    "account_id": acc_id,
                    "container_name": name,
                    "status": "running" if "Up" in status else "stopped",
                    "raw_status": status,
                })
        return results
    except Exception:
        return []
