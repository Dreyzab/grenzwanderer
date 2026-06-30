import {
  INNER_VOICE_IDS,
  SKILL_VOICE_IDS,
  type InnerVoiceId,
  type SkillVoiceId,
} from "./innerVoiceContract";
import { PARLIAMENT_MODULES } from "./parliamentModules";
import {
  SKILL_DEFINITIONS,
  SKILL_IDS_BY_PATRON_VOICE,
  type SkillProgressionRole,
} from "./skillDefinitions";

export type CanonVoiceLayer = "method" | "motive";
export type CanonVoiceStatus = "CANON" | "TRANSITIONAL" | "LEGACY_ALIAS";

export interface CurrentCanonEra {
  value: 1900;
  status: "operational-canon";
  retconCandidate: 1905;
  decision: string;
}

export interface CurrentCanonVoiceRow {
  id: SkillVoiceId | InnerVoiceId;
  layer: CanonVoiceLayer;
  status: CanonVoiceStatus;
  label: string;
  progressionRole?: SkillProgressionRole;
  canonicalId?: string;
  patronInner?: InnerVoiceId;
  note?: string;
}

const skillVoiceIdsByProgressionRole = (
  progressionRole: SkillProgressionRole,
): SkillVoiceId[] =>
  SKILL_VOICE_IDS.filter(
    (skillId) => SKILL_DEFINITIONS[skillId].progressionRole === progressionRole,
  );

/**
 * Player-facing method subset. Runtime still keeps all 24 `attr_*` skill voices;
 * the 18/6 split is derived from `SKILL_DEFINITIONS.progressionRole`.
 */
export const METHOD_VOICE_DISPLAY_IDS = skillVoiceIdsByProgressionRole("method");

/** Aggregate/core-display voices that remain in the runtime registry for now. */
export const COMPATIBILITY_VOICE_IDS =
  skillVoiceIdsByProgressionRole("compatibility");

const methodVoiceRows: CurrentCanonVoiceRow[] = SKILL_VOICE_IDS.map((skillId) => {
  const definition = SKILL_DEFINITIONS[skillId];
  const isCompatibility = definition.progressionRole === "compatibility";
  return {
    id: skillId,
    layer: "method",
    status: isCompatibility ? "TRANSITIONAL" : "CANON",
    label: definition.label,
    progressionRole: definition.progressionRole,
    canonicalId: definition.canonicalId,
    patronInner: definition.patronVoice,
    note: isCompatibility
      ? "Aggregate/core-display compatibility voice: retained in the 24 runtime registry, hidden from the 18-method display subset."
      : undefined,
  };
});

const motiveVoiceRows: CurrentCanonVoiceRow[] = INNER_VOICE_IDS.map((voiceId) => ({
  id: voiceId,
  layer: "motive",
  status: voiceId === "inner_analyst" ? "TRANSITIONAL" : "CANON",
  label: voiceId.replace(/^inner_/, ""),
  note:
    voiceId === "inner_analyst"
      ? "Runtime id retained; possible future rename to inner_witness requires var migration ADR."
      : undefined,
}));

/**
 * Machine-readable identity ledger for the Inner Parliament. Keep counts derived
 * from runtime registries so prose cannot silently re-open the 24 vs 18 dispute.
 */
export const CURRENT_CANON = {
  era: {
    value: 1900,
    status: "operational-canon",
    retconCandidate: 1905,
    decision: "1905 requires a separate ADR before becoming runtime canon",
  } satisfies CurrentCanonEra,
  runtimeSkillVoices: SKILL_VOICE_IDS,
  methodVoiceDisplayIds: METHOD_VOICE_DISPLAY_IDS,
  compatibilityVoiceIds: COMPATIBILITY_VOICE_IDS,
  motiveFactions: INNER_VOICE_IDS,
  patronTriples: SKILL_IDS_BY_PATRON_VOICE,
  originPresets: Object.keys(PARLIAMENT_MODULES),
  voiceRows: [...methodVoiceRows, ...motiveVoiceRows],
} as const;
