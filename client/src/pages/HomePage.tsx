import { Link } from 'react-router-dom'
import { useVNStore } from '@/entities/visual-novel/model/store'
import { scenarios } from '@/entities/visual-novel/api/scenarios'
import { useEffect } from 'react'
import { questsApi } from '@/shared/api/quests'

export function Component() {
  // Инициализируем демо-сценарии один раз для движка
  useVNStore.setState((s) => ({ ...s, scenes: scenarios }))
  // На первом заходе пробуем создать состояние игрока (bootstrap)
  useEffect(() => { void questsApi.bootstrapNewPlayer() }, [])
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">QR-Boost</h1>
      <div className="text-neutral-300 space-y-2">
        <p>Добро пожаловать! Это ранний билд. Ниже — последние изменения.</p>
        <ul className="list-disc pl-5 text-sm">
          <li>Добавлена диалоговая система визуальной новеллы</li>
          <li>Карта с маркерами, попапами и открытием диалогов по клику</li>
          <li>Навигация по страницам и демо-данные квеста «Доставка и дилемма»</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link to="/novel" className="bg-emerald-700 hover:bg-emerald-600 rounded px-4 py-2">Начать</Link>
        <Link to="/quests" className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2">Квесты</Link>
      </div>

      <div className="text-sm text-neutral-500">Предпросмотр сцены доступен на отдельной странице «Начать».</div>
    </div>
  )
}

export default Component


