import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  playerKey,
} from "./__tests__/serverTestContext";

vi.mock("spacetimedb", () => ({
  Timestamp: class Timestamp {
    microsSinceUnixEpoch: bigint;

    constructor(microsSinceUnixEpoch: bigint) {
      this.microsSinceUnixEpoch = microsSinceUnixEpoch;
    }
  },
}));

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import {
  advanceQuestInstance,
  completeQuestInstance,
  publishCaseEvent,
  type QuestInstanceCatalog,
} from "./quest_instances";

const MAIN_NAMESPACE = "overlay.proc.test.main";
const FOLLOWUP_NAMESPACE = "overlay.proc.test.follow";
const REWARD_FLAG_KEY = `${MAIN_NAMESPACE}.reward_done`;

const testCatalog: QuestInstanceCatalog = {
  triggerRules: [
    {
      id: "rule.evt",
      schemaVersion: 1,
      kindVersion: 1,
      status: "active",
      eventName: "evt.test",
      generatedNamespace: MAIN_NAMESPACE,
      allowedArchetypeIds: ["arch.main"],
    },
    {
      id: "rule.followup",
      schemaVersion: 1,
      kindVersion: 1,
      status: "active",
      eventName: "quest_instance.completed",
      generatedNamespace: FOLLOWUP_NAMESPACE,
      allowedArchetypeIds: ["arch.follow"],
    },
  ],
  questArchetypes: [
    {
      id: "arch.main",
      version: 1,
      kind: "rumor_followup",
      title: "Main quest",
      triggerRuleIds: ["rule.evt"],
      stepNodeIds: ["node_a"],
      rewardEffects: [{ type: "set_flag", key: REWARD_FLAG_KEY, value: true }],
    },
    {
      id: "arch.follow",
      version: 1,
      kind: "rumor_followup",
      title: "Follow-up quest",
      triggerRuleIds: ["rule.followup"],
      stepNodeIds: ["node_b"],
    },
  ],
};

const materializeMainQuest = (
  ctx: ReturnType<typeof createReducerTestContext>,
): any => {
  const result = publishCaseEvent(
    ctx,
    { eventName: "evt.test", idempotencyKey: "seed" },
    { catalog: testCatalog },
  );
  const row = result.triggerResults[0]?.row;
  expect(row).toBeDefined();
  return row;
};

const rewardTelemetryCount = (
  ctx: ReturnType<typeof createReducerTestContext>,
): number =>
  ctx.db.telemetryEvent
    .rows()
    .filter((row: any) => row.eventName === "quest_reward_effects_applied")
    .length;

describe("case event dispatch", () => {
  it("publishes the event and materializes eligible quest instances", () => {
    const ctx = createReducerTestContext();

    const result = publishCaseEvent(
      ctx,
      { eventName: "evt.test", idempotencyKey: "e1" },
      { catalog: testCatalog },
    );

    expect(result.triggersProcessed).toBe(true);
    expect(result.triggerResults).toHaveLength(1);
    expect(result.triggerResults[0]).toMatchObject({ created: true });
    expect(ctx.db.caseEventLog.rows()).toHaveLength(1);
    expect(ctx.db.questInstance.rows()).toHaveLength(1);
    expect(ctx.db.questInstance.rows()[0]).toMatchObject({
      archetypeId: "arch.main",
      status: "active",
    });
  });

  it("ignores events that no trigger rule listens to", () => {
    const ctx = createReducerTestContext();

    const result = publishCaseEvent(
      ctx,
      { eventName: "evt.unrelated", idempotencyKey: "e2" },
      { catalog: testCatalog },
    );

    expect(result.triggersProcessed).toBe(true);
    expect(result.triggerResults).toHaveLength(0);
    expect(ctx.db.caseEventLog.rows()).toHaveLength(1);
    expect(ctx.db.questInstance.rows()).toHaveLength(0);
  });

  it("runs follow-up triggers on quest_instance.completed", () => {
    const ctx = createReducerTestContext();
    const mainRow = materializeMainQuest(ctx);

    completeQuestInstance(ctx, mainRow.instanceId, "complete-1", testCatalog);

    const archetypeIds = ctx.db.questInstance
      .rows()
      .map((row: any) => row.archetypeId)
      .sort();
    expect(archetypeIds).toEqual(["arch.follow", "arch.main"]);
    expect(
      ctx.db.caseEventLog
        .rows()
        .filter((row: any) => row.eventName === "quest_instance.completed"),
    ).toHaveLength(1);
  });

  it("applies archetype reward effects exactly once on completion", () => {
    const ctx = createReducerTestContext();
    const mainRow = materializeMainQuest(ctx);

    const first = completeQuestInstance(
      ctx,
      mainRow.instanceId,
      "complete-1",
      testCatalog,
    );
    expect(first.updated).toBe(true);

    const flagRow = ctx.db.playerFlag.flagId.find(
      playerKey(ctx.sender, REWARD_FLAG_KEY),
    );
    expect(flagRow?.value).toBe(true);
    expect(rewardTelemetryCount(ctx)).toBe(1);

    const second = completeQuestInstance(
      ctx,
      mainRow.instanceId,
      "complete-2",
      testCatalog,
    );
    expect(second.updated).toBe(false);
    expect(rewardTelemetryCount(ctx)).toBe(1);
  });

  it("applies reward effects when advancing through the final step", () => {
    const ctx = createReducerTestContext();
    const mainRow = materializeMainQuest(ctx);

    const result = advanceQuestInstance(
      ctx,
      mainRow.instanceId,
      "advance-1",
      undefined,
      testCatalog,
    );

    expect(result.completed).toBe(true);
    const flagRow = ctx.db.playerFlag.flagId.find(
      playerKey(ctx.sender, REWARD_FLAG_KEY),
    );
    expect(flagRow?.value).toBe(true);
    expect(rewardTelemetryCount(ctx)).toBe(1);
  });
});
