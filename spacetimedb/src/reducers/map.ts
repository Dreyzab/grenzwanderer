import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  applyEffects,
  CASE_EVENT_NAMES,
  cleanupExpiredMapEvents,
  createMapEvaluationCache,
  createUnlockGroupKey,
  createRedeemedCodeKey,
  discoveredFlagKey,
  emitTelemetry,
  ensureIdempotent,
  ensurePlayerProfile,
  evaluateMapCondition,
  getActiveSnapshot,
  getFlag,
  getPlayerActiveMapEventByEventId,
  hasGeofenceCondition,
  type MapAction,
  markMapEventResolved,
  normalizeAttemptCoordinate,
  parseStoredMapEventPayload,
  publishCaseEvent,
  resolveAttemptLocation,
  resolvePointState,
  sha256Hex,
  spawnMapEventInternal,
  upsertFlag,
  validateMapDiscovery,
  visitedFlagKey,
} from "./helpers";
import type { MapBinding, MapPoint } from "./helpers";
import {
  hasPriorSuccessfulRedeem,
  hasRecentRejectedRedeem,
} from "./helpers/map_redemption";
import { startScenarioInternal } from "./vn";

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
  if (action.type === "discover_fact") {
    return {
      type: "discover_fact",
      caseId: action.caseId,
      factId: action.factId,
      sourceType: action.sourceType,
      sourceId: action.sourceId,
    } as const;
  }
  if (action.type === "grant_xp") {
    return { type: "grant_xp", amount: action.amount } as const;
  }
  if (action.type === "grant_skill_xp") {
    return {
      type: "grant_skill_xp",
      skillId: action.skillId,
      amount: action.amount,
    } as const;
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

export const map_interact = spacetimedb.reducer(
  {
    requestId: t.string(),
    pointId: t.string(),
    bindingId: t.string(),
    trigger: t.string(),
    attemptedFromLat: t.f64().optional(),
    attemptedFromLng: t.f64().optional(),
  },
  (
    ctx,
    {
      requestId,
      pointId,
      bindingId,
      trigger,
      attemptedFromLat,
      attemptedFromLng,
    },
  ) => {
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

    const attemptedLocation = resolveAttemptLocation(
      attemptedFromLat,
      attemptedFromLng,
    );
    const bindingConditions = binding.conditions ?? [];
    if (
      !attemptedLocation &&
      bindingConditions.some((condition) => hasGeofenceCondition(condition))
    ) {
      rejectMapInteraction(ctx, telemetryBase, "location_required");
      return;
    }

    const mapEvaluationCache = createMapEvaluationCache();
    const conditionScope = { point: runtimePoint, attemptedLocation };
    const conditionsMet = bindingConditions.every((condition) =>
      evaluateMapCondition(ctx, condition, conditionScope, mapEvaluationCache),
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
    publishCaseEvent(ctx, {
      eventName: CASE_EVENT_NAMES.mapInteracted,
      payloadJson: JSON.stringify({
        pointId,
        bindingId,
        trigger,
        intent: binding.intent,
        startedScenarioId,
      }),
      idempotencyKey: `${requestId}:map_interacted`,
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

    const evaluationCache = createMapEvaluationCache();
    const qrConditionScope = { attemptedLocation };
    let geofenceFailed = false;
    let conditionsMet = true;
    for (const check of conditionChecks) {
      const conditionMet = evaluateMapCondition(
        ctx,
        check.condition,
        qrConditionScope,
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
    if (!queuedAfterBriefing) {
      publishCaseEvent(ctx, {
        eventName: CASE_EVENT_NAMES.mapCodeRedeemed,
        payloadJson: JSON.stringify({ codeId: entry.codeId }),
        idempotencyKey: `${requestId}:map_code_redeemed`,
      });
    }
  },
);

export const commit_map_discovery = spacetimedb.reducer(
  {
    requestId: t.string(),
    pointId: t.string(),
    channel: t.string(),
    attemptedFromLat: t.f64().optional(),
    attemptedFromLng: t.f64().optional(),
  },
  (
    ctx,
    { requestId, pointId, channel, attemptedFromLat, attemptedFromLng },
  ) => {
    if (!pointId || pointId.trim().length === 0) {
      throw new SenderError("pointId must not be empty");
    }
    if (!channel || channel.trim().length === 0) {
      throw new SenderError("channel must not be empty");
    }

    ensureIdempotent(ctx, requestId, "commit_map_discovery");
    ensurePlayerProfile(ctx);

    const { snapshot } = getActiveSnapshot(ctx);
    const point = snapshot.map?.points.find((entry) => entry.id === pointId);
    if (!point) {
      throw new SenderError(`Unknown map point ${pointId}`);
    }

    const attemptedLocation = resolveAttemptLocation(
      attemptedFromLat,
      attemptedFromLng,
    );
    const validation = validateMapDiscovery(ctx, point, {
      channel,
      attemptedLocation,
      cache: createMapEvaluationCache(),
    });
    if (!validation.ok) {
      emitTelemetry(ctx, "map_discovery_rejected", {
        pointId,
        channel,
        reason: validation.reason,
        attemptedFromLat: normalizeAttemptCoordinate(attemptedFromLat),
        attemptedFromLng: normalizeAttemptCoordinate(attemptedFromLng),
      });
      throw new SenderError(validation.reason);
    }

    upsertFlag(ctx, discoveredFlagKey(pointId), true);

    if (point.unlockGroup) {
      const unlockKey = createUnlockGroupKey(ctx.sender, point.unlockGroup);
      if (!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey)) {
        ctx.db.playerUnlockGroup.insert({
          unlockKey,
          playerId: ctx.sender,
          groupId: point.unlockGroup,
          unlockedAt: ctx.timestamp,
        });
      }
    }

    emitTelemetry(ctx, "map_point_discovered", {
      pointId,
      channel,
      unlockGroup: point.unlockGroup,
    });
    publishCaseEvent(ctx, {
      eventName: CASE_EVENT_NAMES.mapPointDiscovered,
      payloadJson: JSON.stringify({ pointId, channel }),
      idempotencyKey: `${requestId}:map_point_discovered`,
    });
  },
);
