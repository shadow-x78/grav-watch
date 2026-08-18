# Changelog - GravWatch

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2026-08-19

### Added
- **Interactive Next.js Web Client Integration:** Merged and fully integrated the modern Next.js 16 + Tailwind CSS v4 + TypeScript dashboard directly into `clients/web`.
- **Live FastAPI Telemetry Ingestion & Polling:** Implemented live backend synchronization with `GET /api/v1/usage/latest` in `GravWatchContext` with graceful offline fallback to local mock engine.
- **Docker Compose Web Service:** Added `packaging/docker/Dockerfile.web` and integrated `web` container service on port 3000 into `docker-compose.yml`.
- **Bilingual Header Switcher:** Integrated an instant one-click Arabic (RTL) and English (LTR) language toggle in the global navigation header.
- **Project Co-Ownership:** Officially registered `mohmed-hegaze` as repository co-owner alongside `shadow-x78` across package configurations and documentation.

### Changed
- **Automated Dev Setup:** Updated `scripts/setup-dev-env.sh` to automatically install web dependencies and prepare local environments.
- **Documentation & Badges:** Standardized all README badge formats and updated full bilingual architectural specifications to reflect active web client status.

---

## [2.2.0] - 2026-08-16

### Added
- **Official Antigravity UI Quota Parity:** Re-architected data schemas and telemetry engines to match official Google Antigravity quota categories (`Gemini Models` and `Claude and GPT models`) with `Weekly Limit Remaining` and `Five Hour Limit Remaining` metrics and human-readable countdowns.
- **Full API-Driven Authentication & Session Management:** Added `/api/v1/auth/token` and `/api/v1/auth/status` REST endpoints to authenticate, ingest, and inspect Google OAuth tokens directly via API/UI without requiring access to a Linux terminal.
- **CategorySnapshot Database Layer:** Added dedicated SQLAlchemy asynchronous persistence for category-level quotas and time-series snapshots.

### Changed
- **Default 1-Account Container Topology:** Configured `docker-compose.yml` to run a lean 1-account default (`server` + `acc-1`), with additional accounts placed under Compose Profile `--profile multi`.
- **Pool Aggregator Engine:** Upgraded `compute_latest_pool_summary` to compute aggregate weekly and 5-hour percentages across categories and models.

---

## [2.1.0] - 2026-08-15

### Added
- **Modular Services Architecture:** Separated `services/server` into dedicated subpackages (`core`, `models`, `engine`, `api`, `main.py`) and `services/agent` into (`core`, `collector`, `mock`, `agent.py`).
- **Clean Package Hierarchy:** Standardized Python packages with top-level and service-level `__init__.py` modules for collision-free imports.

### Changed
- **Script Consolidation:** Streamlined root scripts into 3 core utilities: `setup-dev-env.sh`, `setup-auth.sh`, and `uninstall.sh`.

### Removed
- **Redundant Scripts:** Removed `docker-run.sh`, `install.sh`, and `run-tests.sh` in favor of standard direct Docker Compose and Python unit test commands.

---

## [2.0.0] - 2026-08-15

### Added
- **Official Antigravity 5-Model Parser:** Canonical parser standardization for Gemini Flash, Gemini Pro, Claude Sonnet, Claude Opus, and GPT OSS.
- **Dynamic Multi-Account Scaling:** Extended architecture and interactive auth CLI (`./scripts/setup-auth.sh`) to support arbitrary $N$ accounts dynamically.
- **Upcoming Client Roadmaps:** Added technical roadmap for upcoming Web Dashboard and native Android App client.

### Changed
- **Version Major Bump:** Upgraded release target to `v2.0.0` reflecting breaking API cleanup and architecture generalization.
- **Documentation Overhaul:** 100% style, vocabulary, and structural alignment with Orbiscreen technical documentation guidelines.

### Removed
- **Discord Webhook Subsystem:** Completely eliminated external webhook dependencies and test endpoints, refocusing the engine purely on high-performance REST API telemetry and pool aggregation.

---

## [1.0.0] - 2026-08-15

### Added
- **Multi-Account Container Sandboxing:** Process and volume isolation for concurrent Google Antigravity accounts.
- **FastAPI Telemetry Hub:** High-performance async REST API with pooling engine and SQLite persistence.
- **Autonomous Quota Scraper:** Headless daemon parsing CLI tables and streaming snapshots.
- **Bilingual Documentation:** Complete English and Arabic technical specification pairs.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> & <a href="https://github.com/mohmed-hegaze">mohmed-hegaze</a> ·
[Back to README](README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
