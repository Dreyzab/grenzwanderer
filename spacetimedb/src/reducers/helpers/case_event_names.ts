/**
 * Canonical case-event vocabulary emitted by gameplay paths. Trigger rules
 * (CASE_CATALOG) reference these names; keep additions here so authored
 * content and server emissions cannot drift apart.
 */
export const CASE_EVENT_NAMES = {
  caseEntered: "case.entered",
  questInstanceStepAdvanced: "quest_instance.step_advanced",
  questInstanceCompleted: "quest_instance.completed",
  mapInteracted: "map.interacted",
  mapPointDiscovered: "map.point_discovered",
  mapCodeRedeemed: "map.code_redeemed",
  rumorVerified: "rumor.verified",
  careerCriterionRecorded: "career.criterion_recorded",
  careerPromoted: "career.promoted",
} as const;

export type CaseEventName =
  (typeof CASE_EVENT_NAMES)[keyof typeof CASE_EVENT_NAMES];
