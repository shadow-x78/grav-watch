#!/usr/bin/env bash
# GravWatch - setup-dev-env (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo -e "\033[1;36m"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║              GravWatch Developer Environment Setup                 ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "\033[0m"

echo "[1/3] Checking Python 3..."
if command -v python3 >/dev/null 2>&1; then
    echo "  --> Found Python: $(python3 --version)"
else
    echo "  [!] Python 3 not found. Please install Python 3.10+"
    exit 1
fi

echo "[2/3] Installing Python dependencies for Server & Agent..."
python3 -m pip install -q -r "$ROOT_DIR/services/server/requirements.txt" -r "$ROOT_DIR/services/agent/requirements.txt"
echo "  --> Python dependencies installed successfully."

echo "[3/3] Setting execution permissions for scripts..."
chmod +x "$ROOT_DIR/scripts/"*.sh "$ROOT_DIR/packaging/docker/"*.sh

echo ""
echo -e "\033[1;32m[✓] Environment setup completed successfully!\033[0m"
echo -e "You can now run:"
echo -e "  - Run Tests:  \033[1;33mmake test\033[0m"
echo -e "  - Auth Setup: \033[1;33mmake auth\033[0m"
echo -e "  - Start All:  \033[1;33mmake run\033[0m"
