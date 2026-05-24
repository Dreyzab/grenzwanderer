import { describe, expect, it, vi } from "vitest";

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import type { CaseEventEnvelope } from "../../../../src/shared/vn-contract";
import { CASE_CATALOG } from "../../../../src/shared/vn-contract";
import { emitCaseEvent } from "./case_events";
import {
  createReducerTestContext,
  createTestIdentity,
} from "./__tests__/serverTestContext";
import {
  advanceQuestInstance,
  completeQuestInstance,
  createQuestInstanceKey,
  emitCaseEnteredAndProcessTriggers,
  processCaseEventTriggers,
} from "./quest_instances";
import { evaluateTriggerRules } from "./trigger_engine";

const envelopeFromLogRow = (row: {
  eventName: string;
  caseId?: string;
  scenarioId?: string;
  nodeId?: string;
  questInstanceId?: string;
}): Pick<CaseEventEnvelope, "eventName" | "scope"> => ({
  eventName: row.eventName,
  scope: {
    caseId: row.caseId,
    scenarioId: row.scenarioId,
    nodeId: row.nodeId,
    questInstanceId: row.questInstanceId,
  },
});

describe("trigger simulation against authored catalog", () => {
  it("emits case.entered, selects the eligible archetype, and materializes one quest instance", () => {
    const ctx = createReducerTestContext();

    const eventsBefore = [...ctx.db.caseEventLog.iter()].length;
    const eventRow = emitCaseEvent(ctx, {
      eventName: "case.entered",
      caseId: "case01_mainline",
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_opening_arrival_video",
      idempotencyKey: "sim-1",
    });
    const log = [...ctx.db.caseEventLog.iter()];
    expect(log.length - eventsBefore).toBe(1);
    const recorded = log[log.length - 1] as {
      eventName: string;
      caseId?: string;
      scenarioId?: string;
      nodeId?: string;
    };

    const results = evaluateTriggerRules(
      ctx,
      CASE_CATALOG.triggerRules,
      envelopeFromLogRow(recorded),
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );

    const eligible = results.filter((result) => result.eligible);
    expect(eligible).toHaveLength(1);
    expect(eligible[0]).toMatchObject({
      eligible: true,
      ruleId: "trig.case01.newsboy_rumor",
      allowedArchetypeIds: ["arch.case01.newsboy_rumor"],
    });

    expect(CASE_CATALOG.questArchetypes).toContainEqual(
      expect.objectContaining({ id: "arch.case01.newsboy_rumor" }),
    );
    const materialized = processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      envelopeFromLogRow(eventRow),
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );

    expect(materialized).toHaveLength(1);
    expect(ctx.db.questInstance.rows()).toHaveLength(1);
    const questInstanceKey = createQuestInstanceKey(
      ctx.sender,
      "trig.case01.newsboy_rumor",
      "arch.case01.newsboy_rumor",
    );
    const row = ctx.db.questInstance.questInstanceKey.find(
      questInstanceKey,
    ) as Record<string, any>;
    expect(row).toMatchObject({
      questInstanceKey,
      instanceId: questInstanceKey,
      playerId: ctx.sender,
      kind: "generated_side_case",
      status: "active",
      triggerRuleId: "trig.case01.newsboy_rumor",
      archetypeId: "arch.case01.newsboy_rumor",
      archetypeVersion: 1,
      bundleChecksum: "unknown",
      stateNamespace: "overlay.proc.case01.newsboy",
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
    expect(JSON.parse(row.stepsJson)).toEqual([
      expect.objectContaining({
        nodeId: "scene_case01_hbf_newsboy_approach",
        status: "active",
      }),
      expect.objectContaining({
        nodeId: "scene_case01_hbf_newsboy_handoff",
        status: "pending",
      }),
      expect.objectContaining({
        nodeId: "scene_case01_hbf_newsboy_release",
        status: "pending",
      }),
    ]);
    expect(JSON.parse(row.eligibilitySnapshotJson)).toMatchObject({
      triggerRuleId: "trig.case01.newsboy_rumor",
      archetypeId: "arch.case01.newsboy_rumor",
      eventName: "case.entered",
      caseId: "case01_mainline",
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_opening_arrival_video",
    });
    expect([...ctx.db.caseEventLog.iter()].length - eventsBefore).toBe(1);
  });

  it("does not duplicate an active quest instance for repeated matching events", () => {
    const ctx = createReducerTestContext();

    for (const requestId of ["sim-repeat-1", "sim-repeat-2"]) {
      const eventRow = emitCaseEvent(ctx, {
        eventName: "case.entered",
        caseId: "case01_mainline",
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_opening_arrival_video",
        idempotencyKey: requestId,
      });
      processCaseEventTriggers(
        ctx,
        CASE_CATALOG,
        envelopeFromLogRow(eventRow),
        {
          remainingBudgets: { "case01.proc.daily": 1 },
        },
      );
    }

    expect(ctx.db.caseEventLog.rows()).toHaveLength(2);
    expect(ctx.db.questInstance.rows()).toHaveLength(1);
  });

  it("publishes case.entered from scenario start inputs and processes triggers", () => {
    const ctx = createReducerTestContext();

    const materialized = emitCaseEnteredAndProcessTriggers(ctx, CASE_CATALOG, {
      caseId: "case01_mainline",
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_opening_arrival_video",
      contentVersion: "content-v-test",
      idempotencyKey: "start-scenario-sim",
    });

    expect(materialized).toHaveLength(1);
    expect(ctx.db.caseEventLog.rows()).toEqual([
      expect.objectContaining({
        eventName: "case.entered",
        caseId: "case01_mainline",
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_opening_arrival_video",
        payloadJson: '{"contentVersion":"content-v-test"}',
        idempotencyKey: "start-scenario-sim",
      }),
    ]);
    expect(ctx.db.questInstance.rows()).toHaveLength(1);
  });

  it("rejects events whose name or case scope does not match the authored catalog", () => {
    const ctx = createReducerTestContext();

    const wrongEvent: Pick<CaseEventEnvelope, "eventName" | "scope"> = {
      eventName: "choice.recorded",
      scope: { caseId: "case01_mainline" },
    };
    const wrongCase: Pick<CaseEventEnvelope, "eventName" | "scope"> = {
      eventName: "case.entered",
      scope: { caseId: "case99_unknown" },
    };

    expect(
      evaluateTriggerRules(ctx, CASE_CATALOG.triggerRules, wrongEvent).every(
        (result) => !result.eligible,
      ),
    ).toBe(true);
    expect(
      evaluateTriggerRules(ctx, CASE_CATALOG.triggerRules, wrongCase).every(
        (result) => !result.eligible,
      ),
    ).toBe(true);
    processCaseEventTriggers(ctx, CASE_CATALOG, wrongEvent);
    processCaseEventTriggers(ctx, CASE_CATALOG, wrongCase);
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      {
        activeCooldownGroups: new Set(["case01.proc"]),
      },
    );
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      {
        remainingBudgets: { "case01.proc.daily": 0 },
      },
    );
    expect(ctx.db.questInstance.rows()).toHaveLength(0);
  });

  it("rejects unsafe generated archetypes without blocking trigger processing", () => {
    const ctx = createReducerTestContext();
    const event: Pick<CaseEventEnvelope, "eventName" | "scope"> = {
      eventName: "case.entered",
      scope: { caseId: "case01_mainline" },
    };
    const catalog = {
      triggerRules: [
        {
          ...CASE_CATALOG.triggerRules[0],
          id: "trig.case01.unsafe_reward",
          generatedNamespace: "overlay.proc.case01.unsafe",
          allowedArchetypeIds: ["arch.case01.unsafe_reward"],
        },
      ],
      questArchetypes: [
        {
          ...CASE_CATALOG.questArchetypes[0],
          id: "arch.case01.unsafe_reward",
          triggerRuleIds: ["trig.case01.unsafe_reward"],
          rewardEffects: [
            { type: "grant_item", itemId: "item_warrant", quantity: 1 },
          ],
        },
      ],
    };

    const results = processCaseEventTriggers(ctx, catalog, event, {
      remainingBudgets: { "case01.proc.daily": 1 },
    });

    expect(results).toEqual([
      expect.objectContaining({
        created: false,
        rejected: true,
        rejectionReason: "quest_archetype_forbidden_reward_effect",
      }),
    ]);
    expect(ctx.db.questInstance.rows()).toHaveLength(0);
    expect(ctx.db.telemetryEvent.rows()).toContainEqual(
      expect.objectContaining({
        eventName: "quest_instance_materialization_rejected",
      }),
    );
  });

  it("completes an active quest instance without touching authored quest state", () => {
    const ctx = createReducerTestContext();
    const event: Pick<CaseEventEnvelope, "eventName" | "scope"> = {
      eventName: "case.entered",
      scope: { caseId: "case01_mainline" },
    };
    processCaseEventTriggers(ctx, CASE_CATALOG, event, {
      remainingBudgets: { "case01.proc.daily": 1 },
    });
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;

    const result = completeQuestInstance(ctx, row.instanceId, "complete-1");

    expect(result.updated).toBe(true);
    expect(result.row).toMatchObject({
      instanceId: row.instanceId,
      status: "completed",
      updatedAt: ctx.timestamp,
    });
    expect(
      JSON.parse(result.row.stepsJson).every(
        (step: { status: string }) => step.status === "completed",
      ),
    ).toBe(true);
    expect(ctx.db.caseEventLog.rows()).toContainEqual(
      expect.objectContaining({
        eventName: "quest_instance.completed",
        questInstanceId: row.instanceId,
        idempotencyKey: "complete-1",
      }),
    );
    expect(ctx.db.telemetryEvent.rows()).toContainEqual(
      expect.objectContaining({ eventName: "quest_instance_completed" }),
    );
    expect(ctx.db.playerQuest.rows()).toHaveLength(0);
  });

  it("advances the active step and activates the next pending step", () => {
    const ctx = createReducerTestContext();
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;
    const activeStepId = JSON.parse(row.stepsJson)[0].id;

    const result = advanceQuestInstance(
      ctx,
      row.instanceId,
      "advance-1",
      activeStepId,
    );
    const steps = JSON.parse(result.row.stepsJson);

    expect(result).toMatchObject({
      updated: true,
      completed: false,
      completedStepId: activeStepId,
    });
    expect(result.row.status).toBe("active");
    expect(steps.map((step: { status: string }) => step.status)).toEqual([
      "completed",
      "active",
      "pending",
    ]);
    expect(ctx.db.caseEventLog.rows()).toContainEqual(
      expect.objectContaining({
        eventName: "quest_instance.step_advanced",
        questInstanceId: row.instanceId,
        idempotencyKey: "advance-1",
      }),
    );
    expect(ctx.db.telemetryEvent.rows()).toContainEqual(
      expect.objectContaining({ eventName: "quest_instance_step_advanced" }),
    );
    expect(ctx.db.playerQuest.rows()).toHaveLength(0);
  });

  it("rejects stale step ids when advancing a quest instance", () => {
    const ctx = createReducerTestContext();
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;

    expect(() =>
      advanceQuestInstance(ctx, row.instanceId, "advance-stale", "stale-step"),
    ).toThrow("stepId does not match active quest step");
  });

  it("completes the quest instance on the final step advance", () => {
    const ctx = createReducerTestContext();
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;

    const first = advanceQuestInstance(ctx, row.instanceId, "advance-1");
    const second = advanceQuestInstance(ctx, row.instanceId, "advance-2");
    const third = advanceQuestInstance(ctx, row.instanceId, "advance-3");
    const steps = JSON.parse(third.row.stepsJson);

    expect(first.completed).toBe(false);
    expect(second.completed).toBe(false);
    expect(third).toMatchObject({ updated: true, completed: true });
    expect(third.row.status).toBe("completed");
    expect(
      steps.every((step: { status: string }) => step.status === "completed"),
    ).toBe(true);
    expect(ctx.db.caseEventLog.rows()).toContainEqual(
      expect.objectContaining({
        eventName: "quest_instance.completed",
        questInstanceId: row.instanceId,
        idempotencyKey: "advance-3:completed",
      }),
    );
    expect(ctx.db.telemetryEvent.rows()).toContainEqual(
      expect.objectContaining({ eventName: "quest_instance_completed" }),
    );
    expect(ctx.db.playerQuest.rows()).toHaveLength(0);
  });

  it("does not duplicate advance events for already completed instances", () => {
    const ctx = createReducerTestContext();
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;
    completeQuestInstance(ctx, row.instanceId, "complete-1");
    const eventCount = ctx.db.caseEventLog.rows().length;
    const telemetryCount = ctx.db.telemetryEvent.rows().length;

    const result = advanceQuestInstance(ctx, row.instanceId, "advance-done");

    expect(result).toMatchObject({ updated: false, completed: true });
    expect(ctx.db.caseEventLog.rows()).toHaveLength(eventCount);
    expect(ctx.db.telemetryEvent.rows()).toHaveLength(telemetryCount);
  });

  it("does not duplicate completion events for already completed instances", () => {
    const ctx = createReducerTestContext();
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;

    completeQuestInstance(ctx, row.instanceId, "complete-1");
    const eventCount = ctx.db.caseEventLog.rows().length;
    const telemetryCount = ctx.db.telemetryEvent.rows().length;
    const second = completeQuestInstance(ctx, row.instanceId, "complete-2");

    expect(second.updated).toBe(false);
    expect(ctx.db.caseEventLog.rows()).toHaveLength(eventCount);
    expect(ctx.db.telemetryEvent.rows()).toHaveLength(telemetryCount);
  });

  it("rejects completion for failed or tombstoned quest instances", () => {
    const ctx = createReducerTestContext();
    processCaseEventTriggers(
      ctx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = ctx.db.questInstance.rows()[0] as Record<string, any>;

    ctx.db.questInstance.questInstanceKey.update({
      ...row,
      status: "failed",
    });
    expect(() =>
      completeQuestInstance(ctx, row.instanceId, "complete-failed"),
    ).toThrow("Quest instance cannot be completed from status 'failed'");

    ctx.db.questInstance.questInstanceKey.update({
      ...row,
      status: "tombstoned",
    });
    expect(() =>
      completeQuestInstance(ctx, row.instanceId, "complete-tombstoned"),
    ).toThrow("Quest instance cannot be completed from status 'tombstoned'");
  });

  it("hides missing and other-player quest instances behind not found", () => {
    const db = createReducerTestContext().db;
    const ownerCtx = createReducerTestContext({
      db,
      sender: createTestIdentity("player-owner"),
    });
    const otherCtx = createReducerTestContext({
      db,
      sender: createTestIdentity("player-other"),
    });
    processCaseEventTriggers(
      ownerCtx,
      CASE_CATALOG,
      {
        eventName: "case.entered",
        scope: { caseId: "case01_mainline" },
      },
      { remainingBudgets: { "case01.proc.daily": 1 } },
    );
    const row = db.questInstance.rows()[0] as Record<string, any>;

    expect(() =>
      completeQuestInstance(otherCtx, row.instanceId, "complete-other"),
    ).toThrow("Quest instance not found");
    expect(() =>
      completeQuestInstance(otherCtx, "missing-instance", "complete-missing"),
    ).toThrow("Quest instance not found");
    expect(() =>
      advanceQuestInstance(otherCtx, row.instanceId, "advance-other"),
    ).toThrow("Quest instance not found");
    expect(() =>
      advanceQuestInstance(otherCtx, "missing-instance", "advance-missing"),
    ).toThrow("Quest instance not found");
  });
});
