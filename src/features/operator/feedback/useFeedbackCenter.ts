import { useCallback } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import {
  reducers,
  tables,
  type ContentVersion,
  type FeedbackAnalysisReport,
  type FeedbackAnalysisSource,
} from "../../../shared/spacetime/bindings";
import type { FeedbackOutputLanguage } from "../../ai/contracts";

export interface FeedbackRunInput {
  contentVersion?: string;
  fromMicros?: number;
  toMicros?: number;
  scenarioId?: string;
  targetType?: string;
  targetId?: string;
  outputLanguage: FeedbackOutputLanguage;
}

const newRequestId = (scope: string): string => {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `operator_${scope}_${suffix}`;
};

const buildFiltersJson = (input: FeedbackRunInput): string => {
  const filters: Record<string, string | number> = {};
  if (input.contentVersion) {
    filters.contentVersion = input.contentVersion;
  }
  if (input.fromMicros !== undefined) {
    filters.fromMicros = input.fromMicros;
  }
  if (input.toMicros !== undefined) {
    filters.toMicros = input.toMicros;
  }
  if (input.scenarioId) {
    filters.scenarioId = input.scenarioId;
  }
  if (input.targetType) {
    filters.targetType = input.targetType;
  }
  if (input.targetId) {
    filters.targetId = input.targetId;
  }
  return JSON.stringify(filters);
};

export interface FeedbackCenter {
  reports: readonly FeedbackAnalysisReport[];
  sources: readonly FeedbackAnalysisSource[];
  contentVersions: readonly ContentVersion[];
  runAnalysis: (input: FeedbackRunInput) => Promise<void>;
  reanalyze: (reportId: bigint) => Promise<void>;
  markReviewed: (reportId: bigint) => Promise<void>;
  saveNote: (reportId: bigint, note: string) => Promise<void>;
}

export const useFeedbackCenter = (): FeedbackCenter => {
  const [reports] = useTable(tables.feedbackReports);
  const [sources] = useTable(tables.feedbackReportSources);
  const [contentVersions] = useTable(tables.contentVersion);

  const runFeedbackAnalysis = useReducer(reducers.runFeedbackAnalysis);
  const reanalyzeFeedbackReport = useReducer(reducers.reanalyzeFeedbackReport);
  const markFeedbackReportReviewed = useReducer(
    reducers.markFeedbackReportReviewed,
  );
  const saveFeedbackReportNote = useReducer(reducers.saveFeedbackReportNote);

  const runAnalysis = useCallback(
    async (input: FeedbackRunInput) => {
      await runFeedbackAnalysis({
        requestId: newRequestId("run"),
        filtersJson: buildFiltersJson(input),
        outputLanguage: input.outputLanguage,
      });
    },
    [runFeedbackAnalysis],
  );

  const reanalyze = useCallback(
    async (reportId: bigint) => {
      await reanalyzeFeedbackReport({
        requestId: newRequestId("reanalyze"),
        reportId,
      });
    },
    [reanalyzeFeedbackReport],
  );

  const markReviewed = useCallback(
    async (reportId: bigint) => {
      await markFeedbackReportReviewed({ reportId });
    },
    [markFeedbackReportReviewed],
  );

  const saveNote = useCallback(
    async (reportId: bigint, note: string) => {
      await saveFeedbackReportNote({ reportId, note });
    },
    [saveFeedbackReportNote],
  );

  return {
    reports,
    sources,
    contentVersions,
    runAnalysis,
    reanalyze,
    markReviewed,
    saveNote,
  };
};
