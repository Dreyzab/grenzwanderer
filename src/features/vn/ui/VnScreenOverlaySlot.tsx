import { Gauge, Volume2, VolumeX } from "lucide-react";
import {
  VnPassiveCheckBanner,
  type PassiveCheckDisplay,
} from "./VnPassiveCheckBanner";
import { VnSkillCheckResolveOverlay } from "./VnSkillCheckResolveOverlay";
import type { VnSkillCheckResolveState } from "./VnSkillCheckResolveOverlay";
import type { SkillCheckAiStatus } from "../vnScreenTypes";
import type { VnStrings } from "../../i18n/uiStrings";
import type { VnTextSpeed } from "./vnTextSpeedPreference";

interface VnScreenOverlaySlotProps {
  activeResolveAiStatus: SkillCheckAiStatus | null;
  activeResolveAiText?: string | null;
  activeSkillResolve: VnSkillCheckResolveState | null;
  aiThoughtVoiceLabel: string | null;
  canRoll: boolean;
  isSfxMuted: boolean;
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

export function VnScreenOverlaySlot({
  activeResolveAiStatus,
  activeResolveAiText,
  activeSkillResolve,
  aiThoughtVoiceLabel,
  canRoll,
  isSfxMuted,
  passiveCheckItems,
  t,
  textSpeed,
  onActiveResolveInteraction,
  onFortuneSpendChange,
  onRoll,
  onSfxMutedChange,
  onTextSpeedCycle,
}: VnScreenOverlaySlotProps) {
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
      <div className="vn-overlay-controls">
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
          <Gauge size={14} />
          <span>{textSpeedLabel(t, textSpeed)}</span>
        </button>
        <button
          type="button"
          className={["vn-sfx-toggle", isSfxMuted ? "is-muted" : ""].join(" ")}
          aria-label={
            isSfxMuted ? t.unmuteSkillCheckAudio : t.muteSkillCheckAudio
          }
          onClick={(event) => {
            event.stopPropagation();
            onSfxMutedChange(!isSfxMuted);
          }}
        >
          {isSfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>SFX</span>
        </button>
      </div>
    </>
  );
}
