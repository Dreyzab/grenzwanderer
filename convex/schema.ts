import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Определяем возможные типы NPC
const NPCType = v.union(
  v.literal("trader"),
  v.literal("craftsman"),
  v.literal("scientist"),
  v.literal("guard"),
  v.literal("smuggler"),
  v.literal("quest_giver"), // Пример, можно добавить другие типы
  v.literal("enemy")      // Пример враждебного NPC
);

// Определяем возможные фракции
const Faction = v.union(
  v.literal("neutrals"),
  v.literal("officers"),
  v.literal("villains"),
  v.literal("survivors"),
  v.literal("scientists"),
  v.literal("mutants")     // Пример фракции мутантов
);

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(), // Хранит хеш пароля
    salt: v.optional(v.string()), // Соль для хеширования
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
    passwordReset: v.optional(v.boolean()),
    failedLoginAttempts: v.optional(v.number()), // Счетчик неудачных попыток входа
    lastFailedLogin: v.optional(v.number()), // Время последней неудачной попытки
    accountLocked: v.optional(v.boolean()) // Флаг блокировки аккаунта
  }).index("by_email", ["email"])
  .index("by_lastLogin", ["lastLogin"]) // Индекс для оптимизации запросов по времени последнего входа
  .index("by_createdAt", ["createdAt"]), // Индекс для оптимизации запросов по дате создания

  players: defineTable({
    userId: v.id("users"),
    nickname: v.string(),
    avatar: v.optional(v.string()),
    faction: Faction,
    reputation: v.object({
      officers: v.number(),
      villains: v.number(),
      neutrals: v.number(),
      survivors: v.number(),
      scientists: v.optional(v.number()), // Ученые как опциональная репутация
      mutants: v.optional(v.number())      // Мутанты как опциональная репутация
    }),
    equipment: v.object({
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      consumables: v.optional(v.array(v.string()))
    }),
    questState: v.string(), // Можно детализировать с помощью v.union, если нужно
    creationStep: v.optional(v.number()),
    locationHistory: v.array(v.object({ // Ограничиваем размер массива в коде
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number()
    })),
    inventory: v.optional(v.array(v.string())), // Ограничиваем размер в коде
    discoveredNpcs: v.optional(v.array(v.id("npcs"))), // Ограничиваем размер в коде
    activeQuests: v.optional(v.array(v.string())), // Ограничиваем размер в коде
    completedQuests: v.optional(v.array(v.string())), // Ограничиваем размер в коде
    experience: v.optional(v.number()),
    lastLocationUpdate: v.optional(v.number()), // Для ограничения частоты обновлений
    maxInventorySize: v.optional(v.number()), // Максимальный размер инвентаря
    maxLocationHistory: v.optional(v.number()), // Максимальный размер истории локаций
    // Character stats for Visual Novel features
    stats: v.optional(v.object({
      energy: v.optional(v.number()),
      money: v.optional(v.number()),
      attractiveness: v.optional(v.number()),
      willpower: v.optional(v.number()),
      fitness: v.optional(v.number()),
      intelligence: v.optional(v.number()),
      corruption: v.optional(v.number())
    }))
  }).index("by_userId", ["userId"])
  .index("by_nickname", ["nickname"]) // Индекс для поиска по никнейму
  .index("by_faction", ["faction"]), // Индекс для группировки по фракциям
  
  scenes: defineTable({
    title: v.string(),
    sceneKey: v.string(), // Уникальный ключ для идентификации сцены
    background: v.optional(v.string()),
    text: v.string(),
    character: v.optional(v.object({
      name: v.string(),
      image: v.string(),
      position: v.optional(v.union(v.literal('left'), v.literal('right'), v.literal('center')))
    })),
    choices: v.array(v.object({
      text: v.string(),
      nextSceneId: v.optional(v.union(v.id("scenes"), v.string())), // Может быть ID или ключом
      action: v.optional(v.string()), // Действие, связанное с выбором
      statChanges: v.optional(v.object({ // Изменения характеристик
        energy: v.optional(v.number()),
        willpower: v.optional(v.number()),
        attractiveness: v.optional(v.number()),
        fitness: v.optional(v.number()),
        intelligence: v.optional(v.number()),
        corruption: v.optional(v.number()),
        money: v.optional(v.number())
      })),
      requiredState: v.optional(v.string()), // Требуемое состояние квеста/мира
      requiredItems: v.optional(v.array(v.string())), // Требуемые предметы
      equipmentChanges: v.optional(v.object({ // Изменения снаряжения
        primary: v.optional(v.string()),
        secondary: v.optional(v.string()),
        consumables: v.optional(v.array(v.string()))
      }))
    })),
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
    type: v.union(v.literal("npc"), v.literal("location"), v.literal("item"), v.literal("quest")), // Типы QR кодов
    data: v.any(), // Данные, связанные с QR-кодом (ID NPC, локации, и т.д.)
    isOneTime: v.boolean(),
    usedBy: v.optional(v.array(v.id("players"))),
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
    type: NPCType,
    faction: Faction,
    description: v.string(),
    coordinates: v.object({ // Координаты NPC на карте
      lat: v.number(),
      lng: v.number()
    }),
    isShop: v.optional(v.boolean()), // Может ли NPC быть магазином
    shopItems: v.optional(v.array(v.string())), // Товары NPC, если это магазин
    dialogStartSceneKey: v.optional(v.string()) // Ключ начальной сцены диалога
  }).index("by_name", ["name"]), // Индекс для поиска по имени
  
  items: defineTable({
    itemId: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("weapon"), v.literal("armor"), v.literal("consumable"), v.literal("quest"), v.literal("misc")),
    effects: v.optional(v.any()) // Эффекты предмета
  }).index("by_itemId", ["itemId"]),

  // Таблица состояний квестов (опционально, для более сложных квестов)
  questStates: defineTable({
    playerId: v.id("players"),
    questId: v.string(), // Идентификатор квеста
    currentState: v.string(), // Текущее состояние квеста для игрока
    progress: v.optional(v.any()) // Дополнительные данные о прогрессе
  }).index("by_player_quest", ["playerId", "questId"])
});