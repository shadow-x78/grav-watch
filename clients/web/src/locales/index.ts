import { ar } from "./ar";
import { en } from "./en";
import { Language, TranslationDictionary, TranslationParams } from "./types";

export * from "./types";

export const translations: Record<Language, TranslationDictionary> = {
  ar,
  en,
};

/**
 * Resolve a nested key (e.g. "overview.matrix.title") or flat key from the translations dictionary
 */
export function getTranslation(
  dict: TranslationDictionary,
  path: string
): string | undefined {
  const parts = path.split(".");
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  if (typeof current === "string") {
    return current;
  }

  return undefined;
}

/**
 * Format a string with dynamic parameters, e.g. "Refreshes in {time}" with { time: "2d 4h" }
 */
export function interpolate(
  text: string,
  params?: TranslationParams
): string {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{${key}}`, String(value));
  }, text);
}
