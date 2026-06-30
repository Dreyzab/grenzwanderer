import { describe, expect, it } from "vitest";
import {
  CASE01_SCENARIO_IDS,
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
} from "../../src/shared/case01Canon";
import { buildCase01MapSnapshot } from "./case_01_points";
import { CASE01_CANON_NODES } from "./case01_canon_runtime";

const buildScenarioIdSet = (): ReadonlySet<string> =>
  new Set<string>([
    CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    ...Object.values(CASE01_SCENARIO_IDS),
    "sandbox_intro_pilot",
    "sandbox_workers_pub_rumor",
  ]);

const pointById = (id: string) => {
  const point = buildCase01MapSnapshot(buildScenarioIdSet()).points.find(
    (entry) => entry.id === id,
  );
  if (!point) {
    throw new Error(`Missing map point ${id}`);
  }
  return point;
};

describe("Case 01 map progression spine", () => {
  it("moves Matthias to Hauptbahnhof and opens the first Freiburg layer on HBF departure", () => {
    const departure = CASE01_CANON_NODES.find(
      (node) => node.id === "scene_case01_hbf_departure",
    );

    expect(departure?.onEnter).toEqual(
      expect.arrayContaining([
        {
          type: "set_flag",
          key: "case01_onboarding_complete",
          value: true,
        },
        { type: "set_flag", key: "intro_freiburg_done", value: true },
        { type: "set_flag", key: "case01_priority_locked", value: true },
        { type: "unlock_group", groupId: "loc_freiburg_bank" },
        { type: "unlock_group", groupId: "loc_rathaus" },
        { type: "track_event", eventName: "case01_hbf_departure" },
      ]),
    );
  });

  it("keeps the arrival layer focused on HBF, Zum Eber, bank, and Rathaus", () => {
    expect(pointById("loc_hbf")).toMatchObject({
      defaultState: "discovered",
      unlockGroup: "loc_hbf",
    });
    expect(pointById("loc_pub_deutsche")).toMatchObject({
      title: "Zum Eber",
      defaultState: "discovered",
      unlockGroup: "loc_pub_deutsche",
    });
    expect(pointById("loc_freiburg_bank")).toMatchObject({
      defaultState: "discovered",
      unlockGroup: "loc_freiburg_bank",
    });
    expect(pointById("loc_rathaus")).toMatchObject({
      defaultState: "discovered",
      unlockGroup: "loc_rathaus",
    });

    for (const id of [
      "loc_munster",
      "loc_uni_chem",
      "loc_uni_med",
      "loc_red_light",
      "loc_workers_pub",
      "loc_martinstor",
      "loc_schwabentor",
    ]) {
      expect(pointById(id).revealConditions?.length).toBeGreaterThan(0);
    }
  });

  it("adds discovery rules for secondary and late-game POIs", () => {
    expect(pointById("loc_tailor").discoveryRules?.[0]).toMatchObject({
      channel: "proximity",
      signal: { enabled: true, priority: 90 },
    });
    expect(pointById("loc_apothecary").discoveryRules?.[0]).toMatchObject({
      channel: "proximity",
      signal: { enabled: true, priority: 88 },
    });
    expect(pointById("loc_pub").discoveryRules?.[0]).toMatchObject({
      channel: "proximity",
      signal: { enabled: true, priority: 80 },
    });
    expect(pointById("loc_telephone").discoveryRules?.[0]).toMatchObject({
      channel: "proximity",
      signal: { enabled: true, priority: 72 },
    });
    expect(pointById("loc_freiburg_warehouse").discoveryRules?.[0]).toMatchObject(
      {
        channel: "qr_scan",
        requiresServerConfirmation: true,
        signal: {
          enabled: true,
          priority: 120,
          requiresServerConfirmation: true,
        },
      },
    );
  });

  it("keeps the warehouse QR gate late-game only", () => {
    const qrEntry = buildCase01MapSnapshot(
      buildScenarioIdSet(),
    ).qrCodeRegistry?.find((entry) => entry.codeId === "qr_warehouse_dock");

    expect(qrEntry?.requiresFlagsAll).toEqual(["warehouse_plan_locked"]);
  });
});
