# Troubleshooting Guide

This guide covers common issues and resolutions when setting up or running **GravWatch**.

---

<a id="authentication-issues"></a>
## 🔑 1. Authentication Issues

### Problem: Agent reports `"status": "unauthenticated"`
- **Cause:** Google OAuth token expired, missing, or volume mount path mismatch.
- **Resolution:**
  1. Re-run `./scripts/setup-auth.sh` and select the affected account.
  2. Complete the OAuth code paste.
  3. Verify token files exist in `./data/acc-X/`.
  4. Restart the container:
     ```bash
     docker compose -f packaging/docker/docker-compose.yml restart acc-X
     ```

---

<a id="network-connectivity"></a>
## 🌐 2. Network & Server Connectivity

### Problem: Agent logs `"Failed to connect to server"`
- **Cause:** Server container is offline or port 8000 is conflicted.
- **Resolution:**
  1. Check server container logs:
     ```bash
     docker compose -f packaging/docker/docker-compose.yml logs -f server
     ```
  2. Ensure port 8000 is open:
     ```bash
     docker compose -f packaging/docker/docker-compose.yml ps
     ```

---

<a id="discord-alerts"></a>
## 🚨 3. Discord Alerts

### Problem: Discord test alert fails
- **Cause:** `DISCORD_WEBHOOK_URL` in `.env` is invalid or empty.
- **Resolution:**
  1. Open Discord -> Server Settings -> Integrations -> Webhooks.
  2. Copy webhook URL into `.env`.
  3. Restart server container:
     ```bash
     docker compose -f packaging/docker/docker-compose.yml restart server
     ```

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
