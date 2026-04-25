import React, { useEffect, useState, ReactNode } from "react";
import { useUiLanguage } from "../../shared/hooks/useUiLanguage";
import { usePlayerFlags } from "../../entities/player/hooks/usePlayerFlags";
import { I18nContext, I18nDictionary } from "./I18nContext";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const flags = usePlayerFlags();
  const language = useUiLanguage(flags);
  const [dictionary, setDictionary] = useState<I18nDictionary | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTranslations() {
      if (language === "en") {
        setDictionary(null);
        setIsLoaded(true);
        return;
      }

      setIsLoaded(false);
      try {
        // Vite's dynamic import with template strings
        const module = await import(`./locales/${language}.json`);
        setDictionary(module.default || module);
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        setDictionary(null);
        setIsLoaded(true); // Fallback to English (dictionary null)
      }
    }

    loadTranslations();
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, dictionary, isLoaded }}>
      {children}
    </I18nContext.Provider>
  );
}
