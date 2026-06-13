// Pure helpers for the Feedback Center analysis run. Kept free of SpacetimeDB
// imports so the filtering / stats / snapshot logic is unit-testable. The
// reducer (reducers/feedbackAnalysis.ts) extracts raw rows into NormalizedRating
// and delegates all algorithmic work here.
import {
  FEEDBACK_ANALYSIS_MAX_SOURCES,
  type AnalyzeFeedbackFilters,
  type FeedbackRatingStats,
  type FeedbackSourceKind,
  type FrozenFeedbackSource,
} from "../../../../src/features/ai/contracts";
import { sha256Hex } from "./crypto";

export { FEEDBACK_ANALYSIS_MAX_SOURCES };

export interface NormalizedRating {
  kind: FeedbackSourceKind;
  targetType: string;
  targetId: string;
  scenarioId?: string;
  nodeId?: string;
  contentVersion?: string;
  createdAtMicros: number;
  comment?: string;
  // Frozen score snapshot, serialized verbatim into the source row.
  scores: Record<string, number | string>;
  // Plaintext rater identity hex; the reducer hashes it before persisting.
  raterHex: string;
}

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const optionalFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Parse + defensively coerce the operator-supplied filter JSON. */
export const parseFeedbackFiltersJson = (
  filtersJson: string,
): AnalyzeFeedbackFilters => {
  let raw: unknown;
  try {
    raw = JSON.parse(filtersJson);
  } catch {
    throw new Error("filtersJson must be valid JSON");
  }
  if (typeof raw !== "object" || raw === null) {
    throw new Error("filtersJson must be a JSON object");
  }
  const source = raw as Record<string, unknown>;
  const filters: AnalyzeFeedbackFilters = {};
  const contentVersion = optionalString(source.contentVersion);
  if (contentVersion !== undefined) {
    filters.contentVersion = contentVersion;
  }
  const fromMicros = optionalFiniteNumber(source.fromMicros);
  if (fromMicros !== undefined) {
    filters.fromMicros = fromMicros;
  }
  const toMicros = optionalFiniteNumber(source.toMicros);
  if (toMicros !== undefined) {
    filters.toMicros = toMicros;
  }
  const scenarioId = optionalString(source.scenarioId);
  if (scenarioId !== undefined) {
    filters.scenarioId = scenarioId;
  }
  const targetType = optionalString(source.targetType);
  if (targetType !== undefined) {
    filters.targetType = targetType;
  }
  const targetId = optionalString(source.targetId);
  if (targetId !== undefined) {
    filters.targetId = targetId;
  }
  return filters;
};

export const ratingMatchesFilters = (
  rating: NormalizedRating,
  filters: AnalyzeFeedbackFilters,
): boolean => {
  if (
    filters.contentVersion !== undefined &&
    rating.contentVersion !== filters.contentVersion
  ) {
    return false;
  }
  if (
    filters.fromMicros !== undefined &&
    rating.createdAtMicros < filters.fromMicros
  ) {
    return false;
  }
  if (
    filters.toMicros !== undefined &&
    rating.createdAtMicros > filters.toMicros
  ) {
    return false;
  }
  if (
    filters.scenarioId !== undefined &&
    rating.scenarioId !== filters.scenarioId
  ) {
    return false;
  }
  if (
    filters.targetType !== undefined &&
    rating.targetType !== filters.targetType
  ) {
    return false;
  }
  if (filters.targetId !== undefined && rating.targetId !== filters.targetId) {
    return false;
  }
  return true;
};

const roundTo2 = (value: number): number => Math.round(value * 100) / 100;

const averageOf = (values: number[]): number | undefined =>
  values.length > 0
    ? roundTo2(values.reduce((sum, value) => sum + value, 0) / values.length)
    : undefined;

export const computeRatingStats = (
  ratings: readonly NormalizedRating[],
): FeedbackRatingStats => {
  const content = ratings.filter((rating) => rating.kind === "content");
  const dialogue = ratings.filter((rating) => rating.kind === "dialogue");
  const overalls = content
    .map((rating) => rating.scores.overallScore)
    .filter((value): value is number => typeof value === "number");
  const dialogueScores = dialogue
    .map((rating) => rating.scores.score)
    .filter((value): value is number => typeof value === "number");
  const commentedCount = ratings.filter(
    (rating) =>
      typeof rating.comment === "string" && rating.comment.trim().length > 0,
  ).length;

  const stats: FeedbackRatingStats = {
    contentCount: content.length,
    dialogueCount: dialogue.length,
    commentedCount,
  };
  const averageOverall = averageOf(overalls);
  if (averageOverall !== undefined) {
    stats.averageOverall = averageOverall;
  }
  const averageDialogue = averageOf(dialogueScores);
  if (averageDialogue !== undefined) {
    stats.averageDialogue = averageDialogue;
  }
  return stats;
};

/** Sort by recorded time, then cap to the snapshot maximum. */
export const capRatings = (
  ratings: readonly NormalizedRating[],
  max: number = FEEDBACK_ANALYSIS_MAX_SOURCES,
): { kept: NormalizedRating[]; droppedCount: number } => {
  const sorted = [...ratings].sort(
    (left, right) => left.createdAtMicros - right.createdAtMicros,
  );
  const kept = sorted.slice(0, max);
  return { kept, droppedCount: Math.max(0, sorted.length - kept.length) };
};

export const buildFrozenSources = (
  ratings: readonly NormalizedRating[],
): FrozenFeedbackSource[] =>
  ratings.map((rating, index) => {
    const source: FrozenFeedbackSource = {
      evidenceId: `src_${index + 1}`,
      kind: rating.kind,
      targetType: rating.targetType,
      targetId: rating.targetId,
      scoresJson: JSON.stringify(rating.scores),
    };
    if (rating.scenarioId !== undefined) {
      source.scenarioId = rating.scenarioId;
    }
    if (rating.nodeId !== undefined) {
      source.nodeId = rating.nodeId;
    }
    if (rating.contentVersion !== undefined) {
      source.contentVersion = rating.contentVersion;
    }
    if (
      typeof rating.comment === "string" &&
      rating.comment.trim().length > 0
    ) {
      source.comment = rating.comment;
    }
    return source;
  });

/** Stable serialization of filters so equivalent runs share a reportKey. */
export const canonicalFiltersJson = (
  filters: AnalyzeFeedbackFilters,
): string => {
  const ordered: Record<string, string | number> = {};
  const keys: (keyof AnalyzeFeedbackFilters)[] = [
    "contentVersion",
    "fromMicros",
    "toMicros",
    "scenarioId",
    "targetType",
    "targetId",
  ];
  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined) {
      ordered[key] = value;
    }
  }
  return JSON.stringify(ordered);
};

export const computeReportKey = (filters: AnalyzeFeedbackFilters): string =>
  sha256Hex(canonicalFiltersJson(filters));

export const computeSnapshotHash = (
  sources: readonly FrozenFeedbackSource[],
): string => sha256Hex(JSON.stringify(sources));
