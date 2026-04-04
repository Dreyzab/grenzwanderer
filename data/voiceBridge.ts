const FIRST_WAVE_LEGACY_VOICE_ALIASES = {
  attr_charisma: "charisma",
  attr_deception: "deception",
  attr_encyclopedia: "encyclopedia",
  attr_intellect: "logic",
  attr_logic: "logic",
  attr_occultism: "occultism",
  attr_perception: "perception",
  attr_social: "charisma",
  attr_spirit: "occultism",
} as const;

const CANONICAL_VOICE_LABELS = {
  charisma: "Charisma",
  deception: "Deception",
  encyclopedia: "Encyclopedia",
  logic: "Logic",
  occultism: "Occultism",
  perception: "Perception",
} as const;

export interface CanonicalVoicePromptProfile {
  canonicalId: "logic" | "charisma" | "occultism";
  label: string;
  department: string;
  archetype: string;
  motto: string;
  speechPattern: string;
  vocabulary: string;
  emotionalRange: string;
  manners: string;
  philosophy: string;
  blindSpot: string;
  coreDrive: string;
  stressPattern: string;
  checkRoles: string[];
}

// Lore profiles sourced from:
// - obsidian/Detectiv/20_Game_Design/Voices/Voice_Logic.md
// - obsidian/Detectiv/20_Game_Design/Voices/Voice_Charisma.md
// - obsidian/Detectiv/20_Game_Design/Voices/Voice_Occultism.md
const CANONICAL_VOICE_PROMPT_PROFILES: Record<
  CanonicalVoicePromptProfile["canonicalId"],
  CanonicalVoicePromptProfile
> = {
  logic: {
    canonicalId: "logic",
    label: "Logic",
    department: "Brain",
    archetype: "Logic specialist",
    motto: "The world is a machine. Find the fault line.",
    speechPattern: "dry and procedural",
    vocabulary: "technical and evidentiary",
    emotionalRange: "cool certainty to surgical contempt",
    manners:
      "Speaks in a logic-driven framing with concise tactical observations.",
    philosophy: "Truth is actionable when filtered through logic.",
    blindSpot:
      "Can overfit decisions to logic and underweight alternative angles.",
    coreDrive:
      "Convert uncertainty into a playable lead without hard dead-ends.",
    stressPattern:
      "Under pressure becomes rigid and narrows to logic heuristics.",
    checkRoles: [
      "contradiction_scan",
      "timeline_reconstruction",
      "evidence_validation",
    ],
  },
  charisma: {
    canonicalId: "charisma",
    label: "Charisma",
    department: "Character",
    archetype: "Charisma specialist",
    motto: "Make them enjoy telling you what hurts them.",
    speechPattern: "warm and adaptive",
    vocabulary: "social and flattering",
    emotionalRange: "light charm to predatory allure",
    manners:
      "Speaks in a charisma-driven framing with concise tactical observations.",
    philosophy: "Truth is actionable when filtered through charisma.",
    blindSpot:
      "Can overfit decisions to charisma and underweight alternative angles.",
    coreDrive:
      "Convert uncertainty into a playable lead without hard dead-ends.",
    stressPattern:
      "Under pressure becomes rigid and narrows to charisma heuristics.",
    checkRoles: ["rapport_open", "negotiation_soften", "social_tradeoff"],
  },
  occultism: {
    canonicalId: "occultism",
    label: "Occultism",
    department: "Spirit",
    archetype: "Occultism specialist",
    motto: "Meaning hides in patterns the rational eye refuses.",
    speechPattern: "ritual cadence",
    vocabulary: "symbolic and esoteric",
    emotionalRange: "measured wonder to obsessive dread",
    manners:
      "Speaks in a occultism-driven framing with concise tactical observations.",
    philosophy: "Truth is actionable when filtered through occultism.",
    blindSpot:
      "Can overfit decisions to occultism and underweight alternative angles.",
    coreDrive:
      "Convert uncertainty into a playable lead without hard dead-ends.",
    stressPattern:
      "Under pressure becomes rigid and narrows to occultism heuristics.",
    checkRoles: ["symbol_decode", "ritual_pattern_read", "anomaly_flag"],
  },
};

const formatFallbackVoiceLabel = (voiceId: string): string =>
  voiceId
    .replace(/^attr_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());

const normalizeVoiceId = (voiceId: string): string =>
  voiceId.trim().toLowerCase();

const unique = <T>(entries: readonly T[]): T[] => [...new Set(entries)];

export const canonicalSkillVoiceIdFor = (voiceId: string): string => {
  const normalized = normalizeVoiceId(voiceId);
  return FIRST_WAVE_LEGACY_VOICE_ALIASES[
    normalized as keyof typeof FIRST_WAVE_LEGACY_VOICE_ALIASES
  ]
    ? FIRST_WAVE_LEGACY_VOICE_ALIASES[
        normalized as keyof typeof FIRST_WAVE_LEGACY_VOICE_ALIASES
      ]
    : normalized;
};

export const getCanonicalVoiceLabel = (voiceId: string): string => {
  const canonicalVoiceId = canonicalSkillVoiceIdFor(voiceId);
  const promptProfile = getCanonicalVoicePromptProfile(canonicalVoiceId);
  if (promptProfile) {
    return promptProfile.label;
  }

  return (
    CANONICAL_VOICE_LABELS[
      canonicalVoiceId as keyof typeof CANONICAL_VOICE_LABELS
    ] ?? formatFallbackVoiceLabel(canonicalVoiceId)
  );
};

export const getCanonicalVoicePromptProfile = (
  voiceId: string,
): CanonicalVoicePromptProfile | null => {
  const canonicalVoiceId = canonicalSkillVoiceIdFor(voiceId);
  return (
    CANONICAL_VOICE_PROMPT_PROFILES[
      canonicalVoiceId as keyof typeof CANONICAL_VOICE_PROMPT_PROFILES
    ] ?? null
  );
};

const formatRoleLabel = (role: string): string => role.replace(/_/g, " ");

export const getCanonicalVoiceRoleLabels = (voiceId: string): string[] => {
  const promptProfile = getCanonicalVoicePromptProfile(voiceId);
  return promptProfile ? promptProfile.checkRoles.map(formatRoleLabel) : [];
};

export const canonicalizeSpeakerIds = (
  speakerIds: readonly string[],
): string[] => unique(speakerIds.map(canonicalSkillVoiceIdFor));

export const buildCanonicalVoicePromptBrief = (
  voiceId: string,
): string | null => {
  const promptProfile = getCanonicalVoicePromptProfile(voiceId);
  if (!promptProfile) {
    return null;
  }

  return [
    `${promptProfile.label} (${promptProfile.department})`,
    `motto "${promptProfile.motto}"`,
    `speech ${promptProfile.speechPattern}`,
    `vocabulary ${promptProfile.vocabulary}`,
    `range ${promptProfile.emotionalRange}`,
    `philosophy ${promptProfile.philosophy}`,
    `blind spot ${promptProfile.blindSpot}`,
    `drive ${promptProfile.coreDrive}`,
    `stress ${promptProfile.stressPattern}`,
    `roles ${promptProfile.checkRoles.map(formatRoleLabel).join(", ")}`,
  ].join("; ");
};

export const buildParliamentPromptStack = (
  speakerIds: readonly string[],
): string | null => {
  const canonicalSpeakerIds = canonicalizeSpeakerIds(speakerIds);
  const speakerPrompts = canonicalSpeakerIds
    .map((speakerId) => {
      const promptProfile = getCanonicalVoicePromptProfile(speakerId);
      if (!promptProfile) {
        return null;
      }

      return `${promptProfile.label}: ${promptProfile.speechPattern}, ${promptProfile.vocabulary}, ${promptProfile.coreDrive}`;
    })
    .filter((entry): entry is string => entry !== null);

  return speakerPrompts.length > 0 ? speakerPrompts.join(" | ") : null;
};
