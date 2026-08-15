#!/usr/bin/env bash
# GravWatch - run-tests (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo -e "\033[1;36m[*] Running GravWatch Test Suite...\033[0m"

PYTHONPATH="$ROOT_DIR/services/server:$ROOT_DIR/services/agent" python3 -m unittest discover -s "$ROOT_DIR/tests" -v

rm -f "$ROOT_DIR/gravwatch.db"
find "$ROOT_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

echo ""
echo -e "\033[1;32m[✓] All unit & integration tests passed!\033[0m"
