import { SenderError } from "spacetimedb/server";

import {
  getCommandScenario,
  type CommandActorPresentation,
  type CommandOrderPresentation,
  type CommandScenarioTemplate,
} from "./command_scenarios";
import {
  createCommandPartyMemberKey,
  createCommandSessionKey,
  createFlagKey,
  createNpcStateKey,
  createRelationshipKey,
  identityKey,
} from "./map_keys";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";
import type { CommandPhase, CommandReturnTab } from "./types";

interface CommandActorTemplate {
  actorId: string;
  label: string;
  role: string;
  notes?: string;
  sortOrder: number;
  trustCharacterId?: string;
  alwaysAvailable?: boolean;
  unlockFlag?: string;
  minimumRelationship?: {
    characterId: string;
    value: number;
  };
}

const getFlag = (ctx: any, key: string): boolean => {
  const row = ctx.db.playerFlag.flagId.find(createFlagKey(ctx.sender, key));
  return row?.value ?? false;
};

const getLegacyRelationshipValue = (ctx: any, characterId: string): number => {
  const row = ctx.db.playerRelationship.relationshipKey.find(
    createRelationshipKey(ctx.sender, characterId),
  );
  return row ? row.value : 0;
};

const getRelationshipValue = (ctx: any, characterId: string): number => {
  const row = ctx.db.playerNpcState.npcStateKey.find(
    createNpcStateKey(ctx.sender, characterId),
  );
  return row ? row.trustScore : getLegacyRelationshipValue(ctx, characterId);
};

const isCommandActorUnlocked = (
  ctx: any,
  actor: CommandActorTemplate,
): boolean => {
  if (actor.alwaysAvailable) {
    return true;
  }

  if (actor.unlockFlag && getFlag(ctx, actor.unlockFlag)) {
    return true;
  }

  if (actor.minimumRelationship) {
    return (
      getRelationshipValue(ctx, actor.minimumRelationship.characterId) >=
      actor.minimumRelationship.value
    );
  }

  return false;
};

export const buildCommandActorPresentation = (
  ctx: any,
  actor: CommandActorTemplate,
): CommandActorPresentation => {
  const trust = actor.trustCharacterId
    ? getRelationshipValue(ctx, actor.trustCharacterId)
    : 0;
  const availability = isCommandActorUnlocked(ctx, actor)
    ? "available"
    : "locked";

  return {
    actorId: actor.actorId,
    label: actor.label,
    role: actor.role,
    availability,
    trust,
    notes:
      availability === "available"
        ? actor.notes
        : (actor.notes ?? "This operative has not been unlocked yet."),
    sortOrder: actor.sortOrder,
  };
};

export const buildCommandOrderPresentation = (
  ctx: any,
  scenario: CommandScenarioTemplate,
): CommandOrderPresentation[] => {
  const actors = new Map(
    scenario.actors.map((actor) => [
      actor.actorId,
      buildCommandActorPresentation(ctx, actor),
    ]),
  );

  return scenario.orders.map((order) => {
    const actor = actors.get(order.actorId);
    const isAvailable = actor?.availability === "available";
    return {
      id: order.id,
      actorId: order.actorId,
      label: order.label,
      description: order.description,
      effectPreview: order.effectPreview,
      disabled: !isAvailable,
      disabledReason: isAvailable
        ? undefined
        : `${actor?.label ?? order.actorId} is not ready for assignment.`,
    };
  });
};

export const replaceCommandPartyMembers = (
  ctx: any,
  sessionKey: string,
  actors: readonly CommandActorPresentation[],
): void => {
  for (const row of ctx.db.commandPartyMember.iter()) {
    if (
      row.sessionKey === sessionKey &&
      identityKey(row.playerId) === identityKey(ctx.sender)
    ) {
      ctx.db.commandPartyMember.memberKey.delete(row.memberKey);
    }
  }

  for (const actor of actors) {
    ctx.db.commandPartyMember.insert({
      memberKey: createCommandPartyMemberKey(ctx.sender, actor.actorId),
      sessionKey,
      playerId: ctx.sender,
      actorId: actor.actorId,
      label: actor.label,
      role: actor.role,
      availability: actor.availability,
      trust: actor.trust,
      notes: actor.notes,
      sortOrder: actor.sortOrder,
      updatedAt: ctx.timestamp,
    });
  }
};

export const getActiveCommandSession = (ctx: any): any => {
  const session = ctx.db.commandSession.sessionKey.find(
    createCommandSessionKey(ctx.sender),
  );
  if (!session || session.status === "closed") {
    throw new SenderError("No active command session");
  }
  return session;
};

export const openCommandModeInternal = (
  ctx: any,
  scenarioId: string,
  options: {
    returnTab?: CommandReturnTab;
    sourceTab?: CommandReturnTab;
  } = {},
): void => {
  ensurePlayerProfile(ctx);

  const scenario = getCommandScenario(scenarioId);
  const actors = scenario.actors
    .map((actor) => buildCommandActorPresentation(ctx, actor))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const orders = buildCommandOrderPresentation(ctx, scenario);
  const sessionKey = createCommandSessionKey(ctx.sender);
  const existing = ctx.db.commandSession.sessionKey.find(sessionKey);

  const nextRow = {
    sessionKey,
    playerId: ctx.sender,
    scenarioId,
    sourceTab: options.sourceTab ?? "map",
    returnTab: options.returnTab ?? options.sourceTab ?? "map",
    phase: "orders" as CommandPhase,
    status: "active",
    title: scenario.title,
    briefing: scenario.briefing,
    ordersJson: JSON.stringify(orders),
    selectedOrderId: undefined,
    resultTitle: undefined,
    resultSummary: undefined,
    createdAt: existing?.createdAt ?? ctx.timestamp,
    updatedAt: ctx.timestamp,
    resolvedAt: undefined,
    closedAt: undefined,
  };

  if (existing) {
    ctx.db.commandSession.sessionKey.update({
      ...existing,
      ...nextRow,
    });
  } else {
    ctx.db.commandSession.insert(nextRow);
  }

  replaceCommandPartyMembers(ctx, sessionKey, actors);

  emitTelemetry(ctx, "command_mode_opened", {
    scenarioId,
    sourceTab: nextRow.sourceTab,
    returnTab: nextRow.returnTab,
  });
};

export const issueCommandInternal = (ctx: any, orderId: string): any => {
  const session = getActiveCommandSession(ctx);
  if (session.phase !== "orders" && session.phase !== "briefing") {
    throw new SenderError("Command session is not ready for new orders");
  }

  const scenario = getCommandScenario(session.scenarioId);
  const availableOrders = buildCommandOrderPresentation(ctx, scenario);
  const selected = availableOrders.find((entry) => entry.id === orderId);
  if (!selected) {
    throw new SenderError(`Unknown command order ${orderId}`);
  }
  if (selected.disabled) {
    throw new SenderError(selected.disabledReason ?? "Command order is locked");
  }

  ctx.db.commandSession.sessionKey.update({
    ...session,
    phase: "resolving",
    selectedOrderId: orderId,
    resultTitle: undefined,
    resultSummary: undefined,
    updatedAt: ctx.timestamp,
    closedAt: undefined,
  });

  emitTelemetry(ctx, "command_order_issued", {
    scenarioId: session.scenarioId,
    orderId,
    actorId: selected.actorId,
  });

  return selected;
};

export const closeCommandModeInternal = (ctx: any): void => {
  const session = getActiveCommandSession(ctx);

  ctx.db.commandSession.sessionKey.update({
    ...session,
    phase: "closed",
    status: "closed",
    updatedAt: ctx.timestamp,
    closedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "command_mode_closed", {
    scenarioId: session.scenarioId,
    returnTab: session.returnTab,
  });
};
