# API Specification - GravWatch

## 🌐 Language

<a href="API_SPEC.md">🇬🇧 English</a> · <a href="API_SPEC_AR.md">🇸🇦 العربية</a>

---

> Applies to **v2.0.0** and later. Base path: `/api/v1`

---

## 📋 Table of Contents

- [Authentication & Headers](#authentication)
- [Ingestion Endpoints](#ingestion)
- [Query & Aggregation Endpoints](#query)
- [Diagnostic Endpoints](#diagnostics)
- [Model Identifiers](#models)

---

<a id="authentication"></a>
## 🔐 1. Authentication & Headers

| Endpoint Target | Auth Type | Required Header |
|---|---|---|
| Ingestion (`POST /api/v1/usage`) | Shared Secret | `X-Agent-Key: <AGENT_API_KEY>` |
| Diagnostic / Query | Open / Public | None |

---

<a id="ingestion"></a>
## 📥 2. Ingestion Endpoints

### `POST /api/v1/usage`
Receives a point-in-time quota telemetry snapshot from an isolated container agent.

**Headers:**
```http
Content-Type: application/json
X-Agent-Key: gravwatch-agent-secret-key
```

**Payload Schema (`UsageIngestRequest`):**
```json
{
  "account_id": "acc-1",
  "account_label": "Account 1 (Primary)",
  "email": "developer@corp.dev",
  "tier": "Pro Developer",
  "status": "healthy",
  "timestamp": "2026-08-15T03:30:00Z",
  "models": [
    {
      "model_id": "gemini-flash",
      "model_name": "Gemini Flash",
      "used": 140,
      "limit": 1000,
      "percentage": 14.0,
      "unit": "requests",
      "resets_in_human": "03h 45m",
      "resets_at": "2026-08-15T06:00:00Z"
    }
  ]
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Recorded telemetry for acc-1"
}
```

---

<a id="query"></a>
## 📤 3. Query & Aggregation Endpoints

### `GET /api/v1/usage/latest`
Fetches the latest registered status of every account alongside the calculated multi-account pooled capacity.

**Response (`200 OK` - `LatestUsageResponse`):**
```json
{
  "timestamp": "2026-08-15T03:30:00Z",
  "pool_summary": {
    "total_accounts": 3,
    "online_accounts": 3,
    "total_requests_used": 1830,
    "total_requests_limit": 4000,
    "overall_percentage": 45.8,
    "model_summaries": [
      {
        "model_id": "gemini-flash",
        "model_name": "Gemini Flash",
        "total_used": 1830,
        "total_limit": 4000,
        "pool_percentage": 45.8,
        "active_accounts_count": 3
      }
    ]
  },
  "accounts": [
    {
      "id": "acc-1",
      "label": "Account 1",
      "email": "developer@corp.dev",
      "tier": "Pro Developer",
      "status": "healthy",
      "last_seen_at": "2026-08-15T03:30:00Z",
      "models": [ ... ]
    }
  ]
}
```

### `GET /api/v1/usage/history`
Returns chronological snapshot metrics for time-series charts.

**Query Parameters:**
- `account_id` (optional string): Filter to a specific account.
- `range` (string, default `24h`): `1h`, `24h`, `7d`, `30d`.

### `GET /api/v1/accounts`
Lists registered accounts and metadata.

---

<a id="diagnostics"></a>
## 🛠️ 4. Diagnostic Endpoints

### `GET /api/v1/health`
Liveness probe.
```json
{
  "status": "healthy",
  "service": "gravwatch-server",
  "version": "2.0.0"
}
```

---

<a id="models"></a>
## 🤖 5. Supported Antigravity Model Identifiers

| Canonical Name | Model Identifier | Default Metric Unit |
|---|---|---|
| **Gemini Flash** | `gemini-flash` | Requests / Day |
| **Gemini Pro** | `gemini-pro` | Requests / Day |
| **Claude Sonnet** | `claude-sonnet` | Requests / Day |
| **Claude Opus** | `claude-opus` | Requests / Day |
| **GPT OSS** | `gpt-oss` | Requests / Day |

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
