# دليل حل المشاكل - GravWatch

## 🌐 اللغة

<a href="TROUBLESHOOTING.md">🇬🇧 English</a> · <a href="TROUBLESHOOTING_AR.md">🇸🇦 العربية</a>

---

> يسري هذا التوثيق على الإصدار **v2.0.0** فما فوق.

## 📋 جدول المحتويات

### الاختبارات المؤتمتة والـ CI

- [فشل اختبارات الوحدة (`./scripts/run-tests.sh`)](#ci-tests)
- [أخطاء التنسيق وفحص الكود](#ci-lint)

### التوثيق وعزل الحسابات

- [حالة الحساب تظهر `unauthenticated` في البيانات](#auth-unauthenticated)
- [رابط تسجيل الدخول أو انتهاء صلاحية التوكن](#auth-expired)
- [مشكلة تصاريح المجلد `./data/acc-X`](#auth-permissions)

### بيئة تشغيل الحاويات و Docker Compose

- [توقف أو انهيار الحاوية عند الإقلاع](#runtime-crash)
- [تعارض المنفذ 8000 مع خدمة أخرى](#runtime-port-conflict)
- [نفاد الذاكرة وإيقاف الحاوية (OOM)](#runtime-oom)

### الخادم واستقبال الـ API

- [رفض استقبال البيانات بخطأ 401 Unauthorized](#server-401)
- [فحص سلامة قاعدة البيانات](#server-db)

---

<a id="ci-tests"></a>
## 🧪 الاختبارات المؤتمتة: فشل `./scripts/run-tests.sh`

إذا فشلت الاختبارات محلياً أو في مسار الـ CI:

1. تأكد من توفر Python 3.10 فما فوق:
   ```bash
   python3 --version
   ```
2. ثبّت اعتماديات الاختبار:
   ```bash
   ./scripts/setup-dev-env.sh
   ```
3. شغّل الاختبارات مع تفاصيل التقرير:
   ```bash
   PYTHONPATH="services/server:services/agent" python3 -m unittest discover -s tests -v
   ```

---

<a id="ci-lint"></a>
## 💅 فحص جودة وتنسيق الكود

تأكد من مطابقة الكود لمعايير PEP 8 بدون استيرادات غير مستخدمة:
```bash
ruff check .
```

---

<a id="auth-unauthenticated"></a>
## 🔑 التوثيق: حالة الحساب تظهر `unauthenticated`

إذا سجلت الحاوية حالة غير موثقة:

1. شغّل المساعد التفاعلي لتسجيل الدخول:
   ```bash
   ./scripts/setup-auth.sh
   ```
2. اختر الحاوية المعنية (`acc-1`, `acc-2`, `acc-3`, أو معرف مخصص).
3. افتح رابط توثيق Google الصادر في المتصفح وألصق الكود الناتج.
4. أعد تشغيل الحاوية:
   ```bash
   docker compose -f packaging/docker/docker-compose.yml restart acc-1
   ```

---

<a id="auth-expired"></a>
## ⌛ التوثيق: انتهاء صلاحية جلسة Google

إذا ألغت Google جلسة التوثيق بعد فترة زمنية:

1. احذف الملفات القديمة:
   ```bash
   rm -rf data/acc-1/*
   ```
2. شغّل `./scripts/setup-auth.sh` للحصول على جلسة جديدة.

---

<a id="auth-permissions"></a>
## 🛡️ التوثيق: رفض تصاريح المجلد `./data/acc-X`

إذا تعذر على الحاوية قراءة أو كتابة التوكن:

```bash
chmod 700 data/acc-1 data/acc-2 data/acc-3 data/acc-N
```

---

<a id="runtime-crash"></a>
## 💥 بيئة التشغيل: توقف الحاوية عند الإقلاع

افحص سجلات الحاوية لمعرفة سبب التوقف:

```bash
docker compose -f packaging/docker/docker-compose.yml logs -f acc-1
```

إذا لم تكن أداة `agy` متوفرة أثناء التطوير المحلي، تأكد من ضبط `USE_MOCK_FALLBACK=true` في `.env`.

---

<a id="runtime-port-conflict"></a>
## 🚫 بيئة التشغيل: تعارض المنفذ 8000

إذا كان المنفذ 8000 مستخدماً من تطبيق آخر:

1. تحقق من التطبيق الذي يشغل المنفذ:
   ```bash
   sudo lsof -i :8000
   ```
2. عدل منفذ المضيف في `packaging/docker/docker-compose.yml` (مثلاً: `"8080:8000"`).

---

<a id="runtime-oom"></a>
## 📉 بيئة التشغيل: نفاد الذاكرة (OOM)

تلتزم كل حاوية بسقف `256MB RAM`. لمراقبة استهلاك الموارد المباشر:

```bash
docker stats
```

إذا ارتفع الاستهلاك، تأكد من عدم ضبط `POLL_INTERVAL_SECONDS` على رقم صغير جداً (الموصى به $\ge 300\text{ ثانية}$).

---

<a id="server-401"></a>
## 🔒 الخادم: رفض البيانات بخطأ 401 Unauthorized

تأكد من تطابق قيمة `AGENT_API_KEY` في ملف `.env` بين الخادم والحاويات:

```bash
grep AGENT_API_KEY .env
```

---

<a id="server-db"></a>
## 🗄️ الخادم: فحص سلامة قاعدة البيانات

للتحقق من سلامة قاعدة بيانات SQLite:
```bash
sqlite3 data/server/gravwatch.db "PRAGMA integrity_check;"
```

---

<div align="center">

بُني بواسطة <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
