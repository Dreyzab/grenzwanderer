import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Типы станций для крафта
export const StationType = v.union(
  v.literal("workbench"),
  v.literal("laboratory"),
  v.literal("forge"),
  v.literal("electronics"),
  v.literal("chemistry")
);

// Запросы для работы с убежищем игрока

export const getShelter = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const shelter = await ctx.db
      .query("shelters")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", playerId))
      .first();
    return shelter || null;
  },
});

export const createShelter = mutation({
  args: { playerId: v.id("players"), name: v.optional(v.string()) },
  handler: async (ctx, { playerId, name }) => {
    const existingShelter = await ctx.db
      .query("shelters")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", playerId))
      .first();
    if (existingShelter) throw new Error("У игрока уже есть убежище");
    const shelterId = await ctx.db.insert("shelters", {
      ownerId: playerId,
      name: name || "Убежище",
      level: 1,
      resources: {},
      stations: [{ type: "workbench", level: 1 }],
      storage: {},
      activeCrafts: []
    });
    return shelterId;
  },
});

export const addResources = mutation({
  args: { shelterId: v.id("shelters"), resources: v.record(v.string(), v.number()) },
  handler: async (ctx, { shelterId, resources }) => {
    const shelter = await ctx.db.get(shelterId);
    if (!shelter) throw new Error("Убежище не найдено");
    const updatedResources = { ...shelter.resources };
    for (const [resourceId, quantity] of Object.entries(resources)) {
      updatedResources[resourceId] = (updatedResources[resourceId] || 0) + quantity;
    }
    await ctx.db.patch(shelterId, { resources: updatedResources });
    return updatedResources;
  },
});

export const upgradeStation = mutation({
  args: { shelterId: v.id("shelters"), stationType: StationType, newLevel: v.number() },
  handler: async (ctx, { shelterId, stationType, newLevel }) => {
    const shelter = await ctx.db.get(shelterId);
    if (!shelter) throw new Error("Убежище не найдено");
    const stations = [...shelter.stations];
    const stationIndex = stations.findIndex(station => station.type === stationType);
    if (stationIndex === -1) {
      stations.push({ type: stationType, level: newLevel });
    } else {
      stations[stationIndex].level = newLevel;
    }
    await ctx.db.patch(shelterId, { stations });
    return stations;
  },
});

export const startCrafting = mutation({
  args: {
    shelterId: v.id("shelters"),
    recipeId: v.string(),
    stationType: StationType
  },
  handler: async (ctx, { shelterId, recipeId, stationType }) => {
    const shelter = await ctx.db.get(shelterId);
    if (!shelter) throw new Error("Убежище не найдено");
    const recipe = await ctx.db
      .query("craft_recipes")
      .withIndex("by_recipeId", (q) => q.eq("recipeId", recipeId))
      .first();
    if (!recipe) throw new Error("Рецепт не найден");
    const station = shelter.stations.find(s => s.type === stationType && s.level >= recipe.requiredStationLevel);
    if (!station) throw new Error(`Для крафта требуется станция типа ${stationType} уровня ${recipe.requiredStationLevel} или выше`);
    const requiredResources = recipe.requiredResources;
    for (const [resourceId, quantity] of Object.entries(requiredResources)) {
      const available = shelter.resources[resourceId] || 0;
      if (available < quantity) throw new Error(`Недостаточно ресурса ${resourceId}: требуется ${quantity}, доступно ${available}`);
    }
    const updatedResources = { ...shelter.resources };
    for (const [resourceId, quantity] of Object.entries(requiredResources)) {
      updatedResources[resourceId] -= quantity;
    }
    const craftTime = recipe.craftTime || 30000;
    const endTime = Date.now() + craftTime;
    const craftJob = {
      recipeId,
      startTime: Date.now(),
      endTime,
      stationType,
      completed: false
    };
    const activeCrafts = [...shelter.activeCrafts, craftJob];
    await ctx.db.patch(shelterId, {
      resources: updatedResources,
      activeCrafts
    });
    return craftJob;
  },
});

export const claimCraftResult = mutation({
  args: {
    shelterId: v.id("shelters"),
    craftIndex: v.number(),
    playerId: v.id("players")
  },
  handler: async (ctx, { shelterId, craftIndex, playerId }) => {
    const shelter = await ctx.db.get(shelterId);
    if (!shelter) throw new Error("Убежище не найдено");
    if (craftIndex < 0 || craftIndex >= shelter.activeCrafts.length) throw new Error("Неверный индекс задания");
    const craftJob = shelter.activeCrafts[craftIndex];
    if (Date.now() < craftJob.endTime && !craftJob.completed) throw new Error("Крафт еще не завершен");
    const recipe = await ctx.db
      .query("craft_recipes")
      .withIndex("by_recipeId", (q) => q.eq("recipeId", craftJob.recipeId))
      .first();
    if (!recipe) throw new Error("Рецепт не найден");
    await ctx.db.insert("inventories", {
      ownerId: playerId,
      ownerType: "player",
      itemId: recipe.resultItemId,
      quantity: recipe.resultQuantity || 1,
      location: "stash",
      equipped: false
    });
    const activeCrafts = shelter.activeCrafts.filter((_, index) => index !== craftIndex);
    await ctx.db.patch(shelterId, { activeCrafts });
    return {
      itemId: recipe.resultItemId,
      quantity: recipe.resultQuantity || 1
    };
  },
});

export const cancelCrafting = mutation({
  args: {
    shelterId: v.id("shelters"),
    craftIndex: v.number()
  },
  handler: async (ctx, { shelterId, craftIndex }) => {
    const shelter = await ctx.db.get(shelterId);
    if (!shelter) throw new Error("Убежище не найдено");
    if (craftIndex < 0 || craftIndex >= shelter.activeCrafts.length) throw new Error("Неверный индекс задания");
    const craftJob = shelter.activeCrafts[craftIndex];
    const recipe = await ctx.db
      .query("craft_recipes")
      .withIndex("by_recipeId", (q) => q.eq("recipeId", craftJob.recipeId))
      .first();
    if (!recipe) throw new Error("Рецепт не найден");
    const refundRate = 0.8;
    const updatedResources = { ...shelter.resources };
    for (const [resourceId, quantity] of Object.entries(recipe.requiredResources)) {
      const refundAmount = Math.floor(quantity * refundRate);
      updatedResources[resourceId] = (updatedResources[resourceId] || 0) + refundAmount;
    }
    const activeCrafts = shelter.activeCrafts.filter((_, index) => index !== craftIndex);
    await ctx.db.patch(shelterId, {
      activeCrafts,
      resources: updatedResources
    });
    return true;
  },
});

export const getAvailableRecipes = query({
  args: { shelterId: v.id("shelters") },
  handler: async (ctx, { shelterId }) => {
    const shelter = await ctx.db.get(shelterId);
    if (!shelter) throw new Error("Убежище не найдено");
    const allRecipes = await ctx.db.query("craft_recipes").collect();
    const availableRecipes = allRecipes.filter(recipe => {
      const requiredStation = recipe.requiredStationType;
      const requiredLevel = recipe.requiredStationLevel || 1;
      return shelter.stations.some(
        station => station.type === requiredStation && station.level >= requiredLevel
      );
    });
    return availableRecipes;
  },
});

// ... Остальные функции крафта и работы с убежищем можно добавить по аналогии ... 