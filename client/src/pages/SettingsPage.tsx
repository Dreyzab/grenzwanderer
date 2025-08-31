import { useState } from 'react'
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
import logger from '@/shared/lib/logger'
import { useQuestStore } from '@/entities/quest/model/questStore'
import { usePlayerStore } from '@/entities/player/model/store'
import { useGameDataStore } from '@/app/ConvexProvider'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
// getDemoMapPoints удалён; используем серверные сиды Convex напрямую

export function Component() {
  const quests = useQuestStore()
  const player = usePlayerStore()
  const gameData = useGameDataStore()
  const defaultToken = ((import.meta as any).env?.VITE_DEV_SEED_TOKEN as string) ?? ''
  const [token, setToken] = useState<string>(defaultToken)
  const [busy, setBusy] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<any | null>(null)
  const call = async (key: 'map_points' | 'bindings' | 'registry' | 'registry_phase2' | 'init') => {
    try {
      setBusy(key)
      let didSeed = false
      if (key === 'map_points') { await convexClient.mutation((api as any).mapPoints.seedMapPointsDev, { devToken: token || 'dev' }); didSeed = true }
      if (key === 'bindings') { await convexClient.mutation((api as any).mapPoints.seedMappointBindingsDev, { devToken: token || 'dev' }); didSeed = true }
      if (key === 'registry') { await convexClient.mutation((api as any).quests.seedQuestRegistryDev, { devToken: token || 'dev' }); didSeed = true }
      if (key === 'registry_phase2') { await convexClient.mutation((api as any).quests.seedQuestRegistryPhase2Dev, { devToken: token || 'dev' }); didSeed = true }
      if (key === 'init' || didSeed) {
        const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
        const snap = await convexClient.mutation((api as any).quests.initializeSession, { deviceId })
        setSnapshot(snap)
        // Гидрация стора приложения, чтобы карта увидела точки/биндинги сразу
        if (Array.isArray(snap?.progress)) {
          quests.hydrate(
            snap.progress.map((p: any) => ({ id: p.questId, currentStep: p.currentStep, completedAt: p.completedAt ?? null })),
          )
        }
        gameData.hydrate({
          questRegistry: snap?.questRegistry ?? [],
          mappointBindings: snap?.mappointBindings ?? [],
          mapPoints: snap?.mapPoints ?? [],
        } as any)
        if (snap?.playerState) player.hydrateFromServer(snap.playerState as any)
      }
      alert('Done')
    } catch (e) {
      logger.error('SEED', 'seed/init error', e as any)
      alert('Error: ' + (e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-amber-50 rounded-t-xl">
          <h1 className="text-2xl font-semibold">Настройки разработчика</h1>
          <p className="text-sm text-gray-600 mt-1">Сиды данных, инициализация сессии и сброс локального прогресса</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dev token</label>
            <input className="mt-1 border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300" value={token} onChange={(e) => setToken(e.target.value)} placeholder="VITE_DEV_SEED_TOKEN" />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Сиды</h2>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy !== null} className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50" onClick={() => call('map_points')}>Seed Map Points</button>
              <button disabled={busy !== null} className="px-3 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50" onClick={() => call('bindings')}>Seed Map Bindings</button>
              <button disabled={busy !== null} className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" onClick={() => call('registry')}>Seed Quest Registry (Phase 1)</button>
              <button disabled={busy !== null} className="px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50" onClick={() => call('registry_phase2')}>Seed Quest Registry (Phase 2)</button>
              <button disabled={busy !== null} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" onClick={() => call('init')}>Initialize Session</button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Тестирование условий квестов</h2>
            <p className="text-sm text-gray-600 mb-3">Управление состоянием игрока для тестирования активации квестов</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                disabled={busy !== null}
                onClick={async () => {
                  try {
                    setBusy('set_fame_70')
                    const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
                    // Устанавливаем известность 70 для тестирования
                    const newState = {
                      fame: 70,
                      phase: player.phase,
                      health: player.health,
                      reputations: player.reputations,
                      relationships: player.relationships,
                      flags: player.flags,
                      status: player.status,
                      inventory: player.inventory
                    }
                    await convexClient.mutation((api as any).quests.syncProgress, {
                      deviceId,
                      progress: { activeQuests: {}, completedQuests: [] }
                    })
                    // Обновляем локальное состояние
                    player.hydrateFromServer(newState)
                    alert('Известность установлена на 70')
                  } catch (e) {
                    logger.error('STORE', 'set fame error', e as any)
                    alert('Error: ' + (e as Error).message)
                  } finally {
                    setBusy(null)
                  }
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Установить известность 70
              </button>
              <button
                disabled={busy !== null}
                onClick={async () => {
                  try {
                    setBusy('set_fame_50')
                    // Устанавливаем известность 50 для тестирования
                    const newState = {
                      fame: 50,
                      phase: player.phase,
                      health: player.health,
                      reputations: player.reputations,
                      relationships: player.relationships,
                      flags: player.flags,
                      status: player.status,
                      inventory: player.inventory
                    }
                    // Обновляем локальное состояние
                    player.hydrateFromServer(newState)
                    alert('Известность установлена на 50')
                  } catch (e) {
                    logger.error('STORE', 'set fame error', e as any)
                    alert('Error: ' + (e as Error).message)
                  } finally {
                    setBusy(null)
                  }
                }}
                className="px-3 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Установить известность 50
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Текущая известность: {player.fame ?? 0}. Для активации квеста "Приглашение в Цитадель" нужна известность ≥ 70.
            </p>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Сброс</h2>
            <p className="text-sm text-gray-600 mb-3">Полный сброс локального прогресса квестов и данных игрока (локальное хранилище). Серверные данные не трогаются.</p>
            <button
              disabled={busy !== null}
              onClick={() => {
                if (!confirm('Сбросить локальный прогресс и данные игрока? Это действие необратимо.')) return
                // Локальный сброс всего: хранилища zustand с persist и localStorage ключей
                try {
                  // Ключи persist
                  localStorage.removeItem('quest-progress')
                  localStorage.removeItem('player-progression')
                  // Возможные дополнительные ключи (на будущее)
                  localStorage.removeItem('device-id')
                  localStorage.removeItem('player-phase')
                  localStorage.removeItem('registration_prompt_dismissed')
                } catch {}
                // Сброс стора к исходным значениям
                quests.hydrate([])
                // жёстко ставим фазу = 0
                useProgressionStore.getState().setPhase(0)
                player.hydrateFromServer({ phase: 0, fame: 0, reputations: {}, relationships: {}, flags: [], status: 'refugee', inventory: [] })
                alert('Локальный прогресс сброшен')
                // Перегидрируем снапшот сразу после сброса
                void (async () => {
                  try {
                    const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
                    const snap = await convexClient.mutation((api as any).quests.initializeSession, { deviceId, clientPhase: 0 })
                    setSnapshot(snap)
                    if (Array.isArray(snap?.progress)) {
                      quests.hydrate(
                        snap.progress.map((p: any) => ({ id: p.questId, currentStep: p.currentStep, completedAt: p.completedAt ?? null })),
                      )
                    }
                    gameData.hydrate({
                      questRegistry: snap?.questRegistry ?? [],
                      mappointBindings: snap?.mappointBindings ?? [],
                      mapPoints: snap?.mapPoints ?? [],
                    } as any)
                    if (snap?.playerState) player.hydrateFromServer({ ...(snap.playerState as any), phase: 0 })
                  } catch {}
                })()
              }}
              className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Сбросить всё локально
            </button>
          </div>

          {snapshot && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Снапшот</h2>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-3 overflow-auto max-h-96">{JSON.stringify({
                phase: snapshot?.playerState?.phase,
                progressCount: (snapshot?.progress ?? []).length,
                registryCount: (snapshot?.questRegistry ?? []).length,
                bindingsCount: (snapshot?.mappointBindings ?? []).length,
                mapPointsCount: (snapshot?.mapPoints ?? []).length,
              }, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Component
