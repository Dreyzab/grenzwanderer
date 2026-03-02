import { describe, expect, it } from "vitest";
import { getOriginProfileById } from "../../character/originProfiles";
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
      title: "Intro",
      startNodeId: "scene_journalist_intro",
      nodeIds: ["scene_journalist_intro"],
      completionRoute: {
        nextScenarioId: "sandbox_case01_pilot",
      },
    },
    {
      id: "sandbox_case01_pilot",
      title: "Case 01",
      startNodeId: "scene_intro_journey",
      nodeIds: ["scene_intro_journey"],
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
  const journalist = getOriginProfileById("journalist");
  if (!journalist) {
    throw new Error("journalist profile missing");
  }

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
      originProfile: journalist,
    });

    expect(result).toEqual({ kind: "blocked_sync" });
  });

  it("returns show_dossier when origin is not selected and no active session", () => {
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
      },
      originProfile: journalist,
    });

    expect(result).toEqual({ kind: "show_dossier", profileId: "journalist" });
  });

  it("returns most recently updated open session as resume target", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: true,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [
        {
          sessionKey: "me::intro_journalist",
          playerId: identity("me"),
          scenarioId: "intro_journalist",
          nodeId: "scene_journalist_intro",
          updatedAt: timestamp(20n),
          completedAt: undefined,
        },
        {
          sessionKey: "me::sandbox_case01_pilot",
          playerId: identity("me"),
          scenarioId: "sandbox_case01_pilot",
          nodeId: "scene_intro_journey",
          updatedAt: timestamp(30n),
          completedAt: undefined,
        },
      ],
      flags: {
        origin_journalist: true,
      },
      originProfile: journalist,
    });

    expect(result).toEqual({
      kind: "resume",
      scenarioId: "sandbox_case01_pilot",
    });
  });

  it("routes selected journalist with handoff done to post-origin scenario", () => {
    const result = resolveFreiburgEntryTarget({
      isConnected: true,
      contentReady: true,
      sessionReady: true,
      flagsReady: true,
      identityHex: "me",
      snapshot,
      sessions: [],
      flags: {
        origin_journalist: true,
        origin_journalist_handoff_done: true,
      },
      originProfile: journalist,
    });

    expect(result).toEqual({
      kind: "start",
      scenarioId: "sandbox_case01_pilot",
    });
  });
});
