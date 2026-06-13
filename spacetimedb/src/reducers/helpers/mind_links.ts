import { SenderError } from "spacetimedb/server";
import {
  createPlayerMindBoardKey,
  createPlayerMindFactKey,
  createPlayerMindHypothesisKey,
  createPlayerMindLinkKey,
} from "./entity_keys";
import {
  ensureMindCaseActive,
  ensureMindFactForCase,
  ensureMindHypothesisForCase,
} from "./mind_guards";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";

export const MAX_BOARD_LAYOUT_JSON_LENGTH = 16_384;

export const getLinkedFactIdsForHypothesis = (
  ctx: any,
  caseId: string,
  hypothesisId: string,
): Set<string> => {
  const linked = new Set<string>();
  for (const row of ctx.db.playerMindLink.player_mind_link_player_id.filter(
    ctx.sender,
  )) {
    if (row.caseId !== caseId || row.hypothesisId !== hypothesisId) {
      continue;
    }
    linked.add(row.factId);
  }

  return linked;
};

export const linkFactInternal = (
  ctx: any,
  caseId: string,
  factId: string,
  hypothesisId: string,
): boolean => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);
  ensureMindFactForCase(ctx, caseId, factId);
  ensureMindHypothesisForCase(ctx, caseId, hypothesisId);

  const playerFactKey = createPlayerMindFactKey(ctx.sender, caseId, factId);
  if (!ctx.db.playerMindFact.playerFactKey.find(playerFactKey)) {
    throw new SenderError(`Fact ${factId} has not been discovered yet`);
  }

  const playerLinkKey = createPlayerMindLinkKey(
    ctx.sender,
    caseId,
    factId,
    hypothesisId,
  );
  if (ctx.db.playerMindLink.playerLinkKey.find(playerLinkKey)) {
    return false;
  }

  ctx.db.playerMindLink.insert({
    playerLinkKey,
    playerId: ctx.sender,
    caseId,
    factId,
    hypothesisId,
    createdAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "mind_fact_linked", {
    caseId,
    factId,
    hypothesisId,
  });

  return true;
};

export const unlinkFactInternal = (
  ctx: any,
  caseId: string,
  factId: string,
  hypothesisId: string,
): boolean => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);

  const playerLinkKey = createPlayerMindLinkKey(
    ctx.sender,
    caseId,
    factId,
    hypothesisId,
  );
  if (!ctx.db.playerMindLink.playerLinkKey.find(playerLinkKey)) {
    return false;
  }

  const playerHypothesisKey = createPlayerMindHypothesisKey(
    ctx.sender,
    caseId,
    hypothesisId,
  );
  const playerHypothesis =
    ctx.db.playerMindHypothesis.playerHypothesisKey.find(playerHypothesisKey);
  if (playerHypothesis?.status === "validated") {
    throw new SenderError("Cannot unlink facts from a validated hypothesis");
  }

  ctx.db.playerMindLink.playerLinkKey.delete(playerLinkKey);

  emitTelemetry(ctx, "mind_fact_unlinked", {
    caseId,
    factId,
    hypothesisId,
  });

  return true;
};

const isFinitePoint = (value: unknown): boolean => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Record<string, unknown>;
  return (
    typeof point.x === "number" &&
    Number.isFinite(point.x) &&
    typeof point.y === "number" &&
    Number.isFinite(point.y)
  );
};

export const saveBoardLayoutInternal = (
  ctx: any,
  caseId: string,
  layoutJson: string,
): void => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);

  if (layoutJson.length > MAX_BOARD_LAYOUT_JSON_LENGTH) {
    throw new SenderError("layoutJson exceeds the maximum allowed size");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(layoutJson);
  } catch (_error) {
    throw new SenderError("layoutJson must be valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SenderError("layoutJson must be an object of node positions");
  }
  for (const value of Object.values(parsed as Record<string, unknown>)) {
    if (!isFinitePoint(value)) {
      throw new SenderError("layoutJson values must be {x, y} finite numbers");
    }
  }

  const playerBoardKey = createPlayerMindBoardKey(ctx.sender, caseId);
  const existing =
    ctx.db.playerMindBoardLayout.playerBoardKey.find(playerBoardKey);
  if (existing) {
    ctx.db.playerMindBoardLayout.playerBoardKey.update({
      ...existing,
      layoutJson,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerMindBoardLayout.insert({
      playerBoardKey,
      playerId: ctx.sender,
      caseId,
      layoutJson,
      updatedAt: ctx.timestamp,
    });
  }
};
