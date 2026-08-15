# Installation Guide - GravWatch

## 🌐 Language

<a href="INSTALL.md">🇬🇧 English</a> · <a href="INSTALL_AR.md">🇸🇦 العربية</a>

---

> Latest release: **v2.0.0** (Scalable multi-account container isolation, 5-model Antigravity quota pooling, REST API hub).

## 🚀 Quick Start & Multi-Account Deployment

GravWatch runs on Linux hosts with Docker Engine and Docker Compose v2.

### 1. System Requirements

- **Operating System:** Linux (Debian, Ubuntu, Fedora, Arch, openSUSE), macOS, or Windows (WSL2).
- **Docker:** Docker Engine 24.0+ and Docker Compose v2.20+.
- **Python:** Python 3.10+ (for running test suites or standalone scripts).
- **RAM:** ~1.5 GB minimum free memory (~256 MB per container node).

---

### 2. Step-by-Step Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/shadow-x78/grav-watch.git ~/GravWatch
cd ~/GravWatch
```

#### Step 2: Configure Environment
```bash
cp .env.example .env
```
Edit `.env` to configure your API keys and parameters:
```env
AGENT_API_KEY=your-secure-agent-key
MASTER_API_KEY=your-secure-master-key
SERVER_PORT=8000
```

#### Step 3: Interactive Multi-Account OAuth Pairing
Pair your Google accounts with dedicated container volumes using the interactive terminal assistant:
```bash
./scripts/setup-auth.sh
```

Follow the on-screen prompts (Options 1 through 4, or enter custom account identifiers like `acc-5`).

#### Step 4: Launch Entire Multi-Account Stack
```bash
docker compose -f packaging/docker/docker-compose.yml up -d
```

---

## 🩺 First-Run Verification

After launching the stack, verify container health and endpoints:

```bash
# Check container status
docker compose -f packaging/docker/docker-compose.yml ps

# Check central API health endpoint
curl -s http://localhost:8000/api/v1/health

# Check live pooled telemetry
curl -s http://localhost:8000/api/v1/usage/latest | python3 -m json.tool

# Stream logs in real time
docker compose -f packaging/docker/docker-compose.yml logs -f server
```

Open interactive Swagger documentation in your browser at:
**[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🛑 Stopping and Restarting

To stop all running containers without losing OAuth tokens:
```bash
docker compose -f packaging/docker/docker-compose.yml down
```

To start them again:
```bash
docker compose -f packaging/docker/docker-compose.yml up -d
```

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
