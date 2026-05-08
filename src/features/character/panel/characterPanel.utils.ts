import type {
  InnerVoiceId,
  SkillVoiceId,
} from "../../../../data/innerVoiceContract";
import type { VoiceOrDeptId } from "../../../shared/ui/icons/game-icons";
import type { OriginProfileDefinition } from "../originProfiles";
import type {
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

export const PATRON_VOICE_ICON_BY_ID = {
  inner_leader: "authority",
  inner_guide: "empathy",
  inner_manipulator: "charisma",
  inner_adapter: "agility",
  inner_analyst: "logic",
  inner_cynic: "perception",
  inner_exile: "occultism",
  inner_hermit: "tradition",
} as const satisfies Record<InnerVoiceId, VoiceOrDeptId>;

export const SKILL_VOICE_ICON_BY_ID = {
  attr_agility: "agility",
  attr_authority: "authority",
  attr_charisma: "charisma",
  attr_composure: "volition",
  attr_deception: "deception",
  attr_empathy: "empathy",
  attr_encyclopedia: "encyclopedia",
  attr_endurance: "endurance",
  attr_forensics: "perception",
  attr_imagination: "imagination",
  attr_intellect: "intellect",
  attr_intrusion: "intrusion",
  attr_intuition: "intuition",
  attr_logic: "logic",
  attr_occultism: "occultism",
  attr_perception: "perception",
  attr_physical: "physical",
  attr_poetics: "imagination",
  attr_psyche: "psyche",
  attr_shadow: "shadow",
  attr_social: "social",
  attr_spirit: "spirit",
  attr_stealth: "stealth",
  attr_tradition: "tradition",
} as const satisfies Record<SkillVoiceId, VoiceOrDeptId>;

export const getPatronVoiceIcon = (voiceId: InnerVoiceId): VoiceOrDeptId =>
  PATRON_VOICE_ICON_BY_ID[voiceId];

export const getSkillVoiceIcon = (skillId: SkillVoiceId): VoiceOrDeptId =>
  SKILL_VOICE_ICON_BY_ID[skillId];
