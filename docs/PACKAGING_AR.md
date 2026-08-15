# دليل الحزم ومواصفات الحاويات

يوضح هذا المستند معايير عزل الحاويات، حدود الموارد، وآليات التخزين الدائم في نظام **GravWatch**.

---

<a id="عزل-الحاويات"></a>
## 📦 1. استراتيجية عزل الحاويات

يتم تشغيل كل حساب Antigravity داخل بيئة Debian مستقلة:

```yaml
services:
  acc-1:
    build:
      context: ../..
      dockerfile: packaging/docker/Dockerfile.agent
    mem_limit: 256m
    cpus: 0.25
    volumes:
      - ../../data/acc-1:/root/.gemini
      - ../../data/acc-1-agent:/root/.antigravity-agent
```

---

<a id="حدود-الموارد"></a>
## ⚡ 2. قيود الموارد والأداء

| الخدمة | سقف الذاكرة | سقف المعالج | الوظيفة |
|---|---|---|---|
| `server` | بدون قيود | بدون قيود | خادم FastAPI المركزي وقاعدة البيانات |
| `acc-1` | 256 MB | 0.25 vCPU | جامع الكوتا للحساب الأساسي الأول |
| `acc-2` | 256 MB | 0.25 vCPU | جامع الكوتا لحساب العمل الثاني |
| `acc-3` | 256 MB | 0.25 vCPU | جامع الكوتا لحساب العمل الثالث |
| `acc-4` | 256 MB | 0.25 vCPU | جامع الكوتا لحساب العمل الرابع |

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[العودة إلى README](../README_AR.md)

<sub>&copy; 2026 GravWatch (shadow-x78)</sub>

</div>
