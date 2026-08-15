#!/usr/bin/env bash
# GravWatch - Environment Setup Script (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo "[GravWatch] Setting up development environment..."

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "[GravWatch] Creating .env from template..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

if [ ! -d "$ROOT_DIR/.venv" ]; then
    echo "[GravWatch] Creating Python virtual environment in .venv..."
    python3 -m venv "$ROOT_DIR/.venv"
fi

echo "[GravWatch] Installing dependencies in virtual environment..."
"$ROOT_DIR/.venv/bin/pip" install --upgrade pip >/dev/null
"$ROOT_DIR/.venv/bin/pip" install -r "$ROOT_DIR/services/server/requirements.txt" >/dev/null
"$ROOT_DIR/.venv/bin/pip" install -r "$ROOT_DIR/services/agent/requirements.txt" >/dev/null

echo "[GravWatch] Preparing data directories..."
mkdir -p "$ROOT_DIR/data/server"
mkdir -p "$ROOT_DIR/data/acc-1" "$ROOT_DIR/data/acc-2" "$ROOT_DIR/data/acc-3" "$ROOT_DIR/data/acc-4"
chmod 700 "$ROOT_DIR/data/acc-"* 2>/dev/null || true

echo ""
echo "[GravWatch] Environment setup complete."
echo "Activate environment: source .venv/bin/activate"
