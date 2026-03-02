import type { OriginProfileDefinition } from "../../character/originProfiles";
import { getScenarioById } from "../vnContent";
import type { VnScenario, VnSnapshot } from "../types";

export type FreiburgEntryTarget =
  | { kind: "blocked_sync" }
  | { kind: "resume"; scenarioId: string }
  | { kind: "show_dossier"; profileId: "journalist" }
  | { kind: "start"; scenarioId: string };

export interface ResolveFreiburgEntryInput {
  isConnected: boolean;
  contentReady: boolean;
  sessionReady: boolean;
  flagsReady: boolean;
  identityHex: string;
  snapshot: VnSnapshot | null;
  sessions: readonly {
    [key: string]: unknown;
    playerId: { toHexString(): string };
    scenarioId: string;
    updatedAt: unknown;
    completedAt?: unknown;
  }[];
  flags: Record<string, boolean>;
  originProfile: OriginProfileDefinition | null;
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

const extractMicros = (value: unknown): bigint => {
  if (
    typeof value === "object" &&
    value !== null &&
    "microsSinceUnixEpoch" in value
  ) {
    const micros = (value as { microsSinceUnixEpoch?: unknown })
      .microsSinceUnixEpoch;
    if (typeof micros === "bigint") {
      return micros;
    }
    if (typeof micros === "number" && Number.isFinite(micros)) {
      return BigInt(Math.floor(micros));
    }
    if (typeof micros === "string" && micros.trim().length > 0) {
      try {
        return BigInt(micros);
      } catch {
        return 0n;
      }
    }
  }
  return 0n;
};

const resolveBootstrapScenario = (
  snapshot: VnSnapshot,
  originScenarioId: string,
  originFlagKey: string,
): VnScenario | null => {
  const inbound = snapshot.scenarios
    .filter(
      (scenario) =>
        scenario.completionRoute?.nextScenarioId === originScenarioId,
    )
    .filter((scenario) =>
      (scenario.completionRoute?.requiredFlagsAll ?? []).includes(
        originFlagKey,
      ),
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  return inbound[0] ?? null;
};

const resolvePostOriginScenarioId = (
  snapshot: VnSnapshot,
  originScenarioId: string,
): string | null => {
  const preferred = snapshot.vnRuntime?.defaultEntryScenarioId;
  if (preferred && getScenarioById(snapshot, preferred)) {
    return preferred;
  }

  const fallback =
    snapshot.scenarios.find((scenario) => scenario.id !== originScenarioId) ??
    snapshot.scenarios[0];
  return fallback?.id ?? null;
};

const collectDownstreamScenarioIds = (
  snapshot: VnSnapshot,
  startScenarioId: string,
): string[] => {
  const queue = [startScenarioId];
  const visited = new Set<string>();
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    ordered.push(current);

    const scenario = getScenarioById(snapshot, current);
    const nextScenarioId = scenario?.completionRoute?.nextScenarioId;
    if (nextScenarioId) {
      queue.push(nextScenarioId);
    }
  }

  return ordered;
};

const isOpenSession = (session: { completedAt?: unknown }): boolean =>
  !hasOptionalValue(session.completedAt);

export const resolveFreiburgEntryTarget = (
  input: ResolveFreiburgEntryInput,
): FreiburgEntryTarget => {
  const {
    isConnected,
    contentReady,
    sessionReady,
    flagsReady,
    identityHex,
    snapshot,
    sessions,
    flags,
    originProfile,
  } = input;

  if (
    !isConnected ||
    !contentReady ||
    !sessionReady ||
    !flagsReady ||
    !snapshot ||
    !identityHex ||
    !originProfile ||
    snapshot.scenarios.length === 0
  ) {
    return { kind: "blocked_sync" };
  }

  const originScenarioId = originProfile.scenarioId;
  const bootstrapScenario = resolveBootstrapScenario(
    snapshot,
    originScenarioId,
    originProfile.originFlagKey,
  );
  const postOriginScenarioId = resolvePostOriginScenarioId(
    snapshot,
    originScenarioId,
  );
  if (!postOriginScenarioId) {
    return { kind: "blocked_sync" };
  }

  const candidateScenarioIds = new Set<string>();
  candidateScenarioIds.add(originScenarioId);
  candidateScenarioIds.add(postOriginScenarioId);
  if (bootstrapScenario) {
    candidateScenarioIds.add(bootstrapScenario.id);
  }

  for (const scenarioId of collectDownstreamScenarioIds(
    snapshot,
    originScenarioId,
  )) {
    candidateScenarioIds.add(scenarioId);
  }
  for (const scenarioId of collectDownstreamScenarioIds(
    snapshot,
    postOriginScenarioId,
  )) {
    candidateScenarioIds.add(scenarioId);
  }

  const activeSessions = sessions
    .filter((session) => session.playerId.toHexString() === identityHex)
    .filter((session) => candidateScenarioIds.has(session.scenarioId))
    .filter((session) => isOpenSession(session))
    .sort((left, right) => {
      const leftMicros = extractMicros(left.updatedAt);
      const rightMicros = extractMicros(right.updatedAt);
      if (rightMicros > leftMicros) {
        return 1;
      }
      if (rightMicros < leftMicros) {
        return -1;
      }
      return 0;
    });
  if (activeSessions.length > 0) {
    return { kind: "resume", scenarioId: activeSessions[0].scenarioId };
  }

  const hasOriginSelected = Boolean(flags[originProfile.originFlagKey]);
  if (!hasOriginSelected) {
    return { kind: "show_dossier", profileId: "journalist" };
  }

  if (
    Boolean(flags.origin_journalist_handoff_done) ||
    Boolean(flags.met_anna_intro)
  ) {
    return { kind: "start", scenarioId: postOriginScenarioId };
  }

  return { kind: "start", scenarioId: originScenarioId };
};
