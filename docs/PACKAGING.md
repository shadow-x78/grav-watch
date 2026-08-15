# Container & Packaging Specifications - GravWatch

## 🌐 Language

<a href="PACKAGING.md">🇬🇧 English</a> · <a href="PACKAGING_AR.md">🇸🇦 العربية</a>

---

> Applies to **v2.0.0** and later.

GravWatch packages its multi-account scraping agents and central hub into modular, hardened Docker containers to guarantee zero OAuth session cross-contamination and minimal host memory footprint.

---

## 📦 Container Architecture & Isolation Model

Each Antigravity CLI account is isolated in its own headless container:

```
Host Filesystem (data/)
├── acc-1/  ──(bind mount: chmod 700)──►  Container acc-1 (/root/.gemini)
├── acc-2/  ──(bind mount: chmod 700)──►  Container acc-2 (/root/.gemini)
├── acc-3/  ──(bind mount: chmod 700)──►  Container acc-3 (/root/.gemini)
├── acc-N/  ──(bind mount: chmod 700)──►  Container acc-N (/root/.gemini)
└── server/ ──(bind mount)─────────────►  Container server (/app/data)
```

---

## ⚡ Resource Quota Specifications

Strict hard resource caps are enforced via Docker Compose to keep host overhead negligible:

| Container | Base Image | Memory Limit | CPU Cap | Security & Volumes |
|---|---|---|---|---|
| `gravwatch-server` | `python:3.11-slim-bookworm` | Uncapped (Host shared) | Uncapped | Persistent SQLite DB in `./data/server` |
| `gravwatch-acc-1` | `python:3.11-slim-bookworm` | `256m` (Hard limit) | `0.25 vCPU` | Isolated `./data/acc-1` (chmod 700) |
| `gravwatch-acc-2` | `python:3.11-slim-bookworm` | `256m` (Hard limit) | `0.25 vCPU` | Isolated `./data/acc-2` (chmod 700) |
| `gravwatch-acc-3` | `python:3.11-slim-bookworm` | `256m` (Hard limit) | `0.25 vCPU` | Isolated `./data/acc-3` (chmod 700) |
| `gravwatch-acc-N` | `python:3.11-slim-bookworm` | `256m` (Hard limit) | `0.25 vCPU` | Isolated `./data/acc-N` (chmod 700) |

Total footprint per worker node is capped at **256 MB RAM** and **0.25 vCPU**.

---

## 🔨 Building Images Locally

### 1. Build Server Container
```bash
docker build -t gravwatch-server:latest -f packaging/docker/Dockerfile.server .
```

### 2. Build Agent Container
```bash
docker build -t gravwatch-agent:latest -f packaging/docker/Dockerfile.agent .
```

### 3. Build via Docker Compose
```bash
docker compose -f packaging/docker/docker-compose.yml build --no-cache
```

---

## 🔒 Directory Permissions & Security

Each account directory must be protected so that only the container process owner can read authentication tokens:

```bash
chmod 700 data/acc-1 data/acc-2 data/acc-3 data/acc-N
```

The `./scripts/setup-auth.sh` helper automatically provisions directories with `chmod 700` before starting OAuth pairing.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
