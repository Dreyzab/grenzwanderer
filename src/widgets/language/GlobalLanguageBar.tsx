import { useReducer, useState } from "react";
import { useI18n } from "../../features/i18n/I18nContext";
import { getHomeStrings } from "../../features/i18n/uiStrings";
import {
  type UiLanguage,
  writeStoredUiLanguage,
} from "../../shared/hooks/useUiLanguage";
import { reducers } from "../../shared/spacetime/bindings";

export function GlobalLanguageBar() {
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

  const buttonClass = (code: UiLanguage) =>
    `h-8 min-w-[42px] px-2 text-xs font-semibold tracking-wide transition-colors ${
      language === code
        ? "bg-[#a16207] text-[#f5f5f4]"
        : "bg-[#292524] text-[#d6d3d1] hover:bg-[#44403c]"
    } disabled:cursor-not-allowed disabled:opacity-60`;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] flex justify-end px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto inline-flex max-w-[min(100vw-2rem,calc(100%-2rem))] flex-col items-end gap-1">
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#44403c] bg-[#1c1917]/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-wide text-[#a8a29e]">
            {home.languageBarLabel}
          </span>
          <div
            className="inline-flex items-center overflow-hidden rounded-md border border-[#44403c]"
            role="group"
            aria-label={home.languageChooseTitle}
          >
            {(["en", "ru", "de"] as const).map((code) => (
              <button
                key={code}
                type="button"
                disabled={isUpdating}
                title={home.languageChooseTitle}
                aria-pressed={language === code}
                onClick={() => void handleLanguageChange(code)}
                className={buttonClass(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {isUpdating ? (
          <span className="text-[10px] text-[#a8a29e]">
            {home.languageSwitching}
          </span>
        ) : null}
        {!isUpdating && switchError ? (
          <span className="max-w-[16rem] text-right text-[10px] text-amber-200/90">
            {switchError}
          </span>
        ) : null}
      </div>
    </div>
  );
}
