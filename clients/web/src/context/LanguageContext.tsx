"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations, getTranslation, interpolate, Language, Direction, TranslationParams } from "@/locales";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("gravwatch_lang") as Language;
    if (saved === "ar" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  const direction: Direction = useMemo(() => {
    return language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("gravwatch_lang", lang);
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar");
  }, [language, setLanguage]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
    }
  }, [direction, language]);

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      // 1. Try to find in current language
      let translated = getTranslation(translations[language], key);

      // 2. Fallback to English if not found in Arabic
      if (translated === undefined && language !== "en") {
        translated = getTranslation(translations["en"], key);
      }

      // 3. Fallback to raw key if still undefined
      if (translated === undefined) {
        return key;
      }

      // 4. Interpolate parameters like {time}, {count}, {alias}
      return interpolate(translated, params);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      direction,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, direction, setLanguage, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export type { Language, Direction };
