import { Timestamp } from "spacetimedb";
import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  emitTelemetry,
  ensureAdminIdentity,
  ensureIdempotent,
} from "./helpers";
import { AI_REQUEST_STATUS_PENDING, AI_ANALYZE_FEEDBACK_KIND } from "./aiQueue";
import {
  type AnalyzeFeedbackPayload,
  type FeedbackOutputLanguage,
} from "../../../src/features/ai/contracts";
import { sha256Hex } from "./helpers/crypto";
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
} from "./helpers/feedback_analysis";

const MAX_DEVELOPER_NOTE_LENGTH = 4000;

const optStr = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }
  return undefined;
};

const optNum = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof value === "object" && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (
      tagged.tag === "some" &&
      typeof tagged.value === "number" &&
      Number.isFinite(tagged.value)
    ) {
      return tagged.value;
    }
  }
  return undefined;
};

const microsOf = (timestamp: unknown): number => {
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "microsSinceUnixEpoch" in timestamp
  ) {
    const micros = (timestamp as { microsSinceUnixEpoch: bigint })
      .microsSinceUnixEpoch;
    return Number(micros);
  }
  return 0;
};

const hexOf = (identity: unknown): string =>
  identity && typeof identity === "object" && "toHexString" in identity
    ? (identity as { toHexString(): string }).toHexString()
    : String(identity);

const isOutputLanguage = (value: string): value is FeedbackOutputLanguage =>
  value === "en" || value === "ru" || value === "de";

const requireOutputLanguage = (value: string): FeedbackOutputLanguage => {
  if (!isOutputLanguage(value)) {
    throw new SenderError("outputLanguage must be one of en, ru, de");
  }
  return value;
};

const normalizeContentRow = (row: any): NormalizedRating => {
  const scores: Record<string, number | string> = {};
  const visual = optNum(row.visualScore);
  if (visual !== undefined) {
    scores.visualScore = visual;
  }
  const scenic = optNum(row.scenicScore);
  if (scenic !== undefined) {
    scores.scenicScore = scenic;
  }
  const text = optNum(row.textScore);
  if (text !== undefined) {
    scores.textScore = text;
  }
  const overall = optNum(row.overallScore);
  if (overall !== undefined) {
    scores.overallScore = overall;
  }
  return {
    kind: "content",
    targetType: row.targetType,
    targetId: row.targetId,
    scenarioId: optStr(row.scenarioId),
    contentVersion: optStr(row.contentVersion),
    createdAtMicros: microsOf(row.createdAt),
    comment: optStr(row.comment),
    scores,
    raterHex: hexOf(row.raterId),
  };
};

const normalizeDialogueRow = (row: any): NormalizedRating => ({
  kind: "dialogue",
  targetType: "node",
  targetId: row.nodeId,
  scenarioId: optStr(row.scenarioId),
  nodeId: row.nodeId,
  contentVersion: optStr(row.contentVersion),
  createdAtMicros: microsOf(row.createdAt),
  comment: optStr(row.comment),
  scores: {
    score: row.score,
    speaker: row.speaker,
    segmentIndex: row.segmentIndex,
    lineKey: row.lineKey,
  },
  raterHex: hexOf(row.raterId),
});

const countReportsWithKey = (ctx: any, reportKey: string): number => {
  let count = 0;
  for (const _ of ctx.db.feedbackAnalysisReport.feedback_analysis_report_report_key.filter(
    reportKey,
  )) {
    count += 1;
  }
  return count;
};

// Snapshot the matching ratings, persist the report + frozen sources, and
// enqueue the analyze_feedback AI request. Callers handle admin + idempotency.
const performFeedbackRun = (
  ctx: any,
  aiRequestId: string,
  filtersJson: string,
  outputLanguageRaw: string,
): { reportId: bigint; sourceCount: number; droppedCount: number } => {
  const outputLanguage = requireOutputLanguage(outputLanguageRaw);
  const filters = parseFeedbackFiltersJson(filtersJson);

  const matched: NormalizedRating[] = [];
  for (const row of ctx.db.contentRating.iter()) {
    const normalized = normalizeContentRow(row);
    if (ratingMatchesFilters(normalized, filters)) {
      matched.push(normalized);
    }
  }
  for (const row of ctx.db.dialogueRating.iter()) {
    const normalized = normalizeDialogueRow(row);
    if (ratingMatchesFilters(normalized, filters)) {
      matched.push(normalized);
    }
  }

  const { kept, droppedCount } = capRatings(matched);
  const sources = buildFrozenSources(kept);
  const ratingStats = computeRatingStats(kept);
  const reportKey = computeReportKey(filters);
  const snapshotHash = computeSnapshotHash(sources);
  const version = countReportsWithKey(ctx, reportKey) + 1;

  const reportRow = ctx.db.feedbackAnalysisReport.insert({
    reportId: 0n,
    reportKey,
    version,
    requestedBy: ctx.sender,
    filtersJson: canonicalFiltersJson(filters),
    outputLanguage,
    status: "pending",
    reviewState: "unreviewed",
    snapshotHash,
    sourceCount: kept.length,
    aiRequestId: undefined,
    resultJson: undefined,
    developerNote: undefined,
    aiMetaJson: undefined,
    error: undefined,
    createdAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });
  const reportId = reportRow.reportId;

  kept.forEach((rating, index) => {
    const source = sources[index];
    ctx.db.feedbackAnalysisSource.insert({
      sourceId: 0n,
      reportId,
      evidenceId: source.evidenceId,
      kind: source.kind,
      targetType: source.targetType,
      targetId: source.targetId,
      scenarioId: source.scenarioId,
      nodeId: source.nodeId,
      contentVersion: source.contentVersion,
      raterHash: sha256Hex(rating.raterHex),
      scoresJson: source.scoresJson,
      comment: source.comment,
      ratedAt: new Timestamp(BigInt(Math.trunc(rating.createdAtMicros))),
    });
  });

  const payload: AnalyzeFeedbackPayload = {
    source: "feedback_center",
    reportId: reportId.toString(),
    outputLanguage,
    filters,
    snapshotHash,
    ratingStats,
    sources,
  };

  const aiRow = ctx.db.aiRequest.insert({
    id: 0n,
    playerId: ctx.sender,
    requestId: `feedback_${aiRequestId}`,
    kind: AI_ANALYZE_FEEDBACK_KIND,
    payloadJson: JSON.stringify(payload),
    status: AI_REQUEST_STATUS_PENDING,
    responseJson: undefined,
    error: undefined,
    attemptCount: 0,
    claimedBy: undefined,
    claimToken: undefined,
    claimedAt: undefined,
    leaseExpiresAt: undefined,
    nextRetryAt: undefined,
    createdAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });

  ctx.db.feedbackAnalysisReport.reportId.update({
    ...reportRow,
    aiRequestId: aiRow.id,
    updatedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "feedback_analysis_started", {
    reportId: reportId.toString(),
    version,
    sourceCount: kept.length,
    droppedCount,
    outputLanguage,
  });

  return { reportId, sourceCount: kept.length, droppedCount };
};

export const run_feedback_analysis = spacetimedb.reducer(
  {
    requestId: t.string(),
    filtersJson: t.string(),
    outputLanguage: t.string(),
  },
  (ctx, { requestId, filtersJson, outputLanguage }) => {
    ensureAdminIdentity(ctx, "run feedback analysis");
    ensureIdempotent(ctx, requestId, "run_feedback_analysis");
    performFeedbackRun(ctx, requestId, filtersJson, outputLanguage);
  },
);

export const reanalyze_feedback_report = spacetimedb.reducer(
  {
    requestId: t.string(),
    reportId: t.u64(),
  },
  (ctx, { requestId, reportId }) => {
    ensureAdminIdentity(ctx, "reanalyze a feedback report");
    ensureIdempotent(ctx, requestId, "reanalyze_feedback_report");
    const existing = ctx.db.feedbackAnalysisReport.reportId.find(reportId);
    if (!existing) {
      throw new SenderError("feedback report not found");
    }
    performFeedbackRun(
      ctx,
      requestId,
      existing.filtersJson,
      existing.outputLanguage,
    );
  },
);

export const mark_feedback_report_reviewed = spacetimedb.reducer(
  {
    reportId: t.u64(),
  },
  (ctx, { reportId }) => {
    ensureAdminIdentity(ctx, "review a feedback report");
    const existing = ctx.db.feedbackAnalysisReport.reportId.find(reportId);
    if (!existing) {
      throw new SenderError("feedback report not found");
    }
    ctx.db.feedbackAnalysisReport.reportId.update({
      ...existing,
      reviewState: "reviewed",
      updatedAt: ctx.timestamp,
    });
    emitTelemetry(ctx, "feedback_report_reviewed", {
      reportId: reportId.toString(),
    });
  },
);

export const save_feedback_report_note = spacetimedb.reducer(
  {
    reportId: t.u64(),
    note: t.string(),
  },
  (ctx, { reportId, note }) => {
    ensureAdminIdentity(ctx, "annotate a feedback report");
    if (note.length > MAX_DEVELOPER_NOTE_LENGTH) {
      throw new SenderError(
        `note must be at most ${MAX_DEVELOPER_NOTE_LENGTH} characters`,
      );
    }
    const existing = ctx.db.feedbackAnalysisReport.reportId.find(reportId);
    if (!existing) {
      throw new SenderError("feedback report not found");
    }
    const trimmed = note.trim();
    ctx.db.feedbackAnalysisReport.reportId.update({
      ...existing,
      developerNote: trimmed.length > 0 ? trimmed : undefined,
      updatedAt: ctx.timestamp,
    });
    emitTelemetry(ctx, "feedback_report_note_saved", {
      reportId: reportId.toString(),
    });
  },
);
