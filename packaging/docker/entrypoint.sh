#!/usr/bin/env bash
# GravWatch - Container Agent Entrypoint (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

mkdir -p /root/.gemini /root/.antigravity-agent
chmod 700 /root/.gemini /root/.antigravity-agent 2>/dev/null || true

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

exec python3 -m services.agent.agent
