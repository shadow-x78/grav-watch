# System Architecture

This document describes the architectural design, isolation strategy, communication protocols, and data models of **GravWatch**.

---

<a id="high-level-concept"></a>
## 🏛️ 1. High-Level Concept

**GravWatch** solves the multi-account problem in Google Antigravity CLI (`agy`) by providing process and filesystem isolation using lightweight Docker containers.

```mermaid
graph TD
    subgraph Host["Docker Host (Single Host Deployment)"]
        subgraph C1["Container acc-1 (Debian Slim - 256MB RAM)"]
            A1["gravwatch-agent (services/agent)"] -->|Subprocess| CLI1["agy CLI (Account 1)"]
            VOL1[("Volume: ./data/acc-1")] -.->|Auth Session| CLI1
        end
        
        subgraph C2["Container acc-2 (Debian Slim - 256MB RAM)"]
            A2["gravwatch-agent (services/agent)"] -->|Subprocess| CLI2["agy CLI (Account 2)"]
            VOL2[("Volume: ./data/acc-2")] -.->|Auth Session| CLI2
        end

        subgraph C3["Container acc-3 (Debian Slim - 256MB RAM)"]
            A3["gravwatch-agent (services/agent)"] -->|Subprocess| CLI3["agy CLI (Account 3)"]
            VOL3[("Volume: ./data/acc-3")] -.->|Auth Session| CLI3
        end

        subgraph C4["Container acc-4 (Debian Slim - 256MB RAM)"]
            A4["gravwatch-agent (services/agent)"] -->|Subprocess| CLI4["agy CLI (Account 4)"]
            VOL4[("Volume: ./data/acc-4")] -.->|Auth Session| CLI4
        end

        subgraph Backend["Central Hub"]
            Server["gravwatch-server (services/server FastAPI)"]
            DB[("SQLite / PostgreSQL")]
            AlertEngine["Discord Alert Engine"]
            Server <--> DB
            Server --> AlertEngine
        end

        A1 -->|POST /api/v1/usage| Server
        A2 -->|POST /api/v1/usage| Server
        A3 -->|POST /api/v1/usage| Server
        A4 -->|POST /api/v1/usage| Server
    end
```

---

<a id="monorepo-layout"></a>
## 📁 2. Core Monorepo Layout

### 1. Backend Services (`services/`)
- **`services/server/`**: Async FastAPI hub, SQLite/PostgreSQL storage, pool aggregation, and Discord alerts.
- **`services/agent/`**: Lightweight container daemon periodically scraping `agy` usage.

### 2. Packaging & Deployment (`packaging/`)
- **`packaging/docker/`**: Compose specifications with hard memory limits (`mem_limit: 256m`) and persistent token volumes.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
