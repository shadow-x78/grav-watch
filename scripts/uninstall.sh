#!/usr/bin/env bash
# GravWatch - Uninstallation Script (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo "[GravWatch] Stopping and removing all Docker containers..."
if command -v docker >/dev/null 2>&1; then
    docker compose -f "$ROOT_DIR/packaging/docker/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
fi

echo "[GravWatch] Removing temporary and cache files..."
find "$ROOT_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

echo "[GravWatch] Uninstallation complete."
