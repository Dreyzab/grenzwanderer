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
  closeBattleModeInternal,
  endBattleTurnInternal,
  openBattleModeInternal,
  playBattleCardInternal,
} from "./battle_runtime";

const findCombatant = (
  ctx: ReturnType<typeof createReducerTestContext>,
  side: "player" | "enemy",
) => ctx.db.battleCombatant.rows().find((row) => row.side === side);

const findCard = (
  ctx: ReturnType<typeof createReducerTestContext>,
  instanceId: string,
) =>
  ctx.db.battleCardInstance.rows().find((row) => row.instanceId === instanceId);

describe("battle_runtime", () => {
  it("opens a battle session with initial combatants, hand, intent, and history", () => {
    const ctx = createReducerTestContext();

    openBattleModeInternal(ctx, "sandbox_son_duel", {
      sourceTab: "vn",
      returnTab: "dev",
      sourceContextId: "scenario::node::choice",
      sourceScenarioId: "scenario",
    });

    expect(
      ctx.db.battleSession.sessionKey.find(playerKey(ctx.sender, "battle")),
    ).toMatchObject({
      scenarioId: "sandbox_son_duel",
      sourceTab: "vn",
      returnTab: "dev",
      sourceContextId: "scenario::node::choice",
      sourceScenarioId: "scenario",
      phase: "player_turn",
      status: "active",
      turnCount: 1,
      enemyIntentCursor: 0,
    });
    expect(findCombatant(ctx, "player")).toMatchObject({
      combatantId: "detective",
      resolve: 24,
      ap: 3,
      block: 0,
    });
    expect(findCombatant(ctx, "enemy")).toMatchObject({
      combatantId: "friedrich_richter",
      resolve: 18,
      nextIntentCardId: "card_enemy_smug_rebuttal",
    });
    expect(ctx.db.battleCardInstance.rows()).toHaveLength(8);
    expect(
      ctx.db.battleCardInstance.rows().filter((row) => row.zone === "hand"),
    ).toHaveLength(5);
    expect(
      ctx.db.battleCardInstance.rows().filter((row) => row.zone === "deck"),
    ).toHaveLength(3);
    expect(findCard(ctx, "card_0")).toMatchObject({
      cardId: "card_pointed_question",
      zone: "hand",
      isPlayable: true,
    });
    expect(ctx.db.battleHistory.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryType: "system",
          message: "Battle opened: Casino Confrontation.",
        }),
      ]),
    );
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "battle_mode_opened" }),
      ]),
    );
  });

  it("plays a hand card, spends AP, applies damage, discards the card, and records history", () => {
    const ctx = createReducerTestContext();
    openBattleModeInternal(ctx, "sandbox_son_duel");

    playBattleCardInternal(ctx, "card_0");

    expect(findCombatant(ctx, "player")).toMatchObject({ ap: 2 });
    expect(findCombatant(ctx, "enemy")).toMatchObject({ resolve: 14 });
    expect(findCard(ctx, "card_0")).toMatchObject({
      zone: "discard",
      isPlayable: false,
    });
    expect(ctx.db.battleHistory.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryType: "player_action",
          message: "Detective plays Pointed Question.",
        }),
        expect.objectContaining({
          entryType: "player_action",
          message: "Friedrich Richter loses 4 resolve.",
        }),
      ]),
    );
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "battle_card_played" }),
      ]),
    );
  });

  it("rejects unavailable or unaffordable card plays", () => {
    const ctx = createReducerTestContext();
    openBattleModeInternal(ctx, "sandbox_son_duel");

    expect(() => playBattleCardInternal(ctx, "card_6")).toThrow(
      "Battle card card_6 is not available in hand",
    );

    const player = findCombatant(ctx, "player");
    ctx.db.battleCombatant.combatantKey.update({
      ...player,
      ap: 0,
    });

    expect(() => playBattleCardInternal(ctx, "card_0")).toThrow(
      "Not enough AP to play this card",
    );
    expect(findCombatant(ctx, "enemy")).toMatchObject({ resolve: 18 });
  });

  it("ends the turn, resolves the enemy intent, resets AP, draws cards, and advances intent", () => {
    const ctx = createReducerTestContext();
    openBattleModeInternal(ctx, "sandbox_son_duel");

    endBattleTurnInternal(ctx);

    expect(
      ctx.db.battleSession.sessionKey.find(playerKey(ctx.sender, "battle")),
    ).toMatchObject({
      phase: "player_turn",
      status: "active",
      turnCount: 2,
      enemyIntentCursor: 1,
    });
    expect(findCombatant(ctx, "player")).toMatchObject({
      resolve: 20,
      ap: 3,
      block: 0,
    });
    expect(findCombatant(ctx, "enemy")).toMatchObject({
      nextIntentCardId: "card_enemy_closed_posture",
    });
    expect(
      ctx.db.battleCardInstance.rows().filter((row) => row.zone === "hand"),
    ).toHaveLength(7);
    expect(ctx.db.battleHistory.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryType: "enemy_turn",
          message: "Friedrich Richter plays Smug Rebuttal.",
        }),
        expect.objectContaining({
          entryType: "enemy_turn",
          message: "You draw 2 cards for the next exchange.",
        }),
      ]),
    );
  });

  it("resolves victory when a player card breaks enemy resolve", () => {
    const ctx = createReducerTestContext();
    openBattleModeInternal(ctx, "sandbox_son_duel");
    const enemy = findCombatant(ctx, "enemy");
    ctx.db.battleCombatant.combatantKey.update({
      ...enemy,
      resolve: 4,
    });

    playBattleCardInternal(ctx, "card_0");

    expect(
      ctx.db.battleSession.sessionKey.find(playerKey(ctx.sender, "battle")),
    ).toMatchObject({
      phase: "result",
      status: "resolved",
      resultType: "victory",
      resultTitle: "Friedrich Buckles",
    });
    expect(
      ctx.db.playerFlag.flagId.find(playerKey(ctx.sender, "son_duel_won")),
    ).toMatchObject({ value: true });
    expect(
      ctx.db.playerFlag.flagId.find(playerKey(ctx.sender, "son_duel_lost")),
    ).toMatchObject({ value: false });
    expect(
      ctx.db.playerVar.varId.find(playerKey(ctx.sender, "xp_total")),
    ).toMatchObject({
      floatValue: 50,
    });
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "battle_resolved" }),
      ]),
    );
  });

  it("resolves defeat when the enemy breaks player resolve", () => {
    const ctx = createReducerTestContext();
    openBattleModeInternal(ctx, "sandbox_son_duel");
    const player = findCombatant(ctx, "player");
    ctx.db.battleCombatant.combatantKey.update({
      ...player,
      resolve: 4,
    });

    endBattleTurnInternal(ctx);

    expect(
      ctx.db.battleSession.sessionKey.find(playerKey(ctx.sender, "battle")),
    ).toMatchObject({
      phase: "result",
      status: "resolved",
      resultType: "defeat",
      resultTitle: "You Yield Ground",
    });
    expect(
      ctx.db.playerFlag.flagId.find(playerKey(ctx.sender, "son_duel_won")),
    ).toMatchObject({ value: false });
    expect(
      ctx.db.playerFlag.flagId.find(playerKey(ctx.sender, "son_duel_lost")),
    ).toMatchObject({ value: true });
  });

  it("closes an active battle session", () => {
    const ctx = createReducerTestContext();
    openBattleModeInternal(ctx, "sandbox_son_duel");

    closeBattleModeInternal(ctx);

    expect(
      ctx.db.battleSession.sessionKey.find(playerKey(ctx.sender, "battle")),
    ).toMatchObject({
      phase: "closed",
      status: "closed",
      closedAt: ctx.timestamp,
    });
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "battle_mode_closed" }),
      ]),
    );
  });
});
