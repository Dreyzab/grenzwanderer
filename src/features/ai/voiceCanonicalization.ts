import { canonicalSkillVoiceIdFor } from "../../../data/voiceBridge";

/**
 * Canonicalize a voice ID returned by the AI layer.
 * Bridges legacy runtime ids onto the lore voice registry.
 */
export const canonicalVoiceIdFor = (raw: string): string =>
  typeof raw === "string" ? canonicalSkillVoiceIdFor(raw) : "";
