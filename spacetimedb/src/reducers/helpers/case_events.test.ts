import { describe, expect, it, vi } from "vitest";

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import {
  createReducerTestContext,
  createTestTimestamp,
} from "./__tests__/serverTestContext";
import { emitCaseEvent, parseCaseEventPayload } from "./case_events";

describe("case event helpers", () => {
  it("normalizes empty payloads to an empty JSON object", () => {
    expect(parseCaseEventPayload(undefined)).toBe("{}");
    expect(parseCaseEventPayload("")).toBe("{}");
    expect(parseCaseEventPayload('{"ok":true}')).toBe('{"ok":true}');
    expect(() => parseCaseEventPayload("{broken")).toThrow(
      "payloadJson must be valid JSON",
    );
  });

  it("records reducer-friendly case event envelopes", () => {
    const ctx = createReducerTestContext({
      timestamp: createTestTimestamp(2_500n),
    });

    emitCaseEvent(ctx, {
      eventName: "skill.check.resolved",
      caseId: "case01_mainline",
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_hbf_departure",
      payloadJson: '{"passed":true}',
      idempotencyKey: "req-1",
    });

    expect(ctx.db.caseEventLog.rows()).toEqual([
      expect.objectContaining({
        playerId: ctx.sender,
        eventName: "skill.check.resolved",
        caseId: "case01_mainline",
        scenarioId: "case01_hbf_arrival",
        nodeId: "scene_case01_hbf_departure",
        payloadJson: '{"passed":true}',
        idempotencyKey: "req-1",
        createdAt: ctx.timestamp,
      }),
    ]);
  });
});
