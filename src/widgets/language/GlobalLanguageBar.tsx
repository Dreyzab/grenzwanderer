import { useLanguageSwitch } from "./useLanguageSwitch";
import type { UiLanguage } from "../../shared/hooks/useUiLanguage";

export function GlobalLanguageBar() {
  const { language, home, isUpdating, switchError, handleLanguageChange } =
    useLanguageSwitch();

  const buttonClass = (code: UiLanguage) =>
    `h-8 min-w-[42px] px-2 text-[10px] font-bold tracking-widest transition-all duration-300 ${
      language === code
        ? "bg-ember-700 text-stone-100 shadow-[0_0_12px_rgba(180,83,9,0.3)] border-ember-600/50"
        : "bg-stone-900/80 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border-stone-800"
    } disabled:cursor-not-allowed disabled:opacity-50 border first:rounded-l-md last:rounded-r-md -ml-[1px] first:ml-0`;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] flex justify-end px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto inline-flex max-w-[min(100vw-2rem,calc(100%-2rem))] flex-col items-end gap-1.5 group">
        <div className="inline-flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/90 px-3.5 py-2 shadow-2xl backdrop-blur-md transition-all duration-500 hover:border-stone-700/50">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500 group-hover:text-stone-400 transition-colors">
            {home.languageBarLabel}
          </span>
          <div
            className="inline-flex items-center"
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

        <div className="flex flex-col items-end gap-0.5 px-1 min-h-[14px]">
          {isUpdating ? (
            <span className="text-[9px] font-medium uppercase tracking-wider text-ember-500/80 animate-pulse">
              {home.languageSwitching}
            </span>
          ) : null}
          {!isUpdating && switchError ? (
            <span className="max-w-[16rem] text-right text-[9px] font-medium text-red-400/90 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
              {switchError}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
