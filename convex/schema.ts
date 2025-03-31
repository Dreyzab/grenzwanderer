import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(), // In production, this should be a hashed value!
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
    passwordReset: v.optional(v.boolean())
  }).index("by_email", ["email"]),

  players: defineTable({
    userId: v.id("users"),
    nickname: v.string(),
    avatar: v.optional(v.string()),
    faction: v.union(
      v.literal("officers"), 
      v.literal("villains"), 
      v.literal("neutrals"), 
      v.literal("survivors")
    ),
    reputation: v.object({
      officers: v.number(),
      villains: v.number(),
      neutrals: v.number(),
      survivors: v.number()
    }),
    equipment: v.object({
      primary: v.string(),
      secondary: v.optional(v.string()),
      consumables: v.array(v.string())
    }),
    questState: v.string(), // "registered", "character_creation", "training_mission", etc.
    creationStep: v.optional(v.number()),
    locationHistory: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number()
    })),
    inventory: v.optional(v.array(v.string())),
    discoveredNpcs: v.optional(v.array(v.id("npcs"))),
    activeQuests: v.optional(v.array(v.string())),
    completedQuests: v.optional(v.array(v.string())),
    experience: v.optional(v.number())
  }).index("by_userId", ["userId"]),
  
  scenes: defineTable({
    title: v.string(),
    sceneKey: v.string(), // Уникальный ключ для идентификации сцены
    background: v.optional(v.string()),
    text: v.string(),
    choices: v.array(v.object({
      text: v.string(),
      nextSceneId: v.optional(v.id("scenes")),
      action: v.optional(v.string()), // Special action to perform (e.g., "end_character_creation")
      equipmentChanges: v.optional(v.object({
        primary: v.optional(v.string()),
        secondary: v.optional(v.string()),
        consumables: v.optional(v.array(v.string()))
      }))
    }))
  }).index("by_sceneKey", ["sceneKey"]),

  mapPoints: defineTable({
    title: v.string(),
    description: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number()
    }),
    radius: v.number(), // Radius in meters
    requiredQuestState: v.optional(v.string()),
    linkedSceneId: v.optional(v.id("scenes")),
    isActive: v.boolean()
  }),

  qrCodes: defineTable({
    code: v.string(),
    type: v.string(), // "start_quest", "npc", "item", "location", etc.
    data: v.any(), // Custom data based on the type
    isOneTime: v.boolean(), // If true, can only be used once
    usedBy: v.optional(v.array(v.id("players"))) // List of players who used this code
  }).index("by_code", ["code"]),
  
  events: defineTable({
    title: v.string(),
    description: v.string(),
    votes: v.array(v.object({
      playerId: v.id("players"),
      choice: v.string(),
      modifier: v.number()
    })),
    successThreshold: v.number(),
    result: v.optional(v.string()), // "success", "failure", null if not yet resolved
    createdAt: v.number(),
    endedAt: v.optional(v.number())
  }),
  
  roles: defineTable({
    name: v.union(
      v.literal("Sheriff"), 
      v.literal("Deputy"), 
      v.literal("Traitor"), 
      v.literal("Villain"), 
      v.literal("Renegade")
    ),
    description: v.string(),
    objectives: v.array(v.string()),
    specialAbilities: v.optional(v.array(v.string()))
  }),

  npcs: defineTable({
    name: v.string(),
    type: v.string(), // "trader", "craftsman", "officer", etc.
    faction: v.string(),
    description: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number()
    }),
    isShop: v.boolean(),
    shopItems: v.optional(v.array(v.string()))
  }),
  
  items: defineTable({
    name: v.string(),
    type: v.string(), // "weapon", "armor", "consumable", "quest", etc.
    description: v.string(),
    value: v.number(),
    effects: v.optional(v.array(v.string()))
  })
});