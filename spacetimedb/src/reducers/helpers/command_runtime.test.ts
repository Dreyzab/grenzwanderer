import { describe, expect, it, vi } from "vitest";

import {
  createReducerTestContext,
  insertFlag,
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
  closeCommandModeInternal,
  issueCommandInternal,
  openCommandModeInternal,
  resolveCommandInternal,
} from "../helpers";

const readOrders = (ctx: ReturnType<typeof createReducerTestContext>) => {
  const session = ctx.db.commandSession.sessionKey.find(
    playerKey(ctx.sender, "command"),
  );
  return JSON.parse(session?.ordersJson ?? "[]") as Array<{
    id: string;
    actorId: string;
    disabled: boolean;
    disabledReason?: string;
  }>;
};

describe("command_runtime", () => {
  it("opens a command session with actor availability and disabled orders", () => {
    const ctx = createReducerTestContext();

    openCommandModeInternal(ctx, "agency_evening_briefing", {
      sourceTab: "vn",
      returnTab: "map",
    });

    expect(
      ctx.db.commandSession.sessionKey.find(playerKey(ctx.sender, "command")),
    ).toMatchObject({
      scenarioId: "agency_evening_briefing",
      sourceTab: "vn",
      returnTab: "map",
      phase: "orders",
      status: "active",
    });
    expect(ctx.db.commandPartyMember.rows()).toHaveLength(3);
    expect(ctx.db.commandPartyMember.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: "inspector",
          availability: "available",
          sortOrder: 0,
        }),
        expect.objectContaining({
          actorId: "npc_anna_mahler",
          availability: "locked",
          trust: 0,
        }),
      ]),
    );
    expect(readOrders(ctx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "deploy_inspector_watch",
          disabled: false,
        }),
        expect.objectContaining({
          id: "request_anna_network",
          disabled: true,
          disabledReason: "Anna Mahler is not ready for assignment.",
        }),
      ]),
    );
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "command_mode_opened" }),
      ]),
    );
  });

  it("rejects locked or unknown orders without mutating the session phase", () => {
    const ctx = createReducerTestContext();
    openCommandModeInternal(ctx, "agency_evening_briefing");

    expect(() => issueCommandInternal(ctx, "request_anna_network")).toThrow(
      "Anna Mahler is not ready for assignment.",
    );
    expect(() => issueCommandInternal(ctx, "missing_order")).toThrow(
      "Unknown command order missing_order",
    );
    expect(
      ctx.db.commandSession.sessionKey.find(playerKey(ctx.sender, "command")),
    ).toMatchObject({
      phase: "orders",
      selectedOrderId: undefined,
    });
    expect(ctx.db.commandOrderHistory.rows()).toHaveLength(0);
  });

  it("issues and resolves an unlocked order through command effects", () => {
    const ctx = createReducerTestContext();
    insertFlag(ctx, "met_anna_intro", true);
    openCommandModeInternal(ctx, "agency_evening_briefing");

    const selected = issueCommandInternal(ctx, "request_anna_network");
    expect(selected).toMatchObject({
      id: "request_anna_network",
      actorId: "npc_anna_mahler",
      disabled: false,
    });
    expect(
      ctx.db.commandSession.sessionKey.find(playerKey(ctx.sender, "command")),
    ).toMatchObject({
      phase: "resolving",
      selectedOrderId: "request_anna_network",
    });

    resolveCommandInternal(ctx);

    expect(
      ctx.db.commandSession.sessionKey.find(playerKey(ctx.sender, "command")),
    ).toMatchObject({
      phase: "result",
      status: "resolved",
      resultTitle: "Anna Activates Her Network",
    });
    expect(ctx.db.commandOrderHistory.rows()[0]).toMatchObject({
      scenarioId: "agency_evening_briefing",
      orderId: "request_anna_network",
      actorId: "npc_anna_mahler",
    });
    expect(
      ctx.db.playerFlag.flagId.find(
        playerKey(ctx.sender, "command_anna_network_ready"),
      ),
    ).toMatchObject({ value: true });
    expect(ctx.db.playerRumorState.rows()[0]).toMatchObject({
      rumorId: "rumor_bank_rail_yard",
      status: "logged",
    });
    expect(ctx.db.playerAgencyCareer.playerId.find(ctx.sender)).toMatchObject({
      sourceCriterionComplete: true,
    });
    expect(
      ctx.db.playerNpcState.npcStateKey.find(
        playerKey(ctx.sender, "npc::npc_anna_mahler"),
      ),
    ).toMatchObject({
      npcId: "npc_anna_mahler",
      trustScore: 1,
    });
    expect(ctx.db.commandPartyMember.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: "npc_anna_mahler",
          availability: "available",
          trust: 1,
        }),
      ]),
    );
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "command_order_issued" }),
        expect.objectContaining({ eventName: "command_order_resolved" }),
      ]),
    );
  });

  it("closes an active command session", () => {
    const ctx = createReducerTestContext();
    openCommandModeInternal(ctx, "agency_evening_briefing");

    closeCommandModeInternal(ctx);

    expect(
      ctx.db.commandSession.sessionKey.find(playerKey(ctx.sender, "command")),
    ).toMatchObject({
      phase: "closed",
      status: "closed",
      closedAt: ctx.timestamp,
    });
    expect(ctx.db.telemetryEvent.rows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventName: "command_mode_closed" }),
      ]),
    );
  });
});
