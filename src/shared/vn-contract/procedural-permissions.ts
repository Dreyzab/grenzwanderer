import type { QuestArchetype, TriggerRule, VnEffect } from "./types";

export interface ProceduralQuestPermissionIssue {
  code:
    | "trigger_rule_invalid_generated_namespace"
    | "trigger_rule_forbidden_effect"
    | "quest_archetype_forbidden_reward_effect";
  path: string;
  message: string;
}

/**
 * Effect types a trigger rule may apply directly when it fires. Anything
 * heavier (travel, scenario/battle modes, evidence, skill checks) must go
 * through a quest archetype or an authored VN scene instead.
 */
const TRIGGER_RULE_EFFECT_ALLOWLIST = new Set<VnEffect["type"]>([
  "set_flag",
  "unlock_group",
  "spawn_map_event",
  "register_rumor",
  "change_favor_balance",
  "change_agency_standing",
  "grant_xp",
  "track_event",
]);

export const isTriggerRuleEffectAllowed = (effect: VnEffect): boolean =>
  TRIGGER_RULE_EFFECT_ALLOWLIST.has(effect.type);

export const validateTriggerRuleEffects = (
  rule: TriggerRule,
): ProceduralQuestPermissionIssue[] =>
  (rule.effects ?? []).flatMap((effect, index) =>
    isTriggerRuleEffectAllowed(effect)
      ? []
      : [
          {
            code: "trigger_rule_forbidden_effect" as const,
            path: `triggerRules.${rule.id}.effects.${index}`,
            message: `Trigger rule '${rule.id}' effect '${effect.type}' is not in the trigger effect allowlist.`,
          },
        ],
  );

export const isProceduralOverlayNamespace = (
  namespace: string | undefined,
): namespace is string =>
  typeof namespace === "string" && namespace.startsWith("overlay.proc.");

const isOverlayScopedKey = (
  key: string,
  namespace: string | undefined,
): boolean =>
  isProceduralOverlayNamespace(namespace) && key.startsWith(`${namespace}.`);

export const isProceduralQuestRewardEffectAllowed = (
  effect: VnEffect,
  generatedNamespace: string | undefined,
): boolean => {
  if (effect.type === "track_event") {
    return true;
  }

  if (
    effect.type === "set_flag" ||
    effect.type === "set_var" ||
    effect.type === "add_var"
  ) {
    return isOverlayScopedKey(effect.key, generatedNamespace);
  }

  return false;
};

export const validateProceduralQuestPermissions = (
  rule: TriggerRule,
  archetype: QuestArchetype,
): ProceduralQuestPermissionIssue[] => {
  const issues: ProceduralQuestPermissionIssue[] = [];

  if (!isProceduralOverlayNamespace(rule.generatedNamespace)) {
    issues.push({
      code: "trigger_rule_invalid_generated_namespace",
      path: `triggerRules.${rule.id}.generatedNamespace`,
      message: `Trigger rule '${rule.id}' must use an overlay.proc.* generatedNamespace for generated quest archetypes.`,
    });
  }

  for (const [index, effect] of (archetype.rewardEffects ?? []).entries()) {
    if (
      !isProceduralQuestRewardEffectAllowed(effect, rule.generatedNamespace)
    ) {
      issues.push({
        code: "quest_archetype_forbidden_reward_effect",
        path: `questArchetypes.${archetype.id}.rewardEffects.${index}`,
        message: `Quest archetype '${archetype.id}' reward effect '${effect.type}' is not allowed for generated namespace '${rule.generatedNamespace ?? "<missing>"}'.`,
      });
    }
  }

  return issues;
};
