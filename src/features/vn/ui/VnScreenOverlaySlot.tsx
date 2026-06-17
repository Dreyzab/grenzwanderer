import { useLayoutEffect, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { ChevronDown, Gauge, Settings, Volume2, VolumeX } from "lucide-react";
import {
  VnPassiveCheckBanner,
  type PassiveCheckDisplay,
} from "./VnPassiveCheckBanner";
import { VnSkillCheckResolveOverlay } from "./VnSkillCheckResolveOverlay";
import type { VnSkillCheckResolveState } from "./VnSkillCheckResolveOverlay";
import type { SkillCheckAiStatus } from "../vnScreenTypes";
import type { VnStrings } from "../../i18n/uiStrings";
import type { VnTextSpeed } from "./vnTextSpeedPreference";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import { useLanguageSwitch } from "../../../widgets/language/useLanguageSwitch";

interface VnScreenOverlaySlotProps {
  activeResolveAiStatus: SkillCheckAiStatus | null;
  activeResolveAiText?: string | null;
  activeSkillResolve: VnSkillCheckResolveState | null;
  aiThoughtVoiceLabel: string | null;
  canRoll: boolean;
  isSfxMuted: boolean;
  locationName: string;
  passiveCheckItems: PassiveCheckDisplay[];
  t: VnStrings;
  textSpeed: VnTextSpeed;
  onActiveResolveInteraction: () => void;
  onFortuneSpendChange: (fortuneSpend: number) => void;
  onRoll: () => void;
  onSfxMutedChange: (muted: boolean) => void;
  onTextSpeedCycle: () => void;
}

const textSpeedLabel = (t: VnStrings, speed: VnTextSpeed): string => {
  switch (speed) {
    case "slow":
      return t.textSpeedSlow;
    case "fast":
      return t.textSpeedFast;
    case "instant":
      return t.textSpeedInstant;
    default:
      return t.textSpeedNormal;
  }
};

const languageButtonClass = (
  code: UiLanguage,
  active: UiLanguage,
  disabled: boolean,
): string =>
  [
    "h-7 min-w-[34px] px-1.5 text-[9px] font-bold tracking-widest transition-colors border",
    active === code
      ? "bg-ember-700/90 text-stone-100 border-ember-600/50"
      : "bg-stone-900/80 text-stone-400 border-stone-800 hover:bg-stone-800 hover:text-stone-200",
    disabled ? "cursor-not-allowed opacity-50" : "",
    code === "en" ? "rounded-l-md" : "",
    code === "de" ? "rounded-r-md -ml-px" : "-ml-px",
  ].join(" ");

export function VnScreenOverlaySlot({
  activeResolveAiStatus,
  activeResolveAiText,
  activeSkillResolve,
  aiThoughtVoiceLabel,
  canRoll,
  isSfxMuted,
  locationName,
  passiveCheckItems,
  t,
  textSpeed,
  onActiveResolveInteraction,
  onFortuneSpendChange,
  onRoll,
  onSfxMutedChange,
  onTextSpeedCycle,
}: VnScreenOverlaySlotProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [collapseY, setCollapseY] = useState(0);
  const { language, home, isUpdating, switchError, handleLanguageChange } =
    useLanguageSwitch();

  useLayoutEffect(() => {
    const el = settingsRef.current;
    if (!el) {
      return;
    }

    const update = () => {
      setCollapseY(Math.round(el.getBoundingClientRect().height));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isUpdating, switchError, textSpeed, isSfxMuted, language]);

  const settingsCollapsed = !settingsExpanded;
  const yAnimated =
    settingsCollapsed && collapseY > 0
      ? -collapseY
      : settingsCollapsed
        ? "-100%"
        : 0;

  return (
    <>
      <VnSkillCheckResolveOverlay
        state={activeSkillResolve}
        aiStatus={activeResolveAiStatus}
        aiThoughtText={activeResolveAiText}
        aiThoughtVoiceLabel={aiThoughtVoiceLabel}
        onFortuneSpendChange={onFortuneSpendChange}
        onRoll={onRoll}
        canRoll={canRoll}
        onInteract={onActiveResolveInteraction}
      />
      {!activeSkillResolve ? (
        <VnPassiveCheckBanner items={passiveCheckItems} />
      ) : null}

      <div
        className="vn-top-chrome pointer-events-none fixed inset-x-0 top-0 z-[165]"
        data-testid="vn-top-chrome"
      >
        <div className="pointer-events-auto flex items-start gap-2 px-3 pb-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
          {locationName ? (
            <h1
              className="vn-top-chrome__title m-0 min-w-0 flex-1 truncate pt-0.5 font-display text-lg font-bold tracking-tight text-stone-100/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-xl"
              title={locationName}
            >
              {locationName}
            </h1>
          ) : (
            <div className="min-w-0 flex-1" />
          )}

          <div className="relative shrink-0">
            <motion.button
              type="button"
              onPointerDown={(event) => dragControls.start(event)}
              onTap={() => setSettingsExpanded((expanded) => !expanded)}
              className="group relative flex h-6 w-12 items-center justify-center gap-0.5 rounded-b-lg border-x border-b border-stone-700/70 bg-stone-950/90 pb-0.5 shadow-sm transition-colors hover:bg-stone-900/95"
              aria-label={
                settingsCollapsed ? "Expand settings" : "Collapse settings"
              }
              aria-expanded={settingsExpanded}
            >
              <Settings
                size={13}
                strokeWidth={2.25}
                className="text-stone-400 transition-colors group-hover:text-stone-200"
              />
              <motion.div
                animate={{ rotate: settingsCollapsed ? 0 : 180 }}
                className="text-stone-500"
              >
                <ChevronDown size={11} strokeWidth={2.5} />
              </motion.div>
            </motion.button>

            <motion.div
              ref={settingsRef}
              initial={false}
              animate={{ y: yAnimated }}
              drag={collapseY > 0 ? "y" : false}
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={
                collapseY > 0 ? { top: -collapseY, bottom: 0 } : undefined
              }
              dragElastic={0.04}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (collapseY <= 0) {
                  return;
                }
                const { offset, velocity } = info;
                const vTh = 280;
                if (!settingsCollapsed) {
                  if (offset.y < -48 || velocity.y < -vTh) {
                    setSettingsExpanded(false);
                  } else {
                    setSettingsExpanded(true);
                  }
                } else if (offset.y > 48 || velocity.y > vTh) {
                  setSettingsExpanded(true);
                } else {
                  setSettingsExpanded(false);
                }
              }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="vn-settings-drawer absolute right-0 top-full z-10 mt-0 flex w-max max-w-[min(100vw-1.5rem,18rem)] flex-col gap-2 rounded-b-lg border-x border-b border-stone-800/80 bg-stone-950/95 p-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className={[
                    "vn-text-speed-toggle",
                    textSpeed === "instant" ? "is-instant" : "",
                  ].join(" ")}
                  aria-label={`${t.textSpeed}: ${textSpeedLabel(t, textSpeed)}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTextSpeedCycle();
                  }}
                >
                  <Gauge size={12} />
                  <span>{textSpeedLabel(t, textSpeed)}</span>
                </button>
                <button
                  type="button"
                  className={[
                    "vn-sfx-toggle",
                    isSfxMuted ? "is-muted" : "",
                  ].join(" ")}
                  aria-label={
                    isSfxMuted ? t.unmuteSkillCheckAudio : t.muteSkillCheckAudio
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onSfxMutedChange(!isSfxMuted);
                  }}
                >
                  {isSfxMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  <span>SFX</span>
                </button>
              </div>

              <div className="flex flex-col gap-1 border-t border-stone-800/70 pt-2">
                <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-stone-500">
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
                      className={languageButtonClass(
                        code,
                        language,
                        isUpdating,
                      )}
                    >
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>
                {isUpdating ? (
                  <span className="text-[9px] font-medium uppercase tracking-wider text-ember-500/80">
                    {home.languageSwitching}
                  </span>
                ) : null}
                {!isUpdating && switchError ? (
                  <span className="text-[9px] font-medium text-red-400/90">
                    {switchError}
                  </span>
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
