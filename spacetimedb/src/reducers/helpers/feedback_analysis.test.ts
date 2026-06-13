import { describe, expect, it } from "vitest";

import {
  buildFrozenSources,
  canonicalFiltersJson,
  capRatings,
  computeRatingStats,
  computeReportKey,
  computeSnapshotHash,
  parseFeedbackFiltersJson,
  ratingMatchesFilters,
  type NormalizedRating,
} from "./feedback_analysis";

const contentRating = (
  overrides: Partial<NormalizedRating> = {},
): NormalizedRating => ({
  kind: "content",
  targetType: "node",
  targetId: "node_a",
  scenarioId: "case01",
  contentVersion: "v1.0.0",
  createdAtMicros: 1_000,
  comment: "ok",
  scores: { overallScore: 6 },
  raterHex: "deadbeef",
  ...overrides,
});

const dialogueRating = (
  overrides: Partial<NormalizedRating> = {},
): NormalizedRating => ({
  kind: "dialogue",
  targetType: "node",
  targetId: "node_b",
  scenarioId: "case01",
  nodeId: "node_b",
  contentVersion: "v1.0.0",
  createdAtMicros: 2_000,
  comment: undefined,
  scores: { score: 2, speaker: "narrator" },
  raterHex: "cafebabe",
  ...overrides,
});

describe("parseFeedbackFiltersJson", () => {
  it("keeps only known, well-typed fields", () => {
    const filters = parseFeedbackFiltersJson(
      JSON.stringify({
        contentVersion: "v1.0.0",
        fromMicros: 100,
        scenarioId: "case01",
        bogus: "drop me",
        toMicros: "not a number",
      }),
    );
    expect(filters).toEqual({
      contentVersion: "v1.0.0",
      fromMicros: 100,
      scenarioId: "case01",
    });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseFeedbackFiltersJson("{not json")).toThrow();
  });
});

describe("ratingMatchesFilters", () => {
  it("matches on contentVersion, period, scenario and target", () => {
    const rating = contentRating({ createdAtMicros: 1_500 });
    expect(
      ratingMatchesFilters(rating, {
        contentVersion: "v1.0.0",
        fromMicros: 1_000,
        toMicros: 2_000,
        scenarioId: "case01",
        targetType: "node",
        targetId: "node_a",
      }),
    ).toBe(true);
  });

  it("rejects ratings outside the time window", () => {
    expect(
      ratingMatchesFilters(contentRating({ createdAtMicros: 50 }), {
        fromMicros: 100,
      }),
    ).toBe(false);
  });

  it("rejects ratings of a different content version", () => {
    expect(
      ratingMatchesFilters(contentRating({ contentVersion: "v2.0.0" }), {
        contentVersion: "v1.0.0",
      }),
    ).toBe(false);
  });

  it("matches dialogue ratings by node target", () => {
    expect(
      ratingMatchesFilters(dialogueRating(), {
        targetType: "node",
        targetId: "node_b",
      }),
    ).toBe(true);
  });
});

describe("computeRatingStats", () => {
  it("counts content and dialogue, commented rows, and averages", () => {
    const stats = computeRatingStats([
      contentRating({ scores: { overallScore: 8 } }),
      contentRating({ scores: { overallScore: 4 }, comment: undefined }),
      dialogueRating({ scores: { score: 2 } }),
    ]);
    expect(stats.contentCount).toBe(2);
    expect(stats.dialogueCount).toBe(1);
    expect(stats.commentedCount).toBe(1);
    expect(stats.averageOverall).toBe(6);
    expect(stats.averageDialogue).toBe(2);
  });

  it("counts developer and player feedback identically (no weighting)", () => {
    const developer = contentRating({
      raterHex: "dev",
      scores: { overallScore: 10 },
    });
    const player = contentRating({
      raterHex: "player",
      scores: { overallScore: 2 },
    });
    const stats = computeRatingStats([developer, player]);
    expect(stats.contentCount).toBe(2);
    expect(stats.averageOverall).toBe(6);
  });
});

describe("capRatings", () => {
  it("sorts by time and caps to the maximum, reporting drops", () => {
    const ratings = Array.from({ length: 105 }, (_unused, index) =>
      contentRating({ createdAtMicros: 105 - index }),
    );
    const { kept, droppedCount } = capRatings(ratings, 100);
    expect(kept).toHaveLength(100);
    expect(droppedCount).toBe(5);
    expect(kept[0].createdAtMicros).toBe(1);
  });

  it("returns all ratings when under the cap", () => {
    const { kept, droppedCount } = capRatings([contentRating()], 100);
    expect(kept).toHaveLength(1);
    expect(droppedCount).toBe(0);
  });
});

describe("buildFrozenSources", () => {
  it("assigns stable evidence ids and omits empty comments", () => {
    const sources = buildFrozenSources([
      contentRating(),
      dialogueRating({ comment: "" }),
    ]);
    expect(sources[0].evidenceId).toBe("src_1");
    expect(sources[0].comment).toBe("ok");
    expect(sources[1].evidenceId).toBe("src_2");
    expect(sources[1].comment).toBeUndefined();
    expect(sources[1].nodeId).toBe("node_b");
  });
});

describe("hashing", () => {
  it("produces a stable reportKey regardless of filter key order", () => {
    const a = computeReportKey({ scenarioId: "case01", contentVersion: "v1" });
    const b = computeReportKey({ contentVersion: "v1", scenarioId: "case01" });
    expect(a).toBe(b);
  });

  it("serializes filters canonically", () => {
    expect(
      canonicalFiltersJson({ scenarioId: "case01", contentVersion: "v1" }),
    ).toBe('{"contentVersion":"v1","scenarioId":"case01"}');
  });

  it("produces a deterministic snapshot hash", () => {
    const sources = buildFrozenSources([contentRating()]);
    expect(computeSnapshotHash(sources)).toBe(computeSnapshotHash(sources));
  });
});
