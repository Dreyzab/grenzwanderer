import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Проверяет наличие необходимых начальных данных в базе данных
 * Это полезно для определения, нужна ли инициализация
 */
export const checkSetupNeeded = query({
  args: {},
  handler: async (ctx) => {
    // Проверяем наличие сцен с ключами, которые должны существовать
    const traderScene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", "trader_meeting"))
      .first();
    
    const craftsmanScene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", "craftsman_meeting"))
      .first();
    
    // Проверяем QR-коды
    const traderQR = await ctx.db
      .query("qrCodes")
      .withIndex("by_code", (q) => q.eq("code", "grenz_npc_trader_01"))
      .first();
    
    // Если каких-то важных данных нет, значит нужна инициализация
    return {
      setupNeeded: !traderScene || !craftsmanScene || !traderQR,
      existingData: {
        hasTraderScene: !!traderScene,
        hasCraftsmanScene: !!craftsmanScene,
        hasTraderQR: !!traderQR
      }
    };
  },
});

/**
 * Возвращает сцену по её ключу
 * Полезно для отладки и проверки
 */
export const getSceneByKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const scene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", key))
      .first();
    
    return scene;
  },
});

/**
 * Восстанавливает связь между QR-кодами и сценами
 * Полезно, если связи нарушены или требуют обновления
 */
export const fixQRSceneMapping = mutation({
  args: {},
  handler: async (ctx) => {
    const updates = {
      trader: false,
      craftsman: false
    };
    
    // Находим сцены по ключам
    const traderScene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", "trader_meeting"))
      .first();
    
    const craftsmanScene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", "craftsman_meeting"))
      .first();
    
    // Находим QR-коды и обновляем их данные, если нужно
    if (traderScene) {
      const traderQR = await ctx.db
        .query("qrCodes")
        .withIndex("by_code", (q) => q.eq("code", "grenz_npc_trader_01"))
        .first();
      
      if (traderQR) {
        // Обновляем данные QR-кода, чтобы они указывали на правильный ID сцены
        await ctx.db.patch(traderQR._id, {
          data: { ...traderQR.data, sceneId: traderScene._id }
        });
        updates.trader = true;
      }
    }
    
    if (craftsmanScene) {
      const craftsmanQR = await ctx.db
        .query("qrCodes")
        .withIndex("by_code", (q) => q.eq("code", "grenz_npc_craftsman_01"))
        .first();
      
      if (craftsmanQR) {
        await ctx.db.patch(craftsmanQR._id, {
          data: { ...craftsmanQR.data, sceneId: craftsmanScene._id }
        });
        updates.craftsman = true;
      }
    }
    
    // Возвращаем информацию об обновлениях
    return updates;
  },
});

/**
 * Обновляет или создает QR-код для торговца
 * Этот метод полезен для быстрого исправления конкретного QR-кода
 */
export const fixTraderQR = mutation({
  args: {},
  handler: async (ctx) => {
    // Находим сцену торговца
    const traderScene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", "trader_meeting"))
      .first();
    
    if (!traderScene) {
      return { success: false, error: "Сцена торговца не найдена" };
    }
    
    // Находим QR-код торговца
    const traderQR = await ctx.db
      .query("qrCodes")
      .withIndex("by_code", (q) => q.eq("code", "grenz_npc_trader_01"))
      .first();
    
    // Если QR-код существует, обновляем его
    if (traderQR) {
      await ctx.db.patch(traderQR._id, {
        data: { 
          npcId: "trader",
          sceneId: traderScene._id, // Добавляем прямую связь со сценой
          type: "npc"
        }
      });
      return { success: true, action: "updated", qrId: traderQR._id };
    }
    // Если нет, создаем новый
    else {
      const newQRId = await ctx.db.insert("qrCodes", {
        code: "grenz_npc_trader_01",
        type: "npc",
        data: { 
          npcId: "trader",
          sceneId: traderScene._id, // Прямая связь со сценой
          type: "npc"
        },
        isOneTime: false,
        usedBy: []
      });
      return { success: true, action: "created", qrId: newQRId };
    }
  },
});

/**
 * Выдает список всех сцен с их ключами
 * Полезно для диагностики
 */
export const listAllScenes = query({
  args: {},
  handler: async (ctx) => {
    const scenes = await ctx.db.query("scenes").collect();
    return scenes.map(scene => ({
      id: scene._id,
      title: scene.title,
      sceneKey: scene.sceneKey
    }));
  },
});

/**
 * Выдает список всех QR-кодов
 * Полезно для диагностики
 */
export const listAllQRCodes = query({
  args: {},
  handler: async (ctx) => {
    const codes = await ctx.db.query("qrCodes").collect();
    return codes.map(code => ({
      id: code._id,
      code: code.code,
      type: code.type,
      data: code.data
    }));
  },
}); 