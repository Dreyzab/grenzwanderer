import type { MapDiscoveryRule, MapDiscoverySkillGate } from "../../vn/types";
import { isSkillRankGateSatisfiedFromVars } from "../../../shared/game/skillProgression";
import type { MapResolverInputs, RuntimeMapPoint } from "../types";
import { evaluateMapCondition } from "./mapResolver";
import { haversineDistanceMeters, type LngLatTuple } from "./geo";

export type DiscoverySignalPhase = "none" | "cold" | "warm" | "hot";
export type DiscoverySignalState =
  | "idle"
  | "cold"
  | "warm"
  | "hot"
  | "interference";

export interface DiscoverySignalPhaseRadii {
  coldEnterMeters: number;
  coldExitMeters: number;
  warmEnterMeters: number;
  warmExitMeters: number;
  hotEnterMeters: number;
  hotExitMeters: number;
}

export interface DiscoverySignalMemory {
  targetId: string | null;
  phase: DiscoverySignalPhase;
}

export interface DiscoverySignalResult {
  state: DiscoverySignalState;
  phase: DiscoverySignalPhase;
  target: RuntimeMapPoint | null;
  distanceMeters: number | null;
  ambiguity: boolean;
}

export const DEFAULT_DISCOVERY_SIGNAL_RADII: DiscoverySignalPhaseRadii = {
  coldEnterMeters: 40,
  coldExitMeters: 45,
  warmEnterMeters: 30,
  warmExitMeters: 32,
  hotEnterMeters: 15,
  hotExitMeters: 20,
};

const INTERFERENCE_DISTANCE_DELTA_METERS = 6;

const isSignalChannel = (rule: MapDiscoveryRule): boolean =>
  rule.channel === "qr_scan" ||
  rule.channel === "proximity" ||
  rule.channel === "observation_lens" ||
  Boolean(rule.signal);

const readRulePriority = (rule: MapDiscoveryRule): number =>
  rule.signal?.priority ?? 0;

const mergeRadii = (rule: MapDiscoveryRule): DiscoverySignalPhaseRadii => ({
  ...DEFAULT_DISCOVERY_SIGNAL_RADII,
  ...(rule.signal?.radii ?? {}),
});

const varsToRecord = (
  vars: ReadonlyMap<string, number>,
): Readonly<Record<string, number>> => Object.fromEntries(vars.entries());

const isSkillGateSatisfied = (
  vars: ReadonlyMap<string, number>,
  gate: MapDiscoverySkillGate,
): boolean =>
  isSkillRankGateSatisfiedFromVars(varsToRecord(vars), gate.skillId, gate.rank);

export const resolveDiscoveryRulesForSignal = (
  point: RuntimeMapPoint,
): MapDiscoveryRule[] => {
  if (point.discoveryRules && point.discoveryRules.length > 0) {
    return point.discoveryRules;
  }

  if (point.isSearchZone || point.isHidden || point.isHiddenInitially) {
    return [
      {
        channel: "proximity",
        signal: {
          enabled: true,
          radii: {
            coldEnterMeters: Math.max(
              point.searchRadiusMeters ?? point.discoveryRadiusMeters ?? 40,
              DEFAULT_DISCOVERY_SIGNAL_RADII.coldEnterMeters,
            ),
          },
        },
      },
    ];
  }

  return [];
};

export const isPointEligibleForDiscoverySignal = (
  point: RuntimeMapPoint,
  resolverInputs: MapResolverInputs,
): boolean => {
  if (point.state !== "locked") {
    return false;
  }
  if (point.category === "HUB" || point.isVisible) {
    return false;
  }

  const rules = resolveDiscoveryRulesForSignal(point);
  return rules.some((rule) => {
    if (!isSignalChannel(rule) || rule.signal?.enabled === false) {
      return false;
    }
    if (
      rule.conditions &&
      !rule.conditions.every((condition) =>
        evaluateMapCondition(
          {
            ...resolverInputs,
            pointState: point.state,
          },
          condition,
        ),
      )
    ) {
      return false;
    }
    if (
      rule.skillGates &&
      !rule.skillGates.every((gate) =>
        isSkillGateSatisfied(resolverInputs.vars, gate),
      )
    ) {
      return false;
    }

    return true;
  });
};

const resolvePhase = (
  distanceMeters: number,
  radii: DiscoverySignalPhaseRadii,
  previousPhase: DiscoverySignalPhase,
  sameTarget: boolean,
): DiscoverySignalPhase => {
  if (sameTarget && previousPhase === "hot") {
    return distanceMeters <= radii.hotExitMeters ? "hot" : "warm";
  }
  if (distanceMeters <= radii.hotEnterMeters) {
    return "hot";
  }

  if (sameTarget && previousPhase === "warm") {
    if (distanceMeters <= radii.hotEnterMeters) {
      return "hot";
    }
    return distanceMeters <= radii.warmExitMeters ? "warm" : "cold";
  }
  if (distanceMeters <= radii.warmEnterMeters) {
    return "warm";
  }

  if (sameTarget && previousPhase === "cold") {
    if (distanceMeters <= radii.warmEnterMeters) {
      return "warm";
    }
    return distanceMeters <= radii.coldExitMeters ? "cold" : "none";
  }
  if (distanceMeters <= radii.coldEnterMeters) {
    return "cold";
  }

  return "none";
};

interface CandidateSignal {
  point: RuntimeMapPoint;
  rule: MapDiscoveryRule;
  distanceMeters: number;
  phase: DiscoverySignalPhase;
  priority: number;
  hasInteraction: boolean;
}

export const resolveDiscoverySignal = ({
  position,
  candidates,
  resolverInputs,
  previous,
}: {
  position: LngLatTuple | null;
  candidates: readonly RuntimeMapPoint[];
  resolverInputs: MapResolverInputs;
  previous?: DiscoverySignalMemory | null;
}): DiscoverySignalResult => {
  if (!position) {
    return {
      state: "idle",
      phase: "none",
      target: null,
      distanceMeters: null,
      ambiguity: false,
    };
  }

  const signals: CandidateSignal[] = [];
  for (const point of candidates) {
    if (!isPointEligibleForDiscoverySignal(point, resolverInputs)) {
      continue;
    }

    const distanceMeters = haversineDistanceMeters(position, [
      point.lng,
      point.lat,
    ]);

    for (const rule of resolveDiscoveryRulesForSignal(point)) {
      if (!isSignalChannel(rule) || rule.signal?.enabled === false) {
        continue;
      }
      const sameTarget = previous?.targetId === point.id;
      const phase = resolvePhase(
        distanceMeters,
        mergeRadii(rule),
        sameTarget ? (previous?.phase ?? "none") : "none",
        sameTarget,
      );
      if (phase === "none") {
        continue;
      }

      signals.push({
        point,
        rule,
        distanceMeters,
        phase,
        priority: readRulePriority(rule),
        hasInteraction: point.availableBindings.length > 0,
      });
    }
  }

  if (signals.length === 0) {
    return {
      state: "idle",
      phase: "none",
      target: null,
      distanceMeters: null,
      ambiguity: false,
    };
  }

  signals.sort((left, right) => {
    if (left.hasInteraction !== right.hasInteraction) {
      return left.hasInteraction ? -1 : 1;
    }
    if (left.distanceMeters !== right.distanceMeters) {
      return left.distanceMeters - right.distanceMeters;
    }
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    return left.point.id.localeCompare(right.point.id);
  });

  const [primary, secondary] = signals;
  const ambiguity =
    Boolean(secondary) &&
    primary.phase === secondary.phase &&
    Math.abs(primary.distanceMeters - secondary.distanceMeters) <=
      INTERFERENCE_DISTANCE_DELTA_METERS;
  const state: DiscoverySignalState = ambiguity
    ? "interference"
    : primary.phase === "none"
      ? "idle"
      : primary.phase;

  return {
    state,
    phase: primary.phase,
    target: primary.point,
    distanceMeters: primary.distanceMeters,
    ambiguity,
  };
};
