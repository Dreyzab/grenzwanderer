export const PSYCHE_AXIS_X_KEY = "psyche_axis_x";
export const PSYCHE_AXIS_Y_KEY = "psyche_axis_y";
export const PSYCHE_APPROACH_KEY = "psyche_approach";

export const PSYCHE_VAR_KEYS = [
  PSYCHE_AXIS_X_KEY,
  PSYCHE_AXIS_Y_KEY,
  PSYCHE_APPROACH_KEY,
] as const;

export type PsycheVarKey = (typeof PSYCHE_VAR_KEYS)[number];
export type PsycheAxis = "x" | "y" | "approach";

export const APPROACH_WEIGHT = 0.6;
export const INNER_VOICE_SILENCE_THRESHOLD = 0.005;

export const SKILL_VOICE_IDS = [
  "attr_agility",
  "attr_authority",
  "attr_charisma",
  "attr_composure",
  "attr_deception",
  "attr_empathy",
  "attr_encyclopedia",
  "attr_endurance",
  "attr_forensics",
  "attr_imagination",
  "attr_intellect",
  "attr_intrusion",
  "attr_intuition",
  "attr_logic",
  "attr_occultism",
  "attr_perception",
  "attr_physical",
  "attr_poetics",
  "attr_psyche",
  "attr_shadow",
  "attr_social",
  "attr_spirit",
  "attr_stealth",
  "attr_tradition",
] as const;

export type SkillVoiceId = (typeof SKILL_VOICE_IDS)[number];

export const INNER_VOICE_IDS = [
  "inner_leader",
  "inner_guide",
  "inner_manipulator",
  "inner_adapter",
  "inner_analyst",
  "inner_cynic",
  "inner_exile",
  "inner_hermit",
] as const;

export type InnerVoiceId = (typeof INNER_VOICE_IDS)[number];
export type SpeakerId = SkillVoiceId | InnerVoiceId;
export type InnerVoiceStance = "supports" | "opposes";
export type InnerVoiceRole = "dominant" | "support" | "counter";

const PSYCHE_VAR_KEY_SET = new Set<string>(PSYCHE_VAR_KEYS);
const SKILL_VOICE_ID_SET = new Set<string>(SKILL_VOICE_IDS);
const INNER_VOICE_ID_SET = new Set<string>(INNER_VOICE_IDS);

export const SPEAKER_IDS = [
  ...SKILL_VOICE_IDS,
  ...INNER_VOICE_IDS,
] as const satisfies readonly SpeakerId[];

const SPEAKER_ID_SET = new Set<string>(SPEAKER_IDS);

export interface InnerVoicePalette {
  accent: string;
  accentSoft: string;
  glow: string;
  glowStrong: string;
  text: string;
}

export interface InnerVoiceDefinition {
  label: string;
  worldview: string;
  toneDescriptor: string;
  homePoint: {
    x: number;
    y: number;
    approach: number;
  };
  palette: InnerVoicePalette;
  supportText: string;
  opposeText: string;
}

export const INNER_VOICE_DEFINITIONS: Record<
  InnerVoiceId,
  InnerVoiceDefinition
> = {
  inner_leader: {
    label: "Leader",
    worldview: "Protect the group and act before the room collapses.",
    toneDescriptor: "responsible, rallying, strategic",
    homePoint: { x: 70, y: 70, approach: 70 },
    palette: {
      accent: "#34d399",
      accentSoft: "rgba(52, 211, 153, 0.16)",
      glow: "rgba(52, 211, 153, 0.24)",
      glowStrong: "rgba(110, 231, 183, 0.5)",
      text: "#d1fae5",
    },
    supportText: "Take responsibility and bind the group together.",
    opposeText: "Do not trade the group away for a smaller private gain.",
  },
  inner_guide: {
    label: "Guide",
    worldview: "Listen first, steady the room, then move with care.",
    toneDescriptor: "empathetic, calm, mediating",
    homePoint: { x: 70, y: 70, approach: -70 },
    palette: {
      accent: "#38bdf8",
      accentSoft: "rgba(56, 189, 248, 0.16)",
      glow: "rgba(56, 189, 248, 0.24)",
      glowStrong: "rgba(125, 211, 252, 0.5)",
      text: "#e0f2fe",
    },
    supportText: "Hear the others out before you harden the choice.",
    opposeText: "Do not turn tension into a wound you could still prevent.",
  },
  inner_manipulator: {
    label: "Manipulator",
    worldview: "Control the board before anyone else notices the leverage.",
    toneDescriptor: "calculated, coercive, opportunistic",
    homePoint: { x: 40, y: -70, approach: 70 },
    palette: {
      accent: "#a855f7",
      accentSoft: "rgba(168, 85, 247, 0.16)",
      glow: "rgba(168, 85, 247, 0.24)",
      glowStrong: "rgba(216, 180, 254, 0.5)",
      text: "#f3e8ff",
    },
    supportText: "Turn the people in the room into tools before they move.",
    opposeText: "Do not let sentiment erase a clean advantage.",
  },
  inner_adapter: {
    label: "Adapter",
    worldview: "Stay with the winning current and survive the turn.",
    toneDescriptor: "cautious, conformist, opportunistic",
    homePoint: { x: 40, y: -40, approach: -70 },
    palette: {
      accent: "#f59e0b",
      accentSoft: "rgba(245, 158, 11, 0.16)",
      glow: "rgba(245, 158, 11, 0.24)",
      glowStrong: "rgba(252, 211, 77, 0.5)",
      text: "#fef3c7",
    },
    supportText: "Read the current first and attach yourself to the safe move.",
    opposeText: "Do not be the last person standing on a collapsing story.",
  },
  inner_analyst: {
    label: "Analyst",
    worldview: "Cut through mood, find the efficient line, execute cleanly.",
    toneDescriptor: "cold, precise, rational",
    homePoint: { x: -30, y: 0, approach: 70 },
    palette: {
      accent: "#60a5fa",
      accentSoft: "rgba(96, 165, 250, 0.16)",
      glow: "rgba(96, 165, 250, 0.24)",
      glowStrong: "rgba(147, 197, 253, 0.5)",
      text: "#dbeafe",
    },
    supportText: "Choose the line with the best outcome-to-risk ratio.",
    opposeText: "Do not let impulse ruin a solvable position.",
  },
  inner_cynic: {
    label: "Cynic",
    worldview: "Expect betrayal, move early, and keep the upside for yourself.",
    toneDescriptor: "skeptical, sharp, self-protective",
    homePoint: { x: -70, y: -70, approach: 70 },
    palette: {
      accent: "#f87171",
      accentSoft: "rgba(248, 113, 113, 0.16)",
      glow: "rgba(248, 113, 113, 0.24)",
      glowStrong: "rgba(252, 165, 165, 0.5)",
      text: "#fee2e2",
    },
    supportText: "Assume the room will use you if you let it.",
    opposeText: "Do not volunteer trust where leverage would do.",
  },
  inner_exile: {
    label: "Exile",
    worldview: "No one is coming; survive first and leave the rest behind.",
    toneDescriptor: "bitter, isolated, defensive",
    homePoint: { x: -70, y: -70, approach: -70 },
    palette: {
      accent: "#78716c",
      accentSoft: "rgba(120, 113, 108, 0.18)",
      glow: "rgba(120, 113, 108, 0.24)",
      glowStrong: "rgba(168, 162, 158, 0.46)",
      text: "#e7e5e4",
    },
    supportText: "Step back, cut losses, and keep yourself alive.",
    opposeText: "Do not mistake abandonment for strategy.",
  },
  inner_hermit: {
    label: "Hermit",
    worldview: "Do the least harm, ask for little, and leave softly.",
    toneDescriptor: "gentle, solitary, restrained",
    homePoint: { x: -70, y: 70, approach: -70 },
    palette: {
      accent: "#22c55e",
      accentSoft: "rgba(34, 197, 94, 0.16)",
      glow: "rgba(34, 197, 94, 0.24)",
      glowStrong: "rgba(134, 239, 172, 0.5)",
      text: "#dcfce7",
    },
    supportText: "Choose the path that harms the fewest people.",
    opposeText: "Do not force a clash when distance is still possible.",
  },
};

export const isPsycheVarKey = (value: string): value is PsycheVarKey =>
  PSYCHE_VAR_KEY_SET.has(value);

export const isSkillVoiceId = (value: string): value is SkillVoiceId =>
  SKILL_VOICE_ID_SET.has(value);

export const isInnerVoiceId = (value: string): value is InnerVoiceId =>
  INNER_VOICE_ID_SET.has(value);

export const isSpeakerId = (value: string): value is SpeakerId =>
  SPEAKER_ID_SET.has(value);

export const hasMixedSpeakerPool = (
  speakerIds: readonly string[] | undefined,
): boolean => {
  if (!speakerIds || speakerIds.length === 0) {
    return false;
  }

  let hasSkill = false;
  let hasInner = false;
  for (const speakerId of speakerIds) {
    if (isSkillVoiceId(speakerId)) {
      hasSkill = true;
    }
    if (isInnerVoiceId(speakerId)) {
      hasInner = true;
    }
  }

  return hasSkill && hasInner;
};

export const resolvePsycheVarKey = (axis: PsycheAxis): PsycheVarKey => {
  if (axis === "x") {
    return PSYCHE_AXIS_X_KEY;
  }
  if (axis === "y") {
    return PSYCHE_AXIS_Y_KEY;
  }
  return PSYCHE_APPROACH_KEY;
};
