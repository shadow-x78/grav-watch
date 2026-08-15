#!/usr/bin/env bash
# GravWatch - Interactive Multi-Account Authentication Helper (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo "[GravWatch] Multi-Account OAuth Pairing Helper"
echo "Select an account to authenticate:"
echo "  1) Account 1 (acc-1)"
echo "  2) Account 2 (acc-2)"
echo "  3) Account 3 (acc-3)"
echo "  4) Account 4 (acc-4)"
echo "  c) Custom account identifier"
echo "  q) Quit"
echo ""

read -r -p "Enter selection [1-4 / c / q]: " choice

authenticate_account() {
    local acc_id=$1
    local data_dir="$ROOT_DIR/data/$acc_id"
    local agent_dir="$ROOT_DIR/data/$acc_id-agent"

    mkdir -p "$data_dir" "$agent_dir" 2>/dev/null || true
    chmod 700 "$data_dir" "$agent_dir" 2>/dev/null || true

    echo ""
    echo "[GravWatch] Pairing session for [$acc_id]..."
    echo "[GravWatch] Volume mapped to: $data_dir"
    echo "[GravWatch] Complete Google OAuth authentication when prompted below."
    echo "----------------------------------------------------------------------"

    if command -v docker >/dev/null 2>&1; then
        docker compose --env-file "$ROOT_DIR/.env" -f "$ROOT_DIR/packaging/docker/docker-compose.yml" run --rm -it \
            -v "$data_dir:/root/.gemini" \
            -v "$agent_dir:/root/.antigravity-agent" \
            acc-1 bash -c "if command -v agy >/dev/null 2>&1; then agy auth login; else echo '[GravWatch] agy binary not found in container. You can place tokens in $data_dir or start a shell:'; bash; fi" || true
        
        echo "[GravWatch] Completed pairing session for [$acc_id]."
    else
        echo "[GravWatch] Error: Docker CLI not found."
        exit 1
    fi
}

case "$choice" in
    1) authenticate_account "acc-1" ;;
    2) authenticate_account "acc-2" ;;
    3) authenticate_account "acc-3" ;;
    4) authenticate_account "acc-4" ;;
    c|C)
        read -r -p "Enter custom account identifier (e.g. acc-5): " custom_id
        if [ -n "$custom_id" ]; then
            authenticate_account "$custom_id"
        else
            echo "[GravWatch] Invalid account identifier."
            exit 1
        fi
        ;;
    q|Q)
        echo "[GravWatch] Exiting."
        exit 0
        ;;
    *)
        if [ -n "$choice" ]; then
            authenticate_account "$choice"
        else
            echo "[GravWatch] Invalid selection."
            exit 1
        fi
        ;;
esac

echo ""
echo "[GravWatch] Done. Start or restart the container stack using:"
echo "  docker compose --env-file .env -f packaging/docker/docker-compose.yml up -d"
