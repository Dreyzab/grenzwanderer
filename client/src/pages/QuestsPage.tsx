import { useCallback, useEffect, useMemo, useState } from 'react'
import { listDialogs } from '@/shared/storage/dialogs'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { listQuestsByPhase } from '@/entities/quest/model/catalog'
import { useQuest } from '@/entities/quest/model/useQuest'
import { questsApi } from '@/shared/api/quests'

export function Component() {
  const phase = useProgressionStore((s) => s.phase)
  const quest = useQuest()
  const availableQuests = useMemo(() => listDialogs(), [])
  const availableByPhase = useMemo(() => listQuestsByPhase(phase), [phase])
  const [npcHans, setNpcHans] = useState<any[]>([])
  const [fjrBoard, setFjrBoard] = useState<any[]>([])

  const refreshServerAvailability = useCallback(async () => {
    try {
      const [npc, board] = await Promise.all([
        questsApi.getAvailableQuests('npc', 'hans'),
        questsApi.getAvailableQuests('board', 'fjr_board'),
      ])
      setNpcHans((npc as any) ?? [])
      setFjrBoard((board as any) ?? [])
    } catch {
      setNpcHans([])
      setFjrBoard([])
    }
  }, [])

  useEffect(() => {
    void refreshServerAvailability()
  }, [refreshServerAvailability])

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Квесты</h2>
      <div className="rounded border border-emerald-800 bg-emerald-900/10 p-3 space-y-2">
        <div className="text-sm text-neutral-300">Текущая фаза: {phase}</div>
        <div className="text-sm text-neutral-400">Доступные квесты по фазе</div>
        <ul className="space-y-2">
          {availableByPhase.map((q) => (
            <li key={q.id} className="rounded bg-neutral-900 p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{q.id}</div>
                <div className="text-xs text-neutral-400">start at: {q.startPointKey}</div>
              </div>
              <button
                className="text-xs bg-emerald-700 hover:bg-emerald-600 rounded px-3 py-1"
                onClick={() => {
                  // Для демонстрации: если есть outcomeKey для старта — фиксируем через сервер
                  const outcomeKey = 'accept_' + String(q.id) + '_quest'
                  void questsApi.applyDialogOutcome(outcomeKey).catch(() => quest.startQuest(q.id, q.startStep))
                }}
              >
                Начать
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
        <div className="text-sm text-neutral-400">Активные квесты</div>
        <ul className="space-y-2">
          {Object.values(quest.activeQuests).map((aq: any) => (
            <li key={aq.id} className="rounded bg-neutral-900 p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{aq.id}</div>
                <div className="text-xs text-neutral-400">шаг: {aq.currentStep}</div>
              </div>
              <button
                className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded px-3 py-1"
                onClick={() => {
                  const outcomeKey = 'complete_' + String(aq.id) + '_quest'
                  void questsApi.applyDialogOutcome(outcomeKey).catch(() => quest.completeQuest(aq.id as any))
                }}
              >
                Завершить (dev)
              </button>
            </li>
          ))}
          {Object.values(quest.activeQuests).length === 0 && (
            <li className="text-xs text-neutral-500">Нет активных</li>
          )}
        </ul>
      </div>
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
        <div className="text-sm text-neutral-400">Завершённые квесты</div>
        <ul className="space-y-1 text-sm">
          {quest.completedQuests.map((id) => (
            <li key={id} className="rounded bg-neutral-900 p-2">{id}</li>
          ))}
          {quest.completedQuests.length === 0 && <li className="text-xs text-neutral-500">Нет завершённых</li>}
        </ul>
      </div>
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">Серверная выдача (фильтрация по требованиям)</div>
          <button className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded px-2 py-1" onClick={refreshServerAvailability}>
            Обновить
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="font-medium mb-2">NPC: Hans</div>
            <ul className="space-y-1 text-sm">
              {npcHans.map((q: any) => (
                <li key={`${q.questId}-${q.priority}`} className="flex items-center justify-between gap-2">
                  <span>{q.questId}</span>
                  <span className="text-xs text-neutral-500">prio {q.priority}</span>
                </li>
              ))}
              {npcHans.length === 0 && <li className="text-xs text-neutral-500">Нет доступных</li>}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Доска: FJR</div>
            <ul className="space-y-1 text-sm">
              {fjrBoard.map((q: any) => (
                <li key={`${q.questId}-${q.priority}`} className="flex items-center justify-between gap-2">
                  <span>{q.questId}</span>
                  <span className="text-xs text-neutral-500">prio {q.priority}</span>
                </li>
              ))}
              {fjrBoard.length === 0 && <li className="text-xs text-neutral-500">Нет доступных</li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
        <div className="text-sm text-neutral-400">Доступные диалоги/квесты (локальные)</div>
        <ul className="space-y-2">
          {availableQuests.map((d) => (
            <li key={d.dialogKey} className="rounded bg-neutral-900 p-3">
              <div className="font-medium">{d.title}</div>
              <div className="text-xs text-neutral-400">key: {d.dialogKey}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-neutral-500">Интеграция с Convex сохранена в коде, но скрыта на UI до подключения реального бекенда.</div>
    </div>
  )
}

export default Component


