import type { VnChoiceSource } from "../../shared/game/characterProgression";
import type { VnChoice } from "./types";
import type {
  ChoiceInnerVoiceHintDisplay,
  ChoiceSourcePresentation,
} from "./vnScreenTypes";
import { getVoicePresentation } from "./voicePresentation";
import { CHARACTER_SYNERGIES } from "../../shared/game/characterProgression";

const labelBySource: Record<VnChoiceSource, string> = {
  common: "Common",
  voice: "Voice",
  origin: "Origin",
  synergy: "Synergy",
  signature: "Signature",
  flaw: "Flaw",
  volition: "[ВОЛЯ]",
};

const accentBySource: Record<VnChoiceSource, string> = {
  common: "#a8a29e",
  voice: "#fbbf24",
  origin: "#f59e0b",
  synergy: "#38bdf8",
  signature: "#34d399",
  flaw: "#fb7185",
  volition: "#f8fafc",
};

export const resolveChoiceSource = (choice: VnChoice): VnChoiceSource =>
  choice.choiceSource ?? (choice.skillCheck ? "voice" : "common");

export const resolveChoiceSourcePresentation = (
  choice: VnChoice,
  innerVoiceHints: ChoiceInnerVoiceHintDisplay[],
  parliamentPresetId?: string,
): ChoiceSourcePresentation => {
  const source = resolveChoiceSource(choice);
  const voiceId =
    choice.skillCheck?.voiceId ??
    choice.presentationVoiceId ??
    innerVoiceHints[0]?.voiceId;

  if (voiceId) {
    const presentation = getVoicePresentation(voiceId, parliamentPresetId);
    return {
      source,
      voiceId,
      label: presentation.label,
      accent: presentation.palette.accent,
      palette: presentation.palette,
    };
  }

  if (source === "synergy" && choice.skillCheck?.synergyId) {
    return {
      source,
      label: CHARACTER_SYNERGIES[choice.skillCheck.synergyId].labelRu,
      accent: accentBySource[source],
    };
  }

  return {
    source,
    label: labelBySource[source],
    accent: accentBySource[source],
  };
};
