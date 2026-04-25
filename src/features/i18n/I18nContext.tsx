import React, { createContext, useContext } from "react";
import type { UiLanguage } from "../../shared/hooks/useUiLanguage";

export interface I18nDictionary {
  speakers: Record<string, string>;
  stats: Record<string, string>;
  vn: Record<string, string>;
  origin: Record<string, string>;
}

export interface I18nState {
  language: UiLanguage;
  dictionary: I18nDictionary | null;
  isLoaded: boolean;
}

export const I18nContext = createContext<I18nState | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
