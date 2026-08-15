#!/usr/bin/env bash
# GravWatch - Container Agent Entrypoint (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

mkdir -p /root/.gemini /root/.antigravity-agent
chmod 700 /root/.gemini /root/.antigravity-agent

exec python3 -m services.agent.agent
