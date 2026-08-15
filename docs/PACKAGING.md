# Packaging & Container Specifications

This document outlines container isolation parameters, resource quotas, and volume persistence in **GravWatch**.

---

<a id="container-isolation"></a>
## 📦 1. Container Isolation

Each Antigravity CLI account runs in a dedicated Debian minimal environment:

```yaml
services:
  acc-1:
    build:
      context: ../..
      dockerfile: packaging/docker/Dockerfile.agent
    mem_limit: 256m
    cpus: 0.25
    volumes:
      - ../../data/acc-1:/root/.gemini
      - ../../data/acc-1-agent:/root/.antigravity-agent
```

---

<a id="resource-limits"></a>
## ⚡ 2. Resource Caps

| Service | Memory Cap | CPU Cap | Purpose |
|---|---|---|---|
| `server` | Unlimited (host shared) | Unlimited | Central FastAPI telemetry hub |
| `acc-1` | 256 MB | 0.25 vCPU | Primary developer account agent |
| `acc-2` | 256 MB | 0.25 vCPU | Worker developer account agent |
| `acc-3` | 256 MB | 0.25 vCPU | Worker developer account agent |
| `acc-4` | 256 MB | 0.25 vCPU | Worker developer account agent |

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
