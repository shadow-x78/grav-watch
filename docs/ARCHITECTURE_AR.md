# مواصفات البنية المعمارية - GravWatch

## 🌐 اللغة

<a href="ARCHITECTURE.md">🇬🇧 English</a> · <a href="ARCHITECTURE_AR.md">🇸🇦 العربية</a>

---

> يسري هذا التوثيق على الإصدار **v2.1.0** فما فوق.

تم تصميم نظام GravWatch كمحرك موزّع ومعزول بالحاويات لمراقبة وتجميع بيانات الكوتا، حيث يفصل بين عزل الحسابات، وقراءة مخرجات أداة CLI، وحفظ البيانات غير التزامني في قاعدة البيانات، وحساب السعة المجمعة، وتوزيعها عبر REST API.

---

## 🏛 نظرة عامة على معمارية النظام

```mermaid
graph TD
    subgraph الجهاز المضيف / محرك Docker
        subgraph حاوية acc-1 (Debian Slim - 256MB RAM)
            A1[مجلد: ./data/acc-1] -->|توكن Google OAuth| B1(agy CLI - الحساب 1)
            B1 -->|مخرجات الجداول| C1(جامع الكوتا services/agent)
        end
        
        subgraph حاوية acc-2 (Debian Slim - 256MB RAM)
            A2[مجلد: ./data/acc-2] -->|توكن Google OAuth| B2(agy CLI - الحساب 2)
            B2 -->|مخرجات الجداول| C2(جامع الكوتا services/agent)
        end

        subgraph حاوية acc-3 (Debian Slim - 256MB RAM)
            A3[مجلد: ./data/acc-3] -->|توكن Google OAuth| B3(agy CLI - الحساب 3)
            B3 -->|مخرجات الجداول| C3(جامع الكوتا services/agent)
        end

        subgraph حاوية acc-N (Debian Slim - 256MB RAM)
            AN[مجلد: ./data/acc-N] -->|توكن Google OAuth| BN(agy CLI - الحساب N)
            BN -->|مخرجات الجداول| CN(جامع الكوتا services/agent)
        end

        subgraph المركز الرئيسي (services/server)
            Server[خادم FastAPI غير التزامني - api/]
            DB[(قاعدة بيانات SQLite / PostgreSQL غير تزامنية - core/database)]
            Aggregator[محرك تجميع السعة الكلية - engine/]

            Server <--> DB
            Server --> Aggregator
        end

        C1 -->|POST /api/v1/usage (X-Agent-Key)| Server
        C2 -->|POST /api/v1/usage (X-Agent-Key)| Server
        C3 -->|POST /api/v1/usage (X-Agent-Key)| Server
        CN -->|POST /api/v1/usage (X-Agent-Key)| Server
    end
```

---

## 📦 هيكل خدمات المستودع (Topology)

| الخدمة / المجلد | المسؤولية | الاعتماديات الأساسية |
|---|---|---|
| `services/server/core` | إعدادات التطبيق، محرك قاعدة البيانات غير التزامني، وحماية الـ API | `pydantic-settings`, `sqlalchemy`, `aiosqlite` |
| `services/server/models` | جداول قاعدة البيانات ونماذج التحقق Pydantic | `sqlalchemy`, `pydantic` |
| `services/server/engine` | محرك تجميع السعة التراكمية والاستعلام عن السجل الزمني | `sqlalchemy` |
| `services/server/api` | مسارات الـ REST API المعيارية (`/health`, `/usage`, `/accounts`) | `fastapi` |
| `services/agent/core` | إعدادات بيئة الـ Agent داخل الحاوية | `dataclasses` |
| `services/agent/collector` | تنفيذ أوامر CLI وتحليل جداول كوتا ANSI | `re`, `subprocess` |
| `services/agent/mock` | مولد الكوتا المحاكاة لنماذج Antigravity الخمسة | `random` |
| `clients/web` | لوحة تحكم المتصفح الحية ومحاكي توجيه الأوامر (Next.js 16, Tailwind CSS v4, TypeScript) | `next`, `react`, `tailwindcss`, `recharts`, `lucide-react` |
| `clients/android` | تطبيق أندرويد الأصلي للأجهزة الذكية واللوحية | `Jetpack Compose`, `Material 3` |
| `packaging/docker` | تعريفات Docker Compose وملفات Dockerfile وسكربت نقطة الدخول | `docker-compose v2`, `debian:bookworm-slim`, `node:20-alpine` |
| `tests` | اختبارات الوحدة للمحلل واختبارات التكامل للخادم وقاعدة البيانات | `httpx`, `unittest` |
| `scripts` | سكربتات الأتمتة المباشرة للإعداد، والتثبيت، والإدارة | `bash`, `docker`, `python3`, `npm` |

---

## ⚡ مراحل تدفق وتجميع بيانات الكوتا

1. **عزل الحسابات:** ترتبط كل حاوية (`acc-1` إلى `acc-N`) بمجلد تخزين مستقل `./data/acc-X` مع تصاريح `chmod 700`. تقرأ أداة `agy` التوكنات مباشرة من `/root/.gemini` دون التداخل مع الحاويات الأخرى.
2. **الجمع الدوري:**
   - تعمل خدمة الـ Agent داخل كل حاوية بشكل متكرر وتنفذ أمر `agy -p /usage` كل `POLL_INTERVAL_SECONDS` (افتراضياً: 300 ثانية).
   - عند استقبال جدول نصوص ANSI، تقوم دالة `clean_ansi()` بإزالة أكواد الألوان واستخراج بيانات الاستهلاك، والحد الأقصى، ومؤقت التصفير لنماذج **Gemini Flash, Gemini Pro, Claude Sonnet, Claude Opus, GPT OSS**.
   - في حال غياب التوثيق أثناء الاختبار، تستخدم الخدمة بيانات محاكاة دقيقة إذا كان `USE_MOCK_FALLBACK=true`.
3. **استقبال البيانات بالخادم:**
   - يرسل الـ Agent طلب `POST` إلى `http://server:8000/api/v1/usage` مع الترويسة `X-Agent-Key`.
   - يتحقق الخادم من صحة المفتاح، ويحدث بيانات الحساب `Account`، وينشئ لقطة كوتا جديدة `UsageSnapshot` مع أسطر النماذج `ModelQuota`.
4. **تجميع السعة الكلية (Pool Aggregation):**
   - عند طلب `/api/v1/usage/latest`، تقرأ دالة `compute_latest_pool_summary()` آخر لقطة لكل حساب مسجل.
   - تقوم بجمع إجمالي الطلبات المستخدمة والسعة القصوى وحساب نسبة الاستهلاك المجمعة لكل نموذج عبر الحسابات المتصلة.

---

## 🌐 عقود واجهة الـ API (Contract)

| نقطة النهاية | الطريقة | التوثيق / Headers | ملخص البيانات | الاستجابة |
|---|---|---|---|---|
| `/api/v1/health` | GET | بدون | بدون | `{"status":"healthy","service":"gravwatch-server","version":"2.0.0"}` |
| `/api/v1/usage` | POST | `X-Agent-Key: <key>` | `{account_id, timestamp, models: [...]}` | `201 Created {"success":true,"message":"..."}` |
| `/api/v1/usage/latest` | GET | بدون | بدون | `200 OK LatestUsageResponse (pool_summary + accounts)` |
| `/api/v1/usage/history` | GET | بدون | Query: `account_id`, `range=24h` | `200 OK HistoryResponse (series: [...])` |
| `/api/v1/accounts` | GET | بدون | بدون | `200 OK List[AccountDetailResponse]` |

---

## 🔌 تحسينات الأداء واستقبال البيانات

- **قاعدة بيانات غير تزامنية بالكامل:** مبنية على SQLAlchemy 2.0 Async Session مع عمليات commit غير حاجزة.
- **قيود صارمة على الموارد:** تلتزم كل حاوية بسقف `mem_limit: 256m` ومعالج `cpus: 0.25` داخل Docker Compose.

---

## 🔁 دورة حياة الحاويات وعزلها

- تعمل خدمة `services/agent/agent.py` كـ PID 1 في كل حاوية عبر السكربت `packaging/docker/entrypoint.sh`.
- تتواصل الحاويات داخلياً عبر شبكة الجسر الخاصة `gravwatch-net`.
- لا توجد أي متطلبات لواجهة رسومية على الجهاز المضيف.

---

<div align="center">

بُني بواسطة <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
