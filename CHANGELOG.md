# Changelog - GravWatch

All notable changes to GravWatch will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [v1.0.0] - 2026-08-15

### 🚀 Highlights
- **Multi-Account Container Sandboxing:** Process and filesystem isolation for up to 4 concurrent Google Antigravity CLI (`agy`) accounts using lightweight Debian slim containers (capped at 256MB RAM per node).
- **Autonomous Telemetry Agent:** Lightweight daemon parsing ANSI terminal tables and JSON metrics from `agy -p /usage`.
- **Consolidated FastAPI Hub:** High-performance async REST API with SQLite/PostgreSQL storage and pooled capacity aggregation.
- **Discord Alert Engine:** Automated webhook rich embed notifications triggered at $\ge 85\%$ quota utilization.

### ✨ Added
- **Container sandboxes:** Dedicated Debian slim containers (`acc-1` to `acc-4`) with persistent volume bindings (`./data/acc-X`).
- **CLI parser engine:** Resilient extraction of requests per minute, daily limits, and reset timers for Gemini Flash, Gemini Pro, Claude Sonnet, and DeepSeek.
- **REST API Endpoints:** `/api/v1/usage`, `/api/v1/usage/latest`, `/api/v1/usage/history`, `/api/v1/accounts`, `/api/v1/health`, `/api/v1/accounts/test-alert`.
- **Developer automation:** Direct automation scripts (`./scripts/setup-dev-env.sh`, `./scripts/run-tests.sh`, `./scripts/setup-auth.sh`, `./scripts/docker-run.sh`) and root `.env.example`.
- **Standard packaging:** PEP 621 compliant `pyproject.toml` specification.

### ⚡ Optimized
- **Minimal memory footprint:** Hard limit of 256MB RAM and 0.25 vCPU cap per container node.
- **Sub-second test execution:** Complete test suite runs in `< 0.1s`.

### 🔒 Security & Isolation
- **Token isolation:** Process boundaries completely eliminate OAuth session cross-contamination.
- **Agent authentication:** Secured ingestion endpoint via `X-Agent-Key` header verification.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
