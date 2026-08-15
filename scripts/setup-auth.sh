#!/usr/bin/env bash
# GravWatch - Interactive Multi-Account Authentication Helper (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo -e "\033[1;36m"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║                  GravWatch - Auth Setup Helper                     ║"
echo "  ║         Interactive Multi-Account OAuth Pairing for agy            ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "\033[0m"

echo "Select which container to authenticate:"
echo " 1) Account 1 (acc-1) - Primary"
echo " 2) Account 2 (acc-2) - Worker"
echo " 3) Account 3 (acc-3) - Worker"
echo " 4) Account 4 (acc-4) - Worker"
echo " 5) Authenticate ALL 4 Accounts sequentially"
echo " q) Quit"
echo ""

read -r -p "Select option [1-5]: " choice

authenticate_account() {
    local acc_id=$1
    local data_dir="$ROOT_DIR/data/$acc_id"
    local agent_dir="$ROOT_DIR/data/$acc_id-agent"

    mkdir -p "$data_dir" "$agent_dir"
    chmod 700 "$data_dir" "$agent_dir"

    echo ""
    echo -e "\033[1;33m[*] Starting interactive login session for [$acc_id]...\033[0m"
    echo -e "\033[0;32m--> Persistent volume mapped to: $data_dir\033[0m"
    echo -e "\033[0;34m--> Copy the Google OAuth link that appears, authenticate in your browser, and paste the code below.\033[0m"
    echo "----------------------------------------------------------------------"

    if command -v docker >/dev/null 2>&1; then
        docker compose -f "$ROOT_DIR/packaging/docker/docker-compose.yml" --env-file "$ROOT_DIR/.env" run --rm -it \
            -v "$data_dir:/root/.gemini" \
            -v "$agent_dir:/root/.antigravity-agent" \
            "$acc_id" agy auth login || echo "Note: If agy binary is not yet pre-installed in image, ensure token directory is copied directly."
        
        echo -e "\033[1;32m[✓] Authentication session finished for [$acc_id]!\033[0m"
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
    q|Q)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo "Invalid selection."
        exit 1
        ;;
esac

echo ""
echo -e "\033[1;32m[✓] All done! You can now start all services using:\033[0m"
echo -e "    \033[1;36mmake run\033[0m"
