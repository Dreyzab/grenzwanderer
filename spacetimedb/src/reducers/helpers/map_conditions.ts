import {
  createEvidenceKey,
  createHypothesisFocusFlagKey,
  createInventoryKey,
  createQuestKey,
  createUnlockGroupKey,
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
import { emitTelemetry } from "./telemetry";
import { normalizeRumorStatus } from "./rumor_status";
import type { MapCondition, MapPoint, MapPointState } from "./types";

export const visitedFlagKey = (pointId: string): string => `VISITED_${pointId}`;
export const completedFlagKey = (pointId: string): string =>
  `COMPLETED_${pointId}`;
export const discoveredFlagKey = (pointId: string): string =>
  `DISCOVERED_${pointId}`;

const EARTH_RADIUS_METERS = 6_371_000;

export type AttemptLocation = {
  lat: number;
  lng: number;
};

export type MapEvaluationCache = {
  currentCareerRankOrder?: number;
  careerRankOrderByRankId: Map<string, number>;
};

export const createMapEvaluationCache = (): MapEvaluationCache => ({
  careerRankOrderByRankId: new Map<string, number>(),
});

/**
 * Evaluation scope for a single map condition tree. `point` enables
 * point_state_is; `attemptedLocation` enables geofence_within. Conditions
 * that need missing scope evaluate to false and are reported via telemetry
 * so authored content cannot silently dead-end.
 */
export type MapConditionScope = {
  point?: MapPoint | null;
  attemptedLocation?: AttemptLocation | null;
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

export const haversineDistanceMeters = (
  from: AttemptLocation,
  to: AttemptLocation,
): number => {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const normalizeAttemptCoordinate = (
  value: unknown,
): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const resolveAttemptLocation = (
  attemptedFromLat: unknown,
  attemptedFromLng: unknown,
): AttemptLocation | null => {
  const lat = normalizeAttemptCoordinate(attemptedFromLat);
  const lng = normalizeAttemptCoordinate(attemptedFromLng);
  if (lat === undefined || lng === undefined) {
    return null;
  }

  return { lat, lng };
};

export const hasGeofenceCondition = (condition: MapCondition): boolean => {
  if (condition.type === "geofence_within") {
    return true;
  }
  if (condition.type === "logic_and" || condition.type === "logic_or") {
    return condition.conditions.some((entry) => hasGeofenceCondition(entry));
  }
  if (condition.type === "logic_not") {
    return hasGeofenceCondition(condition.condition);
  }
  return false;
};

const getCareerRankOrderCached = (
  ctx: any,
  rankId: string,
  cache: MapEvaluationCache,
): number => {
  const cached = cache.careerRankOrderByRankId.get(rankId);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = getCareerRankOrder(ctx, rankId);
  cache.careerRankOrderByRankId.set(rankId, resolved);
  return resolved;
};

const getCurrentPlayerCareerRankOrderCached = (
  ctx: any,
  cache: MapEvaluationCache,
): number => {
  if (cache.currentCareerRankOrder !== undefined) {
    return cache.currentCareerRankOrder;
  }
  const rankId = ensureAgencyCareerRow(ctx).rankId;
  const resolved = getCareerRankOrderCached(ctx, rankId, cache);
  cache.currentCareerRankOrder = resolved;
  return resolved;
};

export const resolvePointState = (ctx: any, point: MapPoint): MapPointState => {
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

  if (getFlag(ctx, discoveredFlagKey(point.id))) {
    return "discovered";
  }

  return point.defaultState ?? "locked";
};

const reportUnsupportedCondition = (
  ctx: any,
  scope: MapConditionScope,
  conditionType: string,
  reason: string,
): false => {
  emitTelemetry(ctx, "map_condition_unsupported", {
    conditionType,
    reason,
    pointId: scope.point?.id,
  });
  return false;
};

export const evaluateMapCondition = (
  ctx: any,
  condition: MapCondition,
  scope: MapConditionScope,
  cache: MapEvaluationCache,
): boolean => {
  switch (condition.type) {
    case "flag_is": {
      return getFlag(ctx, condition.key) === condition.value;
    }
    case "var_gte": {
      return getVar(ctx, condition.key) >= condition.value;
    }
    case "var_lte": {
      return getVar(ctx, condition.key) <= condition.value;
    }
    case "has_item": {
      const inventoryKey = createInventoryKey(ctx.sender, condition.itemId);
      const row = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
      return row ? row.quantity > 0 : false;
    }
    case "has_evidence": {
      const evidenceKey = createEvidenceKey(ctx.sender, condition.evidenceId);
      return !!ctx.db.playerEvidence.evidenceKey.find(evidenceKey);
    }
    case "quest_stage_gte": {
      const questKey = createQuestKey(ctx.sender, condition.questId);
      const row = ctx.db.playerQuest.questKey.find(questKey);
      return row ? row.stage >= condition.stage : false;
    }
    case "relationship_gte": {
      return (
        getRelationshipValue(ctx, condition.characterId) >= condition.value
      );
    }
    case "favor_balance_gte": {
      return getFavorBalance(ctx, condition.npcId) >= condition.value;
    }
    case "agency_standing_gte": {
      return getAgencyStandingScore(ctx) >= condition.value;
    }
    case "rumor_state_is": {
      const desired = normalizeRumorStatus(condition.status);
      return (
        desired !== null && getRumorStatus(ctx, condition.rumorId) === desired
      );
    }
    case "hypothesis_focus_is": {
      return getFlag(
        ctx,
        createHypothesisFocusFlagKey(condition.caseId, condition.hypothesisId),
      );
    }
    case "thought_state_is": {
      if (condition.state === "internalized") {
        return getFlag(ctx, `mind_internalized::${condition.thoughtId}`);
      }
      if (condition.state === "researching") {
        return getFlag(ctx, `mind_researching::${condition.thoughtId}`);
      }
      return getFlag(ctx, `mind_unlocked::${condition.thoughtId}`);
    }
    case "career_rank_gte": {
      return (
        getCurrentPlayerCareerRankOrderCached(ctx, cache) >=
        getCareerRankOrderCached(ctx, condition.rankId, cache)
      );
    }
    case "unlock_group_has": {
      const unlockKey = createUnlockGroupKey(ctx.sender, condition.groupId);
      return !!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey);
    }
    case "point_state_is": {
      if (!scope.point) {
        return reportUnsupportedCondition(
          ctx,
          scope,
          condition.type,
          "point_scope_missing",
        );
      }
      return resolvePointState(ctx, scope.point) === condition.state;
    }
    case "geofence_within": {
      if (!scope.attemptedLocation) {
        return false;
      }
      return (
        haversineDistanceMeters(scope.attemptedLocation, {
          lat: condition.lat,
          lng: condition.lng,
        }) <= condition.radiusMeters
      );
    }
    case "logic_and": {
      return condition.conditions.every((entry) =>
        evaluateMapCondition(ctx, entry, scope, cache),
      );
    }
    case "logic_or": {
      return condition.conditions.some((entry) =>
        evaluateMapCondition(ctx, entry, scope, cache),
      );
    }
    case "logic_not": {
      return !evaluateMapCondition(ctx, condition.condition, scope, cache);
    }
    default: {
      const unknown = condition as { type?: string };
      return reportUnsupportedCondition(
        ctx,
        scope,
        unknown.type ?? "unknown",
        "condition_type_unknown",
      );
    }
  }
};

export const evaluateAllMapConditions = (
  ctx: any,
  conditions: readonly MapCondition[] | undefined,
  scope: MapConditionScope,
  cache: MapEvaluationCache,
): boolean =>
  (conditions ?? []).every((condition) =>
    evaluateMapCondition(ctx, condition, scope, cache),
  );
