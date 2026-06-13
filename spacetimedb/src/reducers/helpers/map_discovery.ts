import {
  evaluateAllMapConditions,
  haversineDistanceMeters,
  type AttemptLocation,
  type MapEvaluationCache,
} from "./map_conditions";
import { getSkillXpForPlayer } from "./player";
import {
  isSkillRankAtLeast,
  resolveSkillRank,
} from "../../../../src/shared/game/skillProgression";
import type { MapDiscoveryRule, MapPoint } from "./types";

// Mirrors src/features/map/model/geo.ts — the client commits a discovery as
// soon as it crosses these radii, so the server must accept the same geometry.
export const DEFAULT_DISCOVERY_RADIUS_METERS = 50;
export const DEFAULT_SEARCH_RADIUS_METERS = 80;
// Absorbs client-side movement interpolation drift between the frame that
// crossed the radius and the position sent with the commit.
export const DISCOVERY_DISTANCE_TOLERANCE_METERS = 5;

export type MapDiscoveryCommitChannel = "proximity" | "observation_lens";

const COMMIT_CHANNELS = new Set<string>(["proximity", "observation_lens"]);

// Mirrors AUTO_DISCOVERY_CHANNELS in src/features/map/hooks/useMapJourney.ts:
// the journey loop auto-discovers points whose rules allow proximity or
// vn_unlock, so a proximity commit must match the same rule set.
const PROXIMITY_RULE_CHANNELS = new Set<MapDiscoveryRule["channel"]>([
  "proximity",
  "vn_unlock",
]);

export const resolveDiscoveryRadiusMeters = (point: MapPoint): number =>
  point.discoveryRadiusMeters ??
  (point.isSearchZone
    ? (point.searchRadiusMeters ?? DEFAULT_SEARCH_RADIUS_METERS)
    : DEFAULT_DISCOVERY_RADIUS_METERS);

export type MapDiscoveryRejectionReason =
  | "discovery_channel_invalid"
  | "discovery_channel_not_allowed"
  | "discovery_location_required"
  | "discovery_out_of_range"
  | "discovery_not_revealed"
  | "discovery_requirements_not_met";

export type MapDiscoveryValidation =
  | { ok: true }
  | { ok: false; reason: MapDiscoveryRejectionReason };

const rejected = (
  reason: MapDiscoveryRejectionReason,
): MapDiscoveryValidation => ({ ok: false, reason });

const ruleSkillGatesSatisfied = (ctx: any, rule: MapDiscoveryRule): boolean =>
  (rule.skillGates ?? []).every((gate) =>
    isSkillRankAtLeast(
      resolveSkillRank(getSkillXpForPlayer(ctx, ctx.sender, gate.skillId)).rank,
      gate.rank,
    ),
  );

export const validateMapDiscovery = (
  ctx: any,
  point: MapPoint,
  input: {
    channel: string;
    attemptedLocation: AttemptLocation | null;
    cache: MapEvaluationCache;
  },
): MapDiscoveryValidation => {
  const { channel, attemptedLocation, cache } = input;

  if (!COMMIT_CHANNELS.has(channel)) {
    return rejected("discovery_channel_invalid");
  }

  if (!attemptedLocation) {
    return rejected("discovery_location_required");
  }

  const distanceMeters = haversineDistanceMeters(attemptedLocation, {
    lat: point.lat,
    lng: point.lng,
  });
  if (
    distanceMeters >
    resolveDiscoveryRadiusMeters(point) + DISCOVERY_DISTANCE_TOLERANCE_METERS
  ) {
    return rejected("discovery_out_of_range");
  }

  const scope = { point, attemptedLocation };
  if (!evaluateAllMapConditions(ctx, point.revealConditions, scope, cache)) {
    return rejected("discovery_not_revealed");
  }

  const rules = point.discoveryRules ?? [];
  if (rules.length === 0) {
    // Points without authored rules are plain proximity discoveries; the
    // observation lens only applies to points that opted into it.
    return channel === "proximity"
      ? { ok: true }
      : rejected("discovery_channel_not_allowed");
  }

  const matchedRules = rules.filter((rule) =>
    channel === "proximity"
      ? PROXIMITY_RULE_CHANNELS.has(rule.channel)
      : rule.channel === "observation_lens",
  );
  if (matchedRules.length === 0) {
    return rejected("discovery_channel_not_allowed");
  }

  const satisfied = matchedRules.some(
    (rule) =>
      evaluateAllMapConditions(ctx, rule.conditions, scope, cache) &&
      ruleSkillGatesSatisfied(ctx, rule),
  );
  if (!satisfied) {
    return rejected("discovery_requirements_not_met");
  }

  return { ok: true };
};
