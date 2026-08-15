# Changelog - GravWatch

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-08-15

### Added
- **Official Antigravity 5-Model Parser:** Canonical parser standardization for Gemini Flash, Gemini Pro, Claude Sonnet, Claude Opus, and GPT OSS.
- **Dynamic Multi-Account Scaling:** Extended architecture and interactive auth CLI (`./scripts/setup-auth.sh`) to support arbitrary $N$ accounts dynamically.
- **Upcoming Client Roadmaps:** Added technical roadmap for upcoming Web Dashboard and native Android App client.

### Changed
- **Version Major Bump:** Upgraded release target to `v2.0.0` reflecting breaking API cleanup and architecture generalization.
- **Documentation Overhaul:** 100% style, vocabulary, and structural alignment with Orbiscreen technical documentation guidelines.

### Removed
- **Discord Webhook Subsystem:** Completely eliminated external webhook dependencies and test endpoints, refocusing the engine purely on high-performance REST API telemetry and pool aggregation.

---

## [1.0.0] - 2026-08-15

### Added
- **Multi-Account Container Sandboxing:** Process and volume isolation for concurrent Google Antigravity accounts.
- **FastAPI Telemetry Hub:** High-performance async REST API with pooling engine and SQLite persistence.
- **Autonomous Quota Scraper:** Headless daemon parsing CLI tables and streaming snapshots.
- **Bilingual Documentation:** Complete English and Arabic technical specification pairs.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
