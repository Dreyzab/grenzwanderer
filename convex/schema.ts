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
    type: v.union(v.literal("npc"), v.literal("location"), v.literal("item"), v.literal("quest"), v.literal("start_quest")), // Типы QR кодов
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
  }).index("by_player_quest", ["playerId", "questId"]),

  // --- ДОБАВЛЯЮ новые таблицы и индексы ниже ---
  shelters: defineTable({
    ownerId: v.id("players"),
    name: v.string(),
    level: v.number(),
    resources: v.record(v.string(), v.number()),
    stations: v.array(v.object({
      type: v.string(),
      level: v.number()
    })),
    storage: v.record(v.string(), v.number()),
    activeCrafts: v.array(v.any())
  }).index("by_ownerId", ["ownerId"]),

  inventories: defineTable({
    ownerId: v.string(),
    ownerType: v.union(
      v.literal("player"),
      v.literal("npc"),
      v.literal("chest"),
      v.literal("session")
    ),
    itemId: v.string(),
    quantity: v.number(),
    location: v.union(
      v.literal("equipment"),
      v.literal("backpack"),
      v.literal("stash")
    ),
    equipped: v.optional(v.boolean()),
    slotType: v.optional(v.string())
  })
    .index("by_owner", ["ownerType", "ownerId"])
    .index("by_owner_item", ["ownerType", "ownerId", "itemId", "location"]),

  craft_recipes: defineTable({
    recipeId: v.string(),
    name: v.string(),
    description: v.string(),
    requiredStationType: v.string(),
    requiredStationLevel: v.number(),
    requiredResources: v.record(v.string(), v.number()),
    resultItemId: v.string(),
    resultQuantity: v.optional(v.number()),
    craftTime: v.number(),
    craftDifficulty: v.optional(v.number()),
    unlockRequirements: v.optional(v.any())
  })
    .index("by_recipeId", ["recipeId"])
    .index("by_stationType", ["requiredStationType"]),

  resources: defineTable({
    resourceId: v.string(),
    name: v.string(),
    description: v.string(),
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary")
    ),
    category: v.string(),
    weight: v.number(),
    stackSize: v.number(),
    value: v.number(),
    sources: v.optional(v.array(v.string()))
  })
    .index("by_resourceId", ["resourceId"])
    .index("by_category", ["category"]),

  player_skills: defineTable({
    playerId: v.id("players"),
    skillId: v.string(),
    name: v.string(),
    category: v.string(),
    level: v.number(),
    experience: v.number(),
    nextLevelExperience: v.number(),
    bonuses: v.optional(v.array(v.object({
      type: v.string(),
      value: v.number(),
      description: v.string()
    }))),
    unlockedPerks: v.optional(v.array(v.string()))
  }).index("by_player_skill", ["playerId", "skillId"]),

  skill_perks: defineTable({
    perkId: v.string(),
    name: v.string(),
    description: v.string(),
    skillId: v.string(),
    requiredLevel: v.number(),
    effects: v.array(v.object({
      type: v.string(),
      value: v.number(),
      target: v.string()
    })),
    prerequisites: v.optional(v.array(v.string()))
  })
    .index("by_perkId", ["perkId"])
    .index("by_skillId", ["skillId"]),

  player_achievements: defineTable({
    playerId: v.id("players"),
    achievementId: v.string(),
    completed: v.boolean(),
    progress: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    rewards: v.optional(v.array(v.object({
      type: v.string(),
      value: v.any(),
      claimed: v.boolean()
    })))
  }).index("by_player_achievement", ["playerId", "achievementId"]),

  player_quests: defineTable({
    playerId: v.id("players"),
    questId: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    currentStep: v.optional(v.string()),
    objectives: v.array(v.object({
      objectiveId: v.string(),
      description: v.string(),
      completed: v.boolean(),
      progress: v.optional(v.number()),
      requiredProgress: v.optional(v.number())
    })),
    rewards: v.optional(v.array(v.object({
      type: v.string(),
      value: v.any(),
      claimed: v.boolean()
    })))
  })
    .index("by_player_quest", ["playerId", "questId"])
    .index("by_player_status", ["playerId", "status"]),

  player_journal: defineTable({
    playerId: v.id("players"),
    entryId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    addedAt: v.number(),
    relatedTo: v.optional(v.object({
      type: v.string(),
      id: v.string()
    })),
    isRead: v.boolean()
  })
    .index("by_player", ["playerId"])
    .index("by_player_category", ["playerId", "category"]),

  // Таблица для статистики выборов в квестах
  quest_choices_stats: defineTable({
    questId: v.string(), // ID квеста
    sceneId: v.string(), // ID сцены
    choiceId: v.string(), // ID выбора
    choiceText: v.string(), // Текст выбора для удобства анализа
    totalPicks: v.number(), // Сколько раз этот выбор был сделан
    lastPickedAt: v.number() // Время последнего выбора
  })
    .index("by_quest", ["questId"])
    .index("by_scene", ["sceneId"])
    .index("by_quest_scene", ["questId", "sceneId"]),
    
  // Таблица для хранения истории выборов игроков
  player_quest_choices: defineTable({
    playerId: v.id("players"),
    questId: v.string(),
    sceneId: v.string(),
    choiceId: v.string(),
    choiceText: v.string(),
    pickedAt: v.number(),
    actionResult: v.optional(v.any()) // Результат действия для анализа
  })
    .index("by_player", ["playerId"])
    .index("by_player_quest", ["playerId", "questId"])
    .index("by_quest_choice", ["questId", "choiceId"]),

  shops: defineTable({
    shopId: v.string(),
    name: v.string(),
    ownerId: v.optional(v.id("npcs")),
    location: v.optional(v.string()),
    items: v.array(v.object({
      itemId: v.string(),
      quantity: v.number(),
      price: v.number(),
      discount: v.optional(v.number()),
      requiredReputation: v.optional(v.number())
    })),
    buyMultiplier: v.number(),
    restockTime: v.optional(v.number()),
    lastRestock: v.optional(v.number()),
    factionOwned: v.optional(v.string())
  })
    .index("by_shopId", ["shopId"])
    .index("by_location", ["location"]),

  transaction_history: defineTable({
    playerId: v.id("players"),
    transactionId: v.string(),
    type: v.union(
      v.literal("buy"),
      v.literal("sell"),
      v.literal("trade"),
      v.literal("craft"),
      v.literal("reward"),
      v.literal("other")
    ),
    itemId: v.optional(v.string()),
    quantity: v.optional(v.number()),
    amount: v.number(),
    partnerType: v.optional(v.string()),
    partnerId: v.optional(v.string()),
    timestamp: v.number(),
    location: v.optional(v.string()),
    description: v.optional(v.string())
  })
    .index("by_player", ["playerId"])
    .index("by_player_type", ["playerId", "type"]),

  teams: defineTable({
    teamId: v.string(),
    name: v.string(),
    leaderId: v.id("players"),
    members: v.array(v.object({
      playerId: v.id("players"),
      role: v.optional(v.string()),
      joinedAt: v.number()
    })),
    createdAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("disbanded"),
      v.literal("inactive")
    ),
    description: v.optional(v.string()),
    emblem: v.optional(v.string()),
    reputation: v.optional(v.record(v.string(), v.number())),
    lastActivity: v.optional(v.number())
  })
    .index("by_teamId", ["teamId"])
    .index("by_leader", ["leaderId"]),

  game_factions: defineTable({
    factionId: v.string(),
    name: v.string(),
    description: v.string(),
    leader: v.optional(v.string()),
    territory: v.optional(v.array(v.string())),
    relations: v.record(v.string(), v.number()),
    joinRequirements: v.optional(v.any()),
    ranks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      minReputation: v.number(),
      benefits: v.optional(v.array(v.string()))
    })),
    isPlayable: v.boolean()
  })
    .index("by_factionId", ["factionId"]),

  world_settings: defineTable({
    settingId: v.string(),
    name: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.string(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
    isPublic: v.boolean()
  })
    .index("by_settingId", ["settingId"])
    .index("by_category", ["category"]),

  world_events: defineTable({
    eventId: v.string(),
    name: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    location: v.optional(v.string()),
    participants: v.optional(v.array(v.id("players"))),
    requirements: v.optional(v.any()),
    rewards: v.optional(v.array(v.object({
      type: v.string(),
      value: v.any(),
      description: v.string()
    }))),
    affectedFactions: v.optional(v.array(v.string())),
    eventType: v.string()
  })
    .index("by_eventId", ["eventId"])
    .index("by_status", ["status"])
    .index("by_time", ["startTime"]),

  craft_log: defineTable({
    playerId: v.id("players"),
    recipeId: v.string(),
    shelterId: v.id("shelters"),
    timestamp: v.number(),
    success: v.boolean(),
    resourcesUsed: v.record(v.string(), v.number()),
    resultItemId: v.optional(v.string()),
    resultQuantity: v.optional(v.number()),
    craftTime: v.number()
  })
    .index("by_player", ["playerId"])
    .index("by_recipe", ["recipeId"]),

  session_history: defineTable({
    sessionId: v.id("sessions"),
    questId: v.string(),
    hostId: v.id("players"),
    participants: v.array(v.object({
      playerId: v.id("players"),
      finalStatus: v.string(),
      survived: v.boolean(),
      lootCollected: v.optional(v.array(v.object({
        itemId: v.string(),
        quantity: v.number()
      })))
    })),
    isCooperative: v.boolean(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    status: v.string(),
    objectivesCompleted: v.number(),
    totalObjectives: v.number(),
    enemiesDefeated: v.number(),
    totalEnemies: v.number()
  })
    .index("by_quest", ["questId"])
    .index("by_host", ["hostId"])
    .index("by_status", ["status"]),

  player_effects: defineTable({
    playerId: v.id("players"),
    effectId: v.string(),
    type: v.union(
      v.literal("buff"),
      v.literal("debuff"),
      v.literal("status"),
      v.literal("passive")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    modifier: v.optional(v.record(v.string(), v.number())),
    startTime: v.number(),
    duration: v.number(),
    source: v.optional(v.string()),
    stackable: v.optional(v.boolean()),
    stackCount: v.optional(v.number())
  })
    .index("by_player", ["playerId"])
    .index("by_expiration", ["startTime", "duration"])
  // --- КОНЕЦ новых таблиц ---
});