import type { MapPoint } from '../model/types'
import { mapPointApi } from './local'
import logger from '@/shared/lib/logger'

export async function seedDemoMapPoints(): Promise<void> {
  const existing = await mapPointApi.getPoints()

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


