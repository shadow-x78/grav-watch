# Security Policy - GravWatch

> Applies to **v1.0.0** and later.

## 📋 Table of Contents

- [Supported Versions](#supported-versions)
- [Reporting a Vulnerability](#reporting)
- [Disclosure Policy](#disclosure)
- [Security Considerations](#considerations)

---

<a id="supported-versions"></a>
## 🛡️ Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x | ✅ Active development |
| < 1.0 | ❌ Not released |

Only the latest minor release receives security updates. Ensure you build from `main` before reporting.

---

<a id="reporting"></a>
## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in GravWatch, please report it **responsibly** and **privately**.

**Preferred method:**
- Open a private security advisory or issue on GitHub:
  [Security Advisories →](https://github.com/shadow-x78/grav-watch/issues)

**What to include:**

| Field | Details |
|-------|---------|
| Description | Clear explanation of the vulnerability |
| Reproduction | Steps to reproduce - minimal PoC if possible |
| Component | Affected module (server, agent, container) and version |
| Impact | Privilege escalation, token leak, data exposure, etc. |
| Fix | Suggested mitigation (optional) |

---

<a id="disclosure"></a>
## 📢 Disclosure Policy

- Vulnerabilities are acknowledged within **48 hours**.
- We will coordinate a patch before public disclosure.
- Please do not disclose vulnerabilities publicly until a fix is released.

---

<a id="considerations"></a>
## 🔒 Security Considerations

- **Container isolation:** Each account token directory (`./data/acc-X`) is mounted strictly into its dedicated container with `chmod 700` directory permissions.
- **Ingestion authentication:** Central server endpoints reject any telemetry submissions lacking a valid `X-Agent-Key` header matching `AGENT_API_KEY`.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
