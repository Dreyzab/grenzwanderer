import {
  INNER_VOICE_DEFINITIONS,
  isInnerVoiceId,
} from "../../../data/innerVoiceContract";
import { getVoiceSkin } from "../../../data/parliamentModules";
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

/**
 * Resolve how a voice presents. When `presetId` is supplied and the active
 * parliament module skins this voice (see data/parliamentModules.ts), the
 * skin's label/persona override the canonical defaults. The palette always
 * stays canonical so a voice keeps its colour identity across origins.
 */
export const getVoicePresentation = (
  voiceId: string,
  presetId?: string,
): VoicePresentation => {
  const skin = getVoiceSkin(presetId, voiceId);

  if (isInnerVoiceId(voiceId)) {
    const definition = INNER_VOICE_DEFINITIONS[voiceId];
    return {
      label: skin?.label ?? definition.label,
      personaLabel: skin?.persona?.label ?? skin?.label ?? definition.label,
      palette: definition.palette,
      ensembleRoles: [definition.worldview],
    };
  }

  const loreProfile = getCanonicalVoicePromptProfile(voiceId);
  const label = getCanonicalVoiceLabel(voiceId);
  return {
    label: skin?.label ?? label,
    personaLabel:
      skin?.persona?.label ?? loreProfile?.archetype ?? skin?.label ?? label,
    palette: getSkillCheckVoicePalette(voiceId),
    ensembleRoles: getCanonicalVoiceRoleLabels(voiceId),
  };
};

export const getVoicePalette = (voiceId: string): SkillCheckVoicePalette =>
  getVoicePresentation(voiceId).palette;
