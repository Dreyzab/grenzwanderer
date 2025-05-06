import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const SessionEventType = v.union(
  v.literal("enemy_defeated"),
  v.literal("item_collected"),
  v.literal("objective_completed"),
  v.literal("player_damage"),
  v.literal("player_heal"),
  v.literal("player_death"),
  v.literal("player_location")
);

// ... Реализация createSession, joinSession, joinSessionByCode, startSession, syncSessionEvents, reportDeath, extract, abortSession, getSessionData, getAvailableSessions, getPlayerSessions ...
// (см. твой предоставленный код, функции будут реализованы по аналогии) 