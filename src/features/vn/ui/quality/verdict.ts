export type ContentVerdict = "urgent_rework" | "rework" | "keep" | "unrated";

export const resolveOverallVerdict = (
  overallScore: number | undefined | null,
): ContentVerdict => {
  if (overallScore === undefined || overallScore === null) {
    return "unrated";
  }
  if (overallScore <= 3) {
    return "urgent_rework";
  }
  if (overallScore <= 7) {
    return "rework";
  }
  return "keep";
};

export const VERDICT_LABEL: Record<ContentVerdict, string> = {
  urgent_rework: "Срочная переделка",
  rework: "Доработать",
  keep: "Сохранить",
  unrated: "Без оценки",
};

export const VERDICT_COLOR: Record<ContentVerdict, string> = {
  urgent_rework: "#ef4444",
  rework: "#f59e0b",
  keep: "#22c55e",
  unrated: "#6b7280",
};

export type DialogueVerdict = "change" | "reconsider" | "keep" | "unrated";

export const resolveDialogueVerdict = (
  score: number | undefined | null,
): DialogueVerdict => {
  if (score === undefined || score === null) {
    return "unrated";
  }
  if (score <= 1) {
    return "change";
  }
  if (score <= 4) {
    return "reconsider";
  }
  return "keep";
};
