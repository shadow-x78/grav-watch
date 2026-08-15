# دليل التثبيت والتشغيل الشامل

يوضح هذا الدليل خطوات إعداد وتكوين وتشغيل نظام **GravWatch** على السيرفر أو جهازك المحلي.

---

<a id="متطلبات-النظام"></a>
## 🖥️ 1. متطلبات النظام المسبقة

- **نظام التشغيل:** Linux (Debian, Ubuntu, Arch, Fedora, إلخ) أو macOS / Windows WSL2.
- **Docker:** إصدار 24.0 فما فوق مع Docker Compose v2.20+.
- **Python:** Python 3.10+ (للسكربتات والاختبارات).
- **الذاكرة:** توفر 2GB RAM على الأقل في الجهاز (يستهلك كل كونتينر حوالي 256MB).

---

<a id="خطوات-التثبيت"></a>
## ⚙️ 2. خطوات التثبيت والتشغيل

### الخطوة 1: استنساخ المستودع
```bash
git clone https://github.com/shadow-x78/grav-watch.git
cd grav-watch
```

### الخطوة 2: ضبط ملف البيئة
```bash
cp .env.example .env
```

### الخطوة 3: توثيق الحسابات الأربعة تفاعلياً
```bash
./scripts/setup-auth.sh
```

### الخطوة 4: تشغيل الحاويات
```bash
./scripts/docker-run.sh
```

---

<a id="التحقق-من-التشغيل"></a>
## 🔍 3. التحقق من سلامة التشغيل

- **عرض حالة الحاويات:**
  ```bash
  docker compose -f packaging/docker/docker-compose.yml ps
  ```
- **مراقبة الذاكرة والمعالج:**
  ```bash
  docker stats
  ```
- **فتح واجهة Swagger:**
  افتح المتصفح على الرابط [http://localhost:8000/docs](http://localhost:8000/docs).

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
