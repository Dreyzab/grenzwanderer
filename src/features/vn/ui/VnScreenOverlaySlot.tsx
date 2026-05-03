import { Volume2, VolumeX } from "lucide-react";
import {
  VnPassiveCheckBanner,
  type PassiveCheckDisplay,
} from "./VnPassiveCheckBanner";
import { VnSkillCheckResolveOverlay } from "./VnSkillCheckResolveOverlay";
import type { VnSkillCheckResolveState } from "./VnSkillCheckResolveOverlay";
import type { SkillCheckAiStatus } from "../vnScreenTypes";
import type { VnStrings } from "../../i18n/uiStrings";

interface VnScreenOverlaySlotProps {
  activeResolveAiStatus: SkillCheckAiStatus | null;
  activeResolveAiText?: string | null;
  activeSkillResolve: VnSkillCheckResolveState | null;
  aiThoughtVoiceLabel: string | null;
  canRoll: boolean;
  isSfxMuted: boolean;
  passiveCheckItems: PassiveCheckDisplay[];
  t: VnStrings;
  onActiveResolveInteraction: () => void;
  onFortuneSpendChange: (fortuneSpend: number) => void;
  onRoll: () => void;
  onSfxMutedChange: (muted: boolean) => void;
}

export function VnScreenOverlaySlot({
  activeResolveAiStatus,
  activeResolveAiText,
  activeSkillResolve,
  aiThoughtVoiceLabel,
  canRoll,
  isSfxMuted,
  passiveCheckItems,
  t,
  onActiveResolveInteraction,
  onFortuneSpendChange,
  onRoll,
  onSfxMutedChange,
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
    </>
  );
}
