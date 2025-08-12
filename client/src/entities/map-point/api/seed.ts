import type { MapPoint } from '../model/types'
import { mapPointApi } from './local'
import logger from '@/shared/lib/logger'

export function getDemoMapPoints(): MapPoint[] {
  const demo: MapPoint[] = [
    {
      id: 'settlement_center',
      title: 'Городской центр',
      description: 'Сердце выжившего города. Здесь можно встретить нужных людей.',
      coordinates: { lat: 47.9962, lng: 7.8425 },
      type: 'settlement',
      isActive: true,
      dialogKey: 'quest_start_dialog',
      questId: 'delivery_and_dilemma',
      radius: 0,
      icon: '',
    },
    // Мастерская Карла — старт "Искры Свободы" (отложено до Фазы 2)
    {
      id: 'carl_private_workshop',
      title: 'Мастерская Карла',
      description: 'Личная мастерская Карла "Шестерёнки".',
      coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
      type: 'npc',
      isActive: true,
      dialogKey: undefined as any,
      questId: undefined as any,
      radius: 0,
      icon: '',
    },
    // Бар Одина — контент для Фазы 2 (скрыт до поступления)
    {
      id: 'anarchist_bar',
      title: 'Бар Одина',
      description: 'Захудалый бар в квартале анархистов.',
      coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
      type: 'npc',
      isActive: true,
      dialogKey: undefined as any,
      questId: undefined as any,
      radius: 0,
      icon: '',
    },
    // Подвал под ареной — контент для Фазы 2 (скрыт до поступления)
    {
      id: 'anarchist_arena_basement',
      title: 'Подвал Арены',
      description: 'Место, где скрывается Заклёпка и его люди.',
      coordinates: { lat: 47.9936, lng: 7.8526 },
      type: 'npc',
      isActive: true,
      dialogKey: undefined as any,
      questId: undefined as any,
      radius: 0,
      icon: '',
    },
    // Староверы: Отец Иоанн (квест воды — Фаза 2)
    {
      id: 'old_believers_square',
      title: 'Центральная площадь (Отец Иоанн)',
      description: 'Пожилой настоятель Катедраля — Отец Иоанн просит о помощи.',
      coordinates: { lat: 47.99554815122133, lng: 7.851961457760126 },
      type: 'npc',
      isActive: true,
      dialogKey: undefined as any,
      questId: undefined as any,
      radius: 0,
      icon: '',
    },
    // Пивоварня Гюнтера (Фаза 2)
    {
      id: 'gunter_brewery',
      title: 'Пивоварня «Гюнтер»',
      description: 'Один из глав фермеров, отвечает за городскую воду.',
      coordinates: { lat: 47.9903824558821, lng: 7.857654372334707 },
      type: 'npc',
      isActive: true,
      dialogKey: undefined as any,
      questId: undefined as any,
      radius: 0,
      icon: '',
    },
    // КПП Траверса / ворота (Фаза 2)
    {
      id: 'city_gate_travers',
      title: 'Городские ворота (Траверс)',
      description: 'Контрольно-пропускной пункт, лавка Траверса.',
      coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
      type: 'npc',
      isActive: true,
      dialogKey: undefined as any,
      questId: undefined as any,
      radius: 0,
      icon: '',
    },
    // Старт FJR после завершения доставки
    {
      id: 'fjr_office_start',
      title: 'Пункт FJR',
      description: 'Капрал Ганс может выдать особое поручение.',
      coordinates: { lat: 47.99679276901679, lng: 7.8509922034320425 },
      type: 'npc',
      isActive: true,
      dialogKey: 'loyalty_quest_start',
      questId: 'loyalty_fjr',
      radius: 0,
      icon: '',
    },
    // Доска объявлений FJR — старт "Боевого крещения"
    {
      id: 'fjr_board',
      title: 'Доска FJR',
      description: 'Официальные объявления и набор добровольцев.',
      coordinates: { lat: 47.9969, lng: 7.8513 },
      type: 'board',
      isActive: true,
      dialogKey: 'fjr_bulletin_board_dialog',
      questId: 'combat_baptism',
      radius: 0,
      icon: '/images/backgrounds/trader_camp.png',
    },
    // Квартал анархистов «Дыра»
    {
      id: 'anarchist_hole',
      title: '«Дыра» (Анархисты)',
      description: 'Свободная зона под управлением анархистов.',
      coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
      type: 'settlement',
      isActive: true,
      dialogKey: 'infiltration_squat_dialog',
      questId: 'loyalty_fjr',
      radius: 0,
      icon: '',
    },
    {
      id: 'trader_camp',
      title: 'Лагерь торговца',
      description: 'Временный лагерь с товаром и ящиками.',
      coordinates: { lat: 47.985, lng: 7.805 },
      type: 'npc',
      isActive: true,
      dialogKey: 'trader_meeting_dialog',
      questId: 'delivery_and_dilemma',
      radius: 0,
      icon: '/images/npcs/trader.jpg',
    },
    {
      id: 'workshop_center',
      title: 'Мастерская Дитера',
      description: 'Центральная мастерская. Запах машинного масла.',
      coordinates: { lat: 48.0015, lng: 7.855 },
      type: 'npc',
      isActive: true,
      dialogKey: 'craftsman_meeting_dialog',
      questId: 'delivery_and_dilemma',
      radius: 0,
      icon: '/images/npcs/craftsman.jpg',
    },
    {
      id: 'northern_anomaly',
      title: 'Аномальная зона',
      description: 'Искажения воздуха, странные звуки и синее свечение.',
      coordinates: { lat: 48.0205, lng: 7.87 },
      type: 'anomaly',
      isActive: true,
      dialogKey: 'anomaly_exploration_dialog',
      questId: 'delivery_and_dilemma',
      radius: 0,
      icon: '',
    },
  ]
  return demo
}

export async function seedDemoMapPoints(): Promise<void> {
  const existing = await mapPointApi.getPoints()
  const demo = getDemoMapPoints()

  // Мержим: добавляем недостающие точки по id, не перезаписывая существующие
  const existingById = new Map(existing.map((p) => [p.id, p]))
  const merged: MapPoint[] = [...existing]
  for (const d of demo) {
    if (!existingById.has(d.id)) {
      logger.info('SEED', 'Adding missing map point', d.id, d.title)
      merged.push(d)
    }
  }
  await mapPointApi.savePoints(merged)
  logger.info('SEED', 'Seed complete. Total points:', merged.length)
}


