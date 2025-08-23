import { mutation } from './_generated/server'
import { v } from 'convex/values'

const getDevToken = () => (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN

// Dev: seed map points (updated keys and dialog bindings from storage/*Dialogs.ts)
export const seedMapPointsDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    // Strict dev seeding policy: require configured token and exact match.
    // Seeding is forbidden if the expected token is missing or does not match.
    if (!expected) throw new Error('Forbidden: seed token is not configured (VITE_DEV_SEED_TOKEN)')
    if (devToken !== expected) throw new Error('Forbidden: invalid dev token (mismatch)')
    const now = Date.now()
    const points: Array<{
      key: string
      title: string
      description?: string
      coordinates: { lat: number; lng: number }
      type?: string
      dialogKey?: string
      active: boolean
      radius?: number
      icon?: string
    }> = [
      {
        key: 'train_station',
        title: 'ЖД станция',
        description: 'Место прибытия',
        coordinates: { lat: 47.9962, lng: 7.8425 },
        type: 'settlement',
        dialogKey: 'quest_start_dialog', // deliveryQuestDialogs
        active: true,
      },
      {
        key: 'trader_camp',
        title: 'Лагерь торговца',
        description: 'Временный лагерь с товаром и ящиками.',
        coordinates: { lat: 47.985, lng: 7.805 },
        type: 'npc',
        dialogKey: 'trader_meeting_dialog', // deliveryQuestDialogs
        active: true,
        icon: '/images/npcs/trader.jpg',
      },
      {
        key: 'workshop_center',
        title: 'Мастерская Дитера',
        description: 'Центральная мастерская. Запах машинного масла.',
        coordinates: { lat: 48.0015, lng: 7.855 },
        type: 'npc',
        dialogKey: 'craftsman_meeting_dialog', // deliveryQuestDialogs
        active: true,
        icon: '/images/npcs/craftsman.jpg',
      },
      {
        key: 'northern_anomaly',
        title: 'Аномальная зона',
        description: 'Искажения воздуха, странные звуки и синее свечение.',
        coordinates: { lat: 48.0205, lng: 7.87 },
        type: 'anomaly',
        dialogKey: 'anomaly_exploration_dialog', // deliveryQuestDialogs
        active: true,
      },
      // Брифинг FJR (точка перед выходом в парк)
      {
        key: 'fjr_briefing_point',
        title: 'Брифинг FJR',
        description: 'Сбор перед патрулём Stadtgarten.',
        coordinates: { lat: 47.996967960860246, lng: 7.855025931272138 },
        type: 'anomaly',
        active: true,
      },
      // Stadtgarten anomaly (боевой патруль)
      {
        key: 'stadtgarten_anomaly',
        title: 'Стадтгартен — аномалия',
        description: 'Необычные явления в парке Статдгартен.',
        coordinates: { lat: 47.99764091532063, lng: 7.856867590168406 },
        type: 'anomaly',
        active: true,
      },
      // Брифинг FJR (точка перед выходом в парк)
      {
        key: 'fjr_briefing_point',
        title: 'Брифинг FJR',
        description: 'Сбор перед патрулём Stadtgarten.',
        coordinates: { lat: 47.996967960860246, lng: 7.855025931272138 },
        type: 'anomaly',
        active: true,
      },
      {
        key: 'anarchist_hole',
        title: '«Дыра» (Анархисты)',
        description: 'Свободная зона под управлением анархистов.',
        coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
        type: 'settlement',
        active: true,
      },
      // Медицинский центр Synthesis (для квеста field_medicine)
      {
        key: 'synthesis_medical_center',
        title: 'Медпункт "Синтеза"',
        description: 'Медицинский центр для лечения и помощи нуждающимся.',
        coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
        type: 'npc',
        dialogKey: 'field_medicine_quest',
        active: true,
        icon: '/images/backgrounds/synthesis_medbay.jpg',
      },
      // Бар "Тихая Заводь" (для квеста quiet_cove_whisper)
      {
        key: 'quiet_cove_bar',
        title: 'Бар "Тихая Заводь"',
        description: 'Уютное место где можно встретить Люду и узнать новости.',
        coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
        type: 'npc',
        dialogKey: 'whisper_in_quiet_cove_quest',
        active: true,
        icon: '/images/backgrounds/quiet_cove_bar.jpg',
      },
      // Логово Шрама в "Дыре" (для квеста quiet_cove_whisper)
      {
        key: 'scar_hideout',
        title: 'Мастерская Шрама',
        description: 'Подвал бывшей прачечной, где работает Шрам - инженер "Дыры".',
        coordinates: { lat: 47.99289999694173, lng: 7.845946461455242 },
        type: 'npc',
        dialogKey: 'scar_meeting_dialog',
        active: true,
        icon: '/images/backgrounds/anarchist_hideout.jpg',
      },
      // Руины Ботанического сада (для сбора пепельного мха)
      {
        key: 'botanical_garden_ruins',
        title: 'Руины Ботанического сада',
        description: 'Заражённая зона с ядовитыми спорами и мутировавшими растениями.',
        coordinates: { lat: 47.99289999694173, lng: 7.845946461455242 },
        type: 'anomaly',
        dialogKey: 'ash_moss_collection_dialog',
        active: true,
        icon: '/images/backgrounds/botanical_ruins.jpg',
      },
      {
        key: 'fjr_board',
        title: 'Доска FJR',
        description: 'Официальные объявления и набор добровольцев.',
        coordinates: { lat: 47.9969, lng: 7.8513 },
        type: 'board',
        dialogKey: 'fjr_bulletin_board_dialog', // combatBaptismQuestDialogs
        active: true,
        icon: '/images/backgrounds/trader_camp.png',
      },
      {
        key: 'fjr_office_start',
        title: 'Пункт FJR',
        description: 'Капрал Ганс может выдать особое поручение.',
        coordinates: { lat: 47.99679276901679, lng: 7.8509922034320425 },
        type: 'npc',
        dialogKey: 'loyalty_quest_start', // loyaltyQuestDialogs
        active: true,
      },
      {
        key: 'city_gate_travers',
        title: 'Городские ворота (Траверс)',
        description: 'Контрольно-пропускной пункт, лавка Траверса.',
        coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
        type: 'npc',
        active: true,
      },
      {
        key: 'gunter_brewery',
        title: 'Пивоварня «Гюнтер»',
        description: 'Один из глав фермеров, отвечает за городскую воду.',
        coordinates: { lat: 47.9903824558821, lng: 7.857654372334707 },
        type: 'npc',
        // waterQuestDialogs может содержать соответствующий ключ диалога при необходимости
        active: true,
      },
      // Медпункт синтеза (для Field Medicine)
      {
        key: 'Med_point_Synthesis',
        title: 'Медпункт «Синтез»',
        description: 'Лечебный пункт, где можно получить помощь.',
        coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
        type: 'npc',
        active: true,
      },
      {
        key: 'old_believers_square',
        title: 'Центральная площадь (Отец Иоанн)',
        description: 'Пожилой настоятель Катедраля — Отец Иоанн просит о помощи.',
        coordinates: { lat: 47.99554815122133, lng: 7.851961457760126 },
        type: 'npc',
        // bellQuestDialogs может содержать диалог
        active: true,
      },
      {
        key: 'anarchist_arena_basement',
        title: 'Подвал Арены',
        description: 'Место, где скрывается Заклёпка и его люди.',
        coordinates: { lat: 47.9936, lng: 7.8526 },
        type: 'npc',
        active: true,
      },
      {
        key: 'anarchist_bar',
        title: 'Бар Одина',
        description: 'Захудалый бар в квартале анархистов.',
        coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
        type: 'npc',
        active: true,
      },
      {
        key: 'carl_private_workshop',
        title: 'Мастерская Карла',
        description: 'Личная мастерская Карла "Шестерёнки".',
        coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
        type: 'npc',
        active: true,
      },
    ]

    let count = 0
    for (const p of points) {
      const existing = await (db as any).query('map_points').withIndex('by_key', (q: any) => q.eq('key', p.key)).unique()
      if (existing) {
        await (db as any).patch(existing._id, { ...p, updatedAt: now })
      } else {
        await (db as any).insert('map_points', { ...p, updatedAt: now })
      }
      count++
    }
    return { ok: true, count }
  },
})

// Dev: seed mappoint bindings to quests/steps (minimal — start point)
export const seedMappointBindingsDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    // Strict dev seeding policy: require configured token and exact match.
    if (!expected) throw new Error('Forbidden: seed token is not configured (VITE_DEV_SEED_TOKEN)')
    if (devToken !== expected) throw new Error('Forbidden: invalid dev token (mismatch)')
    const now = Date.now()

    const bindings: Array<{
      pointKey: string
      questId: string
      order?: number
      phaseFrom?: number
      phaseTo?: number
      startKey?: string
      dialogKey?: string
      npcId?: string
      stepKey?: string
      isStart?: boolean
      requiresLowHealth?: boolean
    }> = [
      // Этап 0: только ЖД станция со стартовым диалогом
      {
        pointKey: 'train_station',
        questId: 'delivery_and_dilemma',
        isStart: true,
        startKey: 'station_briefing',
        dialogKey: 'quest_start_dialog',
        phaseFrom: 0,
        phaseTo: 0,
        order: 1,
      },
      // Подготовленные шаги квеста (появятся позже, когда реализуем клиентскую фильтрацию по шагам)
      {
        pointKey: 'trader_camp',
        questId: 'delivery_and_dilemma',
        stepKey: 'need_pickup_from_trader',
        dialogKey: 'trader_meeting_dialog',
        phaseFrom: 0,
        phaseTo: 99,
        order: 2,
      },
      {
        pointKey: 'workshop_center',
        questId: 'delivery_and_dilemma',
        stepKey: 'deliver_parts_to_craftsman',
        dialogKey: 'craftsman_meeting_dialog',
        phaseFrom: 0,
        phaseTo: 99,
        order: 3,
      },
      {
        pointKey: 'northern_anomaly',
        questId: 'delivery_and_dilemma',
        stepKey: 'go_to_anomaly',
        dialogKey: 'anomaly_exploration_dialog',
        phaseFrom: 0,
        phaseTo: 99,
        order: 4,
      },
      {
        pointKey: 'workshop_center',
        questId: 'delivery_and_dilemma',
        stepKey: 'return_to_craftsman',
        dialogKey: 'quest_complete_with_artifact_dialog',
        phaseFrom: 0,
        phaseTo: 99,
        order: 5,
      },
      // Фаза 1: стартовые точки доступных квестов
      {
        pointKey: 'city_gate_travers',
        questId: 'quiet_cove_whisper',
        isStart: true,
        startKey: 'courier_missing',
        dialogKey: 'travers_missing_courier_dialog',
        phaseFrom: 1,
        phaseTo: 99,
        order: 9,
      },
      {
        pointKey: 'fjr_office_start',
        questId: 'combat_baptism',
        isStart: true,
        startKey: 'combat_available_on_board',
        dialogKey: 'fjr_bulletin_board_dialog',
        phaseFrom: 1,
        phaseTo: 99,
        order: 10,
      },
      // Брифинг → затем в парк
      {
        pointKey: 'fjr_briefing_point',
        questId: 'combat_baptism',
        stepKey: 'assigned_to_patrol',
        dialogKey: 'Briefing',
        phaseFrom: 1,
        phaseTo: 99,
        order: 11,
      },
      {
        pointKey: 'stadtgarten_anomaly',
        questId: 'combat_baptism',
        stepKey: 'patrol_in_progress',
        dialogKey: 'patrol_start',
        phaseFrom: 1,
        phaseTo: 99,
        order: 12,
      },
      // Медицинский квест: старт в медпункте Synthesis
      {
        pointKey: 'synthesis_medical_center',
        questId: 'field_medicine',
        isStart: true,
        startKey: 'quest_accepted',
        dialogKey: 'field_medicine_quest',
        phaseFrom: 1,
        phaseTo: 99,
        order: 12,
      },
      // Шаг сбора пепельного мха
      {
        pointKey: 'botanical_garden_ruins',
        questId: 'field_medicine',
        stepKey: 'quest_accepted',
        dialogKey: 'ash_moss_collection_dialog',
        phaseFrom: 1,
        phaseTo: 99,
        order: 13,
      },
      // Возврат с мхом (любым результатом)
      {
        pointKey: 'synthesis_medical_center',
        questId: 'field_medicine',
        stepKey: 'moss_collected_injured',
        dialogKey: 'return_with_moss',
        phaseFrom: 1,
        phaseTo: 99,
        order: 14,
      },
      {
        pointKey: 'synthesis_medical_center',
        questId: 'field_medicine',
        stepKey: 'moss_collected_success',
        dialogKey: 'return_with_moss',
        phaseFrom: 1,
        phaseTo: 99,
        order: 15,
      },
      {
        pointKey: 'synthesis_medical_center',
        questId: 'field_medicine',
        stepKey: 'moss_collected_cautious',
        dialogKey: 'return_with_moss',
        phaseFrom: 1,
        phaseTo: 99,
        order: 16,
      },
      {
        pointKey: 'anarchist_bar',
        questId: 'quiet_cove_whisper',
        isStart: true,
        startKey: 'courier_missing',
        phaseFrom: 1,
        phaseTo: 99,
        order: 12,
      },
      {
        pointKey: 'old_believers_square',
        questId: 'bell_for_lost',
        isStart: true,
        startKey: 'bell_mission_offered',
        phaseFrom: 1,
        phaseTo: 99,
        order: 13,
      },
      {
        pointKey: 'fjr_office_start',
        questId: 'combat_baptism',
        stepKey: 'combat_completed',
        dialogKey: 'combat_debrief',
        phaseFrom: 1,
        phaseTo: 99,
        order: 16,
      },
      // Quiet Cove quest progression
      {
        pointKey: 'quiet_cove_bar',
        questId: 'quiet_cove_whisper',
        stepKey: 'courier_missing',
        dialogKey: 'whisper_in_quiet_cove_quest',
        phaseFrom: 1,
        phaseTo: 99,
        order: 17,
      },
      {
        pointKey: 'scar_hideout',
        questId: 'quiet_cove_whisper',
        stepKey: 'find_scar',
        dialogKey: 'whisper_in_quiet_cove_quest',
        phaseFrom: 1,
        phaseTo: 99,
        order: 18,
      },
      {
        pointKey: 'anarchist_arena_basement',
        questId: 'quiet_cove_whisper',
        stepKey: 'stealth_mission',
        dialogKey: 'stealth_mission_rivet_dialog',
        phaseFrom: 1,
        phaseTo: 99,
        order: 19,
      },
      // Return points for quest completion
      {
        pointKey: 'city_gate_travers',
        questId: 'quiet_cove_whisper',
        stepKey: 'mission_completed_peaceful',
        dialogKey: 'travers_missing_courier_dialog',
        phaseFrom: 1,
        phaseTo: 99,
        order: 20,
      },
      {
        pointKey: 'city_gate_travers',
        questId: 'quiet_cove_whisper',
        stepKey: 'mission_completed_violent',
        dialogKey: 'travers_missing_courier_dialog',
        phaseFrom: 1,
        phaseTo: 99,
        order: 21,
      },
      {
        pointKey: 'scar_hideout',
        questId: 'quiet_cove_whisper',
        stepKey: 'mission_completed_peaceful',
        dialogKey: 'whisper_in_quiet_cove_quest',
        phaseFrom: 1,
        phaseTo: 99,
        order: 22,
      },
      {
        pointKey: 'scar_hideout',
        questId: 'quiet_cove_whisper',
        stepKey: 'mission_completed_violent',
        dialogKey: 'whisper_in_quiet_cove_quest',
        phaseFrom: 1,
        phaseTo: 99,
        order: 23,
      }
    ]

    let upserts = 0
    for (const b of bindings) {
      // Дедуп по (pointKey, questId, stepKey, isStart)
      const existing = await (db as any)
        .query('mappoint_bindings')
        .withIndex('by_point', (q: any) => q.eq('pointKey', b.pointKey))
        .collect()
      const same = existing.find(
        (x: any) => x.questId === b.questId && (x.stepKey ?? null) === (b.stepKey ?? null) && Boolean(x.isStart) === Boolean(b.isStart),
      )
      if (same) {
        await (db as any).patch(same._id, { ...b, updatedAt: now })
      } else {
        await (db as any).insert('mappoint_bindings', { ...b, updatedAt: now })
      }
      upserts++
    }
    return { ok: true, count: upserts }
  },
})


