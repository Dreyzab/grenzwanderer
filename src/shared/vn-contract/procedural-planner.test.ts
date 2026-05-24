import { describe, expect, it } from "vitest";

import { validateQuestInstancePlan } from "./procedural-planner";
import type { QuestArchetype, QuestInstancePlan, TriggerRule } from "./types";

const triggerRule: TriggerRule = {
  id: "trig.case01.proc",
  schemaVersion: 1,
  kindVersion: 1,
  status: "active",
  eventName: "case.entered",
  caseId: "case01_mainline",
  generatedNamespace: "overlay.proc.case01.proc",
  allowedArchetypeIds: ["arch.case01.proc"],
  plannerConstraints: {
    districtIds: ["rail_hub"],
    poiCategories: ["PUBLIC"],
    resourceGates: [{ resourceId: "providence", spend: 1, optional: true }],
    tone: "street-level",
    durationWindow: { minSteps: 2, maxSteps: 3, timeBand: "day" },
    threatLevel: "low",
    rewardClass: "information",
  },
};

const archetype: QuestArchetype = {
  id: "arch.case01.proc",
  version: 1,
  kind: "rumor_followup",
  title: "Procedural rumor",
  triggerRuleIds: [triggerRule.id],
  stepNodeIds: ["scene_proc_hook", "scene_proc_resolution"],
};

const buildPlan = (
  overrides: Partial<QuestInstancePlan> = {},
): QuestInstancePlan => ({
  schemaVersion: 1,
  planId: "overlay.proc.case01.proc.instance.1",
  triggerRuleId: triggerRule.id,
  archetypeId: archetype.id,
  archetypeVersion: 1,
  generatedNamespace: triggerRule.generatedNamespace!,
  caseId: "case01_mainline",
  steps: [
    { id: "step_hook", blockKind: "hook", nodeId: "scene_proc_hook" },
    {
      id: "step_resolution",
      blockKind: "resolution",
      nodeId: "scene_proc_resolution",
    },
  ],
  rewardEffects: [
    { type: "track_event", eventName: "proc.case01.proc.completed" },
    {
      type: "set_flag",
      key: "overlay.proc.case01.proc.completed",
      value: true,
    },
  ],
  ...overrides,
});

describe("QuestInstancePlan validation", () => {
  it("accepts deterministic overlay plans from known trigger/archetype blocks", () => {
    const result = validateQuestInstancePlan(buildPlan(), {
      triggerRules: [triggerRule],
      questArchetypes: [archetype],
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects unknown nodes, wrong namespaces, and canon-mutating reward effects", () => {
    const result = validateQuestInstancePlan(
      buildPlan({
        generatedNamespace: "canon.case01.proc",
        steps: [
          { id: "step_bad", blockKind: "reveal", nodeId: "scene_missing" },
        ],
        rewardEffects: [
          { type: "set_flag", key: "case01_canon_complete", value: true },
        ],
      }),
      {
        triggerRules: [triggerRule],
        questArchetypes: [archetype],
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "quest_plan_namespace_mismatch",
        "quest_plan_invalid_generated_namespace",
        "quest_plan_step_not_in_archetype",
        "quest_plan_forbidden_reward_effect",
      ]),
    );
  });
});
