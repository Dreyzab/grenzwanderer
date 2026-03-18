import {
  getOriginProfileByFlags,
  originProfiles,
} from "../../character/originProfiles";
import { getScenarioById } from "../vnContent";
import type { VnScenario, VnSnapshot } from "../types";

export type FreiburgEntryTarget =
  | { kind: "blocked_sync" }
  | { kind: "resume"; scenarioId: string }
  | { kind: "select_origin" }
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

const resolveDefaultEntryScenarioId = (snapshot: VnSnapshot): string | null => {
  const scenarioId = snapshot.vnRuntime?.defaultEntryScenarioId;
  if (!scenarioId) {
    return null;
  }
  return getScenarioById(snapshot, scenarioId) ? scenarioId : null;
};

const collectFreiburgScenarioIds = (
  snapshot: VnSnapshot,
  defaultEntryScenarioId: string,
): Set<string> => {
  const scenarioIds = new Set<string>();

  for (const profile of originProfiles) {
    scenarioIds.add(profile.scenarioId);

    const bootstrapScenario = resolveBootstrapScenario(
      snapshot,
      profile.scenarioId,
      profile.originFlagKey,
    );
    if (bootstrapScenario) {
      scenarioIds.add(bootstrapScenario.id);
    }

    if (profile.wakeupScenarioId) {
      scenarioIds.add(profile.wakeupScenarioId);
    }

    for (const scenarioId of collectDownstreamScenarioIds(
      snapshot,
      profile.scenarioId,
    )) {
      scenarioIds.add(scenarioId);
    }
  }

  for (const scenarioId of collectDownstreamScenarioIds(
    snapshot,
    defaultEntryScenarioId,
  )) {
    scenarioIds.add(scenarioId);
  }

  return scenarioIds;
};

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
  } = input;

  if (
    !isConnected ||
    !contentReady ||
    !sessionReady ||
    !flagsReady ||
    !snapshot ||
    !identityHex ||
    snapshot.scenarios.length === 0
  ) {
    return { kind: "blocked_sync" };
  }

  const defaultEntryScenarioId = resolveDefaultEntryScenarioId(snapshot);
  if (!defaultEntryScenarioId) {
    return { kind: "blocked_sync" };
  }

  const candidateScenarioIds = collectFreiburgScenarioIds(
    snapshot,
    defaultEntryScenarioId,
  );
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

  const selectedProfile = getOriginProfileByFlags(flags);
  if (!selectedProfile) {
    return { kind: "select_origin" };
  }

  const handoffDone = selectedProfile.handoffDoneFlagKeys.some((flagKey) =>
    Boolean(flags[flagKey]),
  );
  if (handoffDone) {
    return { kind: "start", scenarioId: defaultEntryScenarioId };
  }

  const wakeupTriggered =
    selectedProfile.wakeupTriggerFlagKeys?.some((flagKey) =>
      Boolean(flags[flagKey]),
    ) ?? false;
  if (wakeupTriggered && selectedProfile.wakeupScenarioId) {
    const wakeupScenario = getScenarioById(
      snapshot,
      selectedProfile.wakeupScenarioId,
    );
    if (wakeupScenario) {
      return { kind: "start", scenarioId: selectedProfile.wakeupScenarioId };
    }
  }

  return { kind: "start", scenarioId: selectedProfile.scenarioId };
};
