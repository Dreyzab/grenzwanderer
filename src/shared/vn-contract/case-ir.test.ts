import { describe, expect, it } from "vitest";

import { buildCaseIrFromSnapshot, validateCaseIr } from "./case-ir";
import type { QuestArchetype, TriggerRule, VnSnapshot } from "./types";

const buildSnapshot = (overrides: Partial<VnSnapshot> = {}): VnSnapshot => ({
  schemaVersion: 9,
  scenarios: [
    {
      id: "case01_entry",
      title: "Entry",
      startNodeId: "node_start",
      nodeIds: ["node_start", "node_terminal"],
      packId: "case01_mainline",
    },
  ],
  nodes: [
    {
      id: "node_start",
      scenarioId: "case01_entry",
      title: "Start",
      body: "Start body.",
      choices: [
        {
          id: "continue",
          text: "Continue",
          nextNodeId: "node_terminal",
          visibleIfAll: [{ type: "flag_equals", key: "ready", value: true }],
          effects: [{ type: "set_flag", key: "continued", value: true }],
          skillCheck: {
            id: "notice_detail",
            voiceId: "logic",
            difficulty: 10,
            onSuccess: {
              nextNodeId: "node_terminal",
              effects: [{ type: "grant_xp", amount: 1 }],
            },
          },
        },
      ],
    },
    {
      id: "node_terminal",
      scenarioId: "case01_entry",
      title: "Terminal",
      body: "Terminal body.",
      terminal: true,
      choices: [],
    },
  ],
  ...overrides,
});

describe("Case IR validation", () => {
  it("builds a normalized IR from the current VN snapshot shape", () => {
    const caseIr = buildCaseIrFromSnapshot(buildSnapshot(), {
      bundleChecksum: "abc123",
    });

    expect(caseIr.cases).toHaveLength(1);
    expect(caseIr.cases[0]?.id).toBe("case01_mainline");
    expect(caseIr.choices).toHaveLength(1);
    expect(caseIr.conditions).toHaveLength(1);
    expect(caseIr.effects).toHaveLength(2);
    expect(caseIr.skillChecks).toHaveLength(1);
    expect(caseIr.triggerRules).toEqual([]);
    expect(caseIr.questArchetypes).toEqual([]);
    expect(validateCaseIr(caseIr).ok).toBe(true);
  });

  it("catches orphan, unreachable, dead-end, and broken-target nodes", () => {
    const caseIr = buildCaseIrFromSnapshot(
      buildSnapshot({
        scenarios: [
          {
            id: "case01_entry",
            title: "Entry",
            startNodeId: "node_start",
            nodeIds: ["node_start", "node_terminal", "node_unreachable"],
          },
        ],
        nodes: [
          {
            id: "node_start",
            scenarioId: "case01_entry",
            title: "Start",
            body: "Start body.",
            choices: [
              {
                id: "broken",
                text: "Broken",
                nextNodeId: "node_missing",
              },
            ],
          },
          {
            id: "node_terminal",
            scenarioId: "case01_entry",
            title: "Terminal",
            body: "Terminal body.",
            terminal: true,
            choices: [],
          },
          {
            id: "node_unreachable",
            scenarioId: "case01_entry",
            title: "Unreachable",
            body: "Unreachable body.",
            choices: [],
          },
          {
            id: "node_orphan",
            scenarioId: "case01_entry",
            title: "Orphan",
            body: "Orphan body.",
            terminal: true,
            choices: [],
          },
        ],
      }),
    );

    const result = validateCaseIr(caseIr);
    const codes = result.issues.map((issue) => issue.code);

    expect(result.ok).toBe(false);
    expect(codes).toContain("missing_choice_target");
    expect(codes).toContain("dead_end_node");
    expect(codes).toContain("orphan_node");
    expect(codes).toContain("unreachable_node");
  });

  it("normalizes and validates an authored trigger/archetype catalog", () => {
    const triggerRule: TriggerRule = {
      id: "trig.case01.entry",
      schemaVersion: 1,
      kindVersion: 1,
      status: "active",
      eventName: "case.entered",
      caseId: "case01_mainline",
      generatedNamespace: "overlay.proc.case01.entry",
      allowedArchetypeIds: ["arch.case01.entry"],
      plannerConstraints: {
        districtIds: ["rail_hub"],
        poiCategories: ["PUBLIC"],
        resourceGates: [{ resourceId: "providence", spend: 1 }],
        tone: "street lead",
        durationWindow: { minSteps: 2, maxSteps: 3, timeBand: "day" },
        threatLevel: "low",
        rewardClass: "information",
      },
    };
    const questArchetype: QuestArchetype = {
      id: "arch.case01.entry",
      version: 1,
      kind: "rumor_followup",
      title: "Entry rumor",
      triggerRuleIds: ["trig.case01.entry"],
      stepNodeIds: ["node_terminal"],
      plannerConstraints: {
        districtIds: ["rail_hub"],
        poiCategories: ["PUBLIC"],
        tone: "procedural empathy",
        durationWindow: { minSteps: 2, maxSteps: 3 },
        threatLevel: "low",
        rewardClass: "information",
      },
    };

    const caseIr = buildCaseIrFromSnapshot(
      buildSnapshot(),
      {},
      {
        triggerRules: [triggerRule],
        questArchetypes: [questArchetype],
      },
    );

    expect(caseIr.triggerRules).toHaveLength(1);
    expect(caseIr.questArchetypes).toHaveLength(1);
    expect(caseIr.triggerRules[0]?.plannerConstraints).toEqual(
      triggerRule.plannerConstraints,
    );
    expect(caseIr.questArchetypes[0]?.plannerConstraints).toEqual(
      questArchetype.plannerConstraints,
    );
    expect(caseIr.triggerRules[0]?.plannerConstraints).not.toBe(
      triggerRule.plannerConstraints,
    );
    expect(validateCaseIr(caseIr).ok).toBe(true);
  });

  it("requires generated quest trigger rules to use overlay.proc namespaces", () => {
    const caseIr = buildCaseIrFromSnapshot(
      buildSnapshot(),
      {},
      {
        triggerRules: [
          {
            id: "trig.case01.entry",
            schemaVersion: 1,
            kindVersion: 1,
            status: "active",
            eventName: "case.entered",
            caseId: "case01_mainline",
            allowedArchetypeIds: ["arch.case01.entry"],
          },
        ],
        questArchetypes: [
          {
            id: "arch.case01.entry",
            version: 1,
            kind: "rumor_followup",
            title: "Entry rumor",
            triggerRuleIds: ["trig.case01.entry"],
            stepNodeIds: ["node_terminal"],
          },
        ],
      },
    );

    const result = validateCaseIr(caseIr);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "trigger_rule_invalid_generated_namespace",
    );
  });

  it("allows only overlay-scoped reward effects for generated quest archetypes", () => {
    const validCaseIr = buildCaseIrFromSnapshot(
      buildSnapshot(),
      {},
      {
        triggerRules: [
          {
            id: "trig.case01.entry",
            schemaVersion: 1,
            kindVersion: 1,
            status: "active",
            eventName: "case.entered",
            caseId: "case01_mainline",
            generatedNamespace: "overlay.proc.case01.entry",
            allowedArchetypeIds: ["arch.case01.entry"],
          },
        ],
        questArchetypes: [
          {
            id: "arch.case01.entry",
            version: 1,
            kind: "rumor_followup",
            title: "Entry rumor",
            triggerRuleIds: ["trig.case01.entry"],
            stepNodeIds: ["node_terminal"],
            rewardEffects: [
              { type: "track_event", eventName: "proc.entry.completed" },
              {
                type: "set_flag",
                key: "overlay.proc.case01.entry.completed",
                value: true,
              },
              {
                type: "set_var",
                key: "overlay.proc.case01.entry.score",
                value: 1,
              },
              {
                type: "add_var",
                key: "overlay.proc.case01.entry.score",
                value: 1,
              },
            ],
          },
        ],
      },
    );

    expect(validateCaseIr(validCaseIr).ok).toBe(true);

    const invalidCaseIr = buildCaseIrFromSnapshot(
      buildSnapshot(),
      {},
      {
        triggerRules: [
          {
            id: "trig.case01.entry",
            schemaVersion: 1,
            kindVersion: 1,
            status: "active",
            eventName: "case.entered",
            caseId: "case01_mainline",
            generatedNamespace: "overlay.proc.case01.entry",
            allowedArchetypeIds: ["arch.case01.entry"],
          },
        ],
        questArchetypes: [
          {
            id: "arch.case01.entry",
            version: 1,
            kind: "rumor_followup",
            title: "Entry rumor",
            triggerRuleIds: ["trig.case01.entry"],
            stepNodeIds: ["node_terminal"],
            rewardEffects: [
              {
                type: "set_flag",
                key: "canon.case01.completed",
                value: true,
              },
              { type: "grant_item", itemId: "item_warrant", quantity: 1 },
            ],
          },
        ],
      },
    );
    const result = validateCaseIr(invalidCaseIr);

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "quest_archetype_forbidden_reward_effect",
        "quest_archetype_forbidden_reward_effect",
      ]),
    );
  });

  it("flags trigger/archetype catalog with broken cross-references", () => {
    const caseIr = buildCaseIrFromSnapshot(
      buildSnapshot(),
      {},
      {
        triggerRules: [
          {
            id: "trig.bad.case",
            schemaVersion: 1,
            kindVersion: 1,
            status: "active",
            eventName: "case.entered",
            caseId: "case_missing",
            allowedArchetypeIds: ["arch.missing"],
          },
          {
            id: "trig.bad.case",
            schemaVersion: 1,
            kindVersion: 1,
            status: "active",
            eventName: "case.entered",
          },
        ],
        questArchetypes: [
          {
            id: "arch.bad.steps",
            version: 1,
            kind: "rumor_followup",
            title: "Bad archetype",
            triggerRuleIds: ["trig.missing"],
            stepNodeIds: ["node_missing"],
          },
          {
            id: "arch.bad.empty",
            version: 1,
            kind: "rumor_followup",
            title: "Empty archetype",
            triggerRuleIds: [],
            stepNodeIds: [],
          },
        ],
      },
    );

    const result = validateCaseIr(caseIr);
    const codes = result.issues.map((issue) => issue.code);

    expect(result.ok).toBe(false);
    expect(codes).toContain("duplicate_trigger_rule_id");
    expect(codes).toContain("trigger_rule_unknown_case");
    expect(codes).toContain("trigger_rule_unknown_archetype");
    expect(codes).toContain("quest_archetype_unknown_trigger_rule");
    expect(codes).toContain("quest_archetype_missing_step_node");
    expect(codes).toContain("quest_archetype_no_steps");
  });
});
