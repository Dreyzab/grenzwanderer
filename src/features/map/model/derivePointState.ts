import type { MapPoint, PinVisualState } from "../types";

export const derivePointState = (
  point: MapPoint,
  currentLocationId: string | null,
  visitedFlags: ReadonlySet<string>,
  unlockedGroups: ReadonlySet<string>,
  completedFlags: ReadonlySet<string> = new Set<string>(),
  discoveredFlags: ReadonlySet<string> = new Set<string>(),
): PinVisualState => {
  if (completedFlags.has(`COMPLETED_${point.id}`)) {
    return "completed";
  }

  if (
    currentLocationId === point.locationId ||
    visitedFlags.has(`VISITED_${point.id}`)
  ) {
    return "visited";
  }

  if (point.unlockGroup && unlockedGroups.has(point.unlockGroup)) {
    return "discovered";
  }

  if (discoveredFlags.has(`DISCOVERED_${point.id}`)) {
    return "discovered";
  }

  return point.defaultState ?? "locked";
};
