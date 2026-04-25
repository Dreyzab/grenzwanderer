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

import { applyEffects } from "./effects";

describe("applyEffects", () => {
  it("applies flag and variable effects", () => {
    const ctx = createReducerTestContext();

    applyEffects(ctx, [
      { type: "set_flag", key: "gate_open", value: true },
      { type: "set_var", key: "clue_score", value: 4 },
      { type: "add_var", key: "clue_score", value: 3 },
      { type: "add_heat", amount: 2 },
      { type: "add_tension", amount: 1 },
      { type: "grant_influence", amount: 5 },
    ]);

    expect(
      ctx.db.playerFlag.flagId.find(playerKey(ctx.sender, "gate_open")),
    ).toMatchObject({
      key: "gate_open",
      value: true,
    });
    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "clue_score")),
    ).toMatchObject({
      key: "clue_score",
      floatValue: 7,
    });
    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "heat")),
    ).toMatchObject({
      key: "heat",
      floatValue: 2,
    });
    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "tension")),
    ).toMatchObject({
      key: "tension",
      floatValue: 1,
    });
    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "influence_points")),
    ).toMatchObject({
      key: "influence_points",
      floatValue: 5,
    });
  });

  it("grants evidence, inventory, and unlock groups idempotently", () => {
    const ctx = createReducerTestContext();

    applyEffects(ctx, [
      { type: "grant_evidence", evidenceId: "evidence_bank_key" },
      { type: "grant_evidence", evidenceId: "evidence_bank_key" },
      { type: "grant_item", itemId: "item_warrant", quantity: 2 },
      { type: "grant_item", itemId: "item_warrant", quantity: 3 },
      { type: "unlock_group", groupId: "group_archive" },
      { type: "unlock_group", groupId: "group_archive" },
    ]);

    expect(ctx.db.playerEvidence.rows()).toHaveLength(1);
    expect(
      ctx.db.playerEvidence.evidenceKey.find(
        playerKey(ctx.sender, "evidence_bank_key"),
      ),
    ).toMatchObject({ evidenceId: "evidence_bank_key" });
    expect(
      ctx.db.playerInventory.inventoryKey.find(
        playerKey(ctx.sender, "item_warrant"),
      ),
    ).toMatchObject({ itemId: "item_warrant", quantity: 5 });
    expect(ctx.db.playerUnlockGroup.rows()).toHaveLength(1);
    expect(
      ctx.db.playerUnlockGroup.unlockKey.find(
        playerKey(ctx.sender, "group_archive"),
      ),
    ).toMatchObject({ groupId: "group_archive" });
  });

  it("sets quest stage without downgrading existing progress", () => {
    const ctx = createReducerTestContext();

    applyEffects(ctx, [
      { type: "set_quest_stage", questId: "quest_side_case", stage: 2 },
      { type: "set_quest_stage", questId: "quest_side_case", stage: 1 },
    ]);

    expect(
      ctx.db.playerQuest.questKey.find(
        playerKey(ctx.sender, "quest_side_case"),
      ),
    ).toMatchObject({ questId: "quest_side_case", stage: 2 });
  });

  it("unlocks mind thoughts and emits source-aware telemetry", () => {
    const ctx = createReducerTestContext();

    applyEffects(
      ctx,
      [{ type: "unlock_mind_thought", thoughtId: "thought_archive_pattern" }],
      { sourceType: "vn_choice", sourceId: "choice_archive" },
    );

    expect(
      ctx.db.playerFlag.flagId.find(
        playerKey(ctx.sender, "mind_unlocked::thought_archive_pattern"),
      ),
    ).toMatchObject({
      key: "mind_unlocked::thought_archive_pattern",
      value: true,
    });
    expect(ctx.db.telemetryEvent.rows()).toHaveLength(1);
    expect(ctx.db.telemetryEvent.rows()[0]).toMatchObject({
      eventName: "mind_thought_unlocked",
      tagsJson: JSON.stringify({
        thoughtId: "thought_archive_pattern",
        sourceType: "vn_choice",
        sourceId: "choice_archive",
      }),
    });
  });

  it("returns without mutation for empty effect lists", () => {
    const ctx = createReducerTestContext();

    applyEffects(ctx, undefined);
    applyEffects(ctx, []);

    expect(ctx.db.playerFlag.rows()).toHaveLength(0);
    expect(ctx.db.playerVar.rows()).toHaveLength(0);
    expect(ctx.db.telemetryEvent.rows()).toHaveLength(0);
  });
});
