# Architecture Specification - GravWatch

## 🌐 Language

<a href="ARCHITECTURE.md">🇬🇧 English</a> · <a href="ARCHITECTURE_AR.md">🇸🇦 العربية</a>

---

> Applies to **v2.0.0** and later.

GravWatch is designed as a distributed, containerized telemetry and quota aggregation engine that separates container sandboxes, CLI metric scraping, asynchronous database persistence, pooled calculations, and REST API distribution.

---

## 🏛 System Architecture Overview

```mermaid
graph TD
    subgraph Host Linux Machine / Docker Engine
        subgraph Container acc-1 (Debian Slim - 256MB RAM)
            A1[Volume: ./data/acc-1] -->|Google OAuth Token| B1(agy CLI - Account 1)
            B1 -->|Table Output| C1(services/agent daemon)
        end
        
        subgraph Container acc-2 (Debian Slim - 256MB RAM)
            A2[Volume: ./data/acc-2] -->|Google OAuth Token| B2(agy CLI - Account 2)
            B2 -->|Table Output| C2(services/agent daemon)
        end

        subgraph Container acc-3 (Debian Slim - 256MB RAM)
            A3[Volume: ./data/acc-3] -->|Google OAuth Token| B3(agy CLI - Account 3)
            B3 -->|Table Output| C3(services/agent daemon)
        end

        subgraph Container acc-N (Debian Slim - 256MB RAM)
            AN[Volume: ./data/acc-N] -->|Google OAuth Token| BN(agy CLI - Account N)
            BN -->|Table Output| CN(services/agent daemon)
        end

        subgraph Central Hub (services/server)
            Server[FastAPI Async Server]
            DB[(SQLite / PostgreSQL Async Engine)]
            Aggregator[Pool Aggregator Engine]

            Server <--> DB
            Server --> Aggregator
        end

        C1 -->|POST /api/v1/usage (X-Agent-Key)| Server
        C2 -->|POST /api/v1/usage (X-Agent-Key)| Server
        C3 -->|POST /api/v1/usage (X-Agent-Key)| Server
        CN -->|POST /api/v1/usage (X-Agent-Key)| Server
    end
```

---

## 📦 Monorepo Service Topology

| Service / Directory | Responsibility | Key Dependencies |
|---|---|---|
| `services/server` | Async REST API, SQLAlchemy ORM, database migrations, pool math | `fastapi`, `uvicorn`, `sqlalchemy`, `aiosqlite`, `pydantic` |
| `services/agent` | Headless quota scraper daemon, ANSI table parser for 5 models, mock fallback | `requests` |
| `clients/web` | Browser-based live quota monitoring dashboard (HTML5, Vanilla JS, CSS) | Pure Web Standards |
| `clients/android` | Native companion client for mobile devices | `Jetpack Compose`, `Material 3` |
| `packaging/docker` | Multi-container Docker Compose definitions, Dockerfiles, entrypoint scripts | `docker-compose v2`, `debian:bookworm-slim` |
| `tests` | Unit tests for ANSI parser, e2e integration tests for REST API & DB | `httpx`, `unittest` |
| `scripts` | Direct automation scripts for setup, testing, install, and container management | `bash`, `docker`, `python3` |

---

## ⚡ Telemetry & Quota Aggregation Pipeline

1. **Account Sandboxing:** Each container node (`acc-1` through `acc-N`) mounts its own isolated `./data/acc-X` volume with `chmod 700` permissions. The `agy` CLI reads tokens exclusively from `/root/.gemini` without touching other containers.
2. **Periodic Scraping:**
   - The agent daemon runs in a loop inside each container, executing `agy -p /usage` every `POLL_INTERVAL_SECONDS` (default: 300 s).
   - If the CLI returns an ANSI-formatted terminal table, `clean_ansi()` strips color escape codes and regex patterns extract RPM, daily limits, used counts, and reset timers for **Gemini Flash, Gemini Pro, Claude Sonnet, Claude Opus, and GPT OSS**.
   - If the CLI is unauthenticated or missing during testing, the parser falls back to realistic deterministic mock telemetry if `USE_MOCK_FALLBACK=true`.
3. **Telemetry Ingestion:**
   - The agent sends an HTTP `POST` request to `http://server:8000/api/v1/usage` with the payload and `X-Agent-Key` header.
   - The server validates authentication, creates or updates the `Account` record, commits the `UsageSnapshot`, and inserts individual `ModelQuota` rows asynchronously.
4. **Pool Aggregation:**
   - When `/api/v1/usage/latest` is requested, `compute_latest_pool_summary()` reads the latest snapshot for every registered account.
   - It aggregates total requests used, total capacity limit, and calculates pooled utilization percentages per model across all online accounts.

---

## 🌐 HTTP API Contract

| Endpoint | Method | Headers / Auth | Payload Summary | Response |
|---|---|---|---|---|
| `/api/v1/health` | GET | None | None | `{"status":"healthy","service":"gravwatch-server","version":"2.0.0"}` |
| `/api/v1/usage` | POST | `X-Agent-Key: <key>` | `{account_id, timestamp, models: [...]}` | `201 Created {"success":true,"message":"..."}` |
| `/api/v1/usage/latest` | GET | None | None | `200 OK LatestUsageResponse (pool_summary + accounts)` |
| `/api/v1/usage/history` | GET | None | Query: `account_id`, `range=24h` | `200 OK HistoryResponse (series: [...])` |
| `/api/v1/accounts` | GET | None | None | `200 OK List[AccountDetailResponse]` |

---

## 🔌 Ingestion Optimisations

- **Async Database Connection:** Built on SQLAlchemy 2.0 async sessions (`sqlite+aiosqlite` or async PostgreSQL) with non-blocking commits.
- **Memory & CPU Caps:** Each agent container is strictly bounded to `mem_limit: 256m` and `cpus: 0.25` in Docker Compose.

---

## 🔁 Container Lifecycle & Isolation Model

- Each container runs `services/agent/agent.py` as PID 1 via `packaging/docker/entrypoint.sh`.
- Containers communicate over the private Docker bridge network `gravwatch-net`.
- No host GUI or desktop dependencies are required.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
