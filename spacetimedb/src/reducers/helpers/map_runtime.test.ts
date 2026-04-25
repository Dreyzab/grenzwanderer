import { describe, expect, it, vi } from "vitest";

import {
  createMapEventSnapshot,
  createReducerTestContext,
  createTestIdentity,
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

import {
  cleanupExpiredMapEvents,
  markMapEventResolved,
  spawnMapEventInternal,
} from "./map_runtime";

describe("map_runtime", () => {
  it("spawns a map event from an explicit snapshot and TTL override", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(1_000_000n),
    });
    const snapshot = createMapEventSnapshot();

    const row = spawnMapEventInternal(ctx, "template-a", {
      snapshot,
      snapshotChecksum: "checksum-a",
      ttlMinutes: 2,
      sourceLocationId: "loc-source",
    });

    expect(row).toMatchObject({
      eventId: `${ctx.sender.toHexString()}::event::template-a::1000000::0`,
      templateId: "template-a",
      snapshotChecksum: "checksum-a",
      sourceLocationId: "loc-source",
      status: "active",
    });
    expect(row.expiresAt.microsSinceUnixEpoch).toBe(121_000_000n);
    expect(JSON.parse(row.payloadJson)).toMatchObject({
      point: { id: "event-point-a", locationId: "loc-event-a" },
    });
    expect(ctx.db.telemetryEvent.rows()[0]).toMatchObject({
      eventName: "map_event_spawned",
    });
  });

  it("reuses an existing active event for the same template", () => {
    const ctx = createReducerTestContext();
    const snapshot = createMapEventSnapshot();

    const first = spawnMapEventInternal(ctx, "template-a", {
      snapshot,
      snapshotChecksum: "checksum-a",
      skipCleanup: true,
    });
    const second = spawnMapEventInternal(ctx, "template-a", {
      snapshot,
      snapshotChecksum: "checksum-a",
      skipCleanup: true,
    });

    expect(second).toBe(first);
    expect(ctx.db.playerMapEvent.rows()).toHaveLength(1);
  });

  it("increments event id attempts when the deterministic id is occupied", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(2_000_000n),
    });
    const snapshot = createMapEventSnapshot();
    ctx.db.playerMapEvent.insert({
      eventId: `${ctx.sender.toHexString()}::event::template-a::2000000::0`,
      playerId: ctx.sender,
      templateId: "template-a",
      snapshotChecksum: "old-checksum",
      payloadJson: "{}",
      sourceLocationId: "old-location",
      status: "resolved",
      spawnedAt: ctx.timestamp,
      expiresAt: createTestTimestamp(3_000_000n),
      resolvedAt: ctx.timestamp,
    });

    const row = spawnMapEventInternal(ctx, "template-a", {
      snapshot,
      snapshotChecksum: "checksum-a",
      skipCleanup: true,
    });

    expect(row.eventId).toBe(
      `${ctx.sender.toHexString()}::event::template-a::2000000::1`,
    );
    expect(ctx.db.playerMapEvent.rows()).toHaveLength(2);
  });

  it("uses template and snapshot default TTLs", () => {
    const withTemplateTtl = createReducerTestContext({
      timestamp: createTestTimestamp(1_000_000n),
    });
    const templateSnapshot = createMapEventSnapshot();
    const templateRow = spawnMapEventInternal(withTemplateTtl, "template-a", {
      snapshot: templateSnapshot,
      snapshotChecksum: "checksum-a",
      skipCleanup: true,
    });

    const withDefaultTtl = createReducerTestContext({
      timestamp: createTestTimestamp(1_000_000n),
    });
    const defaultSnapshot = createMapEventSnapshot({
      mapEventTemplates: [
        {
          id: "template-a",
          title: "Template A",
          point: {
            id: "event-point-a",
            title: "Event Point A",
            regionId: "region-test",
            lat: 47.99,
            lng: 7.85,
            category: "EPHEMERAL",
            locationId: "loc-event-a",
            bindings: [],
          },
        },
      ],
      testDefaults: { defaultEventTtlMinutes: 5 },
    });
    const defaultRow = spawnMapEventInternal(withDefaultTtl, "template-a", {
      snapshot: defaultSnapshot,
      snapshotChecksum: "checksum-a",
      skipCleanup: true,
    });

    expect(templateRow.expiresAt.microsSinceUnixEpoch).toBe(1_801_000_000n);
    expect(defaultRow.expiresAt.microsSinceUnixEpoch).toBe(301_000_000n);
  });

  it("expires active events during cleanup", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(10_000_000n),
    });
    ctx.db.playerMapEvent.insert({
      eventId: "event-expired",
      playerId: ctx.sender,
      templateId: "template-a",
      snapshotChecksum: "checksum-a",
      payloadJson: "{}",
      sourceLocationId: "loc-event-a",
      status: "active",
      spawnedAt: createTestTimestamp(1_000_000n),
      expiresAt: createTestTimestamp(9_999_999n),
      resolvedAt: undefined,
    });

    cleanupExpiredMapEvents(ctx);

    expect(ctx.db.playerMapEvent.eventId.find("event-expired")).toMatchObject({
      status: "expired",
      resolvedAt: undefined,
    });
  });

  it("marks only the sender's active event as resolved", () => {
    const ctx = createReducerTestContext();
    const otherPlayer = createTestIdentity("other-player");
    ctx.db.playerMapEvent.insert({
      eventId: "event-active",
      playerId: ctx.sender,
      templateId: "template-a",
      snapshotChecksum: "checksum-a",
      payloadJson: "{}",
      sourceLocationId: "loc-event-a",
      status: "active",
      spawnedAt: ctx.timestamp,
      expiresAt: createTestTimestamp(999_000_000n),
      resolvedAt: undefined,
    });
    ctx.db.playerMapEvent.insert({
      eventId: "event-other",
      playerId: otherPlayer,
      templateId: "template-a",
      snapshotChecksum: "checksum-a",
      payloadJson: "{}",
      sourceLocationId: "loc-event-a",
      status: "active",
      spawnedAt: ctx.timestamp,
      expiresAt: createTestTimestamp(999_000_000n),
      resolvedAt: undefined,
    });

    markMapEventResolved(ctx, "event-active");
    markMapEventResolved(ctx, "event-other");

    expect(ctx.db.playerMapEvent.eventId.find("event-active")).toMatchObject({
      status: "resolved",
      resolvedAt: ctx.timestamp,
    });
    expect(ctx.db.playerMapEvent.eventId.find("event-other")).toMatchObject({
      status: "active",
      resolvedAt: undefined,
    });
    expect(
      ctx.db.playerMapEvent.player_map_event_player_id.filter(ctx.sender),
    ).toHaveLength(1);
    expect(
      ctx.db.playerMapEvent.player_map_event_player_id.filter(otherPlayer),
    ).toHaveLength(1);
  });
});
