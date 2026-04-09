import { describe, expect, it } from "vitest";

import {
  contentDriftFiles,
  verifyContentDrift,
} from "./content-drift-check";

const buildSnapshot = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify(
    {
      schemaVersion: 6,
      generatedAt: "2026-04-08T00:00:00.000Z",
      checksum: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      scenarios: [{ id: "sandbox_intro_pilot", nodeIds: ["scene_start"] }],
      ...overrides,
    },
    null,
    2,
  );

describe("content-drift-check", () => {
  it("ignores generatedAt and checksum changes", () => {
    const findings = verifyContentDrift({
      existsSyncImpl: () => true,
      readFileSyncImpl: (file) =>
        buildSnapshot({
          generatedAt: file.includes("public")
            ? "2026-04-09T00:00:00.000Z"
            : "2026-04-08T00:00:00.000Z",
        }),
    });

    expect(findings).toEqual([]);
  });

  it("reports local artifact mismatches by default", () => {
    const findings = verifyContentDrift({
      existsSyncImpl: () => true,
      readFileSyncImpl: (file) =>
        file.includes("public")
          ? buildSnapshot({ scenarios: [{ id: "public" }] })
          : buildSnapshot({ scenarios: [{ id: "local" }] }),
    });

    expect(findings).toEqual([
      {
        file: contentDriftFiles[1],
        message: `snapshot content differs from canonical local artifact (${contentDriftFiles[0]})`,
      },
    ]);
  });

  it("reports content mismatches against git HEAD", () => {
    const findings = verifyContentDrift({
      mode: "head",
      existsSyncImpl: () => true,
      readFileSyncImpl: () => buildSnapshot({ scenarios: [{ id: "local" }] }),
      readHeadContentImpl: () => ({
        ok: true,
        content: buildSnapshot({ scenarios: [{ id: "head" }] }),
      }),
    });

    expect(findings).toEqual([
      {
        file: contentDriftFiles[0],
        message: "snapshot content differs from git HEAD",
      },
      {
        file: contentDriftFiles[1],
        message: "snapshot content differs from git HEAD",
      },
    ]);
  });

  it("reports missing local artifacts", () => {
    const findings = verifyContentDrift({
      existsSyncImpl: (file) => file !== contentDriftFiles[1],
      readFileSyncImpl: () => buildSnapshot(),
      readHeadContentImpl: () => ({ ok: true, content: buildSnapshot() }),
    });

    expect(findings).toEqual([
      {
        file: contentDriftFiles[1],
        message: "file missing locally",
      },
    ]);
  });

  it("reports unavailable git HEAD clearly", () => {
    const findings = verifyContentDrift({
      mode: "head",
      existsSyncImpl: () => true,
      readFileSyncImpl: () => buildSnapshot(),
      readHeadContentImpl: () => ({
        ok: false,
        kind: "head_unavailable",
        detail:
          "git HEAD is unavailable. Use content:drift:against-head only when repository history is available.",
      }),
    });

    expect(findings).toEqual([
      {
        file: contentDriftFiles[0],
        message:
          "git HEAD is unavailable. Use content:drift:against-head only when repository history is available.",
      },
      {
        file: contentDriftFiles[1],
        message:
          "git HEAD is unavailable. Use content:drift:against-head only when repository history is available.",
      },
    ]);
  });
});
