import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { CASE_CATALOG } from "../../../../src/shared/vn-contract";
import {
  publishCaseEvent,
  resetCaseCatalogCacheForTests,
  resolveActiveCaseCatalog,
} from "./quest_instances";

const SNAPSHOT_FLAG_KEY = "snapshot_trigger_flag";

const snapshotPayload = (withCatalog: boolean): string =>
  JSON.stringify({
    schemaVersion: 8,
    scenarios: [],
    nodes: [],
    mindPalace: { cases: [], facts: [], hypotheses: [] },
    map: {
      defaultRegionId: "test_region",
      regions: [
        {
          id: "test_region",
          name: "Test",
          geoCenterLat: 48.0,
          geoCenterLng: 7.85,
          zoom: 12,
        },
      ],
      points: [],
    },
    socialCatalog: {
      npcIdentities: [],
      services: [],
      rumors: [],
      careerRanks: [],
      factions: [],
    },
    questCatalog: [],
    ...(withCatalog
      ? {
          caseCatalog: {
            triggerRules: [
              {
                id: "rule.snapshot",
                schemaVersion: 1,
                kindVersion: 1,
                status: "active",
                eventName: "evt.snapshot",
                effects: [
                  { type: "set_flag", key: SNAPSHOT_FLAG_KEY, value: true },
                ],
              },
            ],
            questArchetypes: [],
          },
        }
      : {}),
  });

const insertActiveContent = (
  ctx: ReturnType<typeof createReducerTestContext>,
  checksum: string,
  payloadJson: string,
): void => {
  ctx.db.contentVersion.insert({
    version: `v-${checksum}`,
    checksum,
    schemaVersion: 9,
    publishedAt: ctx.timestamp,
    isActive: true,
  });
  ctx.db.contentSnapshot.insert({
    checksum,
    payloadJson,
    createdAt: ctx.timestamp,
  });
};

describe("case catalog resolution", () => {
  beforeEach(() => {
    resetCaseCatalogCacheForTests();
  });

  it("falls back to the compiled catalog without active content", () => {
    const ctx = createReducerTestContext();
    expect(resolveActiveCaseCatalog(ctx)).toBe(CASE_CATALOG);
  });

  it("falls back when the active snapshot ships no caseCatalog", () => {
    const ctx = createReducerTestContext();
    insertActiveContent(ctx, "cks-no-catalog", snapshotPayload(false));

    expect(resolveActiveCaseCatalog(ctx)).toBe(CASE_CATALOG);
  });

  it("resolves the snapshot catalog and memoizes per checksum", () => {
    const ctx = createReducerTestContext();
    insertActiveContent(ctx, "cks-memo", snapshotPayload(true));

    const first = resolveActiveCaseCatalog(ctx);
    expect(first.triggerRules.map((rule) => rule.id)).toEqual([
      "rule.snapshot",
    ]);
    expect(resolveActiveCaseCatalog(ctx)).toBe(first);
  });

  it("fires snapshot-authored triggers when no explicit catalog is passed", () => {
    const ctx = createReducerTestContext();
    insertActiveContent(ctx, "cks-fire", snapshotPayload(true));

    publishCaseEvent(ctx, {
      eventName: "evt.snapshot",
      idempotencyKey: "e1",
    });

    const flagRow = ctx.db.playerFlag.flagId.find(
      playerKey(ctx.sender, SNAPSHOT_FLAG_KEY),
    );
    expect(flagRow?.value).toBe(true);
    expect(ctx.db.playerTriggerFire.rows()).toHaveLength(1);
  });
});
