import type { ReducerContextLike } from "./context";
import { senderOf } from "./context";

export const ensurePlayerProfileForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
): void => {
  const profile = ctx.db.playerProfile.playerId.find(playerId);
  if (!profile) {
    ctx.db.playerProfile.insert({
      playerId,
      nickname: undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }

  const location = ctx.db.playerLocation.playerId.find(playerId);
  if (!location) {
    ctx.db.playerLocation.insert({
      playerId,
      locationId: "loc_intro",
      updatedAt: ctx.timestamp,
    });
  }
};

export const ensurePlayerProfile = (ctx: ReducerContextLike): void => {
  ensurePlayerProfileForPlayer(ctx, senderOf(ctx) as { toHexString(): string });
};
