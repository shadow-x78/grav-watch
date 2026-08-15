# البنية المعمارية لنظام GravWatch

يوضح هذا المستند التصميم المعماري، استراتيجية عزل الحسابات، بروتوكولات الاتصال، ونماذج البيانات لنظام **GravWatch**.

---

<a id="الفكرة-المعمارية"></a>
## 🏛️ 1. الفكرة المعمارية العامة

يقدم نظام **GravWatch** حلاً لمشكلة إدارة الحسابات المتعددة في **Google Antigravity CLI (`agy`)** عبر عزل بيئات التشغيل والتخزين داخل حاويات Docker خفيفة ومستقلة.

```mermaid
graph TD
    subgraph Host["البيئة الحاضنة (Docker Host)"]
        subgraph C1["حاوية acc-1 (Debian Slim - 256MB RAM)"]
            A1["جامع الكوتا services/agent"] -->|قراءة الأوامر| CLI1["agy CLI (الحساب 1)"]
            VOL1[("مجلد التوثيق: ./data/acc-1")] -.->|جلسة الدخول| CLI1
        end
        
        subgraph C2["حاوية acc-2 (Debian Slim - 256MB RAM)"]
            A2["جامع الكوتا services/agent"] -->|قراءة الأوامر| CLI2["agy CLI (الحساب 2)"]
            VOL2[("مجلد التوثيق: ./data/acc-2")] -.->|جلسة الدخول| CLI2
        end

        subgraph C3["حاوية acc-3 (Debian Slim - 256MB RAM)"]
            A3["جامع الكوتا services/agent"] -->|قراءة الأوامر| CLI3["agy CLI (الحساب 3)"]
            VOL3[("مجلد التوثيق: ./data/acc-3")] -.->|جلسة الدخول| CLI3
        end

        subgraph C4["حاوية acc-4 (Debian Slim - 256MB RAM)"]
            A4["جامع الكوتا services/agent"] -->|قراءة الأوامر| CLI4["agy CLI (الحساب 4)"]
            VOL4[("مجلد التوثيق: ./data/acc-4")] -.->|جلسة الدخول| CLI4
        end

        subgraph Backend["الخادم المركزي"]
            Server["خادم services/server (FastAPI)"]
            DB[("قاعدة البيانات: SQLite / PostgreSQL")]
            AlertEngine["محرك تنبيهات Discord Webhook"]
            Server <--> DB
            Server --> AlertEngine
        end

        A1 -->|POST /api/v1/usage| Server
        A2 -->|POST /api/v1/usage| Server
        A3 -->|POST /api/v1/usage| Server
        A4 -->|POST /api/v1/usage| Server
    end
```

---

<a id="تفاصيل-الأقسام"></a>
## 📁 2. تفاصيل أقسام المستودع القياسي

### 1. الخدمات الخلفية (`services/`)
- **`services/server/`**: خادم FastAPI المركزي غير التزامني ومحرك تنبيهات Discord وقاعدة البيانات.
- **`services/agent/`**: جامع الكوتا داخل الكونتينرات المعزولة.

### 2. الحزم والنشر (`packaging/`)
- **`packaging/docker/`**: ملفات Docker Compose وتكوينات الحاويات.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
