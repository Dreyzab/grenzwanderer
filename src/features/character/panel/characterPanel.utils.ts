import {
  canonicalSkillVoiceIdFor,
  getCanonicalVoiceLabel,
  getCanonicalVoicePromptProfile,
} from "../../../../data/voiceBridge";
import type { CharacterAttributeDefinition } from "../characterScreenModel";
import type { OriginProfileDefinition } from "../originProfiles";
import type {
  AttributeVoiceBridgeSummary,
  CharacterContactEntry,
  CharacterQuestJournalEntry,
} from "./characterPanel.types";

export const toLocale = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

export const normalizeNumber = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

export const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }

  return null;
};

export const getGenderLabel = (
  gender: OriginProfileDefinition["dossier"]["gender"],
): string => (gender === "female" ? "F" : "M");

export const getStatusTone = (status: CharacterQuestJournalEntry["status"]) => {
  if (status === "Completed") {
    return {
      borderColor: "rgba(52, 211, 153, 0.35)",
      color: "#86efac",
      backgroundColor: "rgba(6, 78, 59, 0.18)",
    };
  }

  if (status === "In progress") {
    return {
      borderColor: "rgba(212, 167, 79, 0.35)",
      color: "#fcd34d",
      backgroundColor: "rgba(120, 53, 15, 0.18)",
    };
  }

  return {
    borderColor: "rgba(138, 151, 168, 0.22)",
    color: "#cbd5e1",
    backgroundColor: "rgba(23, 22, 20, 0.3)",
  };
};

export const getSocialTone = (
  tone: CharacterContactEntry["relationshipTone"],
): { borderColor: string; color: string; backgroundColor: string } => {
  if (tone === "highlight") {
    return {
      borderColor: "rgba(212, 167, 79, 0.34)",
      color: "#fcd34d",
      backgroundColor: "rgba(120, 53, 15, 0.18)",
    };
  }
  if (tone === "success") {
    return {
      borderColor: "rgba(52, 211, 153, 0.28)",
      color: "#86efac",
      backgroundColor: "rgba(6, 78, 59, 0.18)",
    };
  }
  if (tone === "warning") {
    return {
      borderColor: "rgba(251, 191, 36, 0.28)",
      color: "#fcd34d",
      backgroundColor: "rgba(120, 53, 15, 0.18)",
    };
  }
  if (tone === "danger") {
    return {
      borderColor: "rgba(248, 113, 113, 0.28)",
      color: "#fca5a5",
      backgroundColor: "rgba(127, 29, 29, 0.18)",
    };
  }
  return {
    borderColor: "rgba(255, 255, 255, 0.08)",
    color: "#e2e8f0",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  };
};

export const buildAttributeVoiceBridge = (
  attribute: CharacterAttributeDefinition,
): AttributeVoiceBridgeSummary | null => {
  const canonicalVoiceId = canonicalSkillVoiceIdFor(attribute.key);
  const promptProfile = getCanonicalVoicePromptProfile(attribute.key);

  if (canonicalVoiceId === attribute.key && !promptProfile) {
    return null;
  }

  return {
    legacyVoiceId: attribute.key,
    canonicalVoiceId,
    canonicalLabel: getCanonicalVoiceLabel(attribute.key),
    iconName:
      canonicalVoiceId.startsWith("attr_") ||
      canonicalVoiceId.startsWith("inner_")
        ? attribute.icon
        : canonicalVoiceId,
    promptProfile,
  };
};
