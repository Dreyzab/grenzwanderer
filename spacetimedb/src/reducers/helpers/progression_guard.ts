import { SenderError } from "spacetimedb/server";
import { hasAdminIdentity } from "./auth";
import { createSessionKey } from "./keys";
import { getActiveSnapshot, getNode } from "./snapshot";
import {
  nodeAuthorizesDiscoverFact,
  nodeContainsClueToken,
  nodeContainsItemToken,
} from "./vn_interactive_tokens";

const CLIENT_ALLOWLISTED_FLAG_KEYS = new Set(["lang_en", "lang_de", "lang_ru"]);

const CLIENT_ALLOWLISTED_VAR_KEYS = new Set(["game_time_minutes"]);

export const isProgressionBypassIdentity = (ctx: any): boolean =>
  hasAdminIdentity(ctx);

export const assertDirectProgressionReducerAllowed = (
  ctx: any,
  reducerName: string,
): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }
  throw new SenderError(
    `${reducerName} must be applied through gameplay reducers (record_choice, map_interact, or authored effects)`,
  );
};

export const assertClientSetFlagAllowed = (ctx: any, key: string): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }
  if (CLIENT_ALLOWLISTED_FLAG_KEYS.has(key)) {
    return;
  }
  if (key.startsWith("DISCOVERED_") || key.startsWith("VISITED_")) {
    return;
  }
  throw new SenderError(`Direct flag mutation is not allowed for key ${key}`);
};

export const assertClientSetVarAllowed = (ctx: any, key: string): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }
  if (CLIENT_ALLOWLISTED_VAR_KEYS.has(key)) {
    return;
  }
  throw new SenderError(`Direct var mutation is not allowed for key ${key}`);
};

const isSessionOpen = (completedAt: unknown): boolean => {
  if (completedAt === undefined || completedAt === null) {
    return true;
  }
  if (
    typeof completedAt === "object" &&
    completedAt !== null &&
    "tag" in completedAt
  ) {
    return (completedAt as { tag?: string }).tag !== "some";
  }
  return false;
};

const findOpenVnSession = (ctx: any) => {
  for (const row of ctx.db.vnSession.vn_session_player_id.filter(ctx.sender)) {
    if (isSessionOpen(row.completedAt)) {
      return row;
    }
  }
  return null;
};

const getOpenVnNode = (ctx: any) => {
  const session = findOpenVnSession(ctx);
  if (!session) {
    return null;
  }

  const { snapshot } = getActiveSnapshot(ctx);
  try {
    const node = getNode(snapshot, session.nodeId);
    if (node.scenarioId !== session.scenarioId) {
      return null;
    }
    return node;
  } catch {
    return null;
  }
};

export const assertVnInteractiveEvidenceAllowed = (
  ctx: any,
  evidenceId: string,
): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }

  const node = getOpenVnNode(ctx);
  if (!node || !nodeContainsClueToken(node, evidenceId)) {
    throw new SenderError(
      "grant_evidence is only allowed for interactive clue tokens on the active VN node",
    );
  }
};

export const assertVnInteractiveDiscoverFactAllowed = (
  ctx: any,
  caseId: string,
  factId: string,
): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }

  const node = getOpenVnNode(ctx);
  if (!node || !nodeAuthorizesDiscoverFact(node, caseId, factId)) {
    throw new SenderError(
      "discover_fact is only allowed for facts authorized on the active VN node",
    );
  }
};

export const assertVnInteractiveItemAllowed = (
  ctx: any,
  itemId: string,
): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }

  const node = getOpenVnNode(ctx);
  if (!node || !nodeContainsItemToken(node, itemId)) {
    throw new SenderError(
      "grant_item is only allowed for interactive item tokens on the active VN node",
    );
  }
};

export const assertActiveVnNodeMatch = (
  ctx: any,
  scenarioId: string,
  nodeId: string,
): void => {
  const session = findOpenVnSession(ctx);
  if (!session) {
    throw new SenderError("AI request requires an active VN session");
  }
  if (session.scenarioId !== scenarioId || session.nodeId !== nodeId) {
    throw new SenderError("AI request does not match the active VN node");
  }
};

export const assertClientStartScenarioAllowed = (
  ctx: any,
  scenarioId: string,
): void => {
  if (isProgressionBypassIdentity(ctx)) {
    return;
  }

  const { snapshot } = getActiveSnapshot(ctx);
  const scenario = snapshot.scenarios.find((entry) => entry.id === scenarioId);
  if (!scenario) {
    throw new SenderError(`Unknown scenario ${scenarioId}`);
  }

  const inboundScenarios = snapshot.scenarios.filter(
    (entry) => entry.completionRoute?.nextScenarioId === scenarioId,
  );
  if (inboundScenarios.length === 0) {
    return;
  }

  const hasOpenSession = Boolean(
    ctx.db.vnSession.sessionKey.find(createSessionKey(ctx.sender, scenarioId)),
  );
  if (hasOpenSession) {
    return;
  }

  throw new SenderError(
    "start_scenario for chained scenarios must use map_interact or completion routes",
  );
};
