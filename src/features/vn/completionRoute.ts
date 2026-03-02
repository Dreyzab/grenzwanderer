import type { VnScenario } from "./types";

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
  if (!scenario?.completionRoute) {
    return null;
  }

  const { nextScenarioId, requiredFlagsAll, blockedIfFlagsAny } =
    scenario.completionRoute;

  const requirementsMet = (requiredFlagsAll ?? []).every(
    (flag) => flags[flag] === true,
  );
  if (!requirementsMet) {
    return null;
  }

  const blocked = (blockedIfFlagsAny ?? []).some(
    (flag) => flags[flag] === true,
  );
  if (blocked) {
    return null;
  }

  const existingSession =
    sessions.find((session) => session.scenarioId === nextScenarioId) ?? null;

  return {
    nextScenarioId,
    hasExistingSession: existingSession !== null,
    isExistingSessionCompleted: hasOptionalValue(existingSession?.completedAt),
  };
};
