import { describe, expect, it } from "vitest";
import type { MapResolverContext } from "../types";
import {
  evaluateMapCondition,
  pickPrimaryBinding,
  pickTravelBinding,
  resolveAvailableBindings,
  resolveScenarioIdFromBindings,
} from "./mapResolver";

const baseContext: MapResolverContext = {
  pointState: "discovered",
  flags: new Set(["flag_on"]),
  vars: new Map([
    ["progress", 5],
    ["heat", 2],
  ]),
  inventoryItemIds: new Set(["item_key"]),
  evidenceIds: new Set(["ev_note"]),
  unlockGroupIds: new Set(["group_bank"]),
  questStages: new Map([["quest_main", 3]]),
  relationships: new Map([["npc_anna", 2]]),
  favorBalances: new Map([["npc_anna", 1]]),
  agencyStanding: 18,
  careerRankId: "junior_detective",
  rumorStates: new Map([["rumor_bank_rail_yard", "verified"]]),
  careerRankOrder: new Map([
    ["trainee", 0],
    ["junior_detective", 1],
  ]),
};

describe("mapResolver", () => {
  it("evaluates logic_and / logic_or / logic_not conditions", () => {
    expect(
      evaluateMapCondition(baseContext, {
        type: "logic_and",
        conditions: [
          { type: "flag_is", key: "flag_on", value: true },
          { type: "var_gte", key: "progress", value: 4 },
        ],
      }),
    ).toBe(true);

    expect(
      evaluateMapCondition(baseContext, {
        type: "logic_or",
        conditions: [
          { type: "flag_is", key: "flag_missing", value: true },
          { type: "has_item", itemId: "item_key" },
        ],
      }),
    ).toBe(true);

    expect(
      evaluateMapCondition(baseContext, {
        type: "logic_not",
        condition: { type: "flag_is", key: "flag_on", value: true },
      }),
    ).toBe(false);
  });

  it("evaluates social conditions for favor, standing, rumor, and career rank", () => {
    expect(
      evaluateMapCondition(baseContext, {
        type: "favor_balance_gte",
        npcId: "npc_anna",
        value: 1,
      }),
    ).toBe(true);

    expect(
      evaluateMapCondition(baseContext, {
        type: "agency_standing_gte",
        value: 15,
      }),
    ).toBe(true);

    expect(
      evaluateMapCondition(baseContext, {
        type: "rumor_state_is",
        rumorId: "rumor_bank_rail_yard",
        status: "verified",
      }),
    ).toBe(true);

    expect(
      evaluateMapCondition(baseContext, {
        type: "career_rank_gte",
        rankId: "trainee",
      }),
    ).toBe(true);

    expect(
      evaluateMapCondition(
        {
          ...baseContext,
          careerRankId: "trainee",
        },
        {
          type: "career_rank_gte",
          rankId: "junior_detective",
        },
      ),
    ).toBe(false);
  });

  it("treats geofence conditions as false until runtime location evaluation exists", () => {
    expect(
      evaluateMapCondition(baseContext, {
        type: "geofence_within",
        lat: 47.99,
        lng: 7.85,
        radiusMeters: 30,
      }),
    ).toBe(false);
  });

  it("resolves enabled bindings by priority and marks action capabilities", () => {
    const bindings = resolveAvailableBindings(
      [
        {
          id: "bind_travel",
          trigger: "card_secondary",
          label: "Travel",
          priority: 1,
          intent: "travel",
          actions: [{ type: "travel_to", locationId: "loc_bank" }],
        },
        {
          id: "bind_objective",
          trigger: "card_primary",
          label: "Investigate",
          priority: 100,
          intent: "objective",
          conditions: [{ type: "flag_is", key: "flag_on", value: true }],
          actions: [{ type: "start_scenario", scenarioId: "scenario_bank" }],
        },
        {
          id: "bind_locked",
          trigger: "card_primary",
          label: "Locked",
          priority: 120,
          intent: "interaction",
          conditions: [{ type: "flag_is", key: "flag_missing", value: true }],
          actions: [{ type: "set_flag", key: "x", value: true }],
        },
      ],
      baseContext,
    );

    expect(bindings.map((entry) => entry.id)).toEqual([
      "bind_objective",
      "bind_travel",
    ]);
    expect(bindings[0]?.hasStartScenario).toBe(true);
    expect(bindings[0]?.hasTravelAction).toBe(false);
    expect(bindings[1]?.hasTravelAction).toBe(true);
  });

  it("picks primary/travel bindings and resolves scenario id", () => {
    const bindings = resolveAvailableBindings(
      [
        {
          id: "sys_travel_loc_bank",
          trigger: "card_secondary",
          label: "Travel",
          priority: 1,
          intent: "travel",
          actions: [{ type: "travel_to", locationId: "loc_bank" }],
        },
        {
          id: "bind_start",
          trigger: "card_primary",
          label: "Start Case",
          priority: 100,
          intent: "objective",
          actions: [{ type: "start_scenario", scenarioId: "scenario_bank" }],
        },
      ],
      baseContext,
    );

    const primary = pickPrimaryBinding(bindings);
    const travel = pickTravelBinding(bindings);

    expect(primary?.id).toBe("bind_start");
    expect(travel?.id).toBe("sys_travel_loc_bank");
    expect(resolveScenarioIdFromBindings(bindings)).toBe("scenario_bank");
  });
});
