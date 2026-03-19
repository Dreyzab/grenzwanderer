import { describe, expect, it } from "vitest";
import { resolveCompletionRoute } from "./completionRoute";
import type { VnScenario } from "./types";

describe("completionRoute resolver", () => {
  it("returns null when scenario has no completion route", () => {
    const scenario: VnScenario = {
      id: "journalist_agency_wakeup",
      title: "Wakeup",
      startNodeId: "scene_journalist_agency_wakeup",
      nodeIds: ["scene_journalist_agency_wakeup"],
    };

    const resolved = resolveCompletionRoute(scenario, {}, []);
    expect(resolved).toBeNull();
  });

  it("resolves route when required flags are satisfied", () => {
    const scenario: VnScenario = {
      id: "journalist_agency_wakeup",
      title: "Wakeup",
      startNodeId: "scene_journalist_agency_wakeup",
      nodeIds: ["scene_journalist_agency_wakeup"],
      completionRoute: {
        nextScenarioId: "sandbox_agency_briefing",
        requiredFlagsAll: ["origin_journalist"],
      },
    };

    const resolved = resolveCompletionRoute(
      scenario,
      { origin_journalist: true },
      [],
    );

    expect(resolved).toEqual({
      nextScenarioId: "sandbox_agency_briefing",
      hasExistingSession: false,
      isExistingSessionCompleted: false,
    });
  });

  it("returns null when blocked flag is set", () => {
    const scenario: VnScenario = {
      id: "journalist_agency_wakeup",
      title: "Wakeup",
      startNodeId: "scene_journalist_agency_wakeup",
      nodeIds: ["scene_journalist_agency_wakeup"],
      completionRoute: {
        nextScenarioId: "sandbox_agency_briefing",
        requiredFlagsAll: ["origin_journalist"],
        blockedIfFlagsAny: ["agency_briefing_complete"],
      },
    };

    const resolved = resolveCompletionRoute(
      scenario,
      { origin_journalist: true, agency_briefing_complete: true },
      [],
    );

    expect(resolved).toBeNull();
  });

  it("recognizes existing completed session", () => {
    const scenario: VnScenario = {
      id: "journalist_agency_wakeup",
      title: "Wakeup",
      startNodeId: "scene_journalist_agency_wakeup",
      nodeIds: ["scene_journalist_agency_wakeup"],
      completionRoute: {
        nextScenarioId: "sandbox_agency_briefing",
      },
    };

    const resolved = resolveCompletionRoute(scenario, {}, [
      {
        scenarioId: "sandbox_agency_briefing",
        completedAt: { tag: "some", value: "2026-02-27T00:00:00Z" },
      },
    ]);

    expect(resolved).toEqual({
      nextScenarioId: "sandbox_agency_briefing",
      hasExistingSession: true,
      isExistingSessionCompleted: true,
    });
  });
});
