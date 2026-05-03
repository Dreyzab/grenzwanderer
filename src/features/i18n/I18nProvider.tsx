import React, { useEffect, useMemo, useState, ReactNode } from "react";
import { useTable } from "spacetimedb/react";
import { useUiLanguage } from "../../shared/hooks/useUiLanguage";
import { usePlayerBindings } from "../../entities/player/hooks/usePlayerBindings";
import { I18nContext, I18nDictionary } from "./I18nContext";
import { mergeI18nSection } from "./mergeI18nSection";
import { tables } from "../../shared/spacetime/bindings";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { flags } = usePlayerBindings();
  const language = useUiLanguage(flags);
  const [contentTranslationRows] = useTable(tables.contentTranslations);
  const [dictionary, setDictionary] = useState<I18nDictionary | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const serverDictionary = useMemo<I18nDictionary | null>(() => {
    if (language === "en") {
      return null;
    }

    const next: I18nDictionary = {
      speakers: {},
      stats: {},
      vn: {},
      origin: {},
    };

    for (const row of contentTranslationRows) {
      if (row.lang !== language) {
        continue;
      }
      if (row.key.startsWith("vn.")) {
        next.vn[row.key] = row.text;
      } else if (row.key.startsWith("origin.")) {
        next.origin[row.key] = row.text;
      } else if (row.key.startsWith("speaker.")) {
        next.speakers[row.key.slice("speaker.".length)] = row.text;
      } else if (row.key.startsWith("stat.")) {
        next.stats[row.key.slice("stat.".length)] = row.text;
      }
    }

    return next;
  }, [contentTranslationRows, language]);

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
        const localDictionary = (module.default || module) as I18nDictionary;
        setDictionary({
          speakers: mergeI18nSection(
            language,
            localDictionary.speakers,
            serverDictionary?.speakers,
          ),
          stats: mergeI18nSection(
            language,
            localDictionary.stats,
            serverDictionary?.stats,
          ),
          vn: mergeI18nSection(
            language,
            localDictionary.vn,
            serverDictionary?.vn,
          ),
          origin: mergeI18nSection(
            language,
            localDictionary.origin,
            serverDictionary?.origin,
          ),
        });
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        setDictionary(serverDictionary);
        setIsLoaded(true); // Fallback to English (dictionary null)
      }
    }

    loadTranslations();
  }, [language, serverDictionary]);

  const localePackReady = language === "en" || isLoaded;

  return (
    <I18nContext.Provider
      value={{ language, dictionary, isLoaded, localePackReady }}
    >
      {children}
    </I18nContext.Provider>
  );
}
