# مواصفات الحزم والحاويات - GravWatch

## 🌐 اللغة

<a href="PACKAGING.md">🇬🇧 English</a> · <a href="PACKAGING_AR.md">🇸🇦 العربية</a>

---

> يسري هذا التوثيق على الإصدار **v2.0.0** فما فوق.

يقوم نظام GravWatch بتجميع خدمات جمع الكوتا والخادم المركزي في حاويات Docker معزولة ومحمية لضمان عدم تعارض جلسات توثيق Google OAuth نهائياً وتقليل استهلاك موارد الجهاز المضيف.

---

## 📦 معمارية الحاويات ونموذج العزل

يتم عزل كل حساب Antigravity CLI داخل حاوية مستقلة تماماً:

```
مجلدات الجهاز المضيف (data/)
├── acc-1/  ──(ربط مجلد: chmod 700)──►  حاوية acc-1 (/root/.gemini)
├── acc-2/  ──(ربط مجلد: chmod 700)──►  حاوية acc-2 (/root/.gemini)
├── acc-3/  ──(ربط مجلد: chmod 700)──►  حاوية acc-3 (/root/.gemini)
├── acc-N/  ──(ربط مجلد: chmod 700)──►  حاوية acc-N (/root/.gemini)
└── server/ ──(ربط مجلد)─────────────►  حاوية server (/app/data)
```

---

## ⚡ مواصفات قيود الموارد (Resource Quotas)

يتم فرض حدود صارمة على الموارد عبر Docker Compose للحفاظ على خفة النظام:

| الحاوية | الصورة الأساسية | سقف الذاكرة | سقف المعالج | الأمان ومجلدات التخزين |
|---|---|---|---|---|
| `gravwatch-server` | `python:3.11-slim-bookworm` | بدون قيود (مشترك) | بدون قيود | تخزين دائم لقاعدة البيانات في `./data/server` |
| `gravwatch-acc-1` | `python:3.11-slim-bookworm` | `256m` (حد أقصى) | `0.25 vCPU` | مجلد معزول `./data/acc-1` (chmod 700) |
| `gravwatch-acc-2` | `python:3.11-slim-bookworm` | `256m` (حد أقصى) | `0.25 vCPU` | مجلد معزول `./data/acc-2` (chmod 700) |
| `gravwatch-acc-3` | `python:3.11-slim-bookworm` | `256m` (حد أقصى) | `0.25 vCPU` | مجلد معزول `./data/acc-3` (chmod 700) |
| `gravwatch-acc-N` | `python:3.11-slim-bookworm` | `256m` (حد أقصى) | `0.25 vCPU` | مجلد معزول `./data/acc-N` (chmod 700) |

إجمالي استهلاك كل حاوية عاملة يظل محكوماً بـ **256 ميجابايت RAM** و **0.25 معالج vCPU**.

---

## 🔨 بناء الحاويات محلياً

### 1. بناء حاوية الخادم المركزي
```bash
docker build -t gravwatch-server:latest -f packaging/docker/Dockerfile.server .
```

### 2. بناء حاوية جامع الكوتا (Agent)
```bash
docker build -t gravwatch-agent:latest -f packaging/docker/Dockerfile.agent .
```

### 3. بناء جميع الحاويات عبر Docker Compose
```bash
docker compose -f packaging/docker/docker-compose.yml build --no-cache
```

---

## 🔒 تصاريح المجلدات والأمان

يجب حماية مجلدات الحسابات بحيث لا يمكن قراءة توكنات التوثيق إلا من قبل الحاوية المعنية:

```bash
chmod 700 data/acc-1 data/acc-2 data/acc-3 data/acc-N
```

يقوم سكربت `./scripts/setup-auth.sh` بإنشاء وتعيين هذه التصاريح تلقائياً قبل بدء تسجيل الدخول.

---

<div align="center">

بُني بواسطة <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
