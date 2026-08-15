# مواصفات واجهة الـ API البرمجية

جميع نقاط النهاية تعمل تحت المسار الأساسي: `/api/v1`

---

<a id="التوثيق-والأمان"></a>
## 🔐 1. التوثيق والأمان

| الهدف | نوع التوثيق | الـ Header المطلوب |
|---|---|---|
| استقبال البيانات (`/usage`) | مفتاح الـ Agent | `X-Agent-Key: <AGENT_API_KEY>` |
| نقاط التشخيص والعرض | عام / Master Key | اختياري `Authorization: Bearer <MASTER_KEY>` |

---

<a id="نقاط-الاستقبال"></a>
## 📥 2. نقاط استقبال البيانات (Ingestion)

### `POST /api/v1/usage`
استقبال لقطة الكوتا من أي حاوية عاملة (`services/agent`).

**Headers الطلب:**
```http
Content-Type: application/json
X-Agent-Key: gravwatch-agent-secret-key
```

**جسم الطلب (JSON Body):**
```json
{
  "account_id": "acc-1",
  "account_label": "Account 1 (Primary)",
  "email": "dev1@corp.ai",
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

---

<a id="نقاط-الاستعلام"></a>
## 📤 3. نقاط الاستعلام والعرض

### `GET /api/v1/usage/latest`
جلب أحدث بيانات الكوتا لجميع الحسابات مع السعة التراكمية المجمعة (Pool Summary).

### `GET /api/v1/usage/history`
جلب السجل الزمني للنقاط لرسم المخططات البيانية.
- `account_id` (اختياري)
- `range` (`1h`, `24h`, `7d`, `30d`)

---

<a id="الفحص-والتنبيهات"></a>
## 🛠️ 4. الفحص والتنبيهات

### `POST /api/v1/accounts/test-alert`
إرسال تنبيه تجريبي مباشر إلى سيرفر ديسكورد للتأكد من عمل الـ Webhook.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
