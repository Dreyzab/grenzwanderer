import { SenderError } from "spacetimedb/server";

import { applyEffects } from "./effects";
import {
  buildCommandActorPresentation,
  buildCommandOrderPresentation,
  getActiveCommandSession,
  replaceCommandPartyMembers,
} from "./command_runtime";
import { getCommandScenario } from "./command_scenarios";
import { createCommandHistoryKey } from "./map_keys";
import { emitTelemetry } from "./telemetry";

export const resolveCommandInternal = (ctx: any): void => {
  const session = getActiveCommandSession(ctx);
  if (session.phase !== "resolving" || !session.selectedOrderId) {
    throw new SenderError("No command order is awaiting resolution");
  }

  const scenario = getCommandScenario(session.scenarioId);
  const order = scenario.orders.find(
    (entry) => entry.id === session.selectedOrderId,
  );
  if (!order) {
    throw new SenderError(`Unknown command order ${session.selectedOrderId}`);
  }

  applyEffects(ctx, order.effects, {
    sourceType: "command_order",
    sourceId: `${scenario.id}::${order.id}`,
  });

  ctx.db.commandOrderHistory.insert({
    historyKey: createCommandHistoryKey(
      ctx.sender,
      order.id,
      ctx.timestamp.microsSinceUnixEpoch,
    ),
    sessionKey: session.sessionKey,
    playerId: ctx.sender,
    scenarioId: scenario.id,
    orderId: order.id,
    actorId: order.actorId,
    title: order.resultTitle,
    summary: order.resultSummary,
    createdAt: ctx.timestamp,
  });

  const refreshedOrders = buildCommandOrderPresentation(ctx, scenario);
  const refreshedActors = scenario.actors
    .map((actor) => buildCommandActorPresentation(ctx, actor))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  replaceCommandPartyMembers(ctx, session.sessionKey, refreshedActors);

  ctx.db.commandSession.sessionKey.update({
    ...session,
    phase: "result",
    status: "resolved",
    ordersJson: JSON.stringify(refreshedOrders),
    resultTitle: order.resultTitle,
    resultSummary: order.resultSummary,
    updatedAt: ctx.timestamp,
    resolvedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "command_order_resolved", {
    scenarioId: scenario.id,
    orderId: order.id,
    actorId: order.actorId,
  });
};
