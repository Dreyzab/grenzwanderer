import {
  CASE01_CANON_FLAG_KEYS,
  CASE01_CANON_VAR_KEYS,
} from "../../shared/case01Canon";
import { LEGACY_REPUTATION_VAR_BY_FACTION_ID } from "../../../data/factionContract";

export type PlayerFlagRecord = Record<string, boolean>;
export type PlayerVarRecord = Record<string, number>;

export const pickCase01Flags = (
  flags: PlayerFlagRecord,
): Partial<Record<(typeof CASE01_CANON_FLAG_KEYS)[number], boolean>> =>
  Object.fromEntries(
    CASE01_CANON_FLAG_KEYS.map((key) => [key, flags[key] ?? false]),
  );

export const pickCase01Vars = (
  vars: PlayerVarRecord,
): Partial<Record<(typeof CASE01_CANON_VAR_KEYS)[number], number>> =>
  Object.fromEntries(CASE01_CANON_VAR_KEYS.map((key) => [key, vars[key] ?? 0]));

export const pickCharacterProgressVars = (vars: PlayerVarRecord) => ({
  checksPassed: vars.checks_passed ?? 0,
  checksFailed: vars.checks_failed ?? 0,
  caseProgress: vars.case_progress ?? 0,
  stressIndex: vars.stress_index ?? 0,
});

export const pickLegacyReputationVars = (vars: PlayerVarRecord) =>
  Object.fromEntries(
    Object.entries(LEGACY_REPUTATION_VAR_BY_FACTION_ID).map(
      ([factionId, key]) => [factionId, vars[key] ?? 0],
    ),
  ) as Record<keyof typeof LEGACY_REPUTATION_VAR_BY_FACTION_ID, number>;
