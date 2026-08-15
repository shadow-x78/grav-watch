# دليل التثبيت والتشغيل - GravWatch

## 🌐 اللغة

<a href="INSTALL.md">🇬🇧 English</a> · <a href="INSTALL_AR.md">🇸🇦 العربية</a>

---

> أحدث إصدار: **v2.0.0** (عزل الحسابات المتعددة في حاويات، تجميع كوتا الموديلات الخمسة، وخادم REST API المركزي).

## 🚀 البدء السريع وتشغيل بيئة الحسابات المتعددة

يعمل GravWatch على أنظمة Linux المدعومة بـ Docker Engine و Docker Compose v2.

### 1. متطلبات النظام المسبقة

- **نظام التشغيل:** Linux (Debian, Ubuntu, Fedora, Arch, openSUSE)، أو macOS، أو Windows (WSL2).
- **Docker:** إصدار Docker Engine 24.0 فما فوق مع Docker Compose v2.20+.
- **Python:** Python 3.10+ (لتشغيل الاختبارات والسكربتات المستقلة).
- **الذاكرة (RAM):** توفر حوالي 1.5 جيجابايت كحد أدنى (~256 ميجابايت لكل حاوية).

---

### 2. خطوات التثبيت خطوة بخطوة

#### الخطوة 1: استنساخ المستودع
```bash
git clone https://github.com/shadow-x78/grav-watch.git ~/GravWatch
cd ~/GravWatch
```

#### الخطوة 2: ضبط المتغيرات البيئية
```bash
cp .env.example .env
```
قم بتحرير ملف `.env` لضبط المفاتيح:
```env
AGENT_API_KEY=your-secure-agent-key
MASTER_API_KEY=your-secure-master-key
SERVER_PORT=8000
```

#### الخطوة 3: توثيق الحسابات تفاعلياً
قم بتسجيل الدخول للحسابات وربط توكنات الجلسة بمجلدات الحاويات المعزولة عبر المساعد التفاعلي:
```bash
./scripts/setup-auth.sh
```

اتبع التعليمات على الشاشة (الخيارات من 1 إلى 4، أو إدخال أي معرف حساب مخصص مثل `acc-5`).

#### الخطوة 4: تشغيل منظومة الحسابات بالكامل
```bash
./scripts/docker-run.sh
```

---

## 🩺 التحقق من التشغيل لأول مرة

بعد تشغيل الحاويات، تحقق من صحة الخدمات ونقاط النهاية:

```bash
# فحص حالة الحاويات
docker compose -f packaging/docker/docker-compose.yml ps

# فحص صحة خادم الـ API المركزي
curl -s http://localhost:8000/api/v1/health

# جلب بيانات الكوتا المجمعة حياً
curl -s http://localhost:8000/api/v1/usage/latest | python3 -m json.tool

# متابعة سجلات السيرفر حياً
docker compose -f packaging/docker/docker-compose.yml logs -f server
```

افتح توثيق الـ API التفاعلي (Swagger) في متصفحك عبر:
**[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🛑 الإيقاف وإعادة التشغيل

لإيقاف جميع الحاويات دون فقدان توكنات الحسابات المسجلة:
```bash
docker compose -f packaging/docker/docker-compose.yml down
```

لإعادة تشغيلها لاحقاً:
```bash
docker compose -f packaging/docker/docker-compose.yml up -d
```

---

<div align="center">

بُني بواسطة <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
