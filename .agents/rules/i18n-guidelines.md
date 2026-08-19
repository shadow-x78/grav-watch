# GravWatch Web i18n & Localization Invariants

When developing or modifying UI components in `clients/web/`:

1. **Zero Hardcoded Strings**:
   - NEVER hardcode user-facing English or Arabic strings directly in JSX/TSX.
   - Always access translations via `const { t, language, direction } = useLanguage();` and `t("module.subModule.key", { params })`.

2. **Modular Directory Structure**:
   - All translation strings MUST be organized in `clients/web/src/locales/`:
     - `src/locales/ar/{feature}/{feature}.json`
     - `src/locales/en/{feature}/{feature}.json`
   - Maintain identical key hierarchies in both `ar/` and `en/` dictionaries.
   - Register new feature dictionaries in `src/locales/{ar,en}/index.ts`.

3. **Interpolation & Formatting**:
   - Use dynamic interpolation tokens like `{time}`, `{count}`, `{alias}` instead of string concatenation.
   - Use localized helper functions (`formatCountdownWithDays(time, lang)`, `formatRelativeTime(date, lang)`) for time/countdown presentation.

4. **Bi-Directional Support (RTL & LTR)**:
   - Handle RTL styling dynamically via MUI theme `direction`, Tailwind directional classes, and `direction === "rtl" ? "scaleX(-1)" : "none"` for directional icons (e.g. arrows, popouts).
   - Ensure the Arabic typeface `Cairo` is preserved for all RTL contexts.
