import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Activate quest by QR code
export const activateQuestByQR = mutation({
  args: { 
    playerId: v.id("players"),
    qrCode: v.string()
  },
  handler: async (ctx, { playerId, qrCode }) => {
    // Get the player
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }
    
    // Check QR code
    const qrData = await ctx.db
      .query("qrCodes")
      .withIndex("by_code", (q) => q.eq("code", qrCode))
      .first();
    
    if (!qrData) {
      throw new Error("Неверный QR-код");
    }
    
    // Check if code is one-time and already used
    if (qrData.isOneTime && qrData.usedBy && qrData.usedBy.includes(playerId)) {
      throw new Error("Этот QR-код уже был использован вами");
    }
    
    // Process the QR code based on its type
    if (qrData.type === "start_quest") {
      // Mark code as used if it's one-time
      if (qrData.isOneTime) {
        await ctx.db.patch(qrData._id, {
          usedBy: [...(qrData.usedBy || []), playerId]
        });
      }
      
      // Update player state to character creation
      await ctx.db.patch(playerId, {
        questState: "character_creation"
      });
      
      return {
        message: "Квестовая цепочка активирована! Пора создать вашего персонажа.",
        questState: "character_creation"
      };
    } else if (qrData.type === "item") {
      // Logic for item QR codes
      // ...
    } else if (qrData.type === "location") {
      // Logic for location QR codes
      // ...
    }
    
    throw new Error("Неизвестный тип QR-кода");
  },
});

// Get current scene for player
export const getCurrentScene = query({
  args: { 
    playerId: v.id("players")
  },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }
    
    // Based on player's state, return the appropriate scene
    if (player.questState === "character_creation") {
      // Get character creation scene based on step
      const creationStep = player.creationStep || 0;
      
      // Find the first scene for character creation
      if (creationStep === 0) {
        const scene = await ctx.db
          .query("scenes")
          .filter(q => q.eq(q.field("title"), "character_creation_start"))
          .first();
        
        return scene;
      }
      
      // For other steps, we'd need additional logic
      // ...
    } else if (player.questState === "training_mission") {
      // Get training mission scene
      const scene = await ctx.db
        .query("scenes")
        .filter(q => q.eq(q.field("title"), "training_mission_start"))
        .first();
      
      return scene;
    }
    
    // Default case - return null if no scene found
    return null;
  },
});

// Handle scene choice
export const makeSceneChoice = mutation({
  args: { 
    playerId: v.id("players"),
    sceneId: v.id("scenes"),
    choiceIndex: v.number()
  },
  handler: async (ctx, { playerId, sceneId, choiceIndex }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }
    
    const scene = await ctx.db.get(sceneId);
    if (!scene) {
      throw new Error("Сцена не найдена");
    }
    
    if (choiceIndex < 0 || choiceIndex >= scene.choices.length) {
      throw new Error("Неверный индекс выбора");
    }
    
    const choice = scene.choices[choiceIndex];
    
    // Update equipment if needed
    if (choice.equipmentChanges) {
      const updatedEquipment = { ...player.equipment };
      
      if (choice.equipmentChanges.primary) {
        updatedEquipment.primary = choice.equipmentChanges.primary;
      }
      
      if (choice.equipmentChanges.secondary) {
        updatedEquipment.secondary = choice.equipmentChanges.secondary;
      }
      
      if (choice.equipmentChanges.consumables) {
        updatedEquipment.consumables = choice.equipmentChanges.consumables;
      }
      
      await ctx.db.patch(playerId, {
        equipment: updatedEquipment
      });
    }
    
    // Handle special actions
    if (choice.action) {
      if (choice.action === "end_character_creation") {
        await ctx.db.patch(playerId, {
          questState: "training_mission"
        });
        
        return {
          message: "Создание персонажа завершено! Переходим к тренировочной миссии.",
          nextSceneId: choice.nextSceneId,
          questState: "training_mission"
        };
      }
      // Other special actions...
    }
    
    // Advance to next scene
    if (choice.nextSceneId) {
      return {
        message: "Вы сделали выбор.",
        nextSceneId: choice.nextSceneId
      };
    }
    
    return {
      message: "Выбор сделан, но следующая сцена не определена."
    };
  },
});