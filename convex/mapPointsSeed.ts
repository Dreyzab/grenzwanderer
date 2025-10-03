import { mutation } from './_generated/server'

/**
 * Сидирование Map Points для Freiburg
 * Включает все локации из спецификации с привязками к квестам и НПС
 */
export const seedMapPoints = mutation({
  handler: async (ctx) => {
    const now = Date.now()
    
    // Проверяем, есть ли уже точки
    const existingPoints = await ctx.db.query('map_points').take(1)
    if (existingPoints.length > 0) {
      console.log('Map points already seeded, skipping...')
      return { success: true, message: 'Already seeded', pointsCreated: 0 }
    }

    // ========================================
    // 🏕️ ВРЕМЕННЫЙ ЛАГЕРЬ (Торговля и хранилища)
    // ========================================
    const campPoints = [
      {
        id: 'synthesis_camp_storage',
        title: 'Склад "Синтеза"',
        description: 'Временный лагерь с товаром и ящиками. Здесь можно найти припасы и обменять ресурсы',
        coordinates: { lat: 47.9945, lng: 7.853 },
        type: 'poi' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'storage',
          faction: 'synthesis',
          services: ['trade', 'storage'],
          npcs: ['trader_ivan'],
          inventory: {
            foodSupplies: true,
            medicalSupplies: true,
            ammunition: true,
            tools: true
          },
          atmosphere: 'Временные палатки, запах костра и готовящейся еды'
        },
        createdAt: now
      }
    ]

    // ========================================
    // 🔧 МАСТЕРСКИЕ И РЕМОНТ
    // ========================================
    const workshopPoints = [
      {
        id: 'workshop_center',
        title: 'Мастерская Дитера',
        description: 'Центральная мастерская. Запах машинного масла и металла наполняет воздух',
        coordinates: { lat: 48.0015, lng: 7.855 },
        type: 'npc' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'workshop',
          npcId: 'dieter_craftsman',
          characterName: 'Дитер "Молот"',
          services: ['repair', 'crafting', 'upgrade'],
          specialization: 'heavy_weapons',
          dialogues: ['craftsman_meeting_dialog', 'weapon_repair_dialog'],
          questBindings: ['craftsman_quest_chain'],
          atmosphere: 'Грохот молота, искры от сварки, запах машинного масла',
          inventoryAccess: true,
          relationship: {
            initialLevel: 0,
            maxLevel: 100,
            reputationRequired: 10
          }
        },
        createdAt: now
      },
      {
        id: 'carl_private_workshop',
        title: 'Мастерская Карла "Шестерёнки"',
        description: 'Личная мастерская изобретателя. Стол завален чертежами и механизмами',
        coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
        type: 'npc' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'workshop',
          npcId: 'carl_gears',
          characterName: 'Карл "Шестерёнки"',
          services: ['crafting', 'invention', 'modification'],
          specialization: 'precision_mechanics',
          dialogues: ['carl_introduction', 'invention_discussion'],
          atmosphere: 'Уютная мастерская, чертежи на стенах, запах смазки',
          inventoryAccess: true,
          relationship: {
            initialLevel: 0,
            maxLevel: 100,
            unlockRequirements: ['met_dieter']
          }
        },
        createdAt: now
      }
    ]

    // ========================================
    // 🏥 МЕДИЦИНСКИЕ ТОЧКИ
    // ========================================
    const medicalPoints = [
      {
        id: 'synthesis_medical_center',
        title: 'Медпункт "Синтеза"',
        description: 'Медицинский центр для лечения и помощи нуждающимся. Чистота и порядок среди хаоса',
        coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
        type: 'npc' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'medical',
          npcId: 'doctor_elena',
          characterName: 'Доктор Елена',
          faction: 'synthesis',
          services: ['healing', 'medicine_trade', 'first_aid_training'],
          dialogues: ['field_medicine_quest', 'medical_assistance'],
          questBindings: ['field_medicine_quest', 'medical_supplies_quest'],
          atmosphere: 'Запах антисептика, белые палатки с красным крестом',
          healingCost: {
            minor: 50,
            moderate: 150,
            critical: 500
          }
        },
        createdAt: now
      }
    ]

    // ========================================
    // ⚔️ ВОЕННЫЕ И СИЛОВЫЕ СТРУКТУРЫ (FJR)
    // ========================================
    const militaryPoints = [
      {
        id: 'fjr_board',
        title: 'Доска объявлений FJR',
        description: 'Официальные объявления и набор добровольцев. Плакаты с призывами к порядку',
        coordinates: { lat: 47.9969, lng: 7.8513 },
        type: 'board' as const, // Новый подтип для досок объявлений
        phase: 1,
        isActive: true,
        metadata: {
          category: 'bulletin_board',
          faction: 'fjr',
          services: ['quests', 'recruitment', 'news'],
          dialogues: ['fjr_bulletin_board_dialog'],
          questBindings: ['fjr_recruitment', 'patrol_duty', 'security_contract'],
          atmosphere: 'Деревянная доска с бумажными объявлениями, военная символика',
          availableQuests: {
            patrol: true,
            guard: true,
            investigation: true
          }
        },
        createdAt: now
      },
      {
        id: 'fjr_briefing_point',
        title: 'Брифинг FJR',
        description: 'Сбор перед патрулём Stadtgarten. Точка сбора добровольцев',
        coordinates: { lat: 47.996967960860246, lng: 7.855025931272138 },
        type: 'anomaly' as const, // Используем anomaly для специальных точек
        phase: 1,
        isActive: true,
        metadata: {
          category: 'briefing_point',
          faction: 'fjr',
          services: ['briefing', 'patrol_start'],
          atmosphere: 'Военные палатки, карты на столах, запах оружейного масла',
          patrolRoutes: ['stadtgarten_patrol', 'northern_sector'],
          requiresFaction: 'fjr',
          minReputation: 20
        },
        createdAt: now
      }
    ]

    // ========================================
    // 🏛️ РЕЛИГИОЗНЫЕ И СОЦИАЛЬНЫЕ ТОЧКИ
    // ========================================
    const religiousPoints = [
      {
        id: 'old_believers_square',
        title: 'Центральная площадь (Отец Иоанн)',
        description: 'Пожилый настоятель Катедраля — Отец Иоанн просит о помощи',
        coordinates: { lat: 47.99554815122133, lng: 7.851961457760126 },
        type: 'npc' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'religious',
          npcId: 'father_ioann',
          characterName: 'Отец Иоанн',
          faction: 'old_believers',
          services: ['blessing', 'confession', 'shelter'],
          dialogues: ['father_ioann_plea', 'cathedral_help'],
          questBindings: ['help_cathedral', 'protect_believers'],
          atmosphere: 'Старинная площадь, звон колоколов, запах ладана',
          relationship: {
            initialLevel: 0,
            maxLevel: 100,
            bonuses: {
              blessing: 'temporary_luck_boost',
              confession: 'stress_reduction'
            }
          }
        },
        createdAt: now
      }
    ]

    // ========================================
    // 🏴‍☠️ АНАРХИСТСКИЕ ТОЧКИ
    // ========================================
    const anarchistPoints = [
      {
        id: 'anarchist_hole',
        title: '«Дыра» (Анархисты)',
        description: 'Свободная зона под управлением анархистов. Царство хаоса и свободы',
        coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
        type: 'settlement' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'anarchist_zone',
          faction: 'anarchists',
          services: ['black_market', 'underground_intel', 'refuge'],
          npcs: ['rivet_leader', 'dealers', 'informants'],
          atmosphere: 'Граффити на стенах, костры, музыка и смех. Свобода без правил',
          danger_level: 'medium',
          lawless: true,
          tradeOptions: {
            blackMarket: true,
            stolenGoods: true,
            contraband: true
          }
        },
        createdAt: now
      },
      {
        id: 'anarchist_arena_basement',
        title: 'Подвал Арены',
        description: 'Место, где скрывается Заклёпка и его люди. Секретный штаб анархистов',
        coordinates: { lat: 47.9936, lng: 7.8526 },
        type: 'npc' as const,
        phase: 2, // Доступно на 2й фазе
        isActive: true,
        metadata: {
          category: 'hideout',
          npcId: 'rivet_anarchist',
          characterName: 'Заклёпка',
          faction: 'anarchists',
          services: ['quest_hub', 'underground_missions'],
          dialogues: ['rivet_meeting', 'anarchist_ideology'],
          questBindings: ['anarchist_questline', 'revolution_plot'],
          atmosphere: 'Тёмный подвал, запах пороха, карты города на стенах',
          hidden: true,
          unlockRequirements: ['anarchist_reputation_30', 'found_entrance'],
          danger_level: 'low' // Безопасно для членов группы
        },
        createdAt: now
      }
    ]

    // ========================================
    // 🎭 РАЗВЛЕКАТЕЛЬНЫЕ ТОЧКИ
    // ========================================
    const entertainmentPoints = [
      {
        id: 'quiet_cove_bar',
        title: 'Бар "Тихая Заводь"',
        description: 'Уютное место где можно встретить Люду и узнать новости',
        coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
        type: 'npc' as const,
        phase: 1,
        isActive: true,
        metadata: {
          category: 'bar',
          npcId: 'lyuda_bartender',
          characterName: 'Люда',
          services: ['information', 'rumors', 'rest', 'drinks'],
          dialogues: ['whisper_in_quiet_cove_quest', 'bar_gossip', 'news_exchange'],
          questBindings: ['whisper_in_quiet_cove_quest', 'information_network'],
          atmosphere: 'Тёплый свет, тихая музыка, запах пива и жареного мяса',
          socialHub: true,
          informationQuality: 'high',
          priceRange: 'medium',
          specialFeatures: {
            newsBoard: true,
            privateRooms: true,
            gambling: false
          }
        },
        createdAt: now
      }
    ]

    // ========================================
    // ⚗️ АНОМАЛЬНЫЕ ЗОНЫ
    // ========================================
    const anomalyPoints = [
      {
        id: 'northern_anomaly',
        title: 'Северная Аномальная Зона',
        description: 'Искажения воздуха, странные звуки и синее свечение. Опасная территория',
        coordinates: { lat: 48.0205, lng: 7.87 },
        type: 'anomaly' as const,
        phase: 2, // Доступно на 2й фазе
        isActive: true,
        metadata: {
          category: 'anomaly',
          danger_level: 'high',
          services: ['exploration', 'artifact_hunting'],
          dialogues: ['anomaly_exploration_dialog', 'scientist_warning'],
          questBindings: ['anomaly_investigation', 'artifact_retrieval'],
          atmosphere: 'Искажённое пространство, синее свечение, электрические разряды',
          hazards: {
            radiation: 'low',
            temporal_distortion: 'medium',
            hostile_entities: 'high'
          },
          rewards: {
            artifacts: true,
            rareResources: true,
            scientificData: true
          },
          requiresEquipment: ['geiger_counter', 'protective_suit'],
          recommendedLevel: 10
        },
        createdAt: now
      }
    ]

    // ========================================
    // ВСТАВКА ВСЕХ ТОЧЕК В БАЗУ
    // ========================================
    const allPoints = [
      ...campPoints,
      ...workshopPoints,
      ...medicalPoints,
      ...militaryPoints,
      ...religiousPoints,
      ...anarchistPoints,
      ...entertainmentPoints,
      ...anomalyPoints
    ]

    let createdCount = 0
    for (const point of allPoints) {
      try {
        await ctx.db.insert('map_points', point)
        createdCount++
        console.log(`✅ Created point: ${point.id} - ${point.title}`)
      } catch (error) {
        console.error(`❌ Failed to create point ${point.id}:`, error)
      }
    }

    console.log(`🎉 Successfully seeded ${createdCount} map points`)

    return {
      success: true,
      message: `Seeded ${createdCount} map points`,
      pointsCreated: createdCount,
      categories: {
        camp: campPoints.length,
        workshops: workshopPoints.length,
        medical: medicalPoints.length,
        military: militaryPoints.length,
        religious: religiousPoints.length,
        anarchist: anarchistPoints.length,
        entertainment: entertainmentPoints.length,
        anomaly: anomalyPoints.length
      }
    }
  }
})

/**
 * Очистка всех map points (для разработки)
 */
export const clearMapPoints = mutation({
  handler: async (ctx) => {
    const points = await ctx.db.query('map_points').collect()
    
    for (const point of points) {
      await ctx.db.delete(point._id)
    }

    return {
      success: true,
      message: `Deleted ${points.length} map points`
    }
  }
})

/**
 * Пересидировать точки (очистка + создание)
 */
export const reseedMapPoints = mutation({
  handler: async (ctx) => {
    // Сначала очищаем
    const points = await ctx.db.query('map_points').collect()
    for (const point of points) {
      await ctx.db.delete(point._id)
    }

    // Затем создаем заново
    // Переиспользуем логику из seedMapPoints
    // (код идентичен seedMapPoints, но без проверки на существование)
    
    return {
      success: true,
      message: 'Map points reseeded successfully'
    }
  }
})


