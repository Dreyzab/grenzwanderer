import { describe, expect, it, vi } from "vitest";

import { createReducerTestContext } from "./__tests__/serverTestContext";

vi.mock("spacetimedb", () => ({
  Timestamp: class Timestamp {
    microsSinceUnixEpoch: bigint;

    constructor(microsSinceUnixEpoch: bigint) {
      this.microsSinceUnixEpoch = microsSinceUnixEpoch;
    }
  },
}));

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import { CASE_EVENT_NAMES } from "./case_event_names";
import {
  changeAgencyStandingInternal,
  recordServiceCriterionInternal,
  syncAgencyCareerQualifyingCase,
  verifyRumorInternal,
} from "./player_progression";

const eventRows = (
  ctx: ReturnType<typeof createReducerTestContext>,
  eventName: string,
): any[] =>
  ctx.db.caseEventLog.rows().filter((row: any) => row.eventName === eventName);

describe("case event vocabulary", () => {
  it("emits rumor.verified once per rumor transition", () => {
    const ctx = createReducerTestContext();

    verifyRumorInternal(ctx, "rumor_rail_yard", "field_visit");
    verifyRumorInternal(ctx, "rumor_rail_yard", "field_visit");

    const events = eventRows(ctx, CASE_EVENT_NAMES.rumorVerified);
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0].payloadJson)).toEqual({
      rumorId: "rumor_rail_yard",
      verificationKind: "field_visit",
    });
  });

  it("emits career.criterion_recorded once per criterion", () => {
    const ctx = createReducerTestContext();

    recordServiceCriterionInternal(ctx, "verified_rumor_chain");
    recordServiceCriterionInternal(ctx, "verified_rumor_chain");
    recordServiceCriterionInternal(ctx, "clean_closure");

    const events = eventRows(ctx, CASE_EVENT_NAMES.careerCriterionRecorded);
    expect(events).toHaveLength(2);
    expect(events.map((row: any) => JSON.parse(row.payloadJson))).toEqual([
      { criterionId: "verified_rumor_chain" },
      { criterionId: "clean_closure" },
    ]);
  });

  it("emits career.promoted when promotion conditions are met", () => {
    const ctx = createReducerTestContext();

    recordServiceCriterionInternal(ctx, "verified_rumor_chain");
    recordServiceCriterionInternal(ctx, "preserved_source_network");
    syncAgencyCareerQualifyingCase(ctx, "quest_banker", 3);
    expect(eventRows(ctx, CASE_EVENT_NAMES.careerPromoted)).toHaveLength(0);

    changeAgencyStandingInternal(ctx, 15, "test_promotion");

    const events = eventRows(ctx, CASE_EVENT_NAMES.careerPromoted);
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0].payloadJson)).toEqual({
      rankId: "junior_detective",
    });
  });
});
