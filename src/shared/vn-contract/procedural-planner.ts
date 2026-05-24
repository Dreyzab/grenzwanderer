import type {
  QuestArchetype,
  QuestInstancePlan,
  QuestPlannerBlockKind,
  TriggerRule,
} from "./types";
import {
  isProceduralOverlayNamespace,
  isProceduralQuestRewardEffectAllowed,
} from "./procedural-permissions";

export interface QuestPlannerCatalogInput {
  triggerRules: readonly TriggerRule[];
  questArchetypes: readonly QuestArchetype[];
}

export interface QuestInstancePlanValidationIssue {
  code:
    | "quest_plan_invalid_schema_version"
    | "quest_plan_unknown_trigger_rule"
    | "quest_plan_unknown_archetype"
    | "quest_plan_archetype_not_allowed_by_trigger"
    | "quest_plan_archetype_version_mismatch"
    | "quest_plan_namespace_mismatch"
    | "quest_plan_invalid_generated_namespace"
    | "quest_plan_empty_steps"
    | "quest_plan_invalid_step_block"
    | "quest_plan_step_not_in_archetype"
    | "quest_plan_forbidden_reward_effect";
  path: string;
  message: string;
}

export interface QuestInstancePlanValidationResult {
  ok: boolean;
  issues: QuestInstancePlanValidationIssue[];
}

const QUEST_PLANNER_BLOCK_KINDS: readonly QuestPlannerBlockKind[] = [
  "hook",
  "ask",
  "travel",
  "witness",
  "obstacle",
  "payment",
  "reveal",
  "resolution",
];

const addIssue = (
  issues: QuestInstancePlanValidationIssue[],
  issue: QuestInstancePlanValidationIssue,
): void => {
  issues.push(issue);
};

export const validateQuestInstancePlan = (
  plan: QuestInstancePlan,
  catalog: QuestPlannerCatalogInput,
): QuestInstancePlanValidationResult => {
  const issues: QuestInstancePlanValidationIssue[] = [];
  const triggerRule = catalog.triggerRules.find(
    (entry) => entry.id === plan.triggerRuleId,
  );
  const archetype = catalog.questArchetypes.find(
    (entry) => entry.id === plan.archetypeId,
  );

  if (plan.schemaVersion !== 1) {
    addIssue(issues, {
      code: "quest_plan_invalid_schema_version",
      path: "schemaVersion",
      message: "QuestInstancePlan schemaVersion must be 1.",
    });
  }

  if (!triggerRule) {
    addIssue(issues, {
      code: "quest_plan_unknown_trigger_rule",
      path: "triggerRuleId",
      message: `QuestInstancePlan references unknown trigger rule '${plan.triggerRuleId}'.`,
    });
  }

  if (!archetype) {
    addIssue(issues, {
      code: "quest_plan_unknown_archetype",
      path: "archetypeId",
      message: `QuestInstancePlan references unknown quest archetype '${plan.archetypeId}'.`,
    });
  }

  if (triggerRule && archetype) {
    if (
      triggerRule.allowedArchetypeIds &&
      !triggerRule.allowedArchetypeIds.includes(archetype.id)
    ) {
      addIssue(issues, {
        code: "quest_plan_archetype_not_allowed_by_trigger",
        path: "archetypeId",
        message: `Quest archetype '${archetype.id}' is not allowed by trigger rule '${triggerRule.id}'.`,
      });
    }

    if (plan.archetypeVersion !== archetype.version) {
      addIssue(issues, {
        code: "quest_plan_archetype_version_mismatch",
        path: "archetypeVersion",
        message: `QuestInstancePlan archetypeVersion ${plan.archetypeVersion} does not match '${archetype.id}' version ${archetype.version}.`,
      });
    }

    if (plan.generatedNamespace !== triggerRule.generatedNamespace) {
      addIssue(issues, {
        code: "quest_plan_namespace_mismatch",
        path: "generatedNamespace",
        message: `QuestInstancePlan generatedNamespace must match trigger rule '${triggerRule.id}'.`,
      });
    }

    for (const [index, effect] of (plan.rewardEffects ?? []).entries()) {
      if (
        !isProceduralQuestRewardEffectAllowed(
          effect,
          triggerRule.generatedNamespace,
        )
      ) {
        addIssue(issues, {
          code: "quest_plan_forbidden_reward_effect",
          path: `rewardEffects.${index}`,
          message: `QuestInstancePlan reward effect '${effect.type}' is not allowed for generated namespace '${triggerRule.generatedNamespace ?? "<missing>"}'.`,
        });
      }
    }
  }

  if (!isProceduralOverlayNamespace(plan.generatedNamespace)) {
    addIssue(issues, {
      code: "quest_plan_invalid_generated_namespace",
      path: "generatedNamespace",
      message: "QuestInstancePlan generatedNamespace must use overlay.proc.*.",
    });
  }

  if (plan.steps.length === 0) {
    addIssue(issues, {
      code: "quest_plan_empty_steps",
      path: "steps",
      message: "QuestInstancePlan must contain at least one step.",
    });
  }

  for (const [index, step] of plan.steps.entries()) {
    if (!QUEST_PLANNER_BLOCK_KINDS.includes(step.blockKind)) {
      addIssue(issues, {
        code: "quest_plan_invalid_step_block",
        path: `steps.${index}.blockKind`,
        message: `QuestInstancePlan step '${step.id}' uses unsupported blockKind '${step.blockKind}'.`,
      });
    }

    if (
      archetype &&
      step.nodeId &&
      !archetype.stepNodeIds.includes(step.nodeId)
    ) {
      addIssue(issues, {
        code: "quest_plan_step_not_in_archetype",
        path: `steps.${index}.nodeId`,
        message: `QuestInstancePlan step '${step.id}' references node '${step.nodeId}' outside archetype '${archetype.id}'.`,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};
