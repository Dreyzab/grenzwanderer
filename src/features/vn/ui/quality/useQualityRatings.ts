import { useCallback, useMemo } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import {
  reducers,
  tables,
  type ContentRating,
  type DialogueRating,
} from "../../../../shared/spacetime/bindings";
import type { DialogueLineKey } from "./lineKey";

export type ContentRatingTargetType =
  | "node"
  | "scene_group"
  | "scenario"
  | "case"
  | "beat";

export interface ContentRatingInput {
  targetType: ContentRatingTargetType;
  targetId: string;
  scenarioId?: string;
  contentVersion?: string;
  visualScore?: number;
  scenicScore?: number;
  textScore?: number;
  overallScore?: number;
  comment?: string;
}

export interface DialogueRatingInput {
  nodeId: string;
  scenarioId?: string;
  line: DialogueLineKey;
  contentVersion?: string;
  score: number;
  comment?: string;
}

export interface QualityRatings {
  contentRatings: readonly ContentRating[];
  dialogueRatings: readonly DialogueRating[];
  getContentRating: (
    targetType: ContentRatingTargetType,
    targetId: string,
  ) => ContentRating | undefined;
  getDialogueRating: (
    nodeId: string,
    lineKey: string,
  ) => DialogueRating | undefined;
  submitContentRating: (input: ContentRatingInput) => Promise<void>;
  removeContentRating: (
    targetType: ContentRatingTargetType,
    targetId: string,
  ) => Promise<void>;
  submitDialogueRating: (input: DialogueRatingInput) => Promise<void>;
  removeDialogueRating: (
    nodeId: string,
    line: DialogueLineKey,
  ) => Promise<void>;
}

export const useQualityRatings = (): QualityRatings => {
  const [contentRatings] = useTable(tables.myContentRatings);
  const [dialogueRatings] = useTable(tables.myDialogueRatings);

  const upsertContentRating = useReducer(reducers.upsertContentRating);
  const deleteContentRating = useReducer(reducers.deleteContentRating);
  const upsertDialogueRating = useReducer(reducers.upsertDialogueRating);
  const deleteDialogueRating = useReducer(reducers.deleteDialogueRating);

  const contentByTarget = useMemo(() => {
    const map = new Map<string, ContentRating>();
    for (const row of contentRatings) {
      map.set(`${row.targetType}:${row.targetId}`, row);
    }
    return map;
  }, [contentRatings]);

  const dialogueByKey = useMemo(() => {
    const map = new Map<string, DialogueRating>();
    for (const row of dialogueRatings) {
      map.set(`${row.nodeId}:${row.lineKey}`, row);
    }
    return map;
  }, [dialogueRatings]);

  const getContentRating = useCallback(
    (targetType: ContentRatingTargetType, targetId: string) =>
      contentByTarget.get(`${targetType}:${targetId}`),
    [contentByTarget],
  );

  const getDialogueRating = useCallback(
    (nodeId: string, lineKey: string) =>
      dialogueByKey.get(`${nodeId}:${lineKey}`),
    [dialogueByKey],
  );

  const submitContentRating = useCallback(
    async (input: ContentRatingInput) => {
      await upsertContentRating({
        targetType: input.targetType,
        targetId: input.targetId,
        scenarioId: input.scenarioId,
        contentVersion: input.contentVersion,
        visualScore: input.visualScore,
        scenicScore: input.scenicScore,
        textScore: input.textScore,
        overallScore: input.overallScore,
        comment: input.comment,
      });
    },
    [upsertContentRating],
  );

  const removeContentRating = useCallback(
    async (targetType: ContentRatingTargetType, targetId: string) => {
      await deleteContentRating({ targetType, targetId });
    },
    [deleteContentRating],
  );

  const submitDialogueRating = useCallback(
    async (input: DialogueRatingInput) => {
      await upsertDialogueRating({
        nodeId: input.nodeId,
        scenarioId: input.scenarioId,
        segmentIndex: input.line.segmentIndex,
        speaker: input.line.speaker,
        textHash: input.line.textHash,
        contentVersion: input.contentVersion,
        score: input.score,
        comment: input.comment,
      });
    },
    [upsertDialogueRating],
  );

  const removeDialogueRating = useCallback(
    async (nodeId: string, line: DialogueLineKey) => {
      await deleteDialogueRating({
        nodeId,
        segmentIndex: line.segmentIndex,
        speaker: line.speaker,
        textHash: line.textHash,
      });
    },
    [deleteDialogueRating],
  );

  return {
    contentRatings,
    dialogueRatings,
    getContentRating,
    getDialogueRating,
    submitContentRating,
    removeContentRating,
    submitDialogueRating,
    removeDialogueRating,
  };
};
