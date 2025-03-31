import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { QUEST_STATE, FACTION } from "./quest"; // предполагаем, что константы экспортированы

// Check if player profile exists, create it if not
export const getOrCreatePlayer = mutation({
  args: { 
    userId: v.id("users"),
    nickname: v.optional(v.string())
  },
  handler: async (ctx, { userId, nickname }) => {
    // Check if player already exists
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (existingPlayer) {
      return existingPlayer;
    }
    
    // Create a new player profile
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Пользователь не найден");
    }
    
    const playerNickname = nickname || `Wanderer-${Math.floor(Math.random() * 10000)}`;
    
    const playerId = await ctx.db.insert("players", {
      userId,
      nickname: playerNickname,
      faction: FACTION.NEUTRALS,
      reputation: {
        officers: 0,
        villains: 0,
        neutrals: 0,
        survivors: 0
      },
      equipment: { 
        primary: "", 
        consumables: [] 
      },
      questState: QUEST_STATE.REGISTERED,
      creationStep: 0,
      locationHistory: [],
      inventory: [],
      discoveredNpcs: [],
      activeQuests: [],
      completedQuests: []
    });
    
    return await ctx.db.get(playerId);
  },
});

// Get player profile
export const getPlayerProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// Update player location
export const updatePlayerLocation = mutation({
  args: { 
    playerId: v.id("players"),
    lat: v.number(),
    lng: v.number()
  },
  handler: async (ctx, { playerId, lat, lng }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }
    
    const locationHistory = [...player.locationHistory, {
      lat,
      lng,
      timestamp: Date.now()
    }];
    
    // Keep only last 20 locations
    if (locationHistory.length > 20) {
      locationHistory.shift();
    }
    
    await ctx.db.patch(playerId, {
      locationHistory
    });
    
    return locationHistory;
  },
});