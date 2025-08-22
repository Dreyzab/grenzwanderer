import { mutation } from './_generated/server'
import { v } from 'convex/values'

const getDevToken = () => (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN

// Dev: сиды точек карты (обновлённые ключи и привязка к диалогам из storage/*Dialogs.ts)
export const seedMapPointsDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    // В дев-режиме разрешаем сид, если переменная не настроена. Если настроена — проверяем.
    if (expected && devToken !== expected) throw new Error('Forbidden: invalid dev token')
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
      {
        key: 'anarchist_hole',
        title: '«Дыра» (Анархисты)',
        description: 'Свободная зона под управлением анархистов.',
        coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
        type: 'settlement',
        active: true,
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

// Dev: сид биндингов точек к квестам/шагам (минимально — стартовая точка)
export const seedMappointBindingsDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    if (expected && devToken !== expected) throw new Error('Forbidden: invalid dev token')
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


