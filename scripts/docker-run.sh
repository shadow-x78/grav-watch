#!/usr/bin/env bash
# GravWatch - docker-run (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo -e "\033[1;36m[*] Launching GravWatch Multi-Account Stack (packaging/docker/docker-compose.yml)...\033[0m"

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "  --> Copying .env.example to .env..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

docker compose -f "$ROOT_DIR/packaging/docker/docker-compose.yml" --env-file "$ROOT_DIR/.env" up -d --build

echo ""
echo -e "\033[1;32m[✓] GravWatch Multi-Account Stack is up and running!\033[0m"
echo -e "  - API Swagger Docs: \033[1;33mhttp://localhost:8000/docs\033[0m"
echo -e "  - Telemetry Endpoint: \033[1;33mhttp://localhost:8000/api/v1/usage/latest\033[0m"
echo -e "  - Health Check:      \033[1;33mhttp://localhost:8000/api/v1/health\033[0m"
