import { useMemo } from 'react'
import { getQuestMeta } from '@/entities/quest/model/catalog'
import type { QuestStep } from '@/entities/quest/model/types'
import type { QuestId } from '@/entities/quest/model/ids'
import { useQuest } from '@/entities/quest/model/useQuest'

type QuestMeta = NonNullable<ReturnType<typeof getQuestMeta>>
type QuestItemWithMeta = { id: QuestId; type?: string; priority?: number; meta: QuestMeta }
interface Props {
  title: string
  questIds?: QuestId[]
  items?: { id: QuestId; type?: string; priority?: number }[]
  onClose: () => void
  onRefresh?: () => void
  onAcceptAllDev?: (ids: string[]) => void
}

export function AvailableQuestsModal({ title, questIds, items: itemsProp, onClose, onRefresh, onAcceptAllDev }: Props) {
  const quest = useQuest()
  const items = useMemo<QuestItemWithMeta[]>(() => {
    if (itemsProp && itemsProp.length) {
      return itemsProp
        .map((i) => ({ ...i, meta: getQuestMeta(i.id) }))
        .filter((x): x is QuestItemWithMeta => Boolean(x.meta))
    }
    const ids = (questIds ?? []) as QuestId[]
    return ids
      .map((id) => ({ id, meta: getQuestMeta(id) }))
      .filter((x): x is QuestItemWithMeta => Boolean(x.meta))
  }, [itemsProp, questIds])

  const isEmpty = items.length === 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold truncate">{title}</h3>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded px-2 py-1" onClick={onRefresh}>
                Обновить
              </button>
            )}
            {import.meta.env.DEV && onAcceptAllDev && items.length > 0 && (
              <button
                className="text-xs bg-emerald-800 hover:bg-emerald-700 rounded px-2 py-1"
                onClick={() => onAcceptAllDev(items.map((i) => i.id))}
              >
                Принять все
              </button>
            )}
            <button className="text-sm text-neutral-400 hover:text-white" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
        <ul className="space-y-2">
          {items.map(({ id, meta, type, priority }) => (
            <li key={id} className="flex items-center justify-between rounded bg-neutral-800/40 p-2">
              <div>
                <div className="font-medium">{id}</div>
                <div className="text-xs text-neutral-400">
                  start at: {meta.startPointKey}
                  {type ? ` • ${type}` : ''}
                  {priority != null ? ` • prio ${priority}` : ''}
                </div>
                {/* Заглушка: когда сервер начнёт возвращать причины/пороги, здесь можно отобразить их.
                    Пример: Требуется репутация FJR ≥ 10, отношения с Hans ≥ 30 */}
              </div>
              <button
                className="text-xs bg-emerald-700 hover:bg-emerald-600 rounded px-3 py-1"
                onClick={() => {
                  quest.startQuest(id, meta.startStep as QuestStep)
                  onClose()
                }}
              >
                Начать
              </button>
            </li>
          ))}
          {isEmpty && (
            <li className="text-sm text-neutral-400">
              А сегодня ничего нового
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default AvailableQuestsModal


