import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  createTestTimestamp,
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

import { publishCaseEvent, type QuestInstanceCatalog } from "./quest_instances";
import type { TriggerRule } from "./types";

const MICROS_PER_MINUTE = 60_000_000n;

const baseRule = (overrides: Partial<TriggerRule>): TriggerRule => ({
  id: "rule.base",
  schemaVersion: 1,
  kindVersion: 1,
  status: "active",
  eventName: "evt.test",
  ...overrides,
});

const catalogOf = (...rules: TriggerRule[]): QuestInstanceCatalog => ({
  triggerRules: rules,
  questArchetypes: [],
});

const telemetryCount = (
  ctx: ReturnType<typeof createReducerTestContext>,
  eventName: string,
): number =>
  ctx.db.telemetryEvent.rows().filter((row: any) => row.eventName === eventName)
    .length;

describe("trigger fires", () => {
  it("fires once per player by default and records the fire", () => {
    const ctx = createReducerTestContext();
    const catalog = catalogOf(
      baseRule({
        id: "rule.once",
        effects: [{ type: "set_flag", key: "once_flag", value: true }],
      }),
    );

    publishCaseEvent(
      ctx,
      { eventName: "evt.test", idempotencyKey: "e1" },
      { catalog },
    );
    publishCaseEvent(
      ctx,
      { eventName: "evt.test", idempotencyKey: "e2" },
      { catalog },
    );

    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(1);
    expect(telemetryCount(ctx, "trigger_rule_fired")).toBe(1);
    expect(telemetryCount(ctx, "trigger_effects_applied")).toBe(1);
    const flagRow = ctx.db.playerFlag.flagId.find(
      playerKey(ctx.sender, "once_flag"),
    );
    expect(flagRow?.value).toBe(true);
  });

  it("fires repeatable rules on every matching event", () => {
    const ctx = createReducerTestContext();
    const catalog = catalogOf(
      baseRule({
        id: "rule.repeat",
        repeatPolicy: "repeatable",
        effects: [{ type: "grant_xp", amount: 5 }],
      }),
    );

    publishCaseEvent(
      ctx,
      { eventName: "evt.test", idempotencyKey: "e1" },
      { catalog },
    );
    publishCaseEvent(
      ctx,
      { eventName: "evt.test", idempotencyKey: "e2" },
      { catalog },
    );

    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(2);
    expect(telemetryCount(ctx, "trigger_rule_fired")).toBe(2);
  });

  it("rejects effects outside the trigger allowlist without applying them", () => {
    const ctx = createReducerTestContext();
    const catalog = catalogOf(
      baseRule({
        id: "rule.forbidden",
        effects: [{ type: "travel_to", locationId: "loc_anywhere" }],
      }),
    );

    publishCaseEvent(
      ctx,
      { eventName: "evt.test", idempotencyKey: "e1" },
      { catalog },
    );

    expect(telemetryCount(ctx, "trigger_effect_rejected")).toBe(1);
    expect(telemetryCount(ctx, "trigger_effects_applied")).toBe(0);
    expect(ctx.db.playerLocation.rows()).toHaveLength(0);
  });

  it("keeps a cooldown group hot for the configured window", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(0n),
    });
    const catalog = catalogOf(
      baseRule({
        id: "rule.first",
        eventName: "evt.first",
        cooldownGroup: "grp",
        cooldownMinutes: 60,
        effects: [{ type: "track_event", eventName: "fired_first" }],
      }),
      baseRule({
        id: "rule.second",
        eventName: "evt.second",
        cooldownGroup: "grp",
        cooldownMinutes: 60,
        effects: [{ type: "track_event", eventName: "fired_second" }],
      }),
    );

    publishCaseEvent(
      ctx,
      { eventName: "evt.first", idempotencyKey: "e1" },
      { catalog },
    );
    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(1);

    ctx.timestamp = createTestTimestamp(30n * MICROS_PER_MINUTE);
    publishCaseEvent(
      ctx,
      { eventName: "evt.second", idempotencyKey: "e2" },
      { catalog },
    );
    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(1);

    ctx.timestamp = createTestTimestamp(61n * MICROS_PER_MINUTE);
    publishCaseEvent(
      ctx,
      { eventName: "evt.second", idempotencyKey: "e3" },
      { catalog },
    );
    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(2);
  });

  it("exhausts daily budgets across repeatable fires", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(0n),
    });
    const catalog = catalogOf(
      baseRule({
        id: "rule.budget",
        repeatPolicy: "repeatable",
        budgetKey: "daily.test",
        budgetLimit: 2,
        effects: [{ type: "track_event", eventName: "budget_fire" }],
      }),
    );

    for (const [index, minutes] of [10n, 20n, 30n].entries()) {
      ctx.timestamp = createTestTimestamp(minutes * MICROS_PER_MINUTE);
      publishCaseEvent(
        ctx,
        { eventName: "evt.test", idempotencyKey: `e${index}` },
        { catalog },
      );
    }

    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(2);
    expect(telemetryCount(ctx, "trigger_rule_fired")).toBe(2);
  });
});
