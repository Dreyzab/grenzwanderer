import { SenderError } from "spacetimedb/server";
import type {
  CaseEventEnvelope,
  QuestArchetype,
  QuestStepInstance,
  TriggerRule,
} from "../../../../src/shared/vn-contract";
import { validateProceduralQuestPermissions } from "../../../../src/shared/vn-contract";
import { emitCaseEvent } from "./case_events";
import { identityKey } from "./keys";
import { emitTelemetry } from "./telemetry";
import {
  evaluateTriggerRules,
  type TriggerRuntimeGates,
} from "./trigger_engine";

export interface QuestInstanceCatalog {
  triggerRules: readonly TriggerRule[];
  questArchetypes: readonly QuestArchetype[];
}

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
    const activeVersion = [...ctx.db.contentVersion.iter()].find(
      (row: any) => row.isActive,
    );
    if (activeVersion?.checksum) {
      return activeVersion.checksum;
    }
  } catch {
    // Test contexts and smoke harnesses may not have active content.
  }

  if (caseId) {
    try {
      const caseVersions = [...ctx.db.caseVersion.iter()].filter(
        (row: any) => row.caseId === caseId,
      );
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
  return [...ctx.db.questInstance.iter()].find(
    (row: any) =>
      row.instanceId === instanceId &&
      row.playerId &&
      identityKey(row.playerId) === senderKey,
  );
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
): CompleteQuestInstanceResult => {
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

  emitCaseEvent(ctx, {
    eventName: "quest_instance.completed",
    questInstanceId: instanceId,
    payloadJson: "{}",
    idempotencyKey,
  });
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
): AdvanceQuestInstanceResult => {
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

  emitCaseEvent(ctx, {
    eventName: "quest_instance.step_advanced",
    questInstanceId: instanceId,
    payloadJson: JSON.stringify({
      completedStepId: activeStep.id,
      nextStepId: nextStep?.id,
      completed,
    }),
    idempotencyKey,
  });
  emitTelemetry(ctx, "quest_instance_step_advanced", {
    triggerRuleId: existing.triggerRuleId,
    archetypeId: existing.archetypeId,
    instanceId,
    completedStepId: activeStep.id,
    nextStepId: nextStep?.id,
    completed,
  });

  if (completed) {
    emitCaseEvent(ctx, {
      eventName: "quest_instance.completed",
      questInstanceId: instanceId,
      payloadJson: JSON.stringify({ completedBy: "advance_quest_instance" }),
      idempotencyKey: `${idempotencyKey}:completed`,
    });
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

export const processCaseEventTriggers = (
  ctx: any,
  catalog: QuestInstanceCatalog,
  sourceEvent: TriggerSourceEvent,
  gates: TriggerRuntimeGates = {},
): MaterializedQuestInstanceResult[] => {
  const archetypesById = new Map(
    catalog.questArchetypes.map((archetype) => [archetype.id, archetype]),
  );
  const results = evaluateTriggerRules(
    ctx,
    catalog.triggerRules,
    sourceEvent,
    gates,
  );
  const materialized: MaterializedQuestInstanceResult[] = [];

  for (const result of results) {
    if (!result.eligible) {
      continue;
    }

    const archetypeId = result.allowedArchetypeIds[0];
    if (!archetypeId) {
      continue;
    }
    const archetype = archetypesById.get(archetypeId);
    const rule = catalog.triggerRules.find(
      (entry) => entry.id === result.ruleId,
    );
    if (!archetype || !rule) {
      continue;
    }

    materialized.push(
      materializeQuestInstanceFromArchetype(ctx, rule, archetype, sourceEvent),
    );
  }

  return materialized;
};

export const emitCaseEnteredAndProcessTriggers = (
  ctx: any,
  catalog: QuestInstanceCatalog,
  input: CaseEnteredTriggerInput,
): MaterializedQuestInstanceResult[] => {
  const eventRow = emitCaseEvent(ctx, {
    eventName: "case.entered",
    caseId: input.caseId,
    scenarioId: input.scenarioId,
    nodeId: input.nodeId,
    payloadJson: JSON.stringify({ contentVersion: input.contentVersion }),
    idempotencyKey: input.idempotencyKey,
  });

  return processCaseEventTriggers(ctx, catalog, {
    eventName: eventRow.eventName,
    scope: {
      caseId: eventRow.caseId,
      scenarioId: eventRow.scenarioId,
      nodeId: eventRow.nodeId,
      questInstanceId: eventRow.questInstanceId,
    },
    idempotencyKey: eventRow.idempotencyKey,
    payload: JSON.parse(eventRow.payloadJson) as Record<string, unknown>,
  });
};
