import { describe, expect, it } from "vitest";
import { resolveCompletionRoute } from "./completionRoute";
import type { VnScenario } from "./types";

describe("completionRoute resolver", () => {
  it("returns null when scenario has no completion route", () => {
    const scenario: VnScenario = {
      id: "sandbox_intro_pilot",
      title: "Intro",
      startNodeId: "scene_start",
      nodeIds: ["scene_start"],
    };

    const resolved = resolveCompletionRoute(scenario, {}, []);
    expect(resolved).toBeNull();
  });

  it("resolves route when required flags are satisfied", () => {
    const scenario: VnScenario = {
      id: "sandbox_intro_pilot",
      title: "Intro",
      startNodeId: "scene_start",
      nodeIds: ["scene_start"],
      completionRoute: {
        nextScenarioId: "intro_journalist",
        requiredFlagsAll: ["origin_journalist"],
      },
    };

    const resolved = resolveCompletionRoute(
      scenario,
      { origin_journalist: true },
      [],
    );

    expect(resolved).toEqual({
      nextScenarioId: "intro_journalist",
      hasExistingSession: false,
      isExistingSessionCompleted: false,
    });
  });

  it("returns null when blocked flag is set", () => {
    const scenario: VnScenario = {
      id: "sandbox_intro_pilot",
      title: "Intro",
      startNodeId: "scene_start",
      nodeIds: ["scene_start"],
      completionRoute: {
        nextScenarioId: "intro_journalist",
        requiredFlagsAll: ["origin_journalist"],
        blockedIfFlagsAny: ["met_anna_intro"],
      },
    };

    const resolved = resolveCompletionRoute(
      scenario,
      { origin_journalist: true, met_anna_intro: true },
      [],
    );

    expect(resolved).toBeNull();
  });

  it("recognizes existing completed session", () => {
    const scenario: VnScenario = {
      id: "sandbox_intro_pilot",
      title: "Intro",
      startNodeId: "scene_start",
      nodeIds: ["scene_start"],
      completionRoute: {
        nextScenarioId: "intro_journalist",
      },
    };

    const resolved = resolveCompletionRoute(scenario, {}, [
      {
        scenarioId: "intro_journalist",
        completedAt: { tag: "some", value: "2026-02-27T00:00:00Z" },
      },
    ]);

    expect(resolved).toEqual({
      nextScenarioId: "intro_journalist",
      hasExistingSession: true,
      isExistingSessionCompleted: true,
    });
  });
});
