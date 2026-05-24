import { describe, expect, it } from "vitest";
import type { MapResolverInputs, RuntimeMapPoint } from "../types";
import {
  resolveDiscoverySignal,
  type DiscoverySignalMemory,
} from "./discoverySignal";

const resolverInputs: MapResolverInputs = {
  flags: new Set(),
  vars: new Map(),
  inventoryItemIds: new Set(),
  evidenceIds: new Set(),
  unlockGroupIds: new Set(),
  questStages: new Map(),
  relationships: new Map(),
  favorBalances: new Map(),
  agencyStanding: 0,
  careerRankId: null,
  rumorStates: new Map(),
  careerRankOrder: new Map(),
};

const makePoint = (overrides: Partial<RuntimeMapPoint>): RuntimeMapPoint => ({
  id: "loc_hidden",
  regionId: "FREIBURG_1905",
  title: "Hidden Courtyard",
  lat: 47.9959,
  lng: 7.8522,
  category: "SHADOW",
  locationId: "loc_hidden",
  state: "locked",
  availableBindings: [],
  primaryBinding: null,
  travelBinding: null,
  isObjectiveActive: false,
  canTravel: false,
  resolvedScenarioId: null,
  canStartScenario: false,
  isVisible: false,
  runtimeSource: "persistent",
  discoveryRules: [
    {
      channel: "proximity",
      signal: { enabled: true },
    },
  ],
  ...overrides,
});

describe("discovery signal resolver", () => {
  it("applies cold, warm, and hot phases", () => {
    const point = makePoint({ lng: 7.8522 });

    expect(
      resolveDiscoverySignal({
        position: [7.85268, 47.9959],
        candidates: [point],
        resolverInputs,
      }).state,
    ).toBe("cold");

    expect(
      resolveDiscoverySignal({
        position: [7.85255, 47.9959],
        candidates: [point],
        resolverInputs,
      }).state,
    ).toBe("warm");

    expect(
      resolveDiscoverySignal({
        position: [7.85235, 47.9959],
        candidates: [point],
        resolverInputs,
      }).state,
    ).toBe("hot");
  });

  it("uses hysteresis to avoid flickering at a phase boundary", () => {
    const point = makePoint({});
    const previous: DiscoverySignalMemory = {
      targetId: point.id,
      phase: "hot",
    };

    const result = resolveDiscoverySignal({
      position: [7.85244, 47.9959],
      candidates: [point],
      resolverInputs,
      previous,
    });

    expect(result.state).toBe("hot");
  });

  it("excludes found and condition-locked POIs", () => {
    const found = makePoint({ id: "loc_found", state: "discovered" });
    const storyLocked = makePoint({
      id: "loc_story_locked",
      discoveryRules: [
        {
          channel: "proximity",
          conditions: [
            { type: "flag_is", key: "story_gate_open", value: true },
          ],
          signal: { enabled: true },
        },
      ],
    });

    const result = resolveDiscoverySignal({
      position: [7.8522, 47.9959],
      candidates: [found, storyLocked],
      resolverInputs,
    });

    expect(result.state).toBe("idle");
  });

  it("allows story-qualified locked POIs to become signal candidates", () => {
    const storyQualified = makePoint({
      id: "loc_tailor",
      discoveryRules: [
        {
          channel: "proximity",
          conditions: [
            {
              type: "flag_is",
              key: "bank_investigation_complete",
              value: true,
            },
          ],
          signal: { enabled: true, priority: 90 },
        },
      ],
    });

    const result = resolveDiscoverySignal({
      position: [7.85235, 47.9959],
      candidates: [storyQualified],
      resolverInputs: {
        ...resolverInputs,
        flags: new Set(["bank_investigation_complete"]),
      },
    });

    expect(result.state).toBe("hot");
    expect(result.target?.id).toBe("loc_tailor");
  });

  it("resolves overlapping POIs deterministically and reports interference", () => {
    const left = makePoint({ id: "loc_left", lng: 7.85219 });
    const right = makePoint({ id: "loc_right", lng: 7.85221 });

    const result = resolveDiscoverySignal({
      position: [7.8522, 47.9959],
      candidates: [right, left],
      resolverInputs,
    });

    expect(result.state).toBe("interference");
    expect(result.target?.id).toBe("loc_left");
    expect(result.ambiguity).toBe(true);
  });

  it("prefers nearer eligible targets before narrative priority", () => {
    const near = makePoint({
      id: "loc_near",
      lng: 7.85225,
      discoveryRules: [
        {
          channel: "proximity",
          signal: { priority: 1 },
        },
      ],
    });
    const farHighPriority = makePoint({
      id: "loc_far",
      lng: 7.8525,
      discoveryRules: [
        {
          channel: "proximity",
          signal: { priority: 100 },
        },
      ],
    });

    const result = resolveDiscoverySignal({
      position: [7.8522, 47.9959],
      candidates: [farHighPriority, near],
      resolverInputs,
    });

    expect(result.target?.id).toBe("loc_near");
  });
});
