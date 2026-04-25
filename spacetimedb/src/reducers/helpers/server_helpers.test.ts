import { describe, expect, it, vi } from "vitest";

import {
  createMapEventSnapshot,
  createReducerTestContext,
  createTestIdentity,
  createTestTimestamp,
  insertFlag,
  insertInventory,
  insertVar,
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
  ensureAdminIdentity,
  ensureAllowlistedWorker,
  hasAdminIdentity,
  hasAnyAdminIdentity,
} from "./auth";
import {
  createBattleCardInstanceKey,
  createBattleCombatantKey,
  createBattleHistoryKey,
  createBattleSessionKey,
  createCommandHistoryKey,
  createCommandPartyMemberKey,
  createCommandSessionKey,
  createEvidenceKey,
  createFactionSignalKey,
  createFlagKey,
  createHypothesisFocusFlagKey,
  createInventoryKey,
  createMapEventKey,
  createNpcFavorKey,
  createNpcStateKey,
  createPlayerMindCaseKey,
  createPlayerMindFactKey,
  createPlayerMindHypothesisKey,
  createQuestKey,
  createRedeemedCodeKey,
  createRelationshipKey,
  createRumorStateKey,
  createSessionKey,
  createSkillCheckResultKey,
  createUnlockGroupKey,
  createVarKey,
  identityKey,
} from "./keys";
import {
  parseBoolean,
  parseNumber,
  parseRequiredFactIdsJson,
  parseRequiredVarsJson,
  parseRewardEffectsJson,
  parseStoredMapEventPayload,
  parseTagsJsonObject,
} from "./parsers";
import {
  addToVar,
  ensurePlayerProfile,
  getFlag,
  getPlayerActiveMapEventByEventId,
  getVar,
  hasPlayerGameplayProgress,
  resetPlayerGameplayState,
  setNickname,
  upsertFlag,
  upsertLocation,
  upsertVar,
} from "./player";
import { emitTelemetry } from "./telemetry";
import { ensureIdempotent } from "./idempotency";

describe("server helper facades", () => {
  it("builds stable player-scoped keys", () => {
    const player = createTestIdentity("player-a");

    expect(identityKey(player)).toBe("player-a");
    expect(createFlagKey(player, "flag")).toBe("player-a::flag");
    expect(createVarKey(player, "var")).toBe("player-a::var");
    expect(createSessionKey(player, "scenario")).toBe("player-a::scenario");
    expect(createCommandSessionKey(player)).toBe("player-a::command");
    expect(createCommandPartyMemberKey(player, "actor")).toBe(
      "player-a::command::member::actor",
    );
    expect(createInventoryKey(player, "item")).toBe("player-a::item");
    expect(createQuestKey(player, "quest")).toBe("player-a::quest");
    expect(createEvidenceKey(player, "evidence")).toBe("player-a::evidence");
    expect(createRelationshipKey(player, "char")).toBe("player-a::char");
    expect(createNpcStateKey(player, "npc")).toBe("player-a::npc::npc");
    expect(createNpcFavorKey(player, "npc")).toBe("player-a::favor::npc");
    expect(createFactionSignalKey(player, "faction")).toBe(
      "player-a::faction::faction",
    );
    expect(createRumorStateKey(player, "rumor")).toBe("player-a::rumor::rumor");
    expect(createUnlockGroupKey(player, "group")).toBe("player-a::group");
    expect(createMapEventKey(player, "template", 12n, 3)).toBe(
      "player-a::event::template::12::3",
    );
    expect(createRedeemedCodeKey(player, "request")).toBe(
      "player-a::redeem::request",
    );
    expect(createPlayerMindCaseKey(player, "case")).toBe(
      "player-a::case::case",
    );
    expect(createPlayerMindFactKey(player, "case", "fact")).toBe(
      "player-a::fact::case::fact",
    );
    expect(createPlayerMindHypothesisKey(player, "case", "hypothesis")).toBe(
      "player-a::hypothesis::case::hypothesis",
    );
    expect(createHypothesisFocusFlagKey("case", "hypothesis")).toBe(
      "mind_focus::case::hypothesis",
    );
    expect(createSkillCheckResultKey(player, "scenario", "node", "check")).toBe(
      "player-a::check::scenario::node::check",
    );
    expect(createCommandHistoryKey(player, "order", 99n)).toBe(
      "player-a::command::history::order::99",
    );
    expect(createBattleSessionKey(player)).toBe("player-a::battle");
    expect(createBattleCombatantKey(player, "enemy")).toBe(
      "player-a::battle::combatant::enemy",
    );
    expect(createBattleCardInstanceKey(player, "card")).toBe(
      "player-a::battle::card::card",
    );
    expect(createBattleHistoryKey(player, 100n, 2)).toBe(
      "player-a::battle::history::100::2",
    );
  });

  it("parses helper JSON payloads and rejects malformed input", () => {
    const point = createMapEventSnapshot().map.mapEventTemplates[0].point;

    expect(parseRequiredFactIdsJson(JSON.stringify(["fact_a"]))).toEqual([
      "fact_a",
    ]);
    expect(
      parseRequiredVarsJson(
        JSON.stringify([{ key: "focus", op: "gte", value: 2 }]),
      ),
    ).toEqual([{ key: "focus", op: "gte", value: 2 }]);
    expect(
      parseRewardEffectsJson(
        JSON.stringify([{ type: "set_flag", key: "done", value: true }]),
      ),
    ).toEqual([{ type: "set_flag", key: "done", value: true }]);
    expect(
      parseTagsJsonObject(JSON.stringify({ kind: "test" }), "tags"),
    ).toEqual({
      kind: "test",
    });
    expect(parseBoolean(true, "enabled")).toBe(true);
    expect(parseNumber(4, "count")).toBe(4);
    expect(parseStoredMapEventPayload(JSON.stringify({ point }))).toEqual({
      point,
    });

    expect(() => parseRequiredFactIdsJson("{")).toThrow(
      "requiredFactIdsJson must be valid JSON",
    );
    expect(() => parseBoolean("yes", "enabled")).toThrow(
      "enabled must be a boolean",
    );
    expect(() =>
      parseStoredMapEventPayload(JSON.stringify({ point: null })),
    ).toThrow("map event payloadJson has invalid shape");
  });

  it("checks admin and worker authorization tables", () => {
    const ctx = createReducerTestContext();

    expect(hasAnyAdminIdentity(ctx)).toBe(false);
    expect(hasAdminIdentity(ctx)).toBe(false);
    expect(() => ensureAdminIdentity(ctx, "publish content")).toThrow(
      "Only an admin identity can publish content",
    );
    expect(() => ensureAllowlistedWorker(ctx, "claim jobs")).toThrow(
      "Only an allowlisted worker can claim jobs",
    );

    ctx.db.adminIdentity.insert({ identity: ctx.sender });
    ctx.db.workerAllowlist.insert({ identity: ctx.sender });

    expect(hasAnyAdminIdentity(ctx)).toBe(true);
    expect(hasAdminIdentity(ctx)).toBe(true);
    expect(() => ensureAdminIdentity(ctx, "publish content")).not.toThrow();
    expect(() => ensureAllowlistedWorker(ctx, "claim jobs")).not.toThrow();
  });

  it("mutates player profile, flags, vars, location, telemetry, and idempotency", () => {
    const ctx = createReducerTestContext();

    ensurePlayerProfile(ctx);
    setNickname(ctx, "  Ada  ");
    upsertLocation(ctx, "loc_bank");
    upsertFlag(ctx, "gate_open", true);
    upsertVar(ctx, "focus", 3);
    addToVar(ctx, "focus", 2);
    emitTelemetry(ctx, "unit_test_event", { scope: "server" }, 7);
    ensureIdempotent(ctx, "request-1", "test operation");

    expect(ctx.db.playerProfile.playerId.find(ctx.sender)).toMatchObject({
      nickname: "Ada",
    });
    expect(ctx.db.playerLocation.playerId.find(ctx.sender)).toMatchObject({
      locationId: "loc_bank",
    });
    expect(getFlag(ctx, "gate_open")).toBe(true);
    expect(getVar(ctx, "focus")).toBe(5);
    expect(ctx.db.telemetryEvent.rows()).toHaveLength(1);
    expect(ctx.db.idempotencyLog.rows()).toHaveLength(1);
    expect(() => ensureIdempotent(ctx, "request-1", "test operation")).toThrow(
      "Duplicate request for test operation",
    );
  });

  it("detects and resets sender-owned gameplay progress", () => {
    const ctx = createReducerTestContext();
    const other = createTestIdentity("other-player");
    insertFlag(ctx, "gate_open", true);
    insertVar(ctx, "focus", 3);
    insertInventory(ctx, "item_warrant", 1);
    ctx.db.vnSession.insert({
      sessionKey: playerKey(ctx.sender, "scenario"),
      playerId: ctx.sender,
    });
    ctx.db.playerMapEvent.insert({
      eventId: "event-active",
      playerId: ctx.sender,
      status: "active",
      expiresAt: createTestTimestamp(999_000_000n),
    });
    ctx.db.playerFlag.insert({
      flagId: playerKey(other, "gate_open"),
      playerId: other,
      key: "gate_open",
      value: true,
      updatedAt: ctx.timestamp,
    });

    expect(hasPlayerGameplayProgress(ctx)).toBe(true);
    expect(getPlayerActiveMapEventByEventId(ctx, "event-active")).toMatchObject(
      {
        eventId: "event-active",
      },
    );

    resetPlayerGameplayState(ctx);

    expect(ctx.db.vnSession.rows()).toHaveLength(0);
    expect(ctx.db.playerVar.rows()).toHaveLength(0);
    expect(ctx.db.playerInventory.rows()).toHaveLength(0);
    expect(ctx.db.playerMapEvent.rows()).toHaveLength(0);
    expect(ctx.db.playerFlag.rows()).toHaveLength(1);
    expect(ctx.db.playerFlag.rows()[0]).toMatchObject({ playerId: other });
    expect(ctx.db.playerLocation.playerId.find(ctx.sender)).toMatchObject({
      locationId: "loc_intro",
    });
  });
});
