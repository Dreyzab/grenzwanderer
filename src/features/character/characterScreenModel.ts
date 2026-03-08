import type { VoiceOrDeptId } from "../../shared/ui/icons/game-icons";

export type CharacterTabId = "profile" | "development" | "psyche" | "journal";

export type CharacterAttributeKey =
  | "attr_intellect"
  | "attr_psyche"
  | "attr_physical"
  | "attr_spirit"
  | "attr_shadow"
  | "attr_social"
  | "attr_encyclopedia"
  | "attr_perception"
  | "attr_deception";

export interface CharacterAttributeDefinition {
  key: CharacterAttributeKey;
  label: string;
  icon: VoiceOrDeptId;
  isCore: boolean;
  parentCoreKey?: CharacterAttributeKey;
  accent: string;
  description: string;
}

export const CHARACTER_ATTRIBUTES: CharacterAttributeDefinition[] = [
  {
    key: "attr_intellect",
    label: "Intellect",
    icon: "intellect",
    isCore: true,
    accent: "#60a5fa",
    description: "Analytical reasoning and structured deduction.",
  },
  {
    key: "attr_psyche",
    label: "Psyche",
    icon: "psyche",
    isCore: true,
    accent: "#c084fc",
    description: "Internal resolve, intuition, and emotional pressure.",
  },
  {
    key: "attr_physical",
    label: "Physical",
    icon: "physical",
    isCore: true,
    accent: "#f87171",
    description: "Action under pressure, endurance, and direct intervention.",
  },
  {
    key: "attr_spirit",
    label: "Spirit",
    icon: "spirit",
    isCore: true,
    accent: "#34d399",
    description: "Lore, ritual memory, and instinct for the unseen.",
  },
  {
    key: "attr_shadow",
    label: "Shadow",
    icon: "shadow",
    isCore: true,
    accent: "#94a3b8",
    description: "Covert leverage, lies, and movement beyond the light.",
  },
  {
    key: "attr_social",
    label: "Social",
    icon: "social",
    isCore: true,
    accent: "#fbbf24",
    description: "Influence, presence, and control of the room.",
  },
  {
    key: "attr_encyclopedia",
    label: "Encyclopedia",
    icon: "encyclopedia",
    isCore: false,
    parentCoreKey: "attr_intellect",
    accent: "#60a5fa",
    description: "Historical detail, stored facts, and instant recall.",
  },
  {
    key: "attr_perception",
    label: "Perception",
    icon: "perception",
    isCore: false,
    parentCoreKey: "attr_intellect",
    accent: "#60a5fa",
    description: "Fine detail recognition and environmental reading.",
  },
  {
    key: "attr_deception",
    label: "Deception",
    icon: "deception",
    isCore: false,
    parentCoreKey: "attr_shadow",
    accent: "#94a3b8",
    description: "Misleading, masking intent, and weaponized ambiguity.",
  },
];

export const CORE_CHARACTERISTICS = CHARACTER_ATTRIBUTES.filter(
  (attribute) => attribute.isCore,
);

export const SPECIALIZED_ATTRIBUTES = CHARACTER_ATTRIBUTES.filter(
  (attribute) => !attribute.isCore,
);

export const SPECIALIZED_BY_CORE = CORE_CHARACTERISTICS.reduce(
  (registry, coreAttribute) => {
    registry[coreAttribute.key] = SPECIALIZED_ATTRIBUTES.filter(
      (attribute) => attribute.parentCoreKey === coreAttribute.key,
    );
    return registry;
  },
  {} as Partial<Record<CharacterAttributeKey, CharacterAttributeDefinition[]>>,
);
