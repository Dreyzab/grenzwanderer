/**
 * Данные для сидирования Map Points
 * Используется как fallback если Convex функции недоступны
 */

import type { MapPoint } from '@/entities/map-point/model/types'

export const SEED_MAP_POINTS: Omit<MapPoint, '_id' | 'status' | 'discoveredAt' | 'researchedAt' | 'discoveredBy'>[] = [
  // 🏕️ ВРЕМЕННЫЙ ЛАГЕРЬ
  {
    id: 'synthesis_camp_storage',
    title: 'Склад "Синтеза"',
    description: 'Временный лагерь с товаром и ящиками. Здесь можно найти припасы и обменять ресурсы',
    coordinates: { lat: 47.9945, lng: 7.853 },
    type: 'poi',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'storage',
      faction: 'synthesis',
      services: ['trade', 'storage'],
      npcs: ['trader_ivan'],
      atmosphere: 'Временные палатки, запах костра и готовящейся еды'
    },
    createdAt: Date.now()
  },

  // 🔧 МАСТЕРСКИЕ
  {
    id: 'workshop_center',
    title: 'Мастерская Дитера',
    description: 'Центральная мастерская. Запах машинного масла и металла наполняет воздух',
    coordinates: { lat: 48.0015, lng: 7.855 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'dieter_craftsman',
      characterName: 'Дитер "Молот"',
      services: ['repair', 'crafting', 'upgrade'],
      dialogues: ['craftsman_meeting_dialog', 'weapon_repair_dialog'],
      questBindings: ['craftsman_quest_chain'],
      atmosphere: 'Грохот молота, искры от сварки, запах машинного масла',
      relationship: {
        initialLevel: 0,
        maxLevel: 100,
        reputationRequired: 10
      }
    },
    createdAt: Date.now()
  },

  {
    id: 'carl_private_workshop',
    title: 'Мастерская Карла "Шестерёнки"',
    description: 'Личная мастерская изобретателя. Стол завален чертежами и механизмами',
    coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'carl_gears',
      characterName: 'Карл "Шестерёнки"',
      services: ['crafting', 'upgrade'],
      dialogues: ['carl_introduction', 'invention_discussion'],
      atmosphere: 'Уютная мастерская, чертежи на стенах, запах смазки',
      relationship: {
        initialLevel: 0,
        maxLevel: 100
      }
    },
    createdAt: Date.now()
  },

  // 🏥 МЕДИЦИНСКИЕ ТОЧКИ
  {
    id: 'synthesis_medical_center',
    title: 'Медпункт "Синтеза"',
    description: 'Медицинский центр для лечения и помощи нуждающимся. Чистота и порядок среди хаоса',
    coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
    type: 'npc',
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
      atmosphere: 'Запах антисептика, белые палатки с красным крестом'
    },
    createdAt: Date.now()
  },

  // ⚔️ ВОЕННЫЕ СТРУКТУРЫ (FJR)
  {
    id: 'fjr_board',
    title: 'Доска объявлений FJR',
    description: 'Официальные объявления и набор добровольцев. Плакаты с призывами к порядку',
    coordinates: { lat: 47.9969, lng: 7.8513 },
    type: 'board',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'bulletin_board',
      faction: 'fjr',
      services: ['quests', 'recruitment', 'news'],
      dialogues: ['fjr_bulletin_board_dialog'],
      questBindings: ['fjr_recruitment', 'patrol_duty', 'security_contract'],
      atmosphere: 'Деревянная доска с бумажными объявлениями, военная символика'
    },
    createdAt: Date.now()
  },

  {
    id: 'fjr_briefing_point',
    title: 'Брифинг FJR',
    description: 'Сбор перед патрулём Stadtgarten. Точка сбора добровольцев',
    coordinates: { lat: 47.996967960860246, lng: 7.855025931272138 },
    type: 'anomaly',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'briefing_point',
      faction: 'fjr',
      services: ['quests'],
      atmosphere: 'Военные палатки, карты на столах, запах оружейного масла',
      requiresFaction: 'fjr',
      minReputation: 20
    },
    createdAt: Date.now()
  },

  // 🏛️ РЕЛИГИОЗНЫЕ ТОЧКИ
  {
    id: 'old_believers_square',
    title: 'Центральная площадь (Отец Иоанн)',
    description: 'Пожилый настоятель Катедраля — Отец Иоанн просит о помощи',
    coordinates: { lat: 47.99554815122133, lng: 7.851961457760126 },
    type: 'npc',
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
        maxLevel: 100
      }
    },
    createdAt: Date.now()
  },

  // 🏴‍☠️ АНАРХИСТСКИЕ ТОЧКИ
  {
    id: 'anarchist_hole',
    title: '«Дыра» (Анархисты)',
    description: 'Свободная зона под управлением анархистов. Царство хаоса и свободы',
    coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
    type: 'settlement',
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
    createdAt: Date.now()
  },

  {
    id: 'anarchist_arena_basement',
    title: 'Подвал Арены',
    description: 'Место, где скрывается Заклёпка и его люди. Секретный штаб анархистов',
    coordinates: { lat: 47.9936, lng: 7.8526 },
    type: 'npc',
    phase: 2,
    isActive: true,
    metadata: {
      category: 'hideout',
      npcId: 'rivet_anarchist',
      characterName: 'Заклёпка',
      faction: 'anarchists',
      services: ['quests'],
      dialogues: ['rivet_meeting', 'anarchist_ideology'],
      questBindings: ['anarchist_questline', 'revolution_plot'],
      atmosphere: 'Тёмный подвал, запах пороха, карты города на стенах',
      hidden: true,
      unlockRequirements: ['anarchist_reputation_30', 'found_entrance'],
      danger_level: 'low'
    },
    createdAt: Date.now()
  },

  // 🎭 РАЗВЛЕКАТЕЛЬНЫЕ ТОЧКИ
  {
    id: 'quiet_cove_bar',
    title: 'Бар "Тихая Заводь"',
    description: 'Уютное место где можно встретить Люду и узнать новости',
    coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
    type: 'npc',
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
      priceRange: 'medium'
    },
    createdAt: Date.now()
  },

  // ⚗️ АНОМАЛЬНЫЕ ЗОНЫ
  {
    id: 'northern_anomaly',
    title: 'Северная Аномальная Зона',
    description: 'Искажения воздуха, странные звуки и синее свечение. Опасная территория',
    coordinates: { lat: 48.0205, lng: 7.87 },
    type: 'anomaly',
    phase: 2,
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
    createdAt: Date.now()
  }
]

/**
 * Получить точку по ID
 */
export function getMapPointById(id: string) {
  return SEED_MAP_POINTS.find(point => point.id === id)
}

/**
 * Получить точки по типу
 */
export function getMapPointsByType(type: string) {
  return SEED_MAP_POINTS.filter(point => point.type === type)
}

/**
 * Получить точки по фазе
 */
export function getMapPointsByPhase(phase: number) {
  return SEED_MAP_POINTS.filter(point => point.phase === phase)
}

/**
 * Получить точки по фракции
 */
export function getMapPointsByFaction(faction: string) {
  return SEED_MAP_POINTS.filter(point => point.metadata?.faction === faction)
}



