import type {
  MapBinding,
  MapCondition,
  MapResolverContext,
  RuntimeMapBinding,
} from "../types";

export const evaluateMapCondition = (
  context: MapResolverContext,
  condition: MapCondition,
): boolean => {
  if (condition.type === "flag_is") {
    return context.flags.has(condition.key) === condition.value;
  }
  if (condition.type === "var_gte") {
    return (context.vars.get(condition.key) ?? 0) >= condition.value;
  }
  if (condition.type === "var_lte") {
    return (context.vars.get(condition.key) ?? 0) <= condition.value;
  }
  if (condition.type === "has_item") {
    return context.inventoryItemIds.has(condition.itemId);
  }
  if (condition.type === "has_evidence") {
    return context.evidenceIds.has(condition.evidenceId);
  }
  if (condition.type === "quest_stage_gte") {
    return (context.questStages.get(condition.questId) ?? 0) >= condition.stage;
  }
  if (condition.type === "relationship_gte") {
    return (
      (context.relationships.get(condition.characterId) ?? 0) >= condition.value
    );
  }
  if (condition.type === "unlock_group_has") {
    return context.unlockGroupIds.has(condition.groupId);
  }
  if (condition.type === "point_state_is") {
    return context.pointState === condition.state;
  }
  if (condition.type === "logic_and") {
    return condition.conditions.every((entry) =>
      evaluateMapCondition(context, entry),
    );
  }
  if (condition.type === "logic_or") {
    return condition.conditions.some((entry) =>
      evaluateMapCondition(context, entry),
    );
  }

  return !evaluateMapCondition(context, condition.condition);
};

const normalizeBinding = (binding: MapBinding): RuntimeMapBinding => ({
  ...binding,
  hasStartScenario: binding.actions.some(
    (action) => action.type === "start_scenario",
  ),
  hasTravelAction: binding.actions.some(
    (action) => action.type === "travel_to",
  ),
});

export const resolveAvailableBindings = (
  bindings: readonly MapBinding[] | undefined,
  context: MapResolverContext,
): RuntimeMapBinding[] => {
  if (!bindings || bindings.length === 0) {
    return [];
  }

  return bindings
    .filter((binding) =>
      (binding.conditions ?? []).every((condition) =>
        evaluateMapCondition(context, condition),
      ),
    )
    .sort((left, right) => {
      if (left.priority === right.priority) {
        return left.id.localeCompare(right.id);
      }
      return right.priority - left.priority;
    })
    .map((binding) => normalizeBinding(binding));
};

export const pickPrimaryBinding = (
  bindings: readonly RuntimeMapBinding[],
): RuntimeMapBinding | null =>
  bindings.find((binding) => binding.trigger === "card_primary") ??
  bindings.find((binding) => binding.intent !== "travel") ??
  bindings[0] ??
  null;

export const pickTravelBinding = (
  bindings: readonly RuntimeMapBinding[],
): RuntimeMapBinding | null =>
  bindings.find((binding) => binding.intent === "travel") ??
  bindings.find((binding) => binding.hasTravelAction) ??
  null;

export const resolveScenarioIdFromBindings = (
  bindings: readonly RuntimeMapBinding[],
): string | null => {
  for (const binding of bindings) {
    for (const action of binding.actions) {
      if (action.type === "start_scenario") {
        return action.scenarioId;
      }
    }
  }

  return null;
};
