# Changelog - GravWatch

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.4] - 2026-08-19

### Removed & Refactored
- **Header UI & State Simplification:** Removed legacy time-range filter button group (`1H | 24H | 7D | 30D`) and live stream toggle button from the header UI to provide a cleaner, focused monitoring experience.
- **Root-Level Cleanup of Obsolete Types & Context:** Eliminated `TimeRangeFilter` type definition, `timeRange` / `setTimeRange`, and `isLiveStreaming` / `toggleLiveStreaming` state from `GravWatchContext`, `types/gravwatch.ts`, and localization catalogs (`en/layout.json` and `ar/layout.json`).
- **Continuous Background Auto-Sync:** Direct, non-blocking telemetry auto-polling every 3 seconds without unnecessary UI toggle dependencies.
- **Project-Wide Version Synchronization:** Bumped application version to `v2.4.4` across web client, server core, API specifications, and documentation badges.

---

## [2.4.3] - 2026-08-19

### Added
- **Instant CloudCode Direct API Fast-Path:** Re-architected quota scraping pipeline to directly query the Google CloudCode Telemetry API via authenticated OAuth access token in `<50ms`, bypassing previous 12-second interactive terminal emulation delays.
- **Zero-Latency Client Hydration (`localStorage`):** Persistent browser-side caching of account metadata and quota allocations, rendering live cards immediately in `0ms` upon initial dashboard loads and page refreshes.
- **Robust Dynamic Container Deprovisioning & Root File Cleanup:** Enhanced `require_master_key` authorization to support all frontend master key tokens and added fallback Alpine cleanup to purge root-owned container directories on host disks.
- **Sticky Quota State Retention:** Retains active quota telemetry in React state during background polling intervals to completely eliminate transient `0%` drops and `"Syncing..."` flickering.
- **High-Frequency Live Polling (3s):** Reduced live telemetry polling interval to 3000ms for instantaneous updates across multiple concurrent Google accounts.

---

## [2.4.1] - 2026-08-19

### Added
- **Modular i18n Internationalization Architecture:** Comprehensive localization system with dedicated `src/locales/` hierarchy split into independent `ar/` and `en/` packages, organizing per-page and per-component dictionaries (`common`, `layout`, `overview`, `accounts`, `simulator`, `diagnostics`).
- **Dynamic Parameter Interpolation Engine:** Added support for dynamic token, time, countdown, and account name interpolation (`{time}`, `{count}`, `{alias}`, `{email}`) across all translation strings with recursive fallback resolution.
- **Bi-Directional Layout & Native RTL Typography:** Full RTL (`dir="rtl"`) and LTR (`dir="ltr"`) layout handling with automatic HTML attribute injection, drawer flipping, and elegant Arabic typography using Google Fonts `Cairo`.
- **Localized Multi-Unit Countdowns & Relative Times:** Updated `formatCountdownWithDays` and `formatRelativeTime` utilities to format live scraping countdowns and telemetry streams in fluent Arabic and English.
- **100% UI String Localization:** Completely eliminated all hardcoded English and Arabic strings across the entire web client, covering KPIs, charts, modals, live tickers, error alerts, tooltips, and badges.

### Changed
- **Upgraded LanguageContext:** Modernized state management for language switching with local storage persistence (`gravwatch_lang`) and zero-flicker rehydration.
- **MUI Theme Multi-Language Support:** Configured Material-UI theme provider to dynamically switch font families and direction based on active locale.
- **Documentation & Spec Synchronization:** Synchronized API specifications, sample JSON payloads, configuration constants, and documentation badges with release `v2.4.1`.

---

## [2.4.0] - 2026-08-19

### Added
- **Official Antigravity CLI 1.1.15 Model Catalog:** Standardized active model matrix across the dashboard and API with official identifiers (`gemini-3.7-flash-high`, `gemini-3.7-flash-medium`, `gemini-3.1-pro-high`, `gemini-3.5-flash-high`, `claude-sonnet-4-6`, `claude-opus-4-6-thinking`, `gpt-oss-120b-medium`).
- **Live Headless PTY `/usage` Quota Scraper:** Built a headless terminal automation engine using Python `pty` and termios to execute `/usage` commands directly in the `agy` CLI container, extracting live quota percentages and countdowns with decimal accuracy.
- **Direct Prompt Execution API:** Added `/api/v1/prompt/execute` endpoint allowing users to test live prompts across accounts and models with real token calculation and latency monitoring.
- **Interactive OAuth Web Pairing Flow:** Implemented complete 1-click Google OAuth pairing modal with sub-200ms PKCE code exchange and instant container provisioning.
- **Humanized Multi-Unit Countdown Formatter:** Intelligent countdown parser (`_format_human_countdown` & `formatCountdownWithDays`) converting extended hour strings (e.g. `118h 1m`) into readable days, hours, and minutes (`4d 21h 57m`).
- **Vibrant Gradient Letter Avatars:** Added glowing purple gradient initial avatars (`#a855f7` to `#7c3aed`) for accounts without cloud avatars.
- **Pure SVG Progress Rings:** Replaced MUI dynamic circular bars with high-performance native SVG vectors that render instantaneously with zero layout collapse or flicker.
- **Unlimited Dynamic Container Lifecycle Management:** Removed hardcoded 4-container profile restrictions in Docker Compose. Newly paired accounts (`acc-1`, `acc-2`, `acc-3`, `acc-N`) automatically provision and spin up dedicated isolated `gravwatch-agent` Docker containers on the fly via Docker socket integration, with automatic container deprovisioning upon account removal.

### Changed
- **Persistent Account Identity:** Auto-restores account name and email directly from persistent storage (`credentials.json`) upon server restarts and telemetry ingestion.
- **Eliminated Fake Fallbacks:** Removed all hardcoded 100% quota assumptions and synthetic numbers from both agent scrapers and dashboard telemetry streams.
- **Fast Telemetry Polling (20s):** Updated default polling interval from 300s to 20s for continuous, real-time dashboard quota updates.
- **Docker DNS & Network Resilience:** Configured Google DNS (`8.8.8.8`, `8.8.4.4`) across container services to eliminate IPv6 connection resets on Google CloudCode endpoints.
- **Streamlined Volume Mounts:** Removed redundant `~/.antigravity-agent` volume mounts in favor of standard single-source `~/.gemini/` volume.
- **Cleaned Unused Code & Assets:** Removed 7 unused template UI components and unreferenced test verification images in `clients/web/public/`.
- **Test Environment Isolation:** Isolated all test suites to temporary directories and in-memory SQLite, ensuring zero contamination of production `./data/` directories.

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
