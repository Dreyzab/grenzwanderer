import { useMemo } from "react";

export type UiLanguage = "en" | "ru" | "de";

export const resolveUiLanguage = (
  flags: Record<string, boolean>,
): UiLanguage => {
  if (flags.lang_ru) {
    return "ru";
  }
  if (flags.lang_de) {
    return "de";
  }
  return "en";
};

export const useUiLanguage = (flags: Record<string, boolean>): UiLanguage =>
  useMemo(() => resolveUiLanguage(flags), [flags]);
