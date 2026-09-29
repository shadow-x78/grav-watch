// ─────────────────────────────────────────────
// GravWatch - i18n Type Definitions
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

export type Language = "ar" | "en";
export type Direction = "rtl" | "ltr";

export type TranslationParams = Record<string, string | number>;

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}
