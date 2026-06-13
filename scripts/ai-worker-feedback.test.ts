import { describe, expect, it } from "vitest";

import { GeminiMalformedJsonError } from "./ai-worker-watch";
import { normalizeFeedbackAnalysisReport } from "./ai-worker-watch";
import type { FeedbackAnalysisReportV1 } from "../src/features/ai/contracts";

const validReport: FeedbackAnalysisReportV1 = {
  schemaVersion: "v1",
  coverageSummary: "Coverage of v1.0.0.",
  ratingStatsSummary: "Average 6.5.",
  strengths: [],
  thematicFindings: [
    {
      title: "Pacing drags",
      detail: "Several players note it drags.",
      severity: "medium",
      confidence: 0.7,
      affectedTargets: ["node_a"],
      quotes: [{ evidenceId: "src_1", text: "Слишком затянуто." }],
    },
  ],
  opinionSplits: [],
  dataGaps: [],
  followupQuestions: [],
};

describe("normalizeFeedbackAnalysisReport", () => {
  it("accepts a report whose quotes cite known evidence", () => {
    const report = normalizeFeedbackAnalysisReport(
      JSON.stringify(validReport),
      new Set(["src_1", "src_2"]),
    );
    expect(report.schemaVersion).toBe("v1");
  });

  it("rejects a report citing an unknown evidenceId", () => {
    expect(() =>
      normalizeFeedbackAnalysisReport(
        JSON.stringify(validReport),
        new Set(["src_2"]),
      ),
    ).toThrow(GeminiMalformedJsonError);
  });

  it("rejects a structurally invalid report", () => {
    expect(() =>
      normalizeFeedbackAnalysisReport(
        JSON.stringify({ schemaVersion: "v1" }),
        new Set(["src_1"]),
      ),
    ).toThrow(GeminiMalformedJsonError);
  });
});
