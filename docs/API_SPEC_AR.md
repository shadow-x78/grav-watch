# مواصفات واجهة برمجة التطبيقات (API) - GravWatch

## 🌐 اللغة

<a href="API_SPEC.md">🇬🇧 English</a> · <a href="API_SPEC_AR.md">🇸🇦 العربية</a>

---

> يسري هذا التوثيق على الإصدار **v2.4.1** فما فوق. المسار الأساسي: `/api/v1`

---

## 📋 جدول المحتويات

- [التوثيق وإدارة الجلسات عبر الـ API](#auth-api)
- [نقاط استقبال البيانات (Ingestion)](#ingestion)
- [نقاط الاستعلام وتجميع الكوتا (Query & Pooling)](#query)
- [نقاط الفحص والتشخيص](#diagnostics)
- [فئات النماذج الرسمية](#categories)

---

<a id="auth-api"></a>
## 🔐 1. التوثيق وإدارة الجلسات عبر الـ API (بدون الحاجة لطرفية لينكس)

### `POST /api/v1/auth/token`
إرسال توكنات Google OAuth أو كائن بيانات الجلسة الكامل لربط الحساب بالخلفية مباشرة دون فتح أي سطر أوامر.

**بيانات الطلب (`AuthTokenPayload`):**
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

**الاستجابة (`200 OK`):**
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
التحقق من حالة التوثيق وصحة الجلسة لكافة الحسابات المسجلة.

---

<a id="ingestion"></a>
## 📥 2. نقاط استقبال البيانات

### `POST /api/v1/usage`
استقبال لقطة الكوتا من جامع البيانات المعزول مطابقة لمجموعات واجهة Antigravity الرسمية.

**الترويسات:**
```http
Content-Type: application/json
X-Agent-Key: gravwatch-agent-secret-key
```

**بيانات الطلب (`UsageIngestRequest`):**
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
## 📊 3. نقاط الاستعلام وتجميع الكوتا

### `GET /api/v1/usage/latest`
استعراض الكوتا المجمعة الإجمالية ومتوسطات المجموعات ومؤشرات الحسابات.

**الاستجابة (`200 OK`):**
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
## 🩺 4. نقاط الفحص والتشخيص

### `GET /api/v1/health`
```json
{
  "status": "healthy",
  "service": "gravwatch-server",
  "version": "2.4.1",
  "timestamp": "2026-08-19T18:10:00Z"
}
```

---

<a id="categories"></a>
## 🤖 5. فئات النماذج الرسمية

| اسم المجموعة | المعرّف (`category_id`) | النماذج المشمولة |
|---|---|---|
| **Gemini Models** | `gemini-models` | `Gemini Flash`, `Gemini Pro` |
| **Claude and GPT models** | `claude-gpt-models` | `Claude Sonnet`, `Claude Opus`, `GPT OSS` |

---

<div align="center">

بُني بواسطة <a href="https://github.com/shadow-x78">shadow-x78</a> و <a href="https://github.com/mohmed-hegaze">mohmed-hegaze</a> ·
[سجل التغييرات](../CHANGELOG.md) ·
[العودة للرئيسية](../README_AR.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
