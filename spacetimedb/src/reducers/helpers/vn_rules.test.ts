import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  insertEvidence,
  insertFlag,
  insertInventory,
  insertQuest,
  insertVar,
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
  areConditionsSatisfied,
  isChoiceAllowed,
  isChoiceEnabled,
  isChoiceVisible,
} from "./vn_rules";

describe("vn_rules condition evaluation", () => {
  it("accepts empty condition lists", () => {
    const ctx = createReducerTestContext();

    expect(areConditionsSatisfied(ctx, undefined)).toBe(true);
    expect(areConditionsSatisfied(ctx, [])).toBe(true);
  });

  it("evaluates flags, vars, inventory, evidence, quest, thought, and spirit state", () => {
    const ctx = createReducerTestContext();
    insertFlag(ctx, "gate_open", true);
    insertVar(ctx, "heat", 3);
    insertEvidence(ctx, "evidence_bank_key");
    insertQuest(ctx, "quest_bank", 4);
    insertInventory(ctx, "item_warrant", 1);
    insertFlag(ctx, "mind_unlocked::thought_archive_pattern", true);
    insertFlag(ctx, "spirit_state_spirit_clockmaker::controlled", true);

    expect(
      areConditionsSatisfied(ctx, [
        { type: "flag_equals", key: "gate_open", value: true },
        { type: "var_gte", key: "heat", value: 2 },
        { type: "var_lte", key: "heat", value: 4 },
        { type: "has_evidence", evidenceId: "evidence_bank_key" },
        { type: "quest_stage_gte", questId: "quest_bank", stage: 3 },
        { type: "has_item", itemId: "item_warrant" },
        {
          type: "thought_state_is",
          thoughtId: "thought_archive_pattern",
          state: "available",
        },
        {
          type: "spirit_state_is",
          spiritId: "spirit_clockmaker",
          state: "controlled",
        },
      ]),
    ).toBe(true);
  });

  it("fails missing or insufficient conditions", () => {
    const ctx = createReducerTestContext();
    insertVar(ctx, "heat", 1);
    insertInventory(ctx, "item_warrant", 0);

    expect(
      areConditionsSatisfied(ctx, [{ type: "var_gte", key: "heat", value: 2 }]),
    ).toBe(false);
    expect(
      areConditionsSatisfied(ctx, [
        { type: "has_item", itemId: "item_warrant" },
      ]),
    ).toBe(false);
    expect(
      areConditionsSatisfied(ctx, [
        { type: "has_evidence", evidenceId: "missing_evidence" },
      ]),
    ).toBe(false);
  });

  it("evaluates nested logic conditions", () => {
    const ctx = createReducerTestContext();
    insertFlag(ctx, "knows_route", true);
    insertVar(ctx, "tension", 2);

    expect(
      areConditionsSatisfied(ctx, [
        {
          type: "logic_and",
          conditions: [
            { type: "flag_equals", key: "knows_route", value: true },
            {
              type: "logic_or",
              conditions: [
                { type: "var_gte", key: "tension", value: 10 },
                {
                  type: "logic_not",
                  condition: {
                    type: "flag_equals",
                    key: "route_blocked",
                    value: true,
                  },
                },
              ],
            },
          ],
        },
      ]),
    ).toBe(true);
  });

  it("combines choice visibility and enabled gates", () => {
    const ctx = createReducerTestContext();
    insertFlag(ctx, "visible", true);
    insertFlag(ctx, "enabled", true);
    insertVar(ctx, "focus", 5);

    const choice = {
      visibleIfAll: [{ type: "flag_equals", key: "visible", value: true }],
      visibleIfAny: [
        { type: "flag_equals", key: "fallback_visible", value: true },
        { type: "var_gte", key: "focus", value: 4 },
      ],
      requireAll: [{ type: "flag_equals", key: "enabled", value: true }],
      requireAny: [
        { type: "var_gte", key: "focus", value: 8 },
        { type: "var_lte", key: "focus", value: 5 },
      ],
    } as const;

    expect(isChoiceVisible(ctx, choice)).toBe(true);
    expect(isChoiceEnabled(ctx, choice)).toBe(true);
    expect(isChoiceAllowed(ctx, choice)).toBe(true);
  });

  it("uses legacy conditions as requireAll when requireAll is absent", () => {
    const ctx = createReducerTestContext();
    insertFlag(ctx, "legacy_enabled", true);

    expect(
      isChoiceEnabled(ctx, {
        conditions: [
          { type: "flag_equals", key: "legacy_enabled", value: true },
        ],
      }),
    ).toBe(true);
    expect(
      isChoiceAllowed(ctx, {
        conditions: [
          { type: "flag_equals", key: "legacy_enabled", value: false },
        ],
      }),
    ).toBe(false);
  });
});
