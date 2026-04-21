import { describe, expect, it } from "vitest";

import type { ContentReleaseManifest, ContentTarget } from "./content-manifest";
import {
  evaluateContentDbStatus,
  findLatestReleaseForTarget,
  selectSingleActiveContentVersion,
} from "./content-db-status";

const target: ContentTarget = {
  server: "local",
  host: "ws://127.0.0.1:3000",
  database: "grezwandererdata",
};

const manifest: ContentReleaseManifest = {
  schemaVersion: 1,
  updatedAt: "2026-04-08T00:00:00.000Z",
  releases: [
    {
      version: "content-v1.0.0+aaaa1111",
      checksum:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      schemaVersion: 6,
      generatedAt: "2026-04-01T00:00:00.000Z",
      publishedAt: "2026-04-01T12:00:00.000Z",
      target,
    },
    {
      version: "content-v1.0.1+bbbb2222",
      checksum:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      schemaVersion: 6,
      generatedAt: "2026-04-02T00:00:00.000Z",
      publishedAt: "2026-04-02T12:00:00.000Z",
      target,
    },
  ],
  rollbacks: [],
};

describe("content-db-status", () => {
  it("selects the latest manifest release for the target", () => {
    expect(findLatestReleaseForTarget(manifest, target)?.version).toBe(
      "content-v1.0.1+bbbb2222",
    );
  });

  it("returns ok for matching active DB and baseline checksums", () => {
    const result = evaluateContentDbStatus({
      activeVersion: {
        version: "content-v1.0.1+bbbb2222",
        checksum:
          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        schemaVersion: 6,
        publishedAt: "2026-04-02T12:00:00.000Z",
      },
      baseline: {
        source: "manifest",
        version: "content-v1.0.1+bbbb2222",
        checksum:
          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        schemaVersion: 6,
        publishedAt: "2026-04-02T12:00:00.000Z",
      },
    });

    expect(result).toEqual({ ok: true, warning: null });
  });

  it("warns on checksum mismatch for local comparison mode", () => {
    const result = evaluateContentDbStatus({
      activeVersion: {
        version: "content-v1.0.1+bbbb2222",
        checksum:
          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        schemaVersion: 6,
        publishedAt: "2026-04-02T12:00:00.000Z",
      },
      baseline: {
        source: "local",
        version: null,
        checksum:
          "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        schemaVersion: 6,
        publishedAt: null,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.warning).toContain("local snapshot checksum");
  });

  it("returns the single active DB version", () => {
    expect(
      selectSingleActiveContentVersion([
        {
          version: "content-v1.0.1+bbbb2222",
          checksum:
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          schemaVersion: 6,
          publishedAt: "2026-04-02T12:00:00.000Z",
        },
      ]),
    ).toMatchObject({ version: "content-v1.0.1+bbbb2222" });
  });

  it("fails clearly when no active DB version exists", () => {
    expect(() => selectSingleActiveContentVersion([])).toThrow(
      /No active content version found/,
    );
  });
});
