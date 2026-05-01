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

export const inferBrowserUiLanguage = (): UiLanguage => {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const rawList =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const raw of rawList) {
    if (!raw || typeof raw !== "string") {
      continue;
    }
    const base = raw.toLowerCase().split("-")[0] ?? "";
    if (base === "ru") {
      return "ru";
    }
    if (base === "de") {
      return "de";
    }
  }

  return "en";
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

/** Pure resolution for tests and a single hook implementation. */
export const resolveEffectiveUiLanguage = (
  localStored: UiLanguage | null,
  flags: Record<string, boolean>,
  browserInfer: () => UiLanguage = inferBrowserUiLanguage,
): UiLanguage => {
  if (localStored) {
    return localStored;
  }

  const inferred = browserInfer();
  if (inferred !== "en") {
    return inferred;
  }

  return resolveUiLanguage(flags);
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

  return useMemo(
    () => resolveEffectiveUiLanguage(localLanguage, flags),
    [flags, localLanguage],
  );
};
