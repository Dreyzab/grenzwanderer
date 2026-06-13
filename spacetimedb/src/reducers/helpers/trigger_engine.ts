import type {
  CaseEventEnvelope,
  TriggerEvaluationResult,
  TriggerRule,
} from "../../../../src/shared/vn-contract";
import { areConditionsSatisfied } from "./vn_rules";

export interface TriggerRuntimeGates {
  activeCooldownGroups?: ReadonlySet<string>;
  remainingBudgets?: Readonly<Record<string, number>>;
  /** Rules this player has already fired (once-per-player enforcement). */
  firedRuleIds?: ReadonlySet<string>;
}

export const evaluateTriggerRule = (
  ctx: any,
  rule: TriggerRule,
  event: Pick<CaseEventEnvelope, "eventName" | "scope">,
  gates: TriggerRuntimeGates = {},
): TriggerEvaluationResult => {
  if (rule.status !== "active") {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "rule_inactive",
    };
  }

  if (rule.eventName !== event.eventName) {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "event_name_mismatch",
    };
  }

  if (rule.caseId && rule.caseId !== event.scope.caseId) {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "case_scope_mismatch",
    };
  }

  if (
    (rule.repeatPolicy ?? "once_per_player") !== "repeatable" &&
    gates.firedRuleIds?.has(rule.id)
  ) {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "already_fired",
    };
  }

  if (!areConditionsSatisfied(ctx, rule.conditions)) {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "conditions_failed",
    };
  }

  if (
    rule.cooldownGroup &&
    gates.activeCooldownGroups?.has(rule.cooldownGroup)
  ) {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "cooldown_active",
    };
  }

  if (rule.budgetKey && (gates.remainingBudgets?.[rule.budgetKey] ?? 1) <= 0) {
    return {
      eligible: false,
      ruleId: rule.id,
      eventName: event.eventName,
      reason: "budget_exhausted",
    };
  }

  return {
    eligible: true,
    ruleId: rule.id,
    eventName: event.eventName,
    generatedNamespace: rule.generatedNamespace,
    allowedArchetypeIds: rule.allowedArchetypeIds ?? [],
  };
};

export const evaluateTriggerRules = (
  ctx: any,
  rules: readonly TriggerRule[],
  event: Pick<CaseEventEnvelope, "eventName" | "scope">,
  gates: TriggerRuntimeGates = {},
): TriggerEvaluationResult[] =>
  rules.map((rule) => evaluateTriggerRule(ctx, rule, event, gates));
