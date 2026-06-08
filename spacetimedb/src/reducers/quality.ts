import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import { emitTelemetry, ensurePlayerProfile } from "./helpers";

const CONTENT_RATING_TARGET_TYPES = [
  "node",
  "scene_group",
  "scenario",
  "case",
  "beat",
] as const;

type ContentRatingTargetType = (typeof CONTENT_RATING_TARGET_TYPES)[number];

const isContentRatingTargetType = (
  value: string,
): value is ContentRatingTargetType =>
  (CONTENT_RATING_TARGET_TYPES as readonly string[]).includes(value);

const assertNonEmpty = (value: string, label: string): void => {
  if (!value || value.trim().length === 0) {
    throw new SenderError(`${label} must not be empty`);
  }
};

const assertScoreInRange = (
  value: number | undefined,
  label: string,
  min: number,
  max: number,
): void => {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new SenderError(
      `${label} must be an integer between ${min} and ${max}`,
    );
  }
};

const normalizeOptionalText = (
  value: string | undefined,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const raterHexOf = (ctx: any): string =>
  (ctx.sender as { toHexString(): string }).toHexString();

const createContentRatingId = (
  raterHex: string,
  targetType: string,
  targetId: string,
): string => `${raterHex}:${targetType}:${targetId}`;

const createDialogueLineKey = (
  segmentIndex: number,
  speaker: string,
  textHash: string,
): string => `${segmentIndex}:${speaker}:${textHash}`;

const createDialogueRatingId = (
  raterHex: string,
  nodeId: string,
  lineKey: string,
): string => `${raterHex}:${nodeId}:${lineKey}`;

export const upsert_content_rating = spacetimedb.reducer(
  {
    targetType: t.string(),
    targetId: t.string(),
    scenarioId: t.string().optional(),
    contentVersion: t.string().optional(),
    visualScore: t.u32().optional(),
    scenicScore: t.u32().optional(),
    textScore: t.u32().optional(),
    overallScore: t.u32().optional(),
    comment: t.string().optional(),
  },
  (
    ctx,
    {
      targetType,
      targetId,
      scenarioId,
      contentVersion,
      visualScore,
      scenicScore,
      textScore,
      overallScore,
      comment,
    },
  ) => {
    assertNonEmpty(targetType, "targetType");
    assertNonEmpty(targetId, "targetId");
    if (!isContentRatingTargetType(targetType)) {
      throw new SenderError(`Unsupported targetType: ${targetType}`);
    }
    assertScoreInRange(visualScore, "visualScore", 1, 10);
    assertScoreInRange(scenicScore, "scenicScore", 1, 10);
    assertScoreInRange(textScore, "textScore", 1, 10);
    assertScoreInRange(overallScore, "overallScore", 1, 10);

    ensurePlayerProfile(ctx);

    const raterHex = raterHexOf(ctx);
    const ratingId = createContentRatingId(raterHex, targetType, targetId);
    const normalizedComment = normalizeOptionalText(comment);
    const normalizedScenarioId = normalizeOptionalText(scenarioId);
    const normalizedContentVersion = normalizeOptionalText(contentVersion);

    const existing = ctx.db.contentRating.ratingId.find(ratingId);
    if (existing) {
      ctx.db.contentRating.ratingId.update({
        ...existing,
        scenarioId: normalizedScenarioId,
        contentVersion: normalizedContentVersion,
        visualScore,
        scenicScore,
        textScore,
        overallScore,
        comment: normalizedComment,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.contentRating.insert({
        ratingId,
        raterId: ctx.sender,
        targetType,
        targetId,
        scenarioId: normalizedScenarioId,
        contentVersion: normalizedContentVersion,
        visualScore,
        scenicScore,
        textScore,
        overallScore,
        comment: normalizedComment,
        createdAt: ctx.timestamp,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "content_rating_upserted", {
      targetType,
      targetId,
      overallScore: overallScore ?? null,
    });
  },
);

export const delete_content_rating = spacetimedb.reducer(
  {
    targetType: t.string(),
    targetId: t.string(),
  },
  (ctx, { targetType, targetId }) => {
    assertNonEmpty(targetType, "targetType");
    assertNonEmpty(targetId, "targetId");

    const ratingId = createContentRatingId(
      raterHexOf(ctx),
      targetType,
      targetId,
    );
    const existing = ctx.db.contentRating.ratingId.find(ratingId);
    if (existing) {
      ctx.db.contentRating.ratingId.delete(ratingId);
      emitTelemetry(ctx, "content_rating_deleted", { targetType, targetId });
    }
  },
);

export const upsert_dialogue_rating = spacetimedb.reducer(
  {
    nodeId: t.string(),
    scenarioId: t.string().optional(),
    segmentIndex: t.u32(),
    speaker: t.string(),
    textHash: t.string(),
    contentVersion: t.string().optional(),
    score: t.u32(),
    comment: t.string().optional(),
  },
  (
    ctx,
    {
      nodeId,
      scenarioId,
      segmentIndex,
      speaker,
      textHash,
      contentVersion,
      score,
      comment,
    },
  ) => {
    assertNonEmpty(nodeId, "nodeId");
    assertNonEmpty(speaker, "speaker");
    assertNonEmpty(textHash, "textHash");
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new SenderError("score must be an integer between 1 and 5");
    }

    ensurePlayerProfile(ctx);

    const raterHex = raterHexOf(ctx);
    const lineKey = createDialogueLineKey(segmentIndex, speaker, textHash);
    const ratingId = createDialogueRatingId(raterHex, nodeId, lineKey);
    const normalizedScenarioId = normalizeOptionalText(scenarioId);
    const normalizedContentVersion = normalizeOptionalText(contentVersion);
    const normalizedComment = normalizeOptionalText(comment);

    const existing = ctx.db.dialogueRating.ratingId.find(ratingId);
    if (existing) {
      ctx.db.dialogueRating.ratingId.update({
        ...existing,
        scenarioId: normalizedScenarioId,
        speaker,
        segmentIndex,
        textHash,
        lineKey,
        contentVersion: normalizedContentVersion,
        score,
        comment: normalizedComment,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.dialogueRating.insert({
        ratingId,
        raterId: ctx.sender,
        nodeId,
        scenarioId: normalizedScenarioId,
        lineKey,
        speaker,
        segmentIndex,
        textHash,
        contentVersion: normalizedContentVersion,
        score,
        comment: normalizedComment,
        createdAt: ctx.timestamp,
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "dialogue_rating_upserted", {
      nodeId,
      lineKey,
      score,
    });
  },
);

export const delete_dialogue_rating = spacetimedb.reducer(
  {
    nodeId: t.string(),
    segmentIndex: t.u32(),
    speaker: t.string(),
    textHash: t.string(),
  },
  (ctx, { nodeId, segmentIndex, speaker, textHash }) => {
    assertNonEmpty(nodeId, "nodeId");

    const lineKey = createDialogueLineKey(segmentIndex, speaker, textHash);
    const ratingId = createDialogueRatingId(raterHexOf(ctx), nodeId, lineKey);
    const existing = ctx.db.dialogueRating.ratingId.find(ratingId);
    if (existing) {
      ctx.db.dialogueRating.ratingId.delete(ratingId);
      emitTelemetry(ctx, "dialogue_rating_deleted", { nodeId, lineKey });
    }
  },
);
