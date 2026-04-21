import {
  INNER_VOICE_DEFINITIONS,
  isInnerVoiceId,
} from "../../../data/innerVoiceContract";
import {
  getCanonicalVoiceLabel,
  getCanonicalVoicePromptProfile,
  getCanonicalVoiceRoleLabels,
} from "../../../data/voiceBridge";
import {
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

  const loreProfile = getCanonicalVoicePromptProfile(voiceId);
  const label = getCanonicalVoiceLabel(voiceId);
  return {
    label,
    personaLabel: loreProfile?.archetype ?? label,
    palette: getSkillCheckVoicePalette(voiceId),
    ensembleRoles: getCanonicalVoiceRoleLabels(voiceId),
  };
};

export const getVoicePalette = (voiceId: string): SkillCheckVoicePalette =>
  getVoicePresentation(voiceId).palette;
