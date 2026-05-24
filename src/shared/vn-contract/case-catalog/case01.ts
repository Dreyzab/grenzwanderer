import type { QuestArchetype, TriggerRule } from "../types";

export const CASE01_TRIGGER_RULES: TriggerRule[] = [
  {
    id: "trig.case01.newsboy_rumor",
    schemaVersion: 1,
    kindVersion: 1,
    status: "active",
    eventName: "case.entered",
    caseId: "case01_mainline",
    cooldownGroup: "case01.proc",
    budgetKey: "case01.proc.daily",
    generatedNamespace: "overlay.proc.case01.newsboy",
    allowedArchetypeIds: ["arch.case01.newsboy_rumor"],
    plannerConstraints: {
      districtIds: ["rail_hub"],
      poiCategories: ["PUBLIC"],
      resourceGates: [{ resourceId: "providence", spend: 1, optional: true }],
      tone: "street-level witness follow-up",
      durationWindow: { minSteps: 2, maxSteps: 3, timeBand: "day" },
      threatLevel: "low",
      rewardClass: "information",
    },
  },
];

export const CASE01_QUEST_ARCHETYPES: QuestArchetype[] = [
  {
    id: "arch.case01.newsboy_rumor",
    version: 1,
    kind: "rumor_followup",
    title: "Newsboy rumor follow-up",
    triggerRuleIds: ["trig.case01.newsboy_rumor"],
    stepNodeIds: [
      "scene_case01_hbf_newsboy_approach",
      "scene_case01_hbf_newsboy_handoff",
      "scene_case01_hbf_newsboy_release",
    ],
    plannerConstraints: {
      districtIds: ["rail_hub"],
      poiCategories: ["PUBLIC"],
      tone: "procedural empathy",
      durationWindow: { minSteps: 2, maxSteps: 3, timeBand: "day" },
      threatLevel: "low",
      rewardClass: "information",
    },
  },
];
