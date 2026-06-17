import { useState } from "react";
import { useReducer } from "spacetimedb/react";
import { useI18n } from "../../features/i18n/I18nContext";
import { getHomeStrings } from "../../features/i18n/uiStrings";
import {
  type UiLanguage,
  writeStoredUiLanguage,
} from "../../shared/hooks/useUiLanguage";
import { reducers } from "../../shared/spacetime/bindings";

export function useLanguageSwitch() {
  const { language } = useI18n();
  const home = getHomeStrings(language);
  const setFlag = useReducer(reducers.setFlag);
  const [isUpdating, setIsUpdating] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleLanguageChange = async (nextLanguage: UiLanguage) => {
    if (isUpdating || language === nextLanguage) {
      return;
    }

    setIsUpdating(true);
    setSwitchError(null);

    try {
      writeStoredUiLanguage(nextLanguage);
      await setFlag({ key: "lang_en", value: nextLanguage === "en" });
      await setFlag({ key: "lang_de", value: nextLanguage === "de" });
      await setFlag({ key: "lang_ru", value: nextLanguage === "ru" });
    } catch (error) {
      setSwitchError(
        error instanceof Error ? error.message : home.languageSwitchFailed,
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    language,
    home,
    isUpdating,
    switchError,
    handleLanguageChange,
  };
}
