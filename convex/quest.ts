import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Определяем интерфейс для сцены
interface Scene {
  _id: Id<"scenes">;
  title: string;
  sceneKey: string;
  background: string;
  text: string;
  choices?: Array<{
    text: string;
    nextSceneId?: Id<"scenes">;
    action?: string;
  }>;
}

// Определяем константы для состояний квестов
export const QUEST_STATE = {
  CHARACTER_CREATION: "character_creation",
  DELIVERY_STARTED: "delivery_started",
  PARTS_COLLECTED: "parts_collected",
  ARTIFACT_HUNT: "artifact_hunt",
  ARTIFACT_FOUND: "artifact_found",
  TRAINING_MISSION: "training_mission",
  NEW_MESSAGE: "new_message",
  QUEST_COMPLETION: "quest_completion",
  FREE_ROAM: "free_roam",
  REGISTERED: "registered"
} as const;

// Определяем константы для типов NPC
export const NPC_TYPE = {
  TRADER: "trader",
  CRAFTSMAN: "craftsman",
  OFFICER: "officer"
} as const;

// Определяем константы для ключей сцен
export const SCENE_KEY = {
  TRADER_MEETING: "trader_meeting",
  CRAFTSMAN_MEETING: "craftsman_meeting",
  ARTIFACT_FOUND: "Артефакт найден", // Используем существующее значение
  CHARACTER_CREATION_START: "character_creation_start",
  TRAINING_MISSION_START: "training_mission_start",
  NEW_DELIVERY_QUEST: "new_delivery_quest",
  ARTIFACT_AREA: "artifact_area", // Добавляем ключ для сцены аномальной зоны
} as const;

// Определяем константы для действий
export const ACTION = {
  END_CHARACTER_CREATION: "end_character_creation",
  START_DELIVERY_QUEST: "start_delivery_quest",
  TAKE_PARTS: "take_parts",
  ACCEPT_ARTIFACT_QUEST: "accept_artifact_quest",
  HELP_ORK: "help_ork",
  KILL_BOTH: "kill_both",
  IGNORE_ENCOUNTER: "ignore_encounter",
  RETURN_TO_CRAFTSMAN: "return_to_craftsman",
  COMPLETE_DELIVERY_QUEST: "complete_delivery_quest"
} as const;

// Определяем константы для предметов
export const ITEM = {
  ENERGY_CRYSTAL: "energy_crystal",
  VALUABLE_PARTS: "valuable_parts",
  MONEY_REWARD: "money_reward",
  RARE_COMPONENT: "rare_component"
} as const;

// Определяем константы для квестов
export const QUEST = {
  DELIVERY: "delivery",
  MAIN: "main"
} as const;

// Определяем константы для фракций
export const FACTION = {
  OFFICERS: "officers",
  VILLAINS: "villains",
  NEUTRALS: "neutrals",
  SURVIVORS: "survivors"
} as const;

// Activate quest by QR code
export const activateQuestByQR = mutation({
  args: {
    playerId: v.id("players"),
    qrCode: v.string()
  },
  handler: async (ctx, { playerId, qrCode }) => {
    console.log(`Активация QR-кода: ${qrCode} для игрока: ${playerId}`);
    
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

    console.log(`Найден QR-код: ${qrData._id}, тип: ${qrData.type}`);

    // Check if code is one-time and already used by this player
    const usedBy = qrData.usedBy ?? [];
    if (qrData.isOneTime && usedBy.includes(playerId)) {
      throw new Error("Этот QR-код уже был использован вами");
    }

    let resultMessage = "QR-код активирован";
    let resultSceneId = undefined;
    let resultQuestState = undefined;

    // Process the QR code based on its type
    if (qrData.type === "quest") {
      // Mark code as used if it's one-time
      if (qrData.isOneTime) {
        await ctx.db.patch(qrData._id, {
          usedBy: [...usedBy, playerId] // Append player ID to the existing array
        });
      }

      // Проверяем, что qrData.data существует перед доступом к его свойствам
      const questData = qrData.data || {};
      const questLine = questData.questLine || QUEST.MAIN;

      // Update player state to character creation
      await ctx.db.patch(playerId, {
        questState: QUEST_STATE.CHARACTER_CREATION,
        activeQuests: [...(player.activeQuests || []), questLine]
      });

      resultMessage = "Квестовая цепочка активирована! Пора создать вашего персонажа.";
      resultQuestState = QUEST_STATE.CHARACTER_CREATION;
    }

    else if (qrData.type === "npc") {
      console.log("Обработка NPC QR-кода:", qrData);
      
      // Определяем sceneKey в зависимости от данных QR-кода
      let sceneKey = qrData.data.sceneId;
      
      // Для backwards compatibility используем и npcId для определения sceneKey
      if (qrData.data.npcId) {
        if (qrData.data.npcId === "trader") {
          sceneKey = "trader_meeting";
        } else if (qrData.data.npcId === "craftsman") {
          sceneKey = "craftsman_meeting";
        }
      }
      
      console.log("Ищем сцену по ключу:", sceneKey);
      
      // Get the NPC scene
      const scene = await ctx.db
        .query("scenes")
        .withIndex("by_sceneKey", (q) => q.eq("sceneKey", sceneKey))
        .first() as Scene | null;

      if (!scene) {
        console.error(`Сцена с ключом '${sceneKey}' не найдена`);
        throw new Error(`Сцена не найдена: ${sceneKey}`);
      }

      console.log("Найдена сцена:", scene);

      // Update player state based on NPC type
      let questState = qrData.data.questState || player.questState;
      if (qrData.data.npcId === "trader" && player.questState === QUEST_STATE.DELIVERY_STARTED) {
        questState = QUEST_STATE.PARTS_COLLECTED;
      } else if (qrData.data.npcId === "craftsman" && player.questState === QUEST_STATE.PARTS_COLLECTED) {
        questState = QUEST_STATE.ARTIFACT_HUNT;
      }
      
      await ctx.db.patch(playerId, {
        questState: questState
      });

      resultMessage = `Вы встретили: ${scene.title}`;
      resultSceneId = scene._id;
      resultQuestState = questState;
    }
    else if (qrData.type === "location") {
      console.log("Обработка Location QR-кода:", qrData);
      
      // Определяем sceneKey в зависимости от данных QR-кода
      let sceneKey = qrData.data.triggerSceneKey || "artifact_hunt_start";
      
      console.log("Ищем сцену по ключу:", sceneKey);
      
      const scene = await ctx.db
        .query("scenes")
        .withIndex("by_sceneKey", (q) => q.eq("sceneKey", sceneKey))
        .first() as Scene | null;

      if (!scene) {
        console.error(`Сцена с ключом '${sceneKey}' не найдена`);
        throw new Error(`Сцена не найдена: ${sceneKey}`);
      }

      console.log("Найдена сцена:", scene);
      
      // Update player state
      await ctx.db.patch(playerId, {
        questState: QUEST_STATE.ARTIFACT_HUNT
      });
      
      resultMessage = qrData.data?.message || "Вы прибыли в указанную локацию.";
      resultSceneId = scene._id;
      resultQuestState = QUEST_STATE.ARTIFACT_HUNT;
    } else if (qrData.type === "item") {
      // Logic for item QR codes
      const itemId = qrData.data.itemId;

      // Example: Energy Crystal during Artifact Hunt
      if (itemId === ITEM.ENERGY_CRYSTAL && player.questState === QUEST_STATE.ARTIFACT_HUNT) {
        // Mark code as used if it's one-time
        if (qrData.isOneTime) {
          await ctx.db.patch(qrData._id, {
            usedBy: [...usedBy, playerId]
          });
        }

        // Find the artifact found scene
        const artifactScene = await ctx.db
          .query("scenes")
          .withIndex("by_sceneKey", (q) => q.eq("sceneKey", SCENE_KEY.ARTIFACT_FOUND))
          .first();

        if (artifactScene) {
          // Update player state and inventory
          await ctx.db.patch(playerId, {
            questState: QUEST_STATE.ARTIFACT_FOUND,
            inventory: [...(player.inventory || []), ITEM.ENERGY_CRYSTAL]
          });

          resultMessage = "Вы нашли кристалл чистой энергии!";
          resultSceneId = artifactScene._id;
          resultQuestState = QUEST_STATE.ARTIFACT_FOUND;
        } else {
          console.warn(`Scene with key '${SCENE_KEY.ARTIFACT_FOUND}' not found.`);
          throw new Error("Сцена для найденного артефакта не найдена.");
        }
      } else {
        // If no condition matched for the item/quest state
        throw new Error("Предмет не может быть использован в данный момент");
      }
    } else {
      // If QR code type is unknown or not handled
      console.warn(`Неизвестный тип QR-кода: ${qrData.type}, данные:`, qrData.data);
      throw new Error(`Неизвестный или необработанный тип QR-кода: ${qrData.type}`);
    }

    // Возвращаем результат активации QR-кода
    return { 
      message: resultMessage, 
      sceneId: resultSceneId, 
      questState: resultQuestState 
    };
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

    let targetSceneKey: string | null = null;

    // Based on player's state, determine the appropriate scene key
    if (player.questState === QUEST_STATE.CHARACTER_CREATION) {
      const creationStep = player.creationStep || 0;
      if (creationStep === 0) {
        targetSceneKey = SCENE_KEY.CHARACTER_CREATION_START;
      }
      // TODO: Add logic for other character creation steps if they map to different scenes
    } else if (player.questState === QUEST_STATE.TRAINING_MISSION) {
      targetSceneKey = SCENE_KEY.TRAINING_MISSION_START;
    } else if (player.questState === QUEST_STATE.NEW_MESSAGE) {
      targetSceneKey = SCENE_KEY.NEW_DELIVERY_QUEST;
    } else if (player.questState === QUEST_STATE.REGISTERED) {
      // Если игрок в состоянии REGISTERED, отображаем сцену начала квеста доставки
      targetSceneKey = SCENE_KEY.NEW_DELIVERY_QUEST;
    }
    // Add mappings for other quest states...
    // else if (player.questState === "some_other_state") { targetSceneKey = "some_other_scene_key"; }


    if (targetSceneKey) {
      // Используем индекс by_sceneKey для поиска сцены
      const scene = await ctx.db
        .query("scenes")
        .withIndex("by_sceneKey", (q) => q.eq("sceneKey", targetSceneKey))
        .first();

      if (!scene) {
        console.warn(`Current scene not found for player ${playerId} with questState '${player.questState}' (expected key: '${targetSceneKey}')`);
      }
      return scene; // Return scene document or null if not found
    }

    // Default case - return null if no scene corresponds to the current state
    console.log(`No specific scene defined for player ${playerId} with questState '${player.questState}'`);
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

    if (!scene.choices || choiceIndex < 0 || choiceIndex >= scene.choices.length) {
      throw new Error("Неверный индекс выбора или сцена не имеет выборов");
    }

    const choice = scene.choices[choiceIndex];
    
    // Определяем questId из активных квестов игрока или используем текущий quest state
    // Предполагаем, что игрок может быть только в одном активном квесте или берем первый
    let questId = player.activeQuests && player.activeQuests.length > 0 
      ? player.activeQuests[0] 
      : player.questState || "unknown";
    
    // Записываем выбор игрока в историю
    await ctx.db.insert("player_quest_choices", {
      playerId,
      questId: questId.toString(),
      sceneId: sceneId.toString(),
      choiceId: `choice_${choiceIndex}`, // Используем формат идентификатора который точно существует
      choiceText: choice.text,
      pickedAt: Date.now(),
      actionResult: choice.action ? { action: choice.action } : undefined
    });
    
    // Обновляем или создаем запись статистики для этого выбора в общей таблице
    const choiceStats = await ctx.db
      .query("quest_choices_stats")
      .withIndex("by_quest_scene", q => 
        q.eq("questId", questId.toString())
         .eq("sceneId", sceneId.toString()))
      .filter(q => q.eq(q.field("choiceId"), `choice_${choiceIndex}`))
      .first();
      
    if (choiceStats) {
      // Обновляем существующую статистику
      await ctx.db.patch(choiceStats._id, {
        totalPicks: choiceStats.totalPicks + 1,
        lastPickedAt: Date.now()
      });
    } else {
      // Создаем новую запись статистики
      await ctx.db.insert("quest_choices_stats", {
        questId: questId.toString(),
        sceneId: sceneId.toString(),
        choiceId: `choice_${choiceIndex}`,
        choiceText: choice.text,
        totalPicks: 1,
        lastPickedAt: Date.now()
      });
    }

    // --- Prepare updates (gather all changes before patching) ---
    const playerUpdates: Partial<typeof player> = {};
    let nextSceneId = choice.nextSceneId ?? null; // Default to null if not specified
    let message = "Вы сделали выбор."; // Default message
    let questStateUpdate = player.questState; // Keep current state unless action changes it

    // Update equipment if needed
    if (choice.equipmentChanges) {
      // Ensure player.equipment exists and create a mutable copy
      const updatedEquipment = { ...(player.equipment ?? {}) };

      if (choice.equipmentChanges.primary) {
        updatedEquipment.primary = choice.equipmentChanges.primary;
      }
      if (choice.equipmentChanges.secondary) {
        updatedEquipment.secondary = choice.equipmentChanges.secondary;
      }
      if (choice.equipmentChanges.consumables && choice.equipmentChanges.consumables.length > 0) {
        updatedEquipment.consumables = [
          ...(updatedEquipment.consumables || []),
          ...choice.equipmentChanges.consumables
        ];
      }
      playerUpdates.equipment = updatedEquipment;
    }

    // Handle special actions
    // TODO: Refactor this large block if it grows. Consider functions per action type or a data-driven approach.
    if (choice.action) {
      // Ensure reputation exists and create a mutable copy
      const updatedReputation = { ...(player.reputation ?? {}) };
      // Ensure inventory exists and create a mutable copy
      let updatedInventory = [...(player.inventory || [])];
      // Ensure quest lists exist and create mutable copies
      let updatedActiveQuests = [...(player.activeQuests || [])];
      let updatedCompletedQuests = [...(player.completedQuests || [])];
      let updatedExperience = player.experience || 0;

      let reputationChanged = false;
      let inventoryChanged = false;
      let questsChanged = false;
      let experienceChanged = false;

      // --- Action Logic ---
      if (choice.action === ACTION.END_CHARACTER_CREATION) {
        questStateUpdate = QUEST_STATE.TRAINING_MISSION;
        message = "Создание персонажа завершено! Переходим к тренировочной миссии.";
      } else if (choice.action === ACTION.START_DELIVERY_QUEST) {
        questStateUpdate = QUEST_STATE.DELIVERY_STARTED;
        if (!updatedActiveQuests.includes(QUEST.DELIVERY)) {
          updatedActiveQuests.push(QUEST.DELIVERY);
          questsChanged = true;
        }
        message = "Задание получено! Найдите торговца и возьмите запчасти.";
      } else if (choice.action === ACTION.TAKE_PARTS) {
        questStateUpdate = QUEST_STATE.PARTS_COLLECTED;
        if (!updatedInventory.includes(ITEM.VALUABLE_PARTS)) {
          updatedInventory.push(ITEM.VALUABLE_PARTS);
          inventoryChanged = true;
        }
        message = "Вы получили ценные запчасти. Теперь нужно доставить их Дитеру.";
      } else if (choice.action === ACTION.ACCEPT_ARTIFACT_QUEST) {
        questStateUpdate = QUEST_STATE.ARTIFACT_HUNT;
        message = "Вы согласились найти артефакт для Дитера.";
      } else if (choice.action === ACTION.HELP_ORK) {
        const factionKey = FACTION.VILLAINS as keyof typeof updatedReputation;
        const currentRep = updatedReputation[factionKey] || 0;
        updatedReputation[factionKey] = currentRep + 15;
        reputationChanged = true;
        message = "Вы помогли орку. Ваша репутация среди Злодеев повысилась.";
      } else if (choice.action === ACTION.KILL_BOTH) {
        const factionKey = FACTION.VILLAINS as keyof typeof updatedReputation;
        const currentRep = updatedReputation[factionKey] || 0;
        updatedReputation[factionKey] = currentRep - 20;
        reputationChanged = true;
        message = "Вы убили орка и волка. Ваша репутация среди Злодеев понизилась.";
      } else if (choice.action === ACTION.IGNORE_ENCOUNTER) {
        message = "Вы решили не вмешиваться.";
      } else if (choice.action === ACTION.RETURN_TO_CRAFTSMAN) {
        questStateUpdate = QUEST_STATE.QUEST_COMPLETION;
        const initialLength = updatedInventory.length;
        updatedInventory = updatedInventory.filter(item => item !== ITEM.ENERGY_CRYSTAL);
        if (updatedInventory.length !== initialLength) {
          inventoryChanged = true;
        }
        message = "Вы возвращаетесь к Дитеру с артефактом.";
      } else if (choice.action === ACTION.COMPLETE_DELIVERY_QUEST) {
        questStateUpdate = QUEST_STATE.FREE_ROAM;

        // Update reputation
        const factionKey = FACTION.OFFICERS as keyof typeof updatedReputation;
        const currentRep = updatedReputation[factionKey] || 0;
        updatedReputation[factionKey] = currentRep + 20;
        reputationChanged = true;

        // Give reward
        if (!updatedInventory.includes(ITEM.MONEY_REWARD)) updatedInventory.push(ITEM.MONEY_REWARD);
        if (!updatedInventory.includes(ITEM.RARE_COMPONENT)) updatedInventory.push(ITEM.RARE_COMPONENT);
        inventoryChanged = true;

        // Update quests
        if (!updatedCompletedQuests.includes(QUEST.DELIVERY)) updatedCompletedQuests.push(QUEST.DELIVERY);
        const initialActiveLength = updatedActiveQuests.length;
        updatedActiveQuests = updatedActiveQuests.filter(q => q !== QUEST.DELIVERY);
        if (updatedActiveQuests.length !== initialActiveLength || !updatedCompletedQuests.includes(QUEST.DELIVERY)) {
          questsChanged = true;
        }

        // Give XP
        updatedExperience += 100;
        experienceChanged = true;

        message = "Задание 'Доставка и дилемма' выполнено! Вы получили награду и опыт.";
      }
      // Add other actions here...
      else {
          console.warn(`Unhandled action type: ${choice.action}`);
      }

      // --- Apply collected updates ---
      if (questStateUpdate !== player.questState) {
        playerUpdates.questState = questStateUpdate;
      }
      if (reputationChanged) {
        playerUpdates.reputation = updatedReputation;
      }
      if (inventoryChanged) {
        playerUpdates.inventory = updatedInventory;
      }
      if (questsChanged) {
        playerUpdates.activeQuests = updatedActiveQuests;
        playerUpdates.completedQuests = updatedCompletedQuests;
      }
      if (experienceChanged) {
        playerUpdates.experience = updatedExperience;
      }
    } // End of action handling

    // --- Perform DB Patch ---
    // Only patch if there are actual changes to apply
    if (Object.keys(playerUpdates).length > 0) {
      await ctx.db.patch(playerId, playerUpdates);
    }

    // --- Return result ---
    // Construct the result object based on calculated values
    const result: { message: string; nextSceneId?: Id<"scenes"> | string; questState?: string } = {
      message: message,
    };
    if (nextSceneId) {
      result.nextSceneId = nextSceneId;
    }
    // Optionally return the new quest state if it changed
    if (playerUpdates.questState) {
      result.questState = playerUpdates.questState;
    }

    return result;
  },
});

// Получение статистики выборов для админов или аналитики
export const getQuestChoicesStats = query({
  args: {
    questId: v.optional(v.string()),
    sceneId: v.optional(v.string())
  },
  handler: async (ctx, { questId, sceneId }) => {
    let stats;
    
    if (questId && sceneId) {
      stats = await ctx.db
        .query("quest_choices_stats")
        .withIndex("by_quest_scene", q => q.eq("questId", questId).eq("sceneId", sceneId))
        .collect();
    } else if (questId) {
      stats = await ctx.db
        .query("quest_choices_stats")
        .withIndex("by_quest", q => q.eq("questId", questId))
        .collect();
    } else if (sceneId) {
      stats = await ctx.db
        .query("quest_choices_stats")
        .withIndex("by_scene", q => q.eq("sceneId", sceneId))
        .collect();
    } else {
      stats = await ctx.db
        .query("quest_choices_stats")
        .collect();
    }
    
    // Агрегируем данные для удобства анализа
    if (questId && !sceneId) {
      // Группируем по сценам если запрошен только questId
      const scenesMap: Record<string, {
        sceneId: string, 
        totalChoices: number, 
        choices: any[] 
      }> = {};
      
      for (const stat of stats) {
        if (!scenesMap[stat.sceneId]) {
          scenesMap[stat.sceneId] = {
            sceneId: stat.sceneId,
            totalChoices: 0,
            choices: []
          };
        }
        
        scenesMap[stat.sceneId].choices.push({
          choiceId: stat.choiceId,
          choiceText: stat.choiceText,
          totalPicks: stat.totalPicks,
          lastPickedAt: stat.lastPickedAt
        });
        
        scenesMap[stat.sceneId].totalChoices += stat.totalPicks;
      }
      
      return Object.values(scenesMap);
    }
    
    return stats;
  }
});

// Получение истории выборов конкретного игрока
export const getPlayerChoicesHistory = query({
  args: {
    playerId: v.id("players"),
    questId: v.optional(v.string())
  },
  handler: async (ctx, { playerId, questId }) => {
    let choices;
    
    if (questId) {
      choices = await ctx.db
        .query("player_quest_choices")
        .withIndex("by_player_quest", q => q.eq("playerId", playerId).eq("questId", questId))
        .collect();
    } else {
      choices = await ctx.db
        .query("player_quest_choices")
        .withIndex("by_player", q => q.eq("playerId", playerId))
        .collect();
    }
    
    // Сортируем по времени
    return choices.sort((a, b) => a.pickedAt - b.pickedAt);
  }
});

// Get player's discovered NPCs
export const getDiscoveredNpcs = query({
  args: {
    playerId: v.id("players")
  },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }

    const discoveredNpcIds = player.discoveredNpcs;
    if (!discoveredNpcIds || discoveredNpcIds.length === 0) {
      return []; // Return empty array if none discovered
    }

    // Fetch all discovered NPCs concurrently
    const npcPromises = discoveredNpcIds.map(npcId => ctx.db.get(npcId));
    const npcs = await Promise.all(npcPromises);

    // Filter out any null results (e.g., if an NPC was deleted)
    // and ensure the result is typed correctly
    return npcs.filter(npc => npc !== null) as NonNullable<typeof npcs[number]>[];
  },
});

// Get player's quests
export const getPlayerQuests = query({
  args: {
    playerId: v.id("players")
  },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }

    // Return active and completed quests, defaulting to empty arrays if undefined
    return {
      active: player.activeQuests ?? [],
      completed: player.completedQuests ?? []
    };
  },
});

// Start delivery quest (Example of triggering a quest/scene externally)
export const startDeliveryQuest = mutation({
  args: {
    playerId: v.id("players")
  },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }

    // Find the quest start scene using a key
    const sceneKey = SCENE_KEY.NEW_DELIVERY_QUEST;
    const questStartScene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", sceneKey))
      .first();

    if (!questStartScene) {
      throw new Error(`Сцена начала квеста с ключом '${sceneKey}' не найдена`);
    }

    // Update player state to indicate the new message/quest offer
    await ctx.db.patch(playerId, {
      questState: QUEST_STATE.NEW_MESSAGE
    });

    return {
      message: "Вы получили новое сообщение!",
      sceneId: questStartScene._id // Return the ID of the scene to navigate to
    };
  },
});

// Функция для инициализации сцен с ключами и получения их ID
export const initSceneKeys = mutation({
  args: {},
  handler: async (ctx) => {
    // Получаем все сцены
    const scenes = await ctx.db.query("scenes").collect();

    // Обновляем каждую сцену, добавляя sceneKey, если его нет
    const updates = scenes.map(async (scene) => {
      // Если у сцены нет ключа, создаем его на основе заголовка
      if (!scene.sceneKey) {
        const sceneKey = scene.title
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_"); // Преобразуем заголовок в безопасный ключ
        
        await ctx.db.patch(scene._id, { sceneKey });
        
        return {
          id: scene._id,
          title: scene.title,
          sceneKey
        };
      }
      
      return {
        id: scene._id,
        title: scene.title,
        sceneKey: scene.sceneKey
      };
    });

    // Получаем результаты обновлений
    const results = await Promise.all(updates);
    
    // Возвращаем соответствие ключей к ID для использования в коде
    return {
      sceneMap: results.reduce((map, scene) => {
        map[scene.sceneKey] = scene.id;
        return map;
      }, {} as Record<string, string>),
      scenes: results
    };
  }
});

// Функция для получения сцены по ключу
export const getSceneByKey = query({
  args: { sceneKey: v.string() },
  handler: async (ctx, { sceneKey }) => {
    // Ищем сцену по ключу, используя индекс
    const scene = await ctx.db
      .query("scenes")
      .withIndex("by_sceneKey", (q) => q.eq("sceneKey", sceneKey))
      .first();

    return scene;
  }
});