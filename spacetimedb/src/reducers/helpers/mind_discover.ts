import {
  createPlayerMindCaseKey,
  createPlayerMindFactKey,
} from "./entity_keys";
import { ensureMindCaseActive, ensureMindFactForCase } from "./mind_guards";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";

export const ensurePlayerMindCaseRow = (ctx: any, caseId: string): any => {
  const playerCaseKey = createPlayerMindCaseKey(ctx.sender, caseId);
  const existing = ctx.db.playerMindCase.playerCaseKey.find(playerCaseKey);

  if (existing) {
    return existing;
  }

  const created = {
    playerCaseKey,
    playerId: ctx.sender,
    caseId,
    status: "in_progress",
    startedAt: ctx.timestamp,
    completedAt: undefined,
    updatedAt: ctx.timestamp,
  };
  ctx.db.playerMindCase.insert(created);
  return created;
};

export const discoverFactInternal = (
  ctx: any,
  caseId: string,
  factId: string,
  source: { sourceType: string; sourceId: string },
): boolean => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);
  ensureMindFactForCase(ctx, caseId, factId);

  const playerCase = ensurePlayerMindCaseRow(ctx, caseId);
  if (playerCase.status !== "in_progress") {
    ctx.db.playerMindCase.playerCaseKey.update({
      ...playerCase,
      status: "in_progress",
      completedAt: undefined,
      updatedAt: ctx.timestamp,
    });
  }

  const playerFactKey = createPlayerMindFactKey(ctx.sender, caseId, factId);
  const existing = ctx.db.playerMindFact.playerFactKey.find(playerFactKey);
  if (existing) {
    return false;
  }

  ctx.db.playerMindFact.insert({
    playerFactKey,
    playerId: ctx.sender,
    caseId,
    factId,
    discoveredAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "mind_fact_discovered", {
    caseId,
    factId,
    sourceType: source.sourceType,
    sourceId: source.sourceId,
  });

  return true;
};
