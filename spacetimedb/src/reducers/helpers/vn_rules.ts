import {
  createEvidenceKey,
  createHypothesisFocusFlagKey,
  createInventoryKey,
  createQuestKey,
  createSkillCheckResultKey,
} from "./keys";
import {
  ensureAgencyCareerRow,
  getAgencyStandingScore,
  getCareerRankOrder,
  getFavorBalance,
  getFlag,
  getRelationshipValue,
  getRumorStatus,
  getVar,
} from "./player";
import type {
  VnChoice,
  VnCondition,
  VnDiceMode,
  VnNode,
  VnSkillCheck,
} from "./types";
import { normalizeRumorStatus } from "./rumor_status";

export { resolveSkillCheckOutcome } from "./skillCheckOutcome";

// Deterministic hash seed for VN skill checks.
const hashDeterministicSeed = (
  timestamp: unknown,
  identity: { toHexString(): string },
  checkId: string,
): number => {
  const seed = `${String(timestamp)}::${identity.toHexString()}::${checkId}`;

  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

export const rollSkillDie = (
  timestamp: unknown,
  identity: { toHexString(): string },
  checkId: string,
  diceMode: VnDiceMode,
): number => {
  const hash = hashDeterministicSeed(timestamp, identity, checkId);
  const sides = diceMode === "d10" ? 10 : 20;
  return (hash % sides) + 1;
};

export const rollD20 = (
  timestamp: unknown,
  identity: { toHexString(): string },
  checkId: string,
): number => rollSkillDie(timestamp, identity, checkId, "d20");

const evaluateVnCondition = (ctx: any, condition: VnCondition): boolean => {
  if (condition.type === "logic_and") {
    return condition.conditions.every((entry) =>
      evaluateVnCondition(ctx, entry),
    );
  }
  if (condition.type === "logic_or") {
    return condition.conditions.some((entry) =>
      evaluateVnCondition(ctx, entry),
    );
  }
  if (condition.type === "logic_not") {
    return !evaluateVnCondition(ctx, condition.condition);
  }

  if (condition.type === "flag_equals") {
    return getFlag(ctx, condition.key) === condition.value;
  }
  if (condition.type === "var_gte") {
    return getVar(ctx, condition.key) >= condition.value;
  }
  if (condition.type === "var_lte") {
    return getVar(ctx, condition.key) <= condition.value;
  }
  if (condition.type === "has_evidence") {
    const evidenceKey = createEvidenceKey(ctx.sender, condition.evidenceId);
    return !!ctx.db.playerEvidence.evidenceKey.find(evidenceKey);
  }
  if (condition.type === "quest_stage_gte") {
    const questKey = createQuestKey(ctx.sender, condition.questId);
    const row = ctx.db.playerQuest.questKey.find(questKey);
    return row ? row.stage >= condition.stage : false;
  }
  if (condition.type === "relationship_gte") {
    return getRelationshipValue(ctx, condition.characterId) >= condition.value;
  }
  if (condition.type === "has_item") {
    const inventoryKey = createInventoryKey(ctx.sender, condition.itemId);
    const row = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
    return row ? row.quantity > 0 : false;
  }
  if (condition.type === "favor_balance_gte") {
    return getFavorBalance(ctx, condition.npcId) >= condition.value;
  }
  if (condition.type === "agency_standing_gte") {
    return getAgencyStandingScore(ctx) >= condition.value;
  }
  if (condition.type === "rumor_state_is") {
    return (
      getRumorStatus(ctx, condition.rumorId) ===
      normalizeRumorStatus(condition.status)
    );
  }
  if (condition.type === "hypothesis_focus_is") {
    return getFlag(
      ctx,
      createHypothesisFocusFlagKey(condition.caseId, condition.hypothesisId),
    );
  }
  if (condition.type === "thought_state_is") {
    if (condition.state === "internalized") {
      return getFlag(ctx, `mind_internalized::${condition.thoughtId}`);
    }
    if (condition.state === "researching") {
      return getFlag(ctx, `mind_researching::${condition.thoughtId}`);
    }
    return getFlag(ctx, `mind_unlocked::${condition.thoughtId}`);
  }
  if (condition.type === "career_rank_gte") {
    const currentRankOrder = getCareerRankOrder(
      ctx,
      ensureAgencyCareerRow(ctx).rankId,
    );
    return currentRankOrder >= getCareerRankOrder(ctx, condition.rankId);
  }
  if (condition.type === "voice_level_gte") {
    return Math.floor(getVar(ctx, condition.voiceId)) >= condition.value;
  }
  if (condition.type === "spirit_state_is") {
    return getFlag(
      ctx,
      `spirit_state_${condition.spiritId}::${condition.state}`,
    );
  }

  return false;
};

export const areConditionsSatisfied = (
  ctx: any,
  conditions: VnCondition[] | undefined,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => evaluateVnCondition(ctx, condition));
};

const areAnyConditionsSatisfied = (
  ctx: any,
  conditions: VnCondition[] | undefined,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.some((condition) => evaluateVnCondition(ctx, condition));
};

const resolveRequireAll = (
  choice: Pick<VnChoice, "requireAll" | "conditions">,
): VnCondition[] | undefined => choice.requireAll ?? choice.conditions;

export const isChoiceVisible = (
  ctx: any,
  choice: Pick<VnChoice, "visibleIfAll" | "visibleIfAny">,
): boolean =>
  areConditionsSatisfied(ctx, choice.visibleIfAll) &&
  areAnyConditionsSatisfied(ctx, choice.visibleIfAny);

export const isChoiceEnabled = (
  ctx: any,
  choice: Pick<VnChoice, "requireAll" | "requireAny" | "conditions">,
): boolean =>
  areConditionsSatisfied(ctx, resolveRequireAll(choice)) &&
  areAnyConditionsSatisfied(ctx, choice.requireAny);

export const isChoiceAllowed = (
  ctx: any,
  choice: Pick<
    VnChoice,
    "visibleIfAll" | "visibleIfAny" | "requireAll" | "requireAny" | "conditions"
  >,
): boolean => isChoiceVisible(ctx, choice) && isChoiceEnabled(ctx, choice);

export const arePassiveChecksResolved = (
  ctx: any,
  scenarioId: string,
  nodeId: string,
  checks: VnSkillCheck[] | undefined,
): boolean => {
  if (!checks || checks.length === 0) {
    return true;
  }

  return checks.every((check) => {
    const resultKey = createSkillCheckResultKey(
      ctx.sender,
      scenarioId,
      nodeId,
      check.id,
    );
    return Boolean(ctx.db.vnSkillCheckResult.resultKey.find(resultKey));
  });
};

export const isNodeEntryAllowed = (
  ctx: any,
  node: Pick<VnNode, "preconditions">,
): boolean => areConditionsSatisfied(ctx, node.preconditions);
