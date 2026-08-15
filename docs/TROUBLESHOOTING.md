# Troubleshooting - GravWatch

## 🌐 Language

<a href="TROUBLESHOOTING.md">🇬🇧 English</a> · <a href="TROUBLESHOOTING_AR.md">🇸🇦 العربية</a>

---

> Applies to **v2.0.0** and later.

## 📋 Table of Contents

### CI & Automated Testing

- [CI: Unit tests failing (`./scripts/run-tests.sh`)](#ci-tests)
- [CI: Linting errors or formatting failures](#ci-lint)

### Authentication & Account Sandboxing

- [Auth: Account reports `unauthenticated` in telemetry](#auth-unauthenticated)
- [Auth: OAuth login URL does not open or token expires](#auth-expired)
- [Auth: Permission denied on `./data/acc-X`](#auth-permissions)

### Container Runtime & Docker Compose

- [Runtime: Container exits immediately or crashes on boot](#runtime-crash)
- [Runtime: Port 8000 already in use](#runtime-port-conflict)
- [Runtime: Out of memory (OOM) killer terminating containers](#runtime-oom)

### Server & API Ingestion

- [Server: Telemetry ingestion returns 401 Unauthorized](#server-401)
- [Server: Database connection failures or locking](#server-db)

---

<a id="ci-tests"></a>
## 🧪 CI & Automated Testing: `./scripts/run-tests.sh` Failing

If unit tests fail locally or in CI:

1. Verify Python 3.10+ is active:
   ```bash
   python3 --version
   ```
2. Install test dependencies:
   ```bash
   ./scripts/setup-dev-env.sh
   ```
3. Run tests with verbose output:
   ```bash
   PYTHONPATH="services/server:services/agent" python3 -m unittest discover -s tests -v
   ```

---

<a id="ci-lint"></a>
## 💅 CI: Linting & Code Style

Ensure code follows PEP 8 without unused imports:
```bash
ruff check .
```

---

<a id="auth-unauthenticated"></a>
## 🔑 Auth: Account Reports `unauthenticated`

If a container logs `"status": "unauthenticated"`:

1. Re-run the interactive authentication helper:
   ```bash
   ./scripts/setup-auth.sh
   ```
2. Select the affected container (`acc-1`, `acc-2`, `acc-3`, or custom ID).
3. Complete the Google OAuth browser pairing and paste the authorization code.
4. Restart the container:
   ```bash
   docker compose -f packaging/docker/docker-compose.yml restart acc-1
   ```

---

<a id="auth-expired"></a>
## ⌛ Auth: OAuth Login URL / Token Expiration

If Google invalidates OAuth tokens after a period:

1. Clear stale tokens:
   ```bash
   rm -rf data/acc-1/*
   ```
2. Run `./scripts/setup-auth.sh` to obtain a fresh token.

---

<a id="auth-permissions"></a>
## 🛡️ Auth: Permission Denied on `./data/acc-X`

If the container cannot read or write to the mounted volume:

```bash
chmod 700 data/acc-1 data/acc-2 data/acc-3 data/acc-N
```

---

<a id="runtime-crash"></a>
## 💥 Runtime: Container Exits or Crashes on Boot

Inspect container logs to diagnose startup issues:

```bash
docker compose -f packaging/docker/docker-compose.yml logs -f acc-1
```

If the `agy` binary is not found, verify that `USE_MOCK_FALLBACK=true` is set in `.env` for development environments.

---

<a id="runtime-port-conflict"></a>
## 🚫 Runtime: Port 8000 Conflict

If another service is using port 8000:

1. Identify the blocking process:
   ```bash
   sudo lsof -i :8000
   ```
2. Change the host port mapping in `packaging/docker/docker-compose.yml` (e.g. `"8080:8000"`).

---

<a id="runtime-oom"></a>
## 📉 Runtime: Out of Memory (OOM)

Each container is capped at `256MB RAM`. To inspect real-time memory consumption:

```bash
docker stats
```

If memory spikes, check if `POLL_INTERVAL_SECONDS` is set too low (recommended: $\ge 300\text{ s}$).

---

<a id="server-401"></a>
## 🔒 Server: Telemetry Returns 401 Unauthorized

Ensure `AGENT_API_KEY` in `.env` matches across both server and agent container definitions:

```bash
grep AGENT_API_KEY .env
```

---

<a id="server-db"></a>
## 🗄️ Server: Database Connection

To verify SQLite database integrity:
```bash
sqlite3 data/server/gravwatch.db "PRAGMA integrity_check;"
```

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
