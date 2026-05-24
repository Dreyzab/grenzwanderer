import { describe, expect, it, vi } from "vitest";

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import type {
  CaseEventEnvelope,
  TriggerRule,
} from "../../../../src/shared/vn-contract";
import { createReducerTestContext } from "./__tests__/serverTestContext";
import { evaluateTriggerRule, evaluateTriggerRules } from "./trigger_engine";
import { upsertFlag } from "./player";

const buildEvent = (
  overrides: Partial<Pick<CaseEventEnvelope, "eventName" | "scope">> = {},
): Pick<CaseEventEnvelope, "eventName" | "scope"> => ({
  eventName: "case.entered",
  scope: {
    caseId: "case01_mainline",
    scenarioId: "case01_hbf_arrival",
    nodeId: "scene_case01_hbf_departure",
  },
  ...overrides,
});

const buildRule = (overrides: Partial<TriggerRule> = {}): TriggerRule => ({
  id: "trig.case01.rumor_followup",
  schemaVersion: 1,
  kindVersion: 1,
  status: "active",
  eventName: "case.entered",
  caseId: "case01_mainline",
  cooldownGroup: "case01.proc",
  budgetKey: "case01.proc.daily",
  generatedNamespace: "overlay.proc.case01",
  allowedArchetypeIds: ["arch.rumor_followup"],
  ...overrides,
});

describe("trigger engine", () => {
  it("accepts active rules matching the event, case scope, guards, cooldown, and budget", () => {
    const ctx = createReducerTestContext();

    const result = evaluateTriggerRule(ctx, buildRule(), buildEvent(), {
      remainingBudgets: { "case01.proc.daily": 1 },
    });

    expect(result).toEqual({
      eligible: true,
      ruleId: "trig.case01.rumor_followup",
      eventName: "case.entered",
      generatedNamespace: "overlay.proc.case01",
      allowedArchetypeIds: ["arch.rumor_followup"],
    });
  });

  it("skips inactive, mismatched, cooling down, and exhausted rules", () => {
    const ctx = createReducerTestContext();
    const event = buildEvent();

    expect(
      evaluateTriggerRule(ctx, buildRule({ status: "paused" }), event),
    ).toMatchObject({ eligible: false, reason: "rule_inactive" });
    expect(
      evaluateTriggerRule(
        ctx,
        buildRule({ eventName: "choice.recorded" }),
        event,
      ),
    ).toMatchObject({ eligible: false, reason: "event_name_mismatch" });
    expect(
      evaluateTriggerRule(ctx, buildRule({ caseId: "case02" }), event),
    ).toMatchObject({ eligible: false, reason: "case_scope_mismatch" });
    expect(
      evaluateTriggerRule(ctx, buildRule(), event, {
        activeCooldownGroups: new Set(["case01.proc"]),
      }),
    ).toMatchObject({ eligible: false, reason: "cooldown_active" });
    expect(
      evaluateTriggerRule(ctx, buildRule(), event, {
        remainingBudgets: { "case01.proc.daily": 0 },
      }),
    ).toMatchObject({ eligible: false, reason: "budget_exhausted" });
  });

  it("uses existing VN conditions as deterministic guards", () => {
    const ctx = createReducerTestContext();
    const rule = buildRule({
      conditions: [
        { type: "flag_equals", key: "case01_onboarding_complete", value: true },
      ],
    });

    expect(evaluateTriggerRule(ctx, rule, buildEvent())).toMatchObject({
      eligible: false,
      reason: "conditions_failed",
    });

    upsertFlag(ctx, "case01_onboarding_complete", true);
    expect(evaluateTriggerRule(ctx, rule, buildEvent())).toMatchObject({
      eligible: true,
    });
  });

  it("evaluates catalogs without applying world mutations", () => {
    const ctx = createReducerTestContext();
    const results = evaluateTriggerRules(
      ctx,
      [
        buildRule(),
        buildRule({ id: "trig.other", eventName: "choice.recorded" }),
      ],
      buildEvent(),
    );

    expect(results).toEqual([
      expect.objectContaining({
        eligible: true,
        ruleId: "trig.case01.rumor_followup",
      }),
      expect.objectContaining({
        eligible: false,
        ruleId: "trig.other",
        reason: "event_name_mismatch",
      }),
    ]);
  });
});
