<div align="center">

<img src="data/gravwatch.svg" alt="GravWatch" width="160" />

# GravWatch

محرك مراقبة وتجميع كوتا Antigravity CLI عبر عدة حسابات معزولة في حاويات Docker - خادم API وتنبيهات فورية

[![Version](https://img.shields.io/badge/version-1.0.0-2563eb?style=flat-square&logo=semver)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-GPL--3.0-dc2626?style=flat-square)](LICENSE)
![Python](https://img.shields.io/badge/python-3.10%2B-3776ab?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/fastapi-0.109%2B-009688?style=flat-square&logo=fastapi)
![Docker](https://img.shields.io/badge/docker-compose%20v2-2496ed?style=flat-square&logo=docker)
[![Stars](https://img.shields.io/github/stars/shadow-x78/grav-watch?style=flat-square&color=eab308&logo=github)](https://github.com/shadow-x78/grav-watch/stargazers)

</div>

---

## 🌐 اللغة

<a href="README.md">🇬🇧 English</a> · <a href="README_AR.md">🇸🇦 العربية</a>

---

## 📋 جدول المحتويات

- [ما هو GravWatch؟](#ما-هو-gravwatch)
- [لماذا تم بناء هذا المشروع؟](#لماذا-تم-بناء-هذا-المشروع)
- [أبرز الميزات](#أبرز-الميزات)
- [حالة المكونات](#حالة-المكونات)
- [البدء السريع](#البدء-السريع)
- [أوامر وسكربتات المطورين](#أوامر-وسكربتات-المطورين)
- [البنية المعمارية](#البنية-المعمارية)
- [فهرس التوثيق الفني](#فهرس-التوثيق-الفني)
- [المساهمة](#المساهمة)
- [الترخيص](#الترخيص)

---

<a id="ما-هو-gravwatch"></a>
## 🤔 ما هو GravWatch؟

**GravWatch** هو نظام خفيف، موزّع ومفتوح المصدر لمراقبة وتجميع كوتا **Google Antigravity CLI (`agy`)** عبر **4 حسابات مستقلة في نفس الوقت**. يتم تشغيل وعزل كل حساب داخل **حاوية Docker مستقلة (Debian slim بحد أقصى ~256MB RAM)** لمنع تعارض جلسات توثيق Google OAuth نهائياً.

يقوم سكربت خفيف داخل كل حاوية بجمع بيانات الكوتا دورياً وإرسالها إلى خادم مركزي بـ **FastAPI**، والذي يحسب السعة الإجمالية المجمعة عبر كافة الحسابات ويرسل تنبيهات **Discord Webhook** فور اقتراب أي كوتا من النفاد (≥ 85%).

---

<a id="لماذا-تم-بناء-هذا-المشروع"></a>
## 🧭 لماذا تم بناء هذا المشروع؟

| المشكلة | الحلول التقليدية | نظام GravWatch |
|---------|------------------|----------------|
| **تعارض جلسات OAuth** | ❌ تبديل الحسابات يمسح التوكن المحلي دائماً | ✅ عزل تام للعمليات ومجلدات التخزين لكل حاوية (`./data/acc-X`) |
| **استهلاك الموارد** | ❌ استخدام آلات افتراضية ثقيلة تستهلك 4GB+ RAM | ✅ حاويات Debian slim فائقة الخفة (256MB RAM و 0.25 vCPU فقط) |
| **تشتت الرؤية والمتابعة** | ❌ فحص كل حساب على حدة يدوياً عبر الطرفية | ✅ سعة مجمعة موحدة (Pooled Quota) عبر كافة الحسابات بنظرة واحدة |
| **مفاجآت نفاد الكوتا** | ❌ انقطاع الخدمة فجأة أثناء جلسات البرمجة الحية | ✅ تنبيهات Discord Webhook تلقائية عند بلوغ حد الاستهلاك 85% |
| **انعدام الصيانة** | ❌ إعدادات معقدة تتطلب واجهات سطح مكتب | ✅ تشغيل صامت عبر الطرفية يعمل كخلفية دائمة |

---

<a id="أبرز-الميزات"></a>
## ✨ أبرز الميزات

- 🔒 **عزل تام لجلسات التوثيق**: 4 حاويات منفصلة لكل منها مجلد دائم لحفظ توكنات الدخول دون الحاجة لواجهات رسومية.
- ⚡ **استهلاك موارد فائق الخفة**: قيود صارمة على الذاكرة (`mem_limit: 256m`) والمعالج (`cpus: 0.25`) لكل حاوية.
- 🤖 **تحليل ذكي لمخرجات CLI**: استخراج دقيق للجداول ونصوص ANSI وجداول كوتا نماذج Gemini 3.5 Flash, Gemini 3.5 Pro, Claude Sonnet 4.6, DeepSeek.
- 📊 **حساب السعة الإجمالية المجمعة (Total Pool)**: دمج إحصائيات الحسابات الأربعة لعرض الاستهلاك الكلي ونسب الاستخدام التراكمية.
- 🚨 **تنبيهات فورية في Discord**: إرسال بطاقات غنية (Embeds) للقنوات المحددة عند اقتراب الكوتا من النفاد.
- 🚀 **خادم REST API فائق السرعة**: مبني بـ FastAPI ويوفر توثيق Swagger تفاعلي ونقاط نهاية لحظية.

---

<a id="حالة-المكونات"></a>
## 📊 حالة المكونات

| المكون | التقنية | الهدف | الحالة |
|---|---|---|---|
| **عزل الحسابات** | Docker Compose (`debian:bookworm-slim`) | عزل توكنات الحسابات الأربعة | ![Stable](https://img.shields.io/badge/status-stable-10b981?style=flat-square) |
| **جامع الكوتا (Agent)** | Python 3.11 (`subprocess` + `requests`) | خدمة جمع خلفية بدون واجهة | ![Stable](https://img.shields.io/badge/status-stable-10b981?style=flat-square) |
| **الخادم المركزي** | FastAPI + SQLAlchemy (Async) | خادم استقبال وتجميع البيانات | ![Stable](https://img.shields.io/badge/status-stable-10b981?style=flat-square) |

---

<a id="البدء-السريع"></a>
## ⚡ البدء السريع

### 1. استنساخ المستودع والإعداد
```bash
git clone https://github.com/shadow-x78/grav-watch.git
cd grav-watch
cp .env.example .env
```

### 2. توثيق الحسابات الأربعة تفاعلياً
```bash
./scripts/setup-auth.sh
```

### 3. تشغيل النظام بالكامل
```bash
./scripts/docker-run.sh
```

- **توثيق الـ API التفاعلي (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **نقطة جلب الكوتا المجمعة**: [http://localhost:8000/api/v1/usage/latest](http://localhost:8000/api/v1/usage/latest)
- **فحص صحة الخادم**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

<a id="أوامر-وسكربتات-المطورين"></a>
## 💻 أوامر وسكربتات المطورين

| الإجراء | الأمر المباشر | الوظيفة |
|---|---|---|
| **تثبيت الاعتماديات** | `./scripts/setup-dev-env.sh` | تثبيت اعتماديات بايثون للسيرفر والـ Agent |
| **تشغيل الاختبارات** | `./scripts/run-tests.sh` | تشغيل كافة اختبارات الوحدة واختبارات التكامل |
| **توثيق الحسابات** | `./scripts/setup-auth.sh` | مساعد تسجيل دخول Google OAuth التفاعلي للحسابات |
| **تشغيل النظام** | `./scripts/docker-run.sh` | بناء وتشغيل جميع الحاويات عبر Docker Compose |
| **إيقاف النظام** | `docker compose -f packaging/docker/docker-compose.yml down` | إيقاف جميع الحاويات الشغالة |
| **فحص الحالة** | `docker compose -f packaging/docker/docker-compose.yml ps` | فحص حالة الحاويات |
| **متابعة السجلات** | `docker compose -f packaging/docker/docker-compose.yml logs -f` | متابعة سجلات الحاويات حياً |

---

<a id="البنية-المعمارية"></a>
## 🏛️ البنية المعمارية

```
┌─────────────────────────────── Docker Host ───────────────────────────────┐
│                                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ container-01  │  │ container-02  │  │ container-03  │  │ container-04│ │
│  │ Debian slim   │  │ Debian slim   │  │ Debian slim   │  │ Debian slim │ │
│  │ 256MB RAM max │  │ 256MB RAM max │  │ 256MB RAM max │  │ 256MB RAM   │ │
│  │ agy (حساب 1)  │  │ agy (حساب 2)  │  │ agy (حساب 3)  │  │ agy (حساب 4)│ │
│  │ agent-daemon  │  │ agent-daemon  │  │ agent-daemon  │  │ agent-daemon│ │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘ │
│          │  HTTP POST /api/v1/usage (مع مفتاح تحقق X-Agent-Key)   │       │
│          └───────────────────┴───────────────────┴────────────────┘       │
│                                     ▼                                     │
│                        ┌─────────────────────────┐                        │
│                        │   gravwatch-server      │                        │
│                        │   (FastAPI + SQLite/PG) │                        │
│                        └───────────┬─────────────┘                        │
│                                    │                                      │
│                        ┌───────────┴─────────────┐                        │
│                        │  محرك تنبيهات Discord   │                        │
│                        │  (Webhook عند ≥ 85%)    │                        │
│                        └─────────────────────────┘                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

<a id="فهرس-التوثيق-الفني"></a>
## 📚 فهرس التوثيق الفني

| الدليل الإنجليزي | الدليل العربي | الموضوع |
|---|---|---|
| [System Architecture](docs/ARCHITECTURE.md) | [البنية المعمارية](docs/ARCHITECTURE_AR.md) | التصميم الموزع وعزل الحاويات |
| [Installation & Deployment](docs/INSTALL.md) | [دليل التثبيت والتشغيل](docs/INSTALL_AR.md) | دليل التثبيت والمتطلبات وتشغيل الإنتاج |
| [Packaging & Containers](docs/PACKAGING.md) | [دليل الحزم والمواصفات](docs/PACKAGING_AR.md) | قيود الذاكرة والتخزين الدائم للتوكنات |
| [Troubleshooting Guide](docs/TROUBLESHOOTING.md) | [دليل حل المشاكل](docs/TROUBLESHOOTING_AR.md) | استعادة التوثيق والتشخيص والتنبيهات |
| [REST API Specification](docs/API_SPEC.md) | [مواصفات الـ API](docs/API_SPEC_AR.md) | نقاط النهاية ونماذج البيانات |

---

<a id="المساهمة"></a>
## 🤝 المساهمة

نرحب بمساهمات الجميع! يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) قبل تقديم أي تعديلات.

---

<a id="الترخيص"></a>
## 📜 الترخيص

هذا المشروع مرخص تحت رخصة **GNU General Public License v3.0 (GPLv3)**. تفاصيل الترخيص في ملف [LICENSE](LICENSE).

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a>

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
