import { SenderError } from "spacetimedb/server";
import type {
  CaseEventEnvelope,
  QuestArchetype,
  QuestStepInstance,
  TriggerRule,
} from "../../../../src/shared/vn-contract";
import {
  CASE_CATALOG,
  isTriggerRuleEffectAllowed,
  validateProceduralQuestPermissions,
} from "../../../../src/shared/vn-contract";
import {
  emitCaseEvent,
  type CaseEventLogRow,
  type EmitCaseEventInput,
} from "./case_events";
import { applyEffects } from "./effects";
import { identityKey } from "./keys";
import { parseSnapshotPayload } from "./parsers";
import { emitTelemetry } from "./telemetry";
import {
  evaluateTriggerRules,
  type TriggerRuntimeGates,
} from "./trigger_engine";
import { computeTriggerRuntimeGates, recordTriggerFire } from "./trigger_fires";

export interface QuestInstanceCatalog {
  triggerRules: readonly TriggerRule[];
  questArchetypes: readonly QuestArchetype[];
}

// The published snapshot is the runtime truth for trigger rules and quest
// archetypes; the compiled CASE_CATALOG stays as the authoring source and as
// the fallback for content versions published before caseCatalog existed.
// Parsing the snapshot is expensive, so the resolved catalog is memoized per
// active checksum (deterministic: same checksum -> same catalog).
let cachedCaseCatalog: {
  checksum: string;
  catalog: QuestInstanceCatalog;
} | null = null;

/** Test-only: clears memoized snapshot catalog between reducer tests. */
export const resetCaseCatalogCacheForTests = (): void => {
  cachedCaseCatalog = null;
};

export const resolveActiveCaseCatalog = (ctx: any): QuestInstanceCatalog => {
  try {
    const activeVersion = [
      ...ctx.db.contentVersion.content_version_is_active.filter(true),
    ][0];
    if (!activeVersion?.checksum) {
      return CASE_CATALOG;
    }
    if (
      cachedCaseCatalog &&
      cachedCaseCatalog.checksum === activeVersion.checksum
    ) {
      return cachedCaseCatalog.catalog;
    }

    const snapshotRow = ctx.db.contentSnapshot.checksum.find(
      activeVersion.checksum,
    );
    if (!snapshotRow) {
      return CASE_CATALOG;
    }

    const snapshot = parseSnapshotPayload(snapshotRow.payloadJson);
    const catalog: QuestInstanceCatalog = snapshot.caseCatalog ?? CASE_CATALOG;
    cachedCaseCatalog = { checksum: activeVersion.checksum, catalog };
    return catalog;
  } catch {
    // Test contexts and bootstrap paths may lack active content.
    return CASE_CATALOG;
  }
};

export interface MaterializedQuestInstanceResult {
  row?: any;
  created: boolean;
  rejected?: boolean;
  rejectionReason?: string;
}

export interface CaseEnteredTriggerInput {
  caseId: string;
  scenarioId: string;
  nodeId: string;
  contentVersion: string;
  idempotencyKey: string;
}

export type TriggerSourceEvent = Pick<
  CaseEventEnvelope,
  "eventName" | "scope"
> &
  Partial<Pick<CaseEventEnvelope, "idempotencyKey" | "payload">>;

export const createQuestInstanceKey = (
  player: { toHexString(): string },
  triggerRuleId: string,
  archetypeId: string,
): string => `${identityKey(player)}::${triggerRuleId}::${archetypeId}`;

const resolveBundleChecksum = (
  ctx: any,
  caseId: string | undefined,
): string => {
  try {
    const activeVersion = [
      ...ctx.db.contentVersion.content_version_is_active.filter(true),
    ][0];
    if (activeVersion?.checksum) {
      return activeVersion.checksum;
    }
  } catch {
    // Test contexts and smoke harnesses may not have active content.
  }

  if (caseId) {
    try {
      const caseVersions = [
        ...ctx.db.caseVersion.case_version_case_id.filter(caseId),
      ];
      const latest = caseVersions[caseVersions.length - 1];
      if (latest?.checksum) {
        return latest.checksum;
      }
    } catch {
      // Fall through to the deterministic fallback below.
    }
  }

  return "unknown";
};

const buildQuestSteps = (archetype: QuestArchetype): QuestStepInstance[] =>
  archetype.stepNodeIds.map((nodeId, index) => ({
    id: `${archetype.id}.step.${index + 1}`,
    nodeId,
    status: index === 0 ? "active" : "pending",
  }));

const buildEligibilitySnapshot = (
  rule: TriggerRule,
  archetype: QuestArchetype,
  sourceEvent: TriggerSourceEvent,
): Record<string, unknown> => ({
  triggerRuleId: rule.id,
  archetypeId: archetype.id,
  eventName: sourceEvent.eventName,
  caseId: sourceEvent.scope.caseId,
  scenarioId: sourceEvent.scope.scenarioId,
  nodeId: sourceEvent.scope.nodeId,
  sourceQuestInstanceId: sourceEvent.scope.questInstanceId,
  idempotencyKey: sourceEvent.idempotencyKey,
  payload: sourceEvent.payload,
});

const parseQuestSteps = (stepsJson: string): QuestStepInstance[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stepsJson);
  } catch {
    throw new SenderError("quest instance stepsJson must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new SenderError("quest instance stepsJson must be an array");
  }

  return parsed.map((step) => {
    if (!step || typeof step !== "object") {
      throw new SenderError("quest instance step must be an object");
    }
    return step as QuestStepInstance;
  });
};

const findSenderQuestInstanceByInstanceId = (
  ctx: any,
  instanceId: string,
): any | undefined => {
  const senderKey = identityKey(ctx.sender);
  return [
    ...ctx.db.questInstance.quest_instance_instance_id.filter(instanceId),
  ].find((row: any) => row.playerId && identityKey(row.playerId) === senderKey);
};

const rejectUnsafeQuestMaterialization = (
  ctx: any,
  rule: TriggerRule,
  archetype: QuestArchetype,
): MaterializedQuestInstanceResult | undefined => {
  const issues = validateProceduralQuestPermissions(rule, archetype);
  if (issues.length === 0) {
    return undefined;
  }

  const reason = issues[0]?.code ?? "procedural_quest_policy_rejected";
  emitTelemetry(ctx, "quest_instance_materialization_rejected", {
    triggerRuleId: rule.id,
    archetypeId: archetype.id,
    reason,
  });

  return {
    created: false,
    rejected: true,
    rejectionReason: reason,
  };
};

export const materializeQuestInstanceFromArchetype = (
  ctx: any,
  rule: TriggerRule,
  archetype: QuestArchetype,
  sourceEvent: TriggerSourceEvent,
): MaterializedQuestInstanceResult => {
  const rejection = rejectUnsafeQuestMaterialization(ctx, rule, archetype);
  if (rejection) {
    return rejection;
  }

  const questInstanceKey = createQuestInstanceKey(
    ctx.sender,
    rule.id,
    archetype.id,
  );
  const existing = ctx.db.questInstance.questInstanceKey.find(questInstanceKey);
  if (existing) {
    return { row: existing, created: false };
  }

  const row = {
    questInstanceKey,
    playerId: ctx.sender,
    instanceId: questInstanceKey,
    kind: "generated_side_case",
    status: "active",
    triggerRuleId: rule.id,
    archetypeId: archetype.id,
    archetypeVersion: Math.max(0, Math.trunc(archetype.version)),
    bundleChecksum: resolveBundleChecksum(ctx, rule.caseId),
    stateNamespace:
      rule.generatedNamespace ??
      `overlay.proc.${rule.caseId ?? "global"}.${archetype.id}`,
    stepsJson: JSON.stringify(buildQuestSteps(archetype)),
    eligibilitySnapshotJson: JSON.stringify(
      buildEligibilitySnapshot(rule, archetype, sourceEvent),
    ),
    createdAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  };

  ctx.db.questInstance.insert(row);
  emitTelemetry(ctx, "quest_instance_materialized", {
    triggerRuleId: rule.id,
    archetypeId: archetype.id,
    caseId: rule.caseId,
    eventName: sourceEvent.eventName,
  });

  return { row, created: true };
};

const applyQuestRewardEffects = (
  ctx: any,
  instanceRow: { archetypeId: string; instanceId: string },
  catalog: QuestInstanceCatalog,
): void => {
  const archetype = catalog.questArchetypes.find(
    (entry) => entry.id === instanceRow.archetypeId,
  );
  if (!archetype?.rewardEffects || archetype.rewardEffects.length === 0) {
    return;
  }

  applyEffects(ctx, archetype.rewardEffects, {
    sourceType: "quest_reward",
    sourceId: `${instanceRow.archetypeId}::${instanceRow.instanceId}`,
  });
  emitTelemetry(ctx, "quest_reward_effects_applied", {
    archetypeId: instanceRow.archetypeId,
    instanceId: instanceRow.instanceId,
    effectCount: archetype.rewardEffects.length,
  });
};

export interface CompleteQuestInstanceResult {
  row: any;
  updated: boolean;
}

export interface AdvanceQuestInstanceResult {
  row: any;
  updated: boolean;
  completedStepId?: string;
  nextStepId?: string;
  completed: boolean;
}

export const completeQuestInstance = (
  ctx: any,
  instanceId: string,
  idempotencyKey: string,
  catalogOverride?: QuestInstanceCatalog,
): CompleteQuestInstanceResult => {
  const catalog = catalogOverride ?? resolveActiveCaseCatalog(ctx);
  if (!instanceId || instanceId.trim().length === 0) {
    throw new SenderError("instanceId must not be empty");
  }

  const existing = findSenderQuestInstanceByInstanceId(ctx, instanceId);
  if (!existing) {
    throw new SenderError("Quest instance not found");
  }

  if (existing.status === "completed") {
    return { row: existing, updated: false };
  }
  if (existing.status === "failed" || existing.status === "tombstoned") {
    throw new SenderError(
      `Quest instance cannot be completed from status '${existing.status}'`,
    );
  }
  if (existing.status !== "pending" && existing.status !== "active") {
    throw new SenderError(
      `Quest instance cannot be completed from status '${existing.status}'`,
    );
  }

  const updated = {
    ...existing,
    status: "completed",
    stepsJson: JSON.stringify(
      parseQuestSteps(existing.stepsJson).map((step) => ({
        ...step,
        status: "completed",
      })),
    ),
    updatedAt: ctx.timestamp,
  };
  ctx.db.questInstance.questInstanceKey.update(updated);

  applyQuestRewardEffects(ctx, existing, catalog);

  publishCaseEvent(
    ctx,
    {
      eventName: "quest_instance.completed",
      questInstanceId: instanceId,
      payloadJson: "{}",
      idempotencyKey,
    },
    { catalog },
  );
  emitTelemetry(ctx, "quest_instance_completed", {
    triggerRuleId: existing.triggerRuleId,
    archetypeId: existing.archetypeId,
    instanceId,
  });

  return { row: updated, updated: true };
};

export const advanceQuestInstance = (
  ctx: any,
  instanceId: string,
  idempotencyKey: string,
  stepId?: string,
  catalogOverride?: QuestInstanceCatalog,
): AdvanceQuestInstanceResult => {
  const catalog = catalogOverride ?? resolveActiveCaseCatalog(ctx);
  if (!instanceId || instanceId.trim().length === 0) {
    throw new SenderError("instanceId must not be empty");
  }
  if (stepId !== undefined && stepId.trim().length === 0) {
    throw new SenderError("stepId must not be empty");
  }

  const existing = findSenderQuestInstanceByInstanceId(ctx, instanceId);
  if (!existing) {
    throw new SenderError("Quest instance not found");
  }

  if (existing.status === "completed") {
    return { row: existing, updated: false, completed: true };
  }
  if (existing.status === "failed" || existing.status === "tombstoned") {
    throw new SenderError(
      `Quest instance cannot be advanced from status '${existing.status}'`,
    );
  }
  if (existing.status !== "pending" && existing.status !== "active") {
    throw new SenderError(
      `Quest instance cannot be advanced from status '${existing.status}'`,
    );
  }

  const steps = parseQuestSteps(existing.stepsJson);
  const activeIndexes = steps
    .map((step, index) => (step.status === "active" ? index : -1))
    .filter((index) => index >= 0);
  if (activeIndexes.length !== 1) {
    throw new SenderError("Quest instance must have exactly one active step");
  }

  const activeIndex = activeIndexes[0];
  const activeStep = steps[activeIndex];
  if (stepId !== undefined && activeStep.id !== stepId) {
    throw new SenderError("stepId does not match active quest step");
  }

  const nextPendingIndex = steps.findIndex(
    (step, index) => index > activeIndex && step.status === "pending",
  );
  const nextStep = nextPendingIndex >= 0 ? steps[nextPendingIndex] : undefined;
  const updatedSteps = steps.map((step, index) => {
    if (index === activeIndex) {
      return { ...step, status: "completed" };
    }
    if (index === nextPendingIndex) {
      return { ...step, status: "active" };
    }
    return step;
  });
  const completed = !nextStep;
  const updated = {
    ...existing,
    status: completed ? "completed" : "active",
    stepsJson: JSON.stringify(updatedSteps),
    updatedAt: ctx.timestamp,
  };
  ctx.db.questInstance.questInstanceKey.update(updated);

  publishCaseEvent(
    ctx,
    {
      eventName: "quest_instance.step_advanced",
      questInstanceId: instanceId,
      payloadJson: JSON.stringify({
        completedStepId: activeStep.id,
        nextStepId: nextStep?.id,
        completed,
      }),
      idempotencyKey,
    },
    { catalog },
  );
  emitTelemetry(ctx, "quest_instance_step_advanced", {
    triggerRuleId: existing.triggerRuleId,
    archetypeId: existing.archetypeId,
    instanceId,
    completedStepId: activeStep.id,
    nextStepId: nextStep?.id,
    completed,
  });

  if (completed) {
    applyQuestRewardEffects(ctx, existing, catalog);

    publishCaseEvent(
      ctx,
      {
        eventName: "quest_instance.completed",
        questInstanceId: instanceId,
        payloadJson: JSON.stringify({ completedBy: "advance_quest_instance" }),
        idempotencyKey: `${idempotencyKey}:completed`,
      },
      { catalog },
    );
    emitTelemetry(ctx, "quest_instance_completed", {
      triggerRuleId: existing.triggerRuleId,
      archetypeId: existing.archetypeId,
      instanceId,
      completedBy: "advance_quest_instance",
    });
  }

  return {
    row: updated,
    updated: true,
    completedStepId: activeStep.id,
    nextStepId: nextStep?.id,
    completed,
  };
};

const applyTriggerRuleEffects = (
  ctx: any,
  rule: TriggerRule,
  sourceEvent: TriggerSourceEvent,
): void => {
  const effects = rule.effects ?? [];
  if (effects.length === 0) {
    return;
  }

  const allowed = effects.filter((effect) =>
    isTriggerRuleEffectAllowed(effect),
  );
  const rejectedCount = effects.length - allowed.length;
  if (rejectedCount > 0) {
    emitTelemetry(ctx, "trigger_effect_rejected", {
      ruleId: rule.id,
      eventName: sourceEvent.eventName,
      rejectedCount,
    });
  }
  if (allowed.length === 0) {
    return;
  }

  // Trigger consequences are auxiliary: a broken authored effect (e.g. a
  // spawn template missing from the active snapshot) must not roll back the
  // player's primary action that emitted the event.
  try {
    applyEffects(ctx, allowed, {
      sourceType: "trigger_effect",
      sourceId: `${rule.id}::${sourceEvent.eventName}`,
    });
    emitTelemetry(ctx, "trigger_effects_applied", {
      ruleId: rule.id,
      eventName: sourceEvent.eventName,
      effectCount: allowed.length,
    });
  } catch (error) {
    emitTelemetry(ctx, "trigger_effects_failed", {
      ruleId: rule.id,
      eventName: sourceEvent.eventName,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

export const processCaseEventTriggers = (
  ctx: any,
  catalog: QuestInstanceCatalog,
  sourceEvent: TriggerSourceEvent,
  gates?: TriggerRuntimeGates,
): MaterializedQuestInstanceResult[] => {
  const archetypesById = new Map(
    catalog.questArchetypes.map((archetype) => [archetype.id, archetype]),
  );
  const effectiveGates =
    gates ?? computeTriggerRuntimeGates(ctx, catalog.triggerRules);
  const results = evaluateTriggerRules(
    ctx,
    catalog.triggerRules,
    sourceEvent,
    effectiveGates,
  );
  const materialized: MaterializedQuestInstanceResult[] = [];

  for (const result of results) {
    if (!result.eligible) {
      continue;
    }

    const rule = catalog.triggerRules.find(
      (entry) => entry.id === result.ruleId,
    );
    if (!rule) {
      continue;
    }

    recordTriggerFire(ctx, rule, sourceEvent);
    emitTelemetry(ctx, "trigger_rule_fired", {
      ruleId: rule.id,
      eventName: sourceEvent.eventName,
      caseId: sourceEvent.scope.caseId,
    });
    applyTriggerRuleEffects(ctx, rule, sourceEvent);

    const archetypeId = result.allowedArchetypeIds[0];
    if (!archetypeId) {
      continue;
    }
    const archetype = archetypesById.get(archetypeId);
    if (!archetype) {
      continue;
    }

    materialized.push(
      materializeQuestInstanceFromArchetype(ctx, rule, archetype, sourceEvent),
    );
  }

  return materialized;
};

// Trigger processing only runs for top-level publishes. Events emitted while
// triggers are already being processed (quest materialization, reward
// effects, …) still land in the event log but do not re-enter the trigger
// loop — this caps trigger→event→trigger recursion deterministically.
const MAX_CASE_EVENT_DISPATCH_DEPTH = 1;
let caseEventDispatchDepth = 0;

export interface PublishCaseEventOptions {
  catalog?: QuestInstanceCatalog;
  gates?: TriggerRuntimeGates;
}

export interface PublishCaseEventResult {
  eventRow: CaseEventLogRow;
  triggerResults: MaterializedQuestInstanceResult[];
  triggersProcessed: boolean;
}

export const publishCaseEvent = (
  ctx: any,
  input: EmitCaseEventInput,
  options: PublishCaseEventOptions = {},
): PublishCaseEventResult => {
  const eventRow = emitCaseEvent(ctx, input);

  if (caseEventDispatchDepth >= MAX_CASE_EVENT_DISPATCH_DEPTH) {
    emitTelemetry(ctx, "case_event_dispatch_depth_capped", {
      eventName: eventRow.eventName,
      depth: caseEventDispatchDepth,
    });
    return { eventRow, triggerResults: [], triggersProcessed: false };
  }

  caseEventDispatchDepth += 1;
  try {
    const triggerResults = processCaseEventTriggers(
      ctx,
      options.catalog ?? resolveActiveCaseCatalog(ctx),
      {
        eventName: eventRow.eventName,
        scope: {
          caseId: eventRow.caseId,
          scenarioId: eventRow.scenarioId,
          nodeId: eventRow.nodeId,
          questInstanceId: eventRow.questInstanceId,
        },
        idempotencyKey: eventRow.idempotencyKey,
        payload: JSON.parse(eventRow.payloadJson) as Record<string, unknown>,
      },
      options.gates,
    );
    return { eventRow, triggerResults, triggersProcessed: true };
  } finally {
    caseEventDispatchDepth -= 1;
  }
};

export const emitCaseEnteredAndProcessTriggers = (
  ctx: any,
  catalog: QuestInstanceCatalog,
  input: CaseEnteredTriggerInput,
): MaterializedQuestInstanceResult[] =>
  publishCaseEvent(
    ctx,
    {
      eventName: "case.entered",
      caseId: input.caseId,
      scenarioId: input.scenarioId,
      nodeId: input.nodeId,
      payloadJson: JSON.stringify({ contentVersion: input.contentVersion }),
      idempotencyKey: input.idempotencyKey,
    },
    { catalog },
  ).triggerResults;
