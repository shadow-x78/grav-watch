# دليل حل المشاكل الشائعة

يوضح هذا الدليل أبرز المشاكل التي قد تواجهك أثناء إعداد أو تشغيل **GravWatch** وكيفية معالجتها.

---

<a id="مشاكل-التوثيق"></a>
## 🔑 1. مشاكل التوثيق وحسابات Google

### المشكلة: حالة الحساب تظهر `"unauthenticated"`
- **السبب:** انتهاء صلاحية الجلسة أو عدم اكتمال تسجيل الدخول في المجلد المخصص.
- **الحل:**
  1. أعد تشغيل سكربت التوثيق: `./scripts/setup-auth.sh`
  2. اختر الحساب المعني وألصق كود التوثيق.
  3. تأكد من وجود ملفات الجلسة داخل المجلد `./data/acc-X/`.
  4. أعد تشغيل حاوية الحساب:
     ```bash
     docker compose -f packaging/docker/docker-compose.yml restart acc-X
     ```

---

<a id="مشاكل-الاتصال"></a>
## 🌐 2. مشاكل الاتصال بالخادم

### المشكلة: ظهور خطأ اتصال بالخادم في سجلات الـ Agent
- **السبب:** خادم السيرفر متوقف أو تعارض في المنفذ 8000.
- **الحل:**
  1. افحص سجلات الخادم: `docker compose -f packaging/docker/docker-compose.yml logs -f server`
  2. تأكد من عمل الحاويات: `docker compose -f packaging/docker/docker-compose.yml ps`

---

<a id="تنبيهات-ديسكورد"></a>
## 🚨 3. تنبيهات Discord Webhook

### المشكلة: فشل إرسال تنبيه التجربة لـ Discord
- **السبب:** رابط `DISCORD_WEBHOOK_URL` غير معرف في ملف `.env`.
- **الحل:**
  1. أنشئ Webhook جديد في سيرفر ديسكورد وانسخ الرابط إلى `.env`.
  2. أعد تشغيل حاوية السيرفر:
     ```bash
     docker compose -f packaging/docker/docker-compose.yml restart server
     ```

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
