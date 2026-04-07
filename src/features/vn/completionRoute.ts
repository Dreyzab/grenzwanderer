import type { VnScenario, VnScenarioCompletionRoute } from "./types";

interface SessionLike {
  scenarioId: string;
  completedAt: unknown;
}

export interface CompletionRouteResolution {
  nextScenarioId: string;
  hasExistingSession: boolean;
  isExistingSessionCompleted: boolean;
}

const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }
  return true;
};

export const resolveCompletionRoute = (
  scenario: VnScenario | null,
  flags: Record<string, boolean>,
  sessions: SessionLike[],
): CompletionRouteResolution | null => {
  const routes: VnScenarioCompletionRoute[] = [];
  if (scenario?.completionRoutes) {
    routes.push(...scenario.completionRoutes);
  }
  if (scenario?.completionRoute) {
    routes.push(scenario.completionRoute);
  }

  if (routes.length === 0) {
    return null;
  }

  for (const route of routes) {
    const { nextScenarioId, requiredFlagsAll, blockedIfFlagsAny } = route;

    const requirementsMet = (requiredFlagsAll ?? []).every(
      (flag: string) => flags[flag] === true,
    );
    if (!requirementsMet) {
      continue;
    }

    const blocked = (blockedIfFlagsAny ?? []).some(
      (flag: string) => flags[flag] === true,
    );
    if (blocked) {
      continue;
    }

    const existingSession =
      sessions.find((session) => session.scenarioId === nextScenarioId) ?? null;

    return {
      nextScenarioId,
      hasExistingSession: existingSession !== null,
      isExistingSessionCompleted: hasOptionalValue(
        existingSession?.completedAt,
      ),
    };
  }

  return null;
};
