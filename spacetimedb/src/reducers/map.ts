import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  applyEffects,
  createEvidenceKey,
  createInventoryKey,
  createQuestKey,
  createRelationshipKey,
  createUnlockGroupKey,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  getActiveSnapshot,
  getFlag,
  getVar,
  type MapAction,
  type MapBinding,
  type MapCondition,
  type MapPoint,
  type MapPointState,
  upsertFlag,
} from "./helpers";
import { startScenarioInternal } from "./vn";

const visitedFlagKey = (pointId: string): string => `VISITED_${pointId}`;
const completedFlagKey = (pointId: string): string => `COMPLETED_${pointId}`;

const rejectMapInteraction = (
  ctx: any,
  tags: Record<string, unknown>,
  reason: string,
): never => {
  emitTelemetry(ctx, "map_interaction_rejected", {
    ...tags,
    reason,
  });
  throw new SenderError(reason);
};

const resolvePointState = (ctx: any, point: MapPoint): MapPointState => {
  if (getFlag(ctx, completedFlagKey(point.id))) {
    return "completed";
  }
  if (getFlag(ctx, visitedFlagKey(point.id))) {
    return "visited";
  }

  const currentLocation = ctx.db.playerLocation.playerId.find(ctx.sender);
  if (currentLocation?.locationId === point.locationId) {
    return "visited";
  }

  if (point.unlockGroup) {
    const unlockKey = createUnlockGroupKey(ctx.sender, point.unlockGroup);
    if (ctx.db.playerUnlockGroup.unlockKey.find(unlockKey)) {
      return "discovered";
    }
  }

  return point.defaultState ?? "locked";
};

const evaluateMapCondition = (
  ctx: any,
  point: MapPoint,
  condition: MapCondition,
): boolean => {
  if (condition.type === "flag_is") {
    return getFlag(ctx, condition.key) === condition.value;
  }
  if (condition.type === "var_gte") {
    return getVar(ctx, condition.key) >= condition.value;
  }
  if (condition.type === "var_lte") {
    return getVar(ctx, condition.key) <= condition.value;
  }
  if (condition.type === "has_item") {
    const inventoryKey = createInventoryKey(ctx.sender, condition.itemId);
    const row = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
    return row ? row.quantity > 0 : false;
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
    const relKey = createRelationshipKey(ctx.sender, condition.characterId);
    const row = ctx.db.playerRelationship.relationshipKey.find(relKey);
    return row ? row.value >= condition.value : false;
  }
  if (condition.type === "unlock_group_has") {
    const unlockKey = createUnlockGroupKey(ctx.sender, condition.groupId);
    return !!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey);
  }
  if (condition.type === "point_state_is") {
    return resolvePointState(ctx, point) === condition.state;
  }
  if (condition.type === "logic_and") {
    return condition.conditions.every((entry) =>
      evaluateMapCondition(ctx, point, entry),
    );
  }
  if (condition.type === "logic_or") {
    return condition.conditions.some((entry) =>
      evaluateMapCondition(ctx, point, entry),
    );
  }
  if (condition.type === "logic_not") {
    return !evaluateMapCondition(ctx, point, condition.condition);
  }

  return false;
};

const toVnEffect = (action: Exclude<MapAction, { type: "start_scenario" }>) => {
  if (action.type === "travel_to") {
    return { type: "travel_to", locationId: action.locationId } as const;
  }
  if (action.type === "set_flag") {
    return { type: "set_flag", key: action.key, value: action.value } as const;
  }
  if (action.type === "unlock_group") {
    return { type: "unlock_group", groupId: action.groupId } as const;
  }
  if (action.type === "set_quest_stage") {
    return {
      type: "set_quest_stage",
      questId: action.questId,
      stage: action.stage,
    } as const;
  }
  if (action.type === "grant_evidence") {
    return { type: "grant_evidence", evidenceId: action.evidenceId } as const;
  }
  if (action.type === "grant_xp") {
    return { type: "grant_xp", amount: action.amount } as const;
  }
  if (action.type === "change_relationship") {
    return {
      type: "change_relationship",
      characterId: action.characterId,
      delta: action.delta,
    } as const;
  }
  return {
    type: "track_event",
    eventName: action.eventName,
    tags: action.tags,
    value: action.value,
  } as const;
};

const executeAction = (
  ctx: any,
  point: MapPoint,
  binding: MapBinding,
  action: MapAction,
): string | null => {
  if (action.type === "start_scenario") {
    startScenarioInternal(ctx, action.scenarioId);
    upsertFlag(ctx, visitedFlagKey(point.id), true);
    return action.scenarioId;
  }

  applyEffects(ctx, [toVnEffect(action)], {
    sourceType: "map_binding",
    sourceId: `${point.id}::${binding.id}`,
  });

  if (action.type === "travel_to") {
    upsertFlag(ctx, visitedFlagKey(point.id), true);
  }

  return null;
};

const normalizeMapActionError = (error: unknown): SenderError => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unknown scenario")) {
    return new SenderError("scenario_missing");
  }
  if (message.includes("Scenario start is blocked by completion route rules")) {
    return new SenderError("start_blocked_by_route");
  }
  if (error instanceof SenderError) {
    return error;
  }
  return new SenderError("map_interact_failed");
};

export const map_interact = spacetimedb.reducer(
  {
    requestId: t.string(),
    pointId: t.string(),
    bindingId: t.string(),
    trigger: t.string(),
  },
  (ctx, { requestId, pointId, bindingId, trigger }) => {
    if (!pointId || pointId.trim().length === 0) {
      throw new SenderError("pointId must not be empty");
    }
    if (!bindingId || bindingId.trim().length === 0) {
      throw new SenderError("bindingId must not be empty");
    }
    if (!trigger || trigger.trim().length === 0) {
      throw new SenderError("trigger must not be empty");
    }

    ensureIdempotent(ctx, requestId, "map_interact");
    ensurePlayerProfile(ctx);

    const { snapshot, activeVersion } = getActiveSnapshot(ctx);
    const telemetryBase = {
      pointId,
      bindingId,
      trigger,
      contentVersion: activeVersion.version,
    };

    emitTelemetry(ctx, "map_interaction_attempted", telemetryBase);

    const map = snapshot.map;
    if (!map) {
      rejectMapInteraction(ctx, telemetryBase, "map_not_available");
      return;
    }

    const point = map.points.find((entry) => entry.id === pointId);
    if (!point) {
      rejectMapInteraction(ctx, telemetryBase, "binding_not_found");
      return;
    }

    const binding = point.bindings.find((entry) => entry.id === bindingId);
    if (!binding || binding.trigger !== trigger) {
      rejectMapInteraction(ctx, telemetryBase, "binding_not_found");
      return;
    }

    const conditionsMet = (binding.conditions ?? []).every((condition) =>
      evaluateMapCondition(ctx, point, condition),
    );
    if (!conditionsMet) {
      rejectMapInteraction(ctx, telemetryBase, "conditions_failed");
      return;
    }

    let startedScenarioId: string | null = null;
    try {
      for (const action of binding.actions) {
        const startedFromAction = executeAction(ctx, point, binding, action);
        if (startedFromAction) {
          startedScenarioId = startedFromAction;
        }
      }
    } catch (error) {
      const normalized = normalizeMapActionError(error);
      rejectMapInteraction(ctx, telemetryBase, normalized.message);
    }

    emitTelemetry(ctx, "map_interaction_succeeded", {
      ...telemetryBase,
      intent: binding.intent,
      startedScenarioId,
    });
  },
);
