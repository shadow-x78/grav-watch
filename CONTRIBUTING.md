# Contributing to GravWatch

We welcome contributions to GravWatch! This document outlines our development guidelines.

## 🌿 Branch Naming

Use the following prefixes for your branches:
- `feature/` - For new features
- `fix/` - For bug fixes
- `docs/` - For documentation changes
- `chore/` - For maintenance tasks

Example: `feature/deepseek-parser`

## 💬 Commit Convention

We enforce a strict commit message format for clarity:

```text
grav-watch | <type>: <description>
grav-watch | vX.Y.Z | <type>: <description>
```

- `<type>` can be `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- `vX.Y.Z` should be the current workspace version (use on release commits).
- A `release:` type denotes the bump commit (e.g. `grav-watch | v1.0.0 | release: bump to 1.0.0`).

Example: `grav-watch | v1.0.0 | feat: support pooled quota aggregation across accounts`

## 💅 Code Style

All Python code must follow PEP 8 and clean self-documenting code standards.
- Test Suite: `./scripts/run-tests.sh`
- Lint: Clean code without redundant commentary or dead imports.

All file headers must match the GravWatch style:
```python
# GravWatch - <module name> (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch
```

## ✅ Pull Requests

1. Run `./scripts/run-tests.sh` to ensure all unit and integration tests pass.
2. Follow the checklist provided in the PR template (`.github/PULL_REQUEST_TEMPLATE.md`).
3. Mention the `CHANGELOG.md` entry or the feature phase this PR belongs to.

---

<div align="center">

Built by <a href="https://github.com/shadow-x78">shadow-x78</a> ·
[Back to README](README.md)

<sub>&copy; 2026 GravWatch</sub>

</div>
