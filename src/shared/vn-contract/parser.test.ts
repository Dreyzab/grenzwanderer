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

  it("accepts discovery rules on map points", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    parsed.map.points[0].discoveryRules = [
      {
        channel: "qr_scan",
        conditions: [
          { type: "flag_is", key: "agency_briefing_complete", value: true },
        ],
        skillGates: [{ skillId: "attr_forensics", rank: "B" }],
        signal: {
          enabled: true,
          priority: 20,
          requiresServerConfirmation: true,
          radii: {
            coldEnterMeters: 40,
            coldExitMeters: 45,
            warmEnterMeters: 30,
            warmExitMeters: 32,
            hotEnterMeters: 15,
            hotExitMeters: 20,
          },
        },
      },
      {
        channel: "observation_lens",
        conditions: [
          {
            type: "thought_state_is",
            thoughtId: "thought_rationalist",
            state: "internalized",
          },
        ],
      },
    ];

    const result = parseVnSnapshotPayload(JSON.stringify(parsed));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.map?.points[0]?.discoveryRules).toHaveLength(2);
    }
  });

  it("rejects malformed discovery rules", () => {
    const raw = readFileSync(pilotPath, "utf8");
    const parsed = JSON.parse(raw);

    parsed.map.points[0].discoveryRules = [
      {
        channel: "qr_scan",
        signal: { radii: { hotEnterMeters: "close" } },
      },
    ];

    const result = parseVnSnapshotPayload(JSON.stringify(parsed));

    expect(result.ok).toBe(false);
  });
});
