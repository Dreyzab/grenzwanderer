import { useMemo } from 'react'
import { listDialogs } from '@/shared/storage/dialogs'

export function Component() {
  const availableQuests = useMemo(() => listDialogs(), [])

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Квесты</h2>
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


