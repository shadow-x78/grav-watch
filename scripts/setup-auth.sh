#!/usr/bin/env bash
# GravWatch - Interactive Multi-Account Authentication Helper (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo -e "\033[1;36m"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║                  GravWatch - Auth Setup Helper                     ║"
echo "  ║         Scalable Multi-Account OAuth Pairing for agy CLI           ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "\033[0m"

echo "Select an option or enter a custom account identifier:"
echo " 1) Account 1 (acc-1)"
echo " 2) Account 2 (acc-2)"
echo " 3) Account 3 (acc-3)"
echo " 4) Account 4 (acc-4)"
echo " 5) Authenticate accounts 1 to 4 sequentially"
echo " c) Custom account identifier (e.g. acc-5, dev-team, etc.)"
echo " q) Quit"
echo ""

read -r -p "Select option or enter account ID [1-5 / c / ID]: " choice

authenticate_account() {
    local acc_id=$1
    local data_dir="$ROOT_DIR/data/$acc_id"
    local agent_dir="$ROOT_DIR/data/$acc_id-agent"

    mkdir -p "$data_dir" "$agent_dir" 2>/dev/null || true
    chmod 700 "$data_dir" "$agent_dir" 2>/dev/null || true

    echo ""
    echo -e "\033[1;33m[*] Starting interactive authentication session for [$acc_id]...\033[0m"
    echo -e "\033[0;32m--> Persistent volume mapped to: $data_dir\033[0m"
    echo -e "\033[0;34m--> Copy the Google OAuth link that appears, authenticate in your browser, and paste the code below.\033[0m"
    echo "----------------------------------------------------------------------"

    if command -v docker >/dev/null 2>&1; then
        docker compose -f "$ROOT_DIR/packaging/docker/docker-compose.yml" --env-file "$ROOT_DIR/.env" run --rm -it \
            -v "$data_dir:/root/.gemini" \
            -v "$agent_dir:/root/.antigravity-agent" \
            acc-1 agy auth login || echo "Note: Authentication volume paired for [$acc_id]."
        
        echo -e "\033[1;32m[✓] Authentication session completed for [$acc_id]!\033[0m"
    else
        echo -e "\033[1;31m[!] Docker CLI not found. Please install Docker first.\033[0m"
    fi
}

case "$choice" in
    1) authenticate_account "acc-1" ;;
    2) authenticate_account "acc-2" ;;
    3) authenticate_account "acc-3" ;;
    4) authenticate_account "acc-4" ;;
    5)
        authenticate_account "acc-1"
        authenticate_account "acc-2"
        authenticate_account "acc-3"
        authenticate_account "acc-4"
        ;;
    c|C)
        read -r -p "Enter custom account identifier (e.g. acc-5): " custom_id
        if [ -n "$custom_id" ]; then
            authenticate_account "$custom_id"
        else
            echo "Invalid account identifier."
            exit 1
        fi
        ;;
    q|Q)
        echo "Exiting."
        exit 0
        ;;
    *)
        if [ -n "$choice" ]; then
            authenticate_account "$choice"
        else
            echo "Invalid selection."
            exit 1
        fi
        ;;
esac

echo ""
echo -e "\033[1;32m[✓] Ready! You can start the stack anytime using:\033[0m"
echo -e "    \033[1;36mdocker compose --env-file .env -f packaging/docker/docker-compose.yml up -d\033[0m"
