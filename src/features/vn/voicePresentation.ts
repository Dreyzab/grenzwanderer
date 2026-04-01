import {
  INNER_VOICE_DEFINITIONS,
  isInnerVoiceId,
} from "../../../data/innerVoiceContract";
import {
  formatSkillCheckVoiceLabel,
  getSkillCheckVoicePalette,
  type SkillCheckVoicePalette,
} from "./skillCheckPalette";

export interface VoicePresentation {
  label: string;
  personaLabel: string;
  palette: SkillCheckVoicePalette;
  ensembleRoles: string[];
}

export const getVoicePresentation = (voiceId: string): VoicePresentation => {
  if (isInnerVoiceId(voiceId)) {
    const definition = INNER_VOICE_DEFINITIONS[voiceId];
    return {
      label: definition.label,
      personaLabel: definition.label,
      palette: definition.palette,
      ensembleRoles: [definition.worldview],
    };
  }

  const label = formatSkillCheckVoiceLabel(voiceId);
  return {
    label,
    personaLabel: label,
    palette: getSkillCheckVoicePalette(voiceId),
    ensembleRoles: [],
  };
};

export const getVoicePalette = (voiceId: string): SkillCheckVoicePalette =>
  getVoicePresentation(voiceId).palette;
