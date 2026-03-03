import { describe, expect, it } from "vitest";
import {
  computeSnapshotChecksum,
  normalizeSnapshotForPublish,
} from "./content-manifest";

describe("content-manifest snapshot normalization", () => {
  it("excludes metadata and keeps schema v4 runtime payload fields", () => {
    const rawSnapshot: Record<string, unknown> = {
      schemaVersion: 4,
      scenarios: [{ id: "sandbox_intro_pilot" }],
      nodes: [{ id: "scene_intro" }],
      vnRuntime: { skillCheckDice: "d20" },
      mindPalace: { cases: [], facts: [], hypotheses: [] },
      map: { defaultRegionId: "FREIBURG_1905", regions: [], points: [] },
      questCatalog: [{ id: "quest_main", title: "Main", stages: [] }],
      checksum:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      generatedAt: "2026-03-03T00:00:00.000Z",
    };

    const normalized = normalizeSnapshotForPublish(rawSnapshot);

    expect(normalized.payload).toMatchObject({
      schemaVersion: 4,
      map: { defaultRegionId: "FREIBURG_1905" },
      questCatalog: [{ id: "quest_main" }],
    });
    expect(normalized.payload).not.toHaveProperty("checksum");
    expect(normalized.payload).not.toHaveProperty("generatedAt");
    expect(rawSnapshot).toHaveProperty("checksum");
    expect(rawSnapshot).toHaveProperty("generatedAt");
  });

  it("computes checksum from normalized payload json", () => {
    const rawSnapshot: Record<string, unknown> = {
      schemaVersion: 4,
      scenarios: [],
      nodes: [],
      map: { defaultRegionId: "FREIBURG_1905", regions: [], points: [] },
      questCatalog: [],
      checksum:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      generatedAt: "2026-03-03T00:00:00.000Z",
    };

    const normalized = normalizeSnapshotForPublish(rawSnapshot);
    const expectedChecksum = computeSnapshotChecksum(normalized.payloadJson);

    expect(normalized.checksum).toBe(expectedChecksum);
  });
});
