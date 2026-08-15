# مواصفات واجهة الـ API البرمجية - GravWatch

## 🌐 اللغة

<a href="API_SPEC.md">🇬🇧 English</a> · <a href="API_SPEC_AR.md">🇸🇦 العربية</a>

---

> يسري هذا التوثيق على الإصدار **v2.0.0** فما فوق. المسار الأساسي: `/api/v1`

---

## 📋 جدول المحتويات

- [التوثيق والترويسات](#التوثيق-والترويسات)
- [نقاط استقبال البيانات](#نقاط-الاستقبال)
- [نقاط الاستعلام والسعة المجمعة](#نقاط-الاستعلام)
- [نقاط الفحص والتشخيص](#نقاط-الفحص)
- [معرفات النماذج المعتمدة](#معرفات-النماذج)

---

<a id="التوثيق-والترويسات"></a>
## 🔐 1. التوثيق والترويسات المطلوبة

| الهدف | نوع التوثيق | الـ Header المطلوب |
|---|---|---|
| استقبال البيانات (`POST /api/v1/usage`) | مفتاح سري مشترك | `X-Agent-Key: <AGENT_API_KEY>` |
| الاستعلام والفحص | عام / مفتوح | بدون |

---

<a id="نقاط-الاستقبال"></a>
## 📥 2. نقاط استقبال البيانات (Ingestion)

### `POST /api/v1/usage`
استقبال لقطة الكوتا من أي حاوية عاملة.

**الترويسات:**
```http
Content-Type: application/json
X-Agent-Key: gravwatch-agent-secret-key
```

**جسم الطلب (JSON Body):**
```json
{
  "account_id": "acc-1",
  "account_label": "Account 1",
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

**الاستجابة (`201 Created`):**
```json
{
  "success": true,
  "message": "Recorded telemetry for acc-1"
}
```

---

<a id="نقاط-الاستعلام"></a>
## 📤 3. نقاط الاستعلام والسعة المجمعة

### `GET /api/v1/usage/latest`
جلب أحدث بيانات الحسابات المسجلة وحساب السعة التراكمية الإجمالية لكافة الحسابات.

**الاستجابة (`200 OK`):**
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
  "accounts": [ ... ]
}
```

### `GET /api/v1/usage/history`
جلب السجل الزمني للنقاط لرسم المخططات البيانية.
- `account_id` (اختياري)
- `range` (`1h`, `24h`, `7d`, `30d`)

---

<a id="نقاط-الفحص"></a>
## 🛠️ 4. نقاط الفحص والتشخيص

### `GET /api/v1/health`
فحص جاهزية الخادم.
```json
{
  "status": "healthy",
  "service": "gravwatch-server",
  "version": "2.0.0"
}
```

---

<a id="معرفات-النماذج"></a>
## 🤖 5. معرفات موديلات Antigravity المعتمدة

| الاسم المعتمد | معرف النموذج (ID) | وحدة القياس |
|---|---|---|
| **Gemini Flash** | `gemini-flash` | طلبات يومياً |
| **Gemini Pro** | `gemini-pro` | طلبات يومياً |
| **Claude Sonnet** | `claude-sonnet` | طلبات يومياً |
| **Claude Opus** | `claude-opus` | طلبات يومياً |
| **GPT OSS** | `gpt-oss` | طلبات يومياً |

---

<div align="center">

بُني بواسطة <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
