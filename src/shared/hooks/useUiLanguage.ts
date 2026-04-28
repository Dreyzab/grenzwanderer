import { useEffect, useMemo, useState } from "react";

export type UiLanguage = "en" | "ru" | "de";

export const UI_LANGUAGE_STORAGE_KEY = "grenzwanderer_ui_language";

export const isUiLanguage = (value: unknown): value is UiLanguage =>
  value === "en" || value === "ru" || value === "de";

export const readStoredUiLanguage = (): UiLanguage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    return isUiLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const writeStoredUiLanguage = (language: UiLanguage): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
    // Dispatch a custom event so other instances of the hook in the SAME window can react
    window.dispatchEvent(new Event("storage"));
  } catch {
    // Ignore storage failures; SpacetimeDB flags remain the source of truth.
  }
};

export const resolveUiLanguage = (
  flags: Record<string, boolean>,
  fallback: UiLanguage = "en",
): UiLanguage => {
  if (flags.lang_ru) {
    return "ru";
  }
  if (flags.lang_de) {
    return "de";
  }
  if (flags.lang_en) {
    return "en";
  }
  return fallback;
};

export const useUiLanguage = (flags: Record<string, boolean>): UiLanguage => {
  const [localLanguage, setLocalLanguage] = useState<UiLanguage | null>(
    readStoredUiLanguage(),
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setLocalLanguage(readStoredUiLanguage());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return useMemo(() => {
    // Priority 1: Local storage (immediate feedback on this device)
    if (localLanguage) {
      return localLanguage;
    }

    // Priority 2: Server flags (cross-device preference)
    if (flags.lang_ru) return "ru";
    if (flags.lang_de) return "de";
    if (flags.lang_en) return "en";

    // Priority 3: Hardcoded default
    return "en";
  }, [flags, localLanguage]);
};
