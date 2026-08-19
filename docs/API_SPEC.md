# API Specification - GravWatch

## 🌐 Language

<a href="API_SPEC.md">🇬🇧 English</a> · <a href="API_SPEC_AR.md">🇸🇦 العربية</a>

---

> Applies to **v2.5.0** and later. Base path: `/api/v1`

---

## 📋 Table of Contents

- [Authentication & Session Management](#auth-api)
- [Ingestion Endpoints](#ingestion)
- [Query & Pool Aggregation](#query)
- [Diagnostic Endpoints](#diagnostics)
- [Official Model Categories](#categories)

---

<a id="auth-api"></a>
## 🔐 1. Authentication & Session Management (No Linux Terminal Needed)

### `POST /api/v1/auth/token`
Submit Google OAuth tokens or full credentials JSON to pair an account directly via API.

**Payload (`AuthTokenPayload`):**
```json
{
  "account_id": "acc-1",
  "account_label": "Account 1 (Primary)",
  "email": "dev@corp.google.dev",
  "access_token": "ya29.a0AfH6SM...",
  "refresh_token": "1//04...",
  "oauth_credentials_json": null
}
```

**Response (`200 OK`):**
```json
{
  "account_id": "acc-1",
  "authenticated": true,
  "email": "dev@corp.google.dev",
  "last_token_update": "2026-08-16T19:50:00Z",
  "message": "Successfully authenticated and paired session for acc-1 via API."
}
```

### `GET /api/v1/auth/status`
Inspect authentication and session health across all registered accounts.

**Response (`200 OK`):**
```json
[
  {
    "account_id": "acc-1",
    "authenticated": true,
    "email": "dev@corp.google.dev",
    "last_token_update": "2026-08-16T19:50:00Z",
    "message": "Authenticated"
  }
]
```

---

<a id="ingestion"></a>
## 📥 2. Ingestion Endpoints

### `POST /api/v1/usage`
Receives a point-in-time quota telemetry snapshot matching official Google Antigravity UI categories.

**Headers:**
```http
Content-Type: application/json
X-Agent-Key: gravwatch-agent-secret-key
```

**Payload (`UsageIngestRequest`):**
```json
{
  "account_id": "acc-1",
  "account_label": "Account 1",
  "email": "dev@corp.google.dev",
  "tier": "Pro Developer",
  "status": "healthy",
  "timestamp": "2026-08-16T19:50:00Z",
  "categories": [
    {
      "category_id": "gemini-models",
      "category_name": "Gemini Models",
      "weekly_limit": {
        "percentage_remaining": 54.0,
        "refresh_in_human": "fully refreshes in 5 days"
      },
      "five_hour_limit": {
        "percentage_remaining": 79.0,
        "refresh_in_human": "fully refreshes in 4 hours, 18 minutes"
      }
    },
    {
      "category_id": "claude-gpt-models",
      "category_name": "Claude and GPT models",
      "weekly_limit": {
        "percentage_remaining": 100.0,
        "refresh_in_human": "fully refreshes in 6 days"
      },
      "five_hour_limit": {
        "percentage_remaining": 100.0,
        "refresh_in_human": "fully refreshes in 5 hours"
      }
    }
  ],
  "models": []
}
```

---

<a id="query"></a>
## 📊 3. Query & Pool Aggregation

### `GET /api/v1/usage/latest`
Returns consolidated pool capacity, category averages, and individual account metrics.

**Response (`200 OK`):**
```json
{
  "timestamp": "2026-08-16T19:50:00Z",
  "pool_summary": {
    "total_accounts": 1,
    "online_accounts": 1,
    "overall_weekly_remaining": 77.0,
    "overall_five_hour_remaining": 89.5,
    "category_summaries": [
      {
        "category_id": "gemini-models",
        "category_name": "Gemini Models",
        "weekly_limit_remaining": 54.0,
        "five_hour_limit_remaining": 79.0,
        "weekly_refresh_human": "fully refreshes in 5 days",
        "five_hour_refresh_human": "fully refreshes in 4 hours, 18 minutes"
      },
      {
        "category_id": "claude-gpt-models",
        "category_name": "Claude and GPT models",
        "weekly_limit_remaining": 100.0,
        "five_hour_limit_remaining": 100.0,
        "weekly_refresh_human": "fully refreshes in 6 days",
        "five_hour_refresh_human": "fully refreshes in 5 hours"
      }
    ],
    "model_summaries": []
  },
  "accounts": []
}
```

---

<a id="diagnostics"></a>
## 🩺 4. Diagnostic Endpoints

### `GET /api/v1/health`
```json
{
  "status": "healthy",
  "service": "gravwatch-server",
  "version": "2.4.4",
  "timestamp": "2026-08-19T18:40:00Z"
}
```

---

<a id="categories"></a>
## 🤖 5. Official Model Categories

| Category Name | Category ID | Models Included |
|---|---|---|
| **Gemini Models** | `gemini-models` | `Gemini Flash`, `Gemini Pro` |
| **Claude and GPT models** | `claude-gpt-models` | `Claude Sonnet`, `Claude Opus`, `GPT OSS` |

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> & <a href="https://github.com/mohmed-hegaze">mohmed-hegaze</a> ·
[Changelog](../CHANGELOG.md) ·
[Back to README](../README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
