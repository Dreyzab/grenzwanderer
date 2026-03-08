import { describe, expect, it } from "vitest";
import { resolveFreiburgEntryTarget } from "./freiburgEntry";

const identity = (hex: string) => ({
  toHexString: () => hex,
});

const timestamp = (micros: bigint) => ({
  microsSinceUnixEpoch: micros,
});

const snapshot: any = {
  schemaVersion: 2,
  scenarios: [
    {
      id: "origin_journalist_bootstrap",
      title: "Bootstrap",
      startNodeId: "scene_origin_journalist_bootstrap",
      nodeIds: ["scene_origin_journalist_bootstrap"],
      completionRoute: {
        nextScenarioId: "intro_journalist",
        requiredFlagsAll: ["origin_journalist"],
      },
      packId: "system_origin_bootstrap",
    },
    {
      id: "intro_journalist",
      title: "Journalist Intro",
      startNodeId: "scene_journalist_intro",
      nodeIds: ["scene_journalist_intro"],
    },
    {
      id: "intro_aristocrat",
      title: "Aristocrat Intro",
      startNodeId: "scene_aristocrat_intro",
      nodeIds: ["scene_aristocrat_intro"],
    },
    {
      id: "intro_veteran",
      title: "Veteran Intro",
      startNodeId: "scene_veteran_intro",
      nodeIds: ["scene_veteran_intro"],
    },
    {
      id: "intro_archivist",
      title: "Archivist Intro",
      startNodeId: "scene_archivist_intro",
      nodeIds: ["scene_archivist_intro"],
    },
    {
      id: "sandbox_case01_pilot",
      title: "Case 01",
      startNodeId: "scene_intro_journey",
      nodeIds: ["scene_intro_journey"],
      completionRoute: {
        nextScenarioId: "sandbox_case01_epilogue",
      },
    },
    {
      id: "sandbox_case01_epilogue",
      title: "Case 01 Epilogue",
      startNodeId: "scene_case01_epilogue",
      nodeIds: ["scene_case01_epilogue"],
    },
  ],
  nodes: [],
  vnRuntime: {
    defaultEntryScenarioId: "sandbox_case01_pilot",
  },
  mindPalace: {
    cases: [],
    facts: [],
    hypotheses: [],
  },
};

describe("resolveFreiburgEntryTarget", () => {
  it("returns blocked_sync while hydration is incomplete", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: false,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [],
      flags: {},
    });

    expect(result).toEqual({ kind: "blocked_sync" });
  });

  it("returns select_origin when no origin is selected and no active session exists", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: true,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [],
      flags: {
        origin_journalist: false,
        origin_aristocrat: false,
        origin_veteran: false,
        origin_archivist: false,
      },
    });

    expect(result).toEqual({ kind: "select_origin" });
  });

  it("returns most recently updated open session across mixed Freiburg scenarios", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: true,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [
        {
          sessionKey: "me::origin_journalist_bootstrap",
          playerId: identity("me"),
          scenarioId: "origin_journalist_bootstrap",
          nodeId: "scene_origin_journalist_bootstrap",
          updatedAt: timestamp(10n),
          completedAt: { tag: "none" },
        },
        {
          sessionKey: "me::sandbox_case01_pilot",
          playerId: identity("me"),
          scenarioId: "sandbox_case01_pilot",
          nodeId: "scene_intro_journey",
          updatedAt: timestamp(40n),
          completedAt: undefined,
        },
        {
          sessionKey: "me::intro_aristocrat",
          playerId: identity("me"),
          scenarioId: "intro_aristocrat",
          nodeId: "scene_aristocrat_intro",
          updatedAt: timestamp(20n),
          completedAt: undefined,
        },
      ],
      flags: {
        origin_aristocrat: true,
      },
    });

    expect(result).toEqual({
      kind: "resume",
      scenarioId: "sandbox_case01_pilot",
    });
  });

  it("routes selected origin without handoff to its intro scenario", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: true,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [],
      flags: {
        origin_aristocrat: true,
      },
    });

    expect(result).toEqual({
      kind: "start",
      scenarioId: "intro_aristocrat",
    });
  });

  it("routes selected origin with handoff done to the default entry scenario", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: true,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [],
      flags: {
        origin_aristocrat: true,
        origin_aristocrat_handoff_done: true,
      },
    });

    expect(result).toEqual({
      kind: "start",
      scenarioId: "sandbox_case01_pilot",
    });
  });
});
