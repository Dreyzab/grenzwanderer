import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  applyEffects,
  cleanupExpiredMapEvents,
  createEvidenceKey,
  createHypothesisFocusFlagKey,
  createInventoryKey,
  createQuestKey,
  createUnlockGroupKey,
  createRedeemedCodeKey,
  emitTelemetry,
  ensureIdempotent,
  ensureAgencyCareerRow,
  ensurePlayerProfile,
  getActiveSnapshot,
  getAgencyStandingScore,
  getFlag,
  getFavorBalance,
  getCareerRankOrder,
  getPlayerActiveMapEventByEventId,
  getRelationshipValue,
  getRumorStatus,
  getVar,
  type MapAction,
  markMapEventResolved,
  parseStoredMapEventPayload,
  sha256Hex,
  spawnMapEventInternal,
  upsertFlag,
} from "./helpers";
import type {
  MapBinding,
  MapCondition,
  MapPoint,
  MapPointState,
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

const MAP_CODE_RETRY_COOLDOWN_MICROS = 60n * 1_000_000n;
const EARTH_RADIUS_METERS = 6_371_000;

type AttemptLocation = {
  lat: number;
  lng: number;
};

type MapEvaluationCache = {
  currentCareerRankOrder?: number;
  careerRankOrderByRankId: Map<string, number>;
};

const normalizeAttemptCoordinate = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const resolveAttemptLocation = (
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

const timestampMicros = (value: unknown): bigint => {
  if (
    value &&
    typeof value === "object" &&
    "microsSinceUnixEpoch" in (value as Record<string, unknown>)
  ) {
    const micros = (value as { microsSinceUnixEpoch?: unknown })
      .microsSinceUnixEpoch;
    if (typeof micros === "bigint") {
      return micros;
    }
    if (typeof micros === "number" && Number.isFinite(micros)) {
      return BigInt(Math.trunc(micros));
    }
    if (typeof micros === "string" && micros.trim().length > 0) {
      return BigInt(micros);
    }
  }
  return 0n;
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

const haversineDistanceMeters = (
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

const hasGeofenceCondition = (condition: MapCondition): boolean => {
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

const evaluateQrCodeCondition = (
  ctx: any,
  condition: MapCondition,
  attemptedLocation: AttemptLocation | null,
  cache: MapEvaluationCache,
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
    return getRelationshipValue(ctx, condition.characterId) >= condition.value;
  }
  if (condition.type === "favor_balance_gte") {
    return getFavorBalance(ctx, condition.npcId) >= condition.value;
  }
  if (condition.type === "agency_standing_gte") {
    return getAgencyStandingScore(ctx) >= condition.value;
  }
  if (condition.type === "rumor_state_is") {
    return getRumorStatus(ctx, condition.rumorId) === condition.status;
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
    return (
      getCurrentPlayerCareerRankOrderCached(ctx, cache) >=
      getCareerRankOrderCached(ctx, condition.rankId, cache)
    );
  }
  if (condition.type === "unlock_group_has") {
    const unlockKey = createUnlockGroupKey(ctx.sender, condition.groupId);
    return !!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey);
  }
  if (condition.type === "point_state_is") {
    return false;
  }
  if (condition.type === "logic_and") {
    return condition.conditions.every((entry) =>
      evaluateQrCodeCondition(ctx, entry, attemptedLocation, cache),
    );
  }
  if (condition.type === "logic_or") {
    return condition.conditions.some((entry) =>
      evaluateQrCodeCondition(ctx, entry, attemptedLocation, cache),
    );
  }
  if (condition.type === "logic_not") {
    return !evaluateQrCodeCondition(
      ctx,
      condition.condition,
      attemptedLocation,
      cache,
    );
  }
  if (condition.type === "geofence_within") {
    if (!attemptedLocation) {
      return false;
    }

    return (
      haversineDistanceMeters(attemptedLocation, {
        lat: condition.lat,
        lng: condition.lng,
      }) <= condition.radiusMeters
    );
  }

  return false;
};

const insertRedeemAttempt = (
  ctx: any,
  redemptionId: string,
  codeId: string,
  requestId: string,
  result: string,
  attemptedFromLat: number | undefined,
  attemptedFromLng: number | undefined,
): void => {
  ctx.db.playerRedeemedCode.insert({
    redemptionId,
    playerId: ctx.sender,
    codeId,
    requestId,
    redeemedAt: ctx.timestamp,
    result,
    attemptedFromLat,
    attemptedFromLng,
  });
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

const isPointInteractable = (ctx: any, point: MapPoint): boolean => {
  if (point.category === "HUB") {
    return true;
  }

  const briefingComplete = getFlag(ctx, "agency_briefing_complete");
  if (!briefingComplete && point.category !== "EPHEMERAL") {
    return false;
  }

  if (point.category === "PUBLIC" || point.category === "EPHEMERAL") {
    return true;
  }

  return resolvePointState(ctx, point) !== "locked";
};

const evaluateMapCondition = (
  ctx: any,
  point: MapPoint,
  condition: MapCondition,
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
      return getRumorStatus(ctx, condition.rumorId) === condition.status;
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
      return resolvePointState(ctx, point) === condition.state;
    }
    case "logic_and": {
      return condition.conditions.every((entry) =>
        evaluateMapCondition(ctx, point, entry, cache),
      );
    }
    case "logic_or": {
      return condition.conditions.some((entry) =>
        evaluateMapCondition(ctx, point, entry, cache),
      );
    }
    case "logic_not": {
      return !evaluateMapCondition(ctx, point, condition.condition, cache);
    }
    default:
      return false;
  }
};

const assertUnsupportedMapAction = (action: never): never => {
  throw new SenderError(`Unsupported map action: ${JSON.stringify(action)}`);
};

const toVnEffect = (action: Exclude<MapAction, { type: "start_scenario" }>) => {
  if (action.type === "travel_to") {
    return { type: "travel_to", locationId: action.locationId } as const;
  }
  if (action.type === "open_command_mode") {
    return {
      type: "open_command_mode",
      scenarioId: action.scenarioId,
      returnTab: action.returnTab,
    } as const;
  }
  if (action.type === "open_battle_mode") {
    return {
      type: "open_battle_mode",
      scenarioId: action.scenarioId,
      returnTab: action.returnTab,
    } as const;
  }
  if (action.type === "spawn_map_event") {
    return {
      type: "spawn_map_event",
      templateId: action.templateId,
      ttlMinutes: action.ttlMinutes,
    } as const;
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
  if (action.type === "change_favor_balance") {
    return {
      type: "change_favor_balance",
      npcId: action.npcId,
      delta: action.delta,
      reason: action.reason,
    } as const;
  }
  if (action.type === "change_agency_standing") {
    return {
      type: "change_agency_standing",
      delta: action.delta,
      reason: action.reason,
    } as const;
  }
  if (action.type === "change_faction_signal") {
    return {
      type: "change_faction_signal",
      factionId: action.factionId,
      delta: action.delta,
      reason: action.reason,
    } as const;
  }
  if (action.type === "register_rumor") {
    return { type: "register_rumor", rumorId: action.rumorId } as const;
  }
  if (action.type === "verify_rumor") {
    return {
      type: "verify_rumor",
      rumorId: action.rumorId,
      verificationKind: action.verificationKind,
    } as const;
  }
  if (action.type === "record_service_criterion") {
    return {
      type: "record_service_criterion",
      criterionId: action.criterionId,
    } as const;
  }
  if (action.type === "shift_awakening") {
    return {
      type: "shift_awakening",
      amount: action.amount,
      exposureDelta: action.exposureDelta,
    } as const;
  }
  if (action.type === "record_entity_observation") {
    return {
      type: "record_entity_observation",
      observationId: action.observationId,
      entityArchetypeId: action.entityArchetypeId,
      signatureIds: action.signatureIds,
    } as const;
  }
  if (action.type === "unlock_distortion_point") {
    return {
      type: "unlock_distortion_point",
      pointId: action.pointId,
    } as const;
  }
  if (action.type === "set_sight_mode") {
    return { type: "set_sight_mode", mode: action.mode } as const;
  }
  if (action.type === "apply_rationalist_buffer") {
    return {
      type: "apply_rationalist_buffer",
      amount: action.amount,
    } as const;
  }
  if (action.type === "tag_entity_signature") {
    return {
      type: "tag_entity_signature",
      signatureId: action.signatureId,
    } as const;
  }
  if (action.type === "track_event") {
    return {
      type: "track_event",
      eventName: action.eventName,
      tags: action.tags,
      value: action.value,
    } as const;
  }
  return assertUnsupportedMapAction(action);
};

const executeAction = (
  ctx: any,
  point: MapPoint,
  binding: MapBinding,
  action: MapAction,
  options?: { trackVisited?: boolean; sourceType?: string },
): string | null => {
  if (action.type === "start_scenario") {
    startScenarioInternal(ctx, action.scenarioId);
    if (options?.trackVisited !== false) {
      upsertFlag(ctx, visitedFlagKey(point.id), true);
    }
    return action.scenarioId;
  }

  if (action.type === "spawn_map_event") {
    spawnMapEventInternal(ctx, action.templateId, {
      ttlMinutes: action.ttlMinutes,
      sourceLocationId: point.locationId,
      skipCleanup: true,
    });
    return null;
  }

  applyEffects(ctx, [toVnEffect(action)], {
    sourceType: options?.sourceType ?? "map_binding",
    sourceId: `${point.id}::${binding.id}`,
  });

  if (action.type === "travel_to" && options?.trackVisited !== false) {
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

const iterateRedeemRowsByCodeForSender = (
  ctx: any,
  codeId: string,
): Iterable<any> => {
  const senderHex = ctx.sender.toHexString();
  return [
    ...ctx.db.playerRedeemedCode.player_redeemed_code_code_id.filter(codeId),
  ].filter((row) => row.playerId.toHexString() === senderHex);
};

const hasPriorSuccessfulRedeem = (ctx: any, codeId: string): boolean => {
  for (const row of iterateRedeemRowsByCodeForSender(ctx, codeId)) {
    if (row.result === "applied" || row.result === "queued_after_briefing") {
      return true;
    }
  }
  return false;
};

const hasRecentRejectedRedeem = (
  ctx: any,
  codeId: string,
  nowMicros: bigint,
): boolean => {
  for (const row of iterateRedeemRowsByCodeForSender(ctx, codeId)) {
    if (
      row.result !== "blocked_flags" &&
      row.result !== "location_required" &&
      row.result !== "outside_geofence"
    ) {
      continue;
    }

    if (
      timestampMicros(row.redeemedAt) + MAP_CODE_RETRY_COOLDOWN_MICROS >
      nowMicros
    ) {
      return true;
    }
  }
  return false;
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
    cleanupExpiredMapEvents(ctx);

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

    const point = map.points.find((entry) => entry.id === pointId) ?? null;

    const activeEventRow =
      point === null ? getPlayerActiveMapEventByEventId(ctx, pointId) : null;
    const runtimePoint = (point ??
      (activeEventRow
        ? parseStoredMapEventPayload(activeEventRow.payloadJson).point
        : null)) as MapPoint | null;
    if (!runtimePoint) {
      rejectMapInteraction(ctx, telemetryBase, "binding_not_found");
      return;
    }
    if (!activeEventRow && !isPointInteractable(ctx, runtimePoint)) {
      rejectMapInteraction(ctx, telemetryBase, "point_not_visible");
      return;
    }

    const binding = runtimePoint.bindings.find(
      (entry) => entry.id === bindingId,
    );
    if (!binding || binding.trigger !== trigger) {
      rejectMapInteraction(ctx, telemetryBase, "binding_not_found");
      return;
    }

    const mapEvaluationCache: MapEvaluationCache = {
      careerRankOrderByRankId: new Map<string, number>(),
    };
    const conditionsMet = (binding.conditions ?? []).every((condition) =>
      evaluateMapCondition(ctx, runtimePoint, condition, mapEvaluationCache),
    );
    if (!conditionsMet) {
      rejectMapInteraction(ctx, telemetryBase, "conditions_failed");
      return;
    }

    let startedScenarioId: string | null = null;
    try {
      for (const action of binding.actions) {
        const startedFromAction = executeAction(
          ctx,
          runtimePoint,
          binding,
          action,
          {
            trackVisited: !activeEventRow,
            sourceType: activeEventRow ? "map_event_binding" : "map_binding",
          },
        );
        if (startedFromAction) {
          startedScenarioId = startedFromAction;
        }
      }
      if (activeEventRow) {
        markMapEventResolved(ctx, activeEventRow.eventId);
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

export const redeem_map_code = spacetimedb.reducer(
  {
    requestId: t.string(),
    code: t.string(),
    attemptedFromLat: t.f64().optional(),
    attemptedFromLng: t.f64().optional(),
  },
  (ctx, { requestId, code, attemptedFromLat, attemptedFromLng }) => {
    if (!code || code.trim().length === 0) {
      throw new SenderError("code must not be empty");
    }

    ensureIdempotent(ctx, requestId, "redeem_map_code");
    ensurePlayerProfile(ctx);
    cleanupExpiredMapEvents(ctx);

    const { snapshot, activeVersion } = getActiveSnapshot(ctx);
    const registry = snapshot.map?.qrCodeRegistry ?? [];
    const codeHash = sha256Hex(code.trim());
    const entry = registry.find((candidate) => candidate.codeHash === codeHash);
    const normalizedAttemptedFromLat =
      normalizeAttemptCoordinate(attemptedFromLat);
    const normalizedAttemptedFromLng =
      normalizeAttemptCoordinate(attemptedFromLng);
    const attemptedLocation = resolveAttemptLocation(
      normalizedAttemptedFromLat,
      normalizedAttemptedFromLng,
    );

    if (!entry) {
      emitTelemetry(ctx, "map_code_rejected", {
        requestId,
        reason: "invalid_code",
        contentVersion: activeVersion.version,
      });
      throw new SenderError("invalid_map_code");
    }

    const redemptionId = createRedeemedCodeKey(ctx.sender, requestId);
    const priorSuccess = hasPriorSuccessfulRedeem(ctx, entry.codeId);

    if (entry.redeemPolicy === "once_per_player" && priorSuccess) {
      insertRedeemAttempt(
        ctx,
        redemptionId,
        entry.codeId,
        requestId,
        "already_redeemed",
        normalizedAttemptedFromLat,
        normalizedAttemptedFromLng,
      );
      emitTelemetry(ctx, "map_code_rejected", {
        requestId,
        codeId: entry.codeId,
        reason: "already_redeemed",
        contentVersion: activeVersion.version,
      });
      throw new SenderError("code_already_redeemed");
    }

    const priorRejectedAttempt = hasRecentRejectedRedeem(
      ctx,
      entry.codeId,
      ctx.timestamp.microsSinceUnixEpoch,
    );

    if (priorRejectedAttempt) {
      insertRedeemAttempt(
        ctx,
        redemptionId,
        entry.codeId,
        requestId,
        "cooldown",
        normalizedAttemptedFromLat,
        normalizedAttemptedFromLng,
      );
      emitTelemetry(ctx, "map_code_rejected", {
        requestId,
        codeId: entry.codeId,
        reason: "cooldown",
        contentVersion: activeVersion.version,
      });
      throw new SenderError("code_retry_later");
    }

    const missingFlags = (entry.requiresFlagsAll ?? []).filter(
      (flagKey) => getFlag(ctx, flagKey) === false,
    );
    const missingNonBriefingFlags = missingFlags.filter(
      (flagKey) => flagKey !== "agency_briefing_complete",
    );
    if (missingNonBriefingFlags.length > 0) {
      insertRedeemAttempt(
        ctx,
        redemptionId,
        entry.codeId,
        requestId,
        "blocked_flags",
        normalizedAttemptedFromLat,
        normalizedAttemptedFromLng,
      );
      emitTelemetry(ctx, "map_code_rejected", {
        requestId,
        codeId: entry.codeId,
        reason: "blocked_flags",
        missingFlags: missingNonBriefingFlags,
        contentVersion: activeVersion.version,
      });
      throw new SenderError("code_not_available");
    }

    const conditionChecks = (entry.conditions ?? []).map((condition) => ({
      condition,
      includesGeofence: hasGeofenceCondition(condition),
    }));
    const geofenceRequired = conditionChecks.some(
      (check) => check.includesGeofence,
    );
    if (geofenceRequired && !attemptedLocation) {
      insertRedeemAttempt(
        ctx,
        redemptionId,
        entry.codeId,
        requestId,
        "location_required",
        normalizedAttemptedFromLat,
        normalizedAttemptedFromLng,
      );
      emitTelemetry(ctx, "map_code_rejected", {
        requestId,
        codeId: entry.codeId,
        reason: "location_required",
        contentVersion: activeVersion.version,
      });
      throw new SenderError("code_location_required");
    }

    const evaluationCache: MapEvaluationCache = {
      careerRankOrderByRankId: new Map<string, number>(),
    };
    let geofenceFailed = false;
    let conditionsMet = true;
    for (const check of conditionChecks) {
      const conditionMet = evaluateQrCodeCondition(
        ctx,
        check.condition,
        attemptedLocation,
        evaluationCache,
      );
      if (!conditionMet) {
        conditionsMet = false;
        if (check.includesGeofence) {
          geofenceFailed = true;
        }
      }
    }
    if (!conditionsMet) {
      const rejectionResult = geofenceFailed
        ? "outside_geofence"
        : "blocked_flags";
      const rejectionError = geofenceFailed
        ? "code_outside_geofence"
        : "code_not_available";
      insertRedeemAttempt(
        ctx,
        redemptionId,
        entry.codeId,
        requestId,
        rejectionResult,
        normalizedAttemptedFromLat,
        normalizedAttemptedFromLng,
      );
      emitTelemetry(ctx, "map_code_rejected", {
        requestId,
        codeId: entry.codeId,
        reason: rejectionResult,
        contentVersion: activeVersion.version,
      });
      throw new SenderError(rejectionError);
    }

    const queuedAfterBriefing =
      missingFlags.includes("agency_briefing_complete") &&
      !entry.requiresBriefingBypass;

    for (const effect of entry.effects) {
      if (effect.type === "spawn_map_event") {
        spawnMapEventInternal(ctx, effect.templateId, {
          ttlMinutes: effect.ttlMinutes,
          sourceLocationId: "loc_agency",
          snapshot,
          snapshotChecksum: activeVersion.checksum,
          skipCleanup: true,
        });
        continue;
      }

      applyEffects(ctx, [effect], {
        sourceType: "map_code",
        sourceId: entry.codeId,
      });
    }

    insertRedeemAttempt(
      ctx,
      redemptionId,
      entry.codeId,
      requestId,
      queuedAfterBriefing ? "queued_after_briefing" : "applied",
      normalizedAttemptedFromLat,
      normalizedAttemptedFromLng,
    );

    emitTelemetry(ctx, "map_code_redeemed", {
      requestId,
      codeId: entry.codeId,
      result: queuedAfterBriefing ? "queued_after_briefing" : "applied",
      contentVersion: activeVersion.version,
    });
  },
);
