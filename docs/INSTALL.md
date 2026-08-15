# Installation and Deployment Guide

This guide covers setting up, configuring, and running **GravWatch** on your host system.

---

<a id="system-requirements"></a>
## 🖥️ 1. System Requirements

- **Operating System:** Linux (Debian/Ubuntu/Arch/Fedora/RHEL) or macOS / Windows WSL2.
- **Docker Engine:** v24.0+ and Docker Compose v2.20+.
- **Python:** Python 3.10+ (for local scripts and tests).
- **Memory:** At least 2GB RAM free on host (each container uses ~256MB).

---

<a id="setup-steps"></a>
## ⚙️ 2. Step-by-Step Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/shadow-x78/grav-watch.git
cd grav-watch
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` to configure your keys and optional Discord Webhook URL.

### Step 3: Interactive Account Authentication
```bash
./scripts/setup-auth.sh
```
Follow the on-screen menu to authenticate accounts `acc-1` through `acc-4`. Tokens are persisted in `./data/acc-X/`.

### Step 4: Start Services
```bash
./scripts/docker-run.sh
```

---

<a id="verifying-installation"></a>
## 🔍 3. Verifying Installation

- **Check container status:**
  ```bash
  docker compose -f packaging/docker/docker-compose.yml ps
  ```
- **Check resource utilization:**
  ```bash
  docker stats
  ```
- **Access Swagger UI:**
  Open [http://localhost:8000/docs](http://localhost:8000/docs) in your web browser.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
