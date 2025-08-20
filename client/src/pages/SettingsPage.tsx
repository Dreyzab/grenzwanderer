import { useState } from 'react'
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
import { getDemoMapPoints } from '@/entities/map-point/api/seed'
import { mapPointsApiConvex } from '@/shared/api/mapPoints/convex'

export function Component() {
  const defaultToken = ((import.meta as any).env?.VITE_DEV_SEED_TOKEN as string) ?? ''
  const [token, setToken] = useState<string>(defaultToken)
  const [busy, setBusy] = useState<string | null>(null)
  const call = async (key: 'registry' | 'deps' | 'bindings' | 'qr' | 'map_points' | 'all') => {
    if (!token) return alert('Введите dev token')
    try {
      setBusy(key)
      if (key === 'registry') await convexClient.mutation(api.seed.seedQuestRegistryDev, { devToken: token })
      if (key === 'deps') await convexClient.mutation(api.seed.seedQuestDependenciesDev, { devToken: token })
      if (key === 'bindings') await convexClient.mutation(api.seed.seedMappointBindingsDev, { devToken: token })
      if (key === 'qr') await convexClient.mutation(api.seed.seedQrCodesDev, { devToken: token })
      if (key === 'map_points') {
        const demo = getDemoMapPoints()
        const points = demo.map((p) => ({
          key: p.id,
          title: p.title,
          description: p.description,
          coordinates: p.coordinates,
          type: p.type,
          dialogKey: p.dialogKey,
          questId: p.questId,
          active: p.isActive,
          radius: p.radius,
          icon: p.icon,
        }))
        await mapPointsApiConvex.upsertManyDev(points, token)
      }
      if (key === 'all') {
        await convexClient.mutation(api.seed.seedQuestRegistryDev, { devToken: token })
        await convexClient.mutation(api.seed.seedQuestDependenciesDev, { devToken: token })
        const demo = getDemoMapPoints()
        const points = demo.map((p) => ({
          key: p.id,
          title: p.title,
          description: p.description,
          coordinates: p.coordinates,
          type: p.type,
          dialogKey: p.dialogKey,
          questId: p.questId,
          active: p.isActive,
          radius: p.radius,
          icon: p.icon,
        }))
        await mapPointsApiConvex.upsertManyDev(points, token)
        await convexClient.mutation(api.seed.seedMappointBindingsDev, { devToken: token })
        await convexClient.mutation(api.seed.seedQrCodesDev, { devToken: token })
      }
      alert('Done')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      alert('Error: ' + (e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Developer Seeds</h1>
      <label className="block">
        <span className="text-sm text-gray-500">Dev token</span>
        <input className="mt-1 border rounded px-2 py-1 w-full" value={token} onChange={(e) => setToken(e.target.value)} placeholder="VITE_DEV_SEED_TOKEN" />
        {defaultToken && <span className="text-xs text-gray-500">Загружен из env: VITE_DEV_SEED_TOKEN</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => call('registry')}>Seed Quest Registry</button>
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => call('deps')}>Seed Dependencies</button>
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => call('bindings')}>Seed Mappoint Bindings</button>
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => call('qr')}>Seed QR Codes</button>
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => call('map_points')}>Seed Map Points (demo)</button>
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-indigo-200 hover:bg-indigo-300 disabled:opacity-50" onClick={() => call('all')}>Seed ALL</button>
      </div>
    </div>
  )
}

export default Component
