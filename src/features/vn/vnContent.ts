import {
  createVnSnapshotIndex,
  getNodeById,
  getScenarioById,
  parseVnSnapshotPayload,
} from "../../shared/vn-contract";
import type {
  RumorStateStatus,
  VnChoice,
  VnCondition,
  VnSnapshot,
} from "./types";
import {
  createMindThoughtInternalizedFlagKey,
  createMindThoughtResearchingFlagKey,
  createMindThoughtUnlockedFlagKey,
} from "../mindpalace/thoughtCabinet";

export {
  createVnSnapshotIndex,
  getNodeById,
  getScenarioById,
  parseVnSnapshotPayload,
};

export const parseSnapshot = (payloadJson: string): VnSnapshot | null => {
  const result = parseVnSnapshotPayload(payloadJson);
  return result.ok ? result.snapshot : null;
};

export interface VnChoiceEvaluationContext {
  favorBalances?:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>;
  agencyStanding?: number;
  rumorStates?:
    | ReadonlyMap<string, RumorStateStatus>
    | Readonly<Record<string, RumorStateStatus>>;
  careerRankId?: string | null;
  careerRankOrder?:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>;
}

const readMappedNumber = (
  source:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>
    | undefined,
  key: string,
): number => {
  if (!source) {
    return 0;
  }
  if (source instanceof Map) {
    return source.get(key) ?? 0;
  }
  return (source as Readonly<Record<string, number>>)[key] ?? 0;
};

const readMappedString = <T extends string>(
  source: ReadonlyMap<string, T> | Readonly<Record<string, T>> | undefined,
  key: string,
): T | null => {
  if (!source) {
    return null;
  }
  if (source instanceof Map) {
    return source.get(key) ?? null;
  }
  return (source as Readonly<Record<string, T>>)[key] ?? null;
};

const evaluateChoiceConditionLeaf = (
  condition: VnCondition,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (condition.type === "flag_equals") {
    return (flags[condition.key] ?? false) === condition.value;
  }
  if (condition.type === "var_gte") {
    return (vars[condition.key] ?? 0) >= condition.value;
  }
  if (condition.type === "var_lte") {
    return (vars[condition.key] ?? 0) <= condition.value;
  }
  if (condition.type === "favor_balance_gte") {
    return (
      readMappedNumber(context?.favorBalances, condition.npcId) >=
      condition.value
    );
  }
  if (condition.type === "agency_standing_gte") {
    return (context?.agencyStanding ?? 0) >= condition.value;
  }
  if (condition.type === "rumor_state_is") {
    return (
      readMappedString(context?.rumorStates, condition.rumorId) ===
      condition.status
    );
  }
  if (condition.type === "hypothesis_focus_is") {
    return (
      (flags[`mind_focus::${condition.caseId}::${condition.hypothesisId}`] ??
        false) === true
    );
  }
  if (condition.type === "thought_state_is") {
    if (condition.state === "internalized") {
      return (
        flags[createMindThoughtInternalizedFlagKey(condition.thoughtId)] ??
        false
      );
    }
    if (condition.state === "researching") {
      return (
        flags[createMindThoughtResearchingFlagKey(condition.thoughtId)] ?? false
      );
    }
    return (
      flags[createMindThoughtUnlockedFlagKey(condition.thoughtId)] ?? false
    );
  }
  if (condition.type === "career_rank_gte") {
    const currentRankId = context?.careerRankId;
    if (!currentRankId) {
      return false;
    }
    const currentOrder = readMappedNumber(
      context?.careerRankOrder,
      currentRankId,
    );
    const requiredOrder = readMappedNumber(
      context?.careerRankOrder,
      condition.rankId,
    );
    return currentOrder >= requiredOrder;
  }

  // Client pre-check is advisory; leave server as authority for unsupported
  // local data sources (inventory/evidence/quest/relationship).
  return true;
};

const evaluateChoiceCondition = (
  condition: VnCondition,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (condition.type === "logic_and") {
    return condition.conditions.every((entry) =>
      evaluateChoiceCondition(entry, flags, vars, context),
    );
  }
  if (condition.type === "logic_or") {
    return condition.conditions.some((entry) =>
      evaluateChoiceCondition(entry, flags, vars, context),
    );
  }
  if (condition.type === "logic_not") {
    return !evaluateChoiceCondition(condition.condition, flags, vars, context);
  }

  return evaluateChoiceConditionLeaf(condition, flags, vars, context);
};

const groupAll = (
  conditions: VnCondition[] | undefined,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  return conditions.every((condition) =>
    evaluateChoiceCondition(condition, flags, vars, context),
  );
};

const groupAny = (
  conditions: VnCondition[] | undefined,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  return conditions.some((condition) =>
    evaluateChoiceCondition(condition, flags, vars, context),
  );
};

const resolveRequireAll = (choice: VnChoice): VnCondition[] | undefined =>
  choice.requireAll ?? choice.conditions;

export const isChoiceVisible = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean =>
  groupAll(choice.visibleIfAll, flags, vars, context) &&
  groupAny(choice.visibleIfAny, flags, vars, context);

export const isChoiceEnabled = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean =>
  groupAll(resolveRequireAll(choice), flags, vars, context) &&
  groupAny(choice.requireAny, flags, vars, context);

export const isChoiceAvailable = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  return isChoiceEnabled(choice, flags, vars, context);
};
