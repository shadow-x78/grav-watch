<div align="center">

<img src="data/gravwatch.svg" alt="GravWatch" width="160" />

# GravWatch

Multi-account Google Antigravity CLI quota monitoring & telemetry engine — isolated containers & centralized API

[![Version](https://img.shields.io/badge/version-1.0.0-2563eb?style=flat-square&logo=semver)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-GPL--3.0-dc2626?style=flat-square)](LICENSE)
![Python](https://img.shields.io/badge/python-3.10%2B-3776ab?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/fastapi-0.109%2B-009688?style=flat-square&logo=fastapi)
![Docker](https://img.shields.io/badge/docker-compose%20v2-2496ed?style=flat-square&logo=docker)
[![Stars](https://img.shields.io/github/stars/shadow-x78/grav-watch?style=flat-square&color=eab308&logo=github)](https://github.com/shadow-x78/grav-watch/stargazers)

</div>

---

## 🌐 Language

<a href="README.md">🇬🇧 English</a> · <a href="README_AR.md">🇸🇦 العربية</a>

---

## 📋 Table of Contents

- [What is GravWatch?](#what-is-gravwatch)
- [Why GravWatch Exists](#why-gravwatch-exists)
- [Highlights](#highlights)
- [Status](#status)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

<a id="what-is-gravwatch"></a>
## 🤔 What is GravWatch?

**GravWatch** is a lightweight, distributed telemetry and quota aggregation engine built specifically for the **Google Antigravity CLI (`agy`)**. It runs up to **4 isolated Google accounts concurrently** inside minimal headless Docker containers (`debian:bookworm-slim`, capped at ~256MB RAM per container) to completely eliminate OAuth session conflicts.

Each containerized agent periodically parses quota metrics and streams telemetry to a central **FastAPI** hub, calculating pooled capacity across all developer accounts and dispatching automated **Discord Webhook** alerts when quotas reach capacity limits.

---

<a id="why-gravwatch-exists"></a>
## 🧭 Why GravWatch Exists

| Problem | Standard Workarounds | GravWatch |
|---------|---------------------|-----------|
| **OAuth Session Collisions** | ❌ Switching accounts locally overwrites tokens | ✅ Strict process & volume isolation per container (`./data/acc-X`) |
| **Resource Overhead** | ❌ Heavy VMs consuming 4GB+ RAM | ✅ Ultra-light Debian slim containers (256MB RAM & 0.25 vCPU cap) |
| **Fragmented Visibility** | ❌ Checking quotas one by one in terminal | ✅ Unified pooled capacity across all 4 developer accounts |
| **Quota Depletion Surprises** | ❌ Discovering quota exhaustion during live coding | ✅ Automated Discord alerts triggered at $\ge 85\%$ threshold |
| **Zero Maintenance** | ❌ Complex setups requiring desktop GUIs | ✅ Headless terminal-first daemon running in background |

---

<a id="highlights"></a>
## ✨ Highlights

- 🔒 **Zero Token Collisions**: True multi-account isolation with persistent Docker volume mounts.
- ⚡ **Minimal Footprint**: Strict memory limits (`256MB RAM`) and CPU caps (`0.25 vCPU`) per container node.
- 🤖 **Smart Telemetry Parser**: Resilient parser supporting ANSI terminal tables, JSON flags, and dev simulation.
- 📊 **Aggregated Quota Pool**: Calculates pooled requests, limits, and combined utilization percentage across all accounts for Gemini Flash, Gemini Pro, Claude Sonnet, and DeepSeek.
- 🚨 **Automated Discord Alerts**: Dispatches rich embed alerts whenever any model quota hits $\ge 85\%$.
- 🚀 **REST API Hub**: FastAPI async backend providing real-time telemetry endpoints and interactive Swagger docs.

---

<a id="status"></a>
## 📊 Status

| Component | Technology | Target | State |
|-----------|------------|--------|-------|
| **Account Isolation** | Docker Compose (`debian:bookworm-slim`) | Multi-account token sandboxing | ![Stable](https://img.shields.io/badge/status-stable-10b981?style=flat-square) |
| **Agent Collector** | Python 3.11 (`subprocess` + `requests`) | Headless quota daemon | ![Stable](https://img.shields.io/badge/status-stable-10b981?style=flat-square) |
| **API Server** | FastAPI + SQLAlchemy (Async) | Central telemetry ingestion hub | ![Stable](https://img.shields.io/badge/status-stable-10b981?style=flat-square) |

---

<a id="quick-start"></a>
## ⚡ Quick Start

### 1. Clone & Configure
```bash
git clone https://github.com/shadow-x78/grav-watch.git
cd grav-watch
cp .env.example .env
```

### 2. Interactive OAuth Authentication
Authenticate your 4 accounts sequentially using the interactive terminal helper:
```bash
./scripts/setup-auth.sh
```

### 3. Launch Entire Stack
```bash
./scripts/docker-run.sh
```

- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Live Pooled Telemetry**: [http://localhost:8000/api/v1/usage/latest](http://localhost:8000/api/v1/usage/latest)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

<a id="commands"></a>
## 💻 Commands

| Action | Command | Description |
|---|---|---|
| **Setup Dev Environment** | `./scripts/setup-dev-env.sh` | Install Python dependencies for server & agent |
| **Run Test Suite** | `./scripts/run-tests.sh` | Execute all unit and integration test suites |
| **Authenticate Accounts** | `./scripts/setup-auth.sh` | Interactive Google OAuth account pairing assistant |
| **Start Stack** | `./scripts/docker-run.sh` | Build and start all containers via Docker Compose |
| **Stop Stack** | `docker compose -f packaging/docker/docker-compose.yml down` | Stop all running containers |
| **Check Status** | `docker compose -f packaging/docker/docker-compose.yml ps` | Inspect status of all containers |
| **Stream Logs** | `docker compose -f packaging/docker/docker-compose.yml logs -f` | View container logs in real time |

---

<a id="architecture"></a>
## 🏛️ Architecture

```
┌─────────────────────────────── Docker Host ───────────────────────────────┐
│                                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ container-01  │  │ container-02  │  │ container-03  │  │ container-04│ │
│  │ Debian slim   │  │ Debian slim   │  │ Debian slim   │  │ Debian slim │ │
│  │ 256MB RAM max │  │ 256MB RAM max │  │ 256MB RAM max │  │ 256MB RAM   │ │
│  │ agy (Acc 1)   │  │ agy (Acc 2)   │  │ agy (Acc 3)   │  │ agy (Acc 4) │ │
│  │ agent-daemon  │  │ agent-daemon  │  │ agent-daemon  │  │ agent-daemon│ │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘ │
│          │  HTTP POST /api/v1/usage (with X-Agent-Key header)     │       │
│          └───────────────────┴───────────────────┴────────────────┘       │
│                                     ▼                                     │
│                        ┌─────────────────────────┐                        │
│                        │   gravwatch-server      │                        │
│                        │   (FastAPI + SQLite/PG) │                        │
│                        └───────────┬─────────────┘                        │
│                                    │                                      │
│                        ┌───────────┴─────────────┐                        │
│                        │  Discord Alert Engine   │                        │
│                        │  (Webhook at ≥ 85%)     │                        │
│                        └─────────────────────────┘                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

<a id="documentation"></a>
## 📚 Documentation

| English Guide | Arabic Guide | Subject |
|---|---|---|
| [System Architecture](docs/ARCHITECTURE.md) | [البنية المعمارية](docs/ARCHITECTURE_AR.md) | Distributed design & container isolation |
| [Installation & Deployment](docs/INSTALL.md) | [دليل التثبيت والتشغيل](docs/INSTALL_AR.md) | Full setup, requirements & production steps |
| [Packaging & Containers](docs/PACKAGING.md) | [دليل الحزم والمواصفات](docs/PACKAGING_AR.md) | Memory caps & persistent volume mounts |
| [Troubleshooting Guide](docs/TROUBLESHOOTING.md) | [دليل حل المشاكل](docs/TROUBLESHOOTING_AR.md) | Auth recovery, diagnostics & alerts |
| [REST API Specification](docs/API_SPEC.md) | [مواصفات الـ API](docs/API_SPEC_AR.md) | Endpoints, payloads & schemas |

---

<a id="contributing"></a>
## 🤝 Contributing

Contributions are warmly welcomed! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting pull requests.

---

<a id="license"></a>
## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a>

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
