export type Language = "ar" | "en";
export type Direction = "rtl" | "ltr";

export type TranslationParams = Record<string, string | number>;

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}
