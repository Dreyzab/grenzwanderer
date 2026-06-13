import type { InnerVoiceId } from "../../../data/innerVoiceContract";
import { getParliamentModule } from "../../../data/parliamentModules";

export const WITCH_SHAME_REVEAL_FLAG = "flag_witch_shame_revealed";

/**
 * Whether a parliament voice is visible for the active preset. A voice is
 * concealed only when the preset's module declares it as the seat of its
 * hidden voice (`hiddenVoice.targetId`) and the reveal flag is not set yet.
 * Without a preset (before character creation) every voice is visible —
 * concealment is per-origin data, never a global rule.
 */
export const isParliamentVoiceVisible = (
  voiceId: InnerVoiceId,
  flags: Record<string, boolean>,
  presetId?: string,
): boolean => {
  const hiddenVoice = getParliamentModule(presetId)?.hiddenVoice;
  if (
    !hiddenVoice ||
    hiddenVoice.targetId !== voiceId ||
    !hiddenVoice.revealFlagKey
  ) {
    return true;
  }
  return Boolean(flags[hiddenVoice.revealFlagKey]);
};
