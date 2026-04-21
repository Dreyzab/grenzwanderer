import { describe, expect, it } from "vitest";
import {
  buildEntityKnowledge,
  buildMysticStateSummary,
  isSightModeAllowed,
  resolveUnlockedObservationEntries,
} from "./mysticism";
import type { VnSnapshot } from "../../vn/types";

const snapshot: VnSnapshot = {
  schemaVersion: 6,
  scenarios: [],
  nodes: [],
  mindPalace: {
    cases: [],
    facts: [],
    hypotheses: [],
  },
  mysticism: {
    entityArchetypes: [
      {
        id: "echo_hound",
        label: "Echo Hound",
        veilLevel: 2,
        signatures: ["cold", "echo"],
        habitats: ["rail", "alley"],
        temperament: "tracking",
        witnessValue: 2,
        rationalCoverStories: ["stray dog", "panic rumor"],
        allowedManifestations: ["trace", "sighting"],
      },
    ],
    observations: [
      {
        id: "obs_unlocked_default",
        kind: "trace",
        title: "Cold Rails",
        text: "The platform keeps its chill after the train has gone.",
        entityArchetypeId: "echo_hound",
        signatureIds: ["cold"],
        unlockedByDefault: true,
      },
      {
        id: "obs_flagged",
        kind: "echo",
        title: "Delayed Bark",
        text: "The sound arrives twice, the second time from nowhere visible.",
        entityArchetypeId: "echo_hound",
        signatureIds: ["echo"],
        rationalInterpretation:
          "Tunnel acoustics and crowd panic may be compounding.",
      },
    ],
  },
};

describe("mysticism model", () => {
  it("derives awakening band, sight mode, and rationalism", () => {
    const result = buildMysticStateSummary({
      mystic_awakening: 61,
      mystic_exposure: 4,
      mystic_rationalist_buffer: 12,
      mystic_sight_mode_tier: 2,
    });

    expect(result.awakeningBand).toBe("open");
    expect(result.awakeningBandLabel).toBe("Opening");
    expect(result.activeSightMode).toBe("ether");
    expect(result.rationalism).toBe(51);
  });

  it("filters observation entries by unlock flags", () => {
    const result = resolveUnlockedObservationEntries(snapshot, {
      mystic_obs_obs_flagged: true,
    });

    expect(result.map((entry) => entry.id)).toEqual([
      "obs_unlocked_default",
      "obs_flagged",
    ]);
  });

  it("builds entity knowledge from unlocked observations", () => {
    const unlocked = resolveUnlockedObservationEntries(snapshot, {
      mystic_obs_obs_flagged: true,
    });
    const result = buildEntityKnowledge(
      snapshot.mysticism?.entityArchetypes,
      unlocked,
    );

    expect(result).toEqual([
      {
        id: "echo_hound",
        label: "Echo Hound",
        veilLevel: 2,
        observationCount: 2,
        signatureIds: ["cold", "echo"],
      },
    ]);
  });

  it("treats higher sight modes as supersets of lower ones", () => {
    expect(isSightModeAllowed(["sensitive"], "ether")).toBe(true);
    expect(isSightModeAllowed(["ether"], "sensitive")).toBe(false);
    expect(isSightModeAllowed(undefined, "rational")).toBe(true);
  });
});
