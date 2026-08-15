#!/usr/bin/env bash
# GravWatch - Installation Script (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo "[GravWatch] Installing GravWatch Telemetry Engine..."

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "[GravWatch] Creating default .env from template..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

echo "[GravWatch] Setting up local Python development environment..."
"$DIR/setup-dev-env.sh"

echo "[GravWatch] Preparing data directories with secure permissions..."
mkdir -p "$ROOT_DIR/data/server"
mkdir -p "$ROOT_DIR/data/acc-1" "$ROOT_DIR/data/acc-2" "$ROOT_DIR/data/acc-3" "$ROOT_DIR/data/acc-4"
chmod 700 "$ROOT_DIR/data/acc-"* 2>/dev/null || true

echo ""
echo "[GravWatch] Installation complete."
echo "To pair Google Antigravity accounts, run: ./scripts/setup-auth.sh"
echo "To start the multi-account container stack, run: ./scripts/docker-run.sh"
echo "To uninstall later, run ./scripts/uninstall.sh"
