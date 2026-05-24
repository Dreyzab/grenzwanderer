import { describe, expect, it } from "vitest";

import type { VnSnapshot } from "../../../../src/shared/vn-contract";
import {
  collectCaseIdsFromSnapshot,
  createCaseVersionKey,
  syncCaseVersions,
} from "./case_versions";
import {
  createReducerTestContext,
  createTestTimestamp,
} from "./__tests__/serverTestContext";

const buildSnapshot = (): VnSnapshot => ({
  schemaVersion: 9,
  scenarios: [
    {
      id: "case01_entry",
      title: "Case 01 Entry",
      startNodeId: "node_start",
      nodeIds: ["node_start"],
      packId: "case01_mainline",
    },
    {
      id: "case01_side",
      title: "Case 01 Side",
      startNodeId: "node_side",
      nodeIds: ["node_side"],
      packId: "case01_mainline",
    },
    {
      id: "sandbox",
      title: "Sandbox",
      startNodeId: "node_sandbox",
      nodeIds: ["node_sandbox"],
    },
  ],
  nodes: [],
});

describe("case version sync", () => {
  it("collects stable case ids from scenario pack ownership", () => {
    expect(collectCaseIdsFromSnapshot(buildSnapshot())).toEqual([
      "case01_mainline",
      "default",
    ]);
    expect(createCaseVersionKey("case01_mainline", "content-v1")).toBe(
      "case01_mainline:content-v1",
    );
  });

  it("upserts one case_version row per case and content version", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(1_000n),
    });

    syncCaseVersions(ctx, buildSnapshot(), "content-v1", "checksum-a", 9);
    expect(ctx.db.caseVersion.rows()).toHaveLength(2);
    expect(
      ctx.db.caseVersion.caseVersionKey.find("case01_mainline:content-v1"),
    ).toMatchObject({
      caseId: "case01_mainline",
      version: "content-v1",
      checksum: "checksum-a",
      schemaVersion: 9,
    });

    const later = createReducerTestContext({
      db: ctx.db,
      timestamp: createTestTimestamp(2_000n),
    });
    syncCaseVersions(later, buildSnapshot(), "content-v1", "checksum-b", 9);

    expect(later.db.caseVersion.rows()).toHaveLength(2);
    expect(
      later.db.caseVersion.caseVersionKey.find("case01_mainline:content-v1"),
    ).toMatchObject({
      checksum: "checksum-b",
      publishedAt: later.timestamp,
    });
  });
});
