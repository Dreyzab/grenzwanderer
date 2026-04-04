import {
  canonicalSkillVoiceIdFor,
  getCanonicalVoiceLabel,
} from "../../../data/voiceBridge";

export interface SkillCheckVoicePalette {
  accent: string;
  accentSoft: string;
  glow: string;
  glowStrong: string;
  text: string;
}

const FALLBACK_PALETTE: SkillCheckVoicePalette = {
  accent: "#a8a29e",
  accentSoft: "rgba(168, 162, 158, 0.16)",
  glow: "rgba(168, 162, 158, 0.28)",
  glowStrong: "rgba(168, 162, 158, 0.46)",
  text: "#f5f0e8",
};

const PALETTE_BY_VOICE: Record<string, SkillCheckVoicePalette> = {
  logic: {
    accent: "#60a5fa",
    accentSoft: "rgba(96, 165, 250, 0.16)",
    glow: "rgba(96, 165, 250, 0.24)",
    glowStrong: "rgba(147, 197, 253, 0.5)",
    text: "#dbeafe",
  },
  perception: {
    accent: "#3b82f6",
    accentSoft: "rgba(59, 130, 246, 0.16)",
    glow: "rgba(59, 130, 246, 0.24)",
    glowStrong: "rgba(96, 165, 250, 0.5)",
    text: "#dbeafe",
  },
  encyclopedia: {
    accent: "#8b5cf6",
    accentSoft: "rgba(139, 92, 246, 0.16)",
    glow: "rgba(139, 92, 246, 0.24)",
    glowStrong: "rgba(196, 181, 253, 0.5)",
    text: "#ede9fe",
  },
  deception: {
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.16)",
    glow: "rgba(245, 158, 11, 0.24)",
    glowStrong: "rgba(251, 191, 36, 0.5)",
    text: "#fef3c7",
  },
  attr_persuasion: {
    accent: "#10b981",
    accentSoft: "rgba(16, 185, 129, 0.16)",
    glow: "rgba(16, 185, 129, 0.24)",
    glowStrong: "rgba(110, 231, 183, 0.5)",
    text: "#d1fae5",
  },
  charisma: {
    accent: "#14b8a6",
    accentSoft: "rgba(20, 184, 166, 0.16)",
    glow: "rgba(20, 184, 166, 0.24)",
    glowStrong: "rgba(94, 234, 212, 0.5)",
    text: "#ccfbf1",
  },
  occultism: {
    accent: "#fbbf24",
    accentSoft: "rgba(251, 191, 36, 0.16)",
    glow: "rgba(251, 191, 36, 0.24)",
    glowStrong: "rgba(253, 224, 71, 0.52)",
    text: "#fef3c7",
  },
};

export const formatSkillCheckVoiceLabel = (voiceId: string): string =>
  getCanonicalVoiceLabel(voiceId);

export const formatSkillCheckDifficulty = (val: number): string => {
  if (val <= 3) return "Trivial";
  if (val <= 6) return "Simple";
  if (val <= 9) return "Normal";
  if (val <= 12) return "Demanding";
  if (val <= 15) return "Hard";
  if (val <= 18) return "Legendary";
  return "Impossible";
};

export const getSkillCheckVoicePalette = (
  voiceId: string,
): SkillCheckVoicePalette => {
  const canonicalVoiceId = canonicalSkillVoiceIdFor(voiceId);
  return (
    PALETTE_BY_VOICE[canonicalVoiceId] ??
    PALETTE_BY_VOICE[voiceId] ??
    FALLBACK_PALETTE
  );
};
