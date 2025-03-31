import { mutation } from "./_generated/server";
import { v } from "convex/values";

// This function can be called from the Convex dashboard to seed initial data
export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create QR codes
    const startQrCode = await ctx.db.insert("qrCodes", {
      code: "START_QUEST_2023",
      type: "start_quest",
      data: { questLine: "main" },
      isOneTime: false,
      usedBy: []
    });
    
    // Create character creation scenes
    const characterCreationStart = await ctx.db.insert("scenes", {
      title: "character_creation_start",
      background: "/backgrounds/headquarters.jpg",
      text: "Добро пожаловать в тренировочный комплекс Grenzwanderer. Я ваш координатор. Для начала нам нужно выбрать ваше основное оружие. Что предпочитаете?",
      choices: [
        {
          text: "HK G3 - надежная штурмовая винтовка",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            primary: "HK G3"
          }
        },
        {
          text: "M4A1 - универсальная и легкая винтовка",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            primary: "M4A1"
          }
        },
        {
          text: "Remington 870 - дробовик для ближнего боя",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            primary: "Remington 870"
          }
        },
        {
          text: "SR-25 - снайперская винтовка для поддержки",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            primary: "SR-25"
          }
        }
      ]
    });
    
    const equipmentChoiceScene = await ctx.db.insert("scenes", {
      title: "equipment_choice",
      background: "/backgrounds/armory.jpg",
      text: "Отличный выбор! Теперь необходимо выбрать дополнительное снаряжение.",
      choices: [
        {
          text: "1 граната и 2 аптечки",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            consumables: ["Граната", "Аптечка", "Аптечка"]
          }
        },
        {
          text: "2 гранаты и 1 аптечка",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            consumables: ["Граната", "Граната", "Аптечка"]
          }
        },
        {
          text: "Бронежилет и 1 аптечка",
          nextSceneId: undefined, // Will be updated later
          equipmentChanges: {
            secondary: "Бронежилет",
            consumables: ["Аптечка"]
          }
        }
      ]
    });
    
    const trainingStart = await ctx.db.insert("scenes", {
      title: "training_mission_start",
      background: "/backgrounds/briefing.jpg",
      text: "Экипировка выбрана! Пора приступать к тренировочной миссии. Ваша задача — добраться до контрольной точки, отмеченной на карте. Будьте внимательны и осторожны.",
      choices: [
        {
          text: "Принять задание",
          nextSceneId: undefined,
          action: "end_character_creation"
        }
      ]
    });
    
    const trainingComplete = await ctx.db.insert("scenes", {
      title: "training_complete",
      background: "/backgrounds/success.jpg",
      text: "Поздравляю! Вы успешно прошли тренировочную миссию. Теперь вы готовы к настоящим заданиям. Ждите дальнейших инструкций от координатора.",
      choices: [
        {
          text: "Вернуться на базу",
          nextSceneId: undefined
        }
      ]
    });
    
    // Update scene references
    const updatedCharacterCreation = await ctx.db.patch(characterCreationStart, {
      choices: [
        {
          text: "HK G3 - надежная штурмовая винтовка",
          nextSceneId: equipmentChoiceScene,
          equipmentChanges: {
            primary: "HK G3"
          }
        },
        {
          text: "M4A1 - универсальная и легкая винтовка",
          nextSceneId: equipmentChoiceScene,
          equipmentChanges: {
            primary: "M4A1"
          }
        },
        {
          text: "Remington 870 - дробовик для ближнего боя",
          nextSceneId: equipmentChoiceScene,
          equipmentChanges: {
            primary: "Remington 870"
          }
        },
        {
          text: "SR-25 - снайперская винтовка для поддержки",
          nextSceneId: equipmentChoiceScene,
          equipmentChanges: {
            primary: "SR-25"
          }
        }
      ]
    });
    
    const updatedEquipmentChoice = await ctx.db.patch(equipmentChoiceScene, {
      choices: [
        {
          text: "1 граната и 2 аптечки",
          nextSceneId: trainingStart,
          equipmentChanges: {
            consumables: ["Граната", "Аптечка", "Аптечка"]
          }
        },
        {
          text: "2 гранаты и 1 аптечка",
          nextSceneId: trainingStart,
          equipmentChanges: {
            consumables: ["Граната", "Граната", "Аптечка"]
          }
        },
        {
          text: "Бронежилет и 1 аптечка",
          nextSceneId: trainingStart,
          equipmentChanges: {
            secondary: "Бронежилет",
            consumables: ["Аптечка"]
          }
        }
      ]
    });
    
    // Create map points
    const trainingPoint = await ctx.db.insert("mapPoints", {
      title: "Тренировочная зона",
      description: "Здесь проходит первое тренировочное задание. Подойдите к этой точке для завершения тренировки.",
      coordinates: {
        lat: 55.751244, // Example coordinates (Moscow)
        lng: 37.618423
      },
      radius: 50, // 50 meters radius
      requiredQuestState: "training_mission",
      linkedSceneId: trainingComplete,
      isActive: true
    });
    
    return {
      message: "Начальные данные успешно созданы",
      qrCodes: [startQrCode],
      scenes: [characterCreationStart, equipmentChoiceScene, trainingStart, trainingComplete],
      mapPoints: [trainingPoint]
    };
  },
});