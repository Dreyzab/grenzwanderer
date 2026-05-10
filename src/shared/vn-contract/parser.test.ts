import { describe, it, expect } from "vitest";
import { parseVnSnapshotPayload } from "./parser";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pilotPath = path.resolve(
  __dirname,
  "../../../content/vn/pilot.snapshot.json",
);

describe("VN Snapshot Parser Fix", () => {
  it("should accept a snapshot even if vocabulary is slightly different", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    // Artificially "pollute" the vocabulary with a new condition
    parsed.contractMetadata.vocabulary.conditions.push("some_new_condition");

    const payload = JSON.stringify(parsed);
    const result = parseVnSnapshotPayload(payload);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Ensure it was overwritten by the latest code metadata anyway
      expect(
        result.snapshot.contractMetadata?.vocabulary.conditions,
      ).not.toContain("some_new_condition");
    }
  });

  it("should provide detailed error if a node is invalid", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    // Break a node
    parsed.nodes[0].id = 123; // Should be a string

    const payload = JSON.stringify(parsed);
    const result = parseVnSnapshotPayload(payload);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0].path).toContain("nodes[");
      expect(result.issues[0].message).toBe("Invalid node structure");
    }
  });
});
