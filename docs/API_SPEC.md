# REST API Specification

All endpoints are served under the base prefix: `/api/v1`

---

<a id="authentication"></a>
## 🔐 1. Authentication

| Target | Auth Type | Header |
|---|---|---|
| Ingestion Endpoints (`/usage`) | API Key | `X-Agent-Key: <AGENT_API_KEY>` |
| Diagnostic Endpoints | Open / Master Key | Optional `Authorization: Bearer <MASTER_KEY>` |

---

<a id="ingestion-endpoints"></a>
## 📥 2. Ingestion Endpoints

### `POST /api/v1/usage`
Ingests telemetry snapshot from containerized agents (`services/agent`).

**Request Headers:**
```http
Content-Type: application/json
X-Agent-Key: gravwatch-agent-secret-key
```

**Request Body:**
```json
{
  "account_id": "acc-1",
  "account_label": "Account 1 (Primary)",
  "email": "developer@corp.ai",
  "tier": "Pro Developer",
  "status": "healthy",
  "timestamp": "2026-08-15T03:30:00Z",
  "models": [
    {
      "model_id": "gemini-3.5-flash",
      "model_name": "Gemini 3.5 Flash",
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

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Recorded telemetry for acc-1"
}
```

---

<a id="query-endpoints"></a>
## 📤 3. Query Endpoints

### `GET /api/v1/usage/latest`
Fetches the latest status and model quotas across all registered accounts, including the aggregated pool.

**Response (200 OK):**
```json
{
  "timestamp": "2026-08-15T03:30:00Z",
  "pool_summary": {
    "total_accounts": 4,
    "online_accounts": 4,
    "total_requests_used": 1830,
    "total_requests_limit": 4000,
    "overall_percentage": 45.8,
    "model_summaries": [
      {
        "model_id": "gemini-3.5-flash",
        "model_name": "Gemini 3.5 Flash",
        "total_used": 1830,
        "total_limit": 4000,
        "pool_percentage": 45.8,
        "active_accounts_count": 4
      }
    ]
  },
  "accounts": [ ... ]
}
```

### `GET /api/v1/usage/history`
Returns time-series data for charting.

**Parameters:**
- `account_id` (optional string): Filter to a specific account.
- `range` (string): `1h`, `24h`, `7d`, `30d` (default: `24h`).

---

<a id="diagnostics-and-testing"></a>
## 🛠️ 4. Diagnostics & Testing

### `POST /api/v1/accounts/test-alert`
Sends a test webhook to the configured Discord channel.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
