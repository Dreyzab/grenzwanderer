import { hasCyrillicText, repairI18nSectionString } from "./ruUtf8Repair";

const shouldUseServerTranslation = (
  language: string,
  localText: string | undefined,
  serverText: string,
): boolean => {
  if (
    language === "ru" &&
    localText &&
    hasCyrillicText(localText) &&
    !hasCyrillicText(serverText)
  ) {
    return false;
  }

  return true;
};

export const mergeI18nSection = (
  language: string,
  localSection: Record<string, string>,
  serverSection?: Record<string, string>,
): Record<string, string> => {
  const merged = { ...localSection };
  for (const [key, serverText] of Object.entries(serverSection ?? {})) {
    if (shouldUseServerTranslation(language, merged[key], serverText)) {
      merged[key] = serverText;
    }
  }

  if (language === "ru" || language === "de") {
    for (const key of Object.keys(merged)) {
      merged[key] = repairI18nSectionString(language, merged[key]);
    }
  }

  return merged;
};
