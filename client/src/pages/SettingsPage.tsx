import { useState } from 'react'
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import logger from '@/shared/lib/logger'
import { questsApi } from '@/shared/api/quests'
import { qrApiConvex } from '@/shared/api/qr/convex'
// getDemoMapPoints удалён; используем серверные сиды Convex напрямую

export function Component() {
  const defaultToken = ((import.meta as any).env?.VITE_DEV_SEED_TOKEN as string) ?? ''
  const [token, setToken] = useState<string>(defaultToken)
  const [busy, setBusy] = useState<string | null>(null)
  const [debug, setDebug] = useState<any | null>(null)
  const [qrCode, setQrCode] = useState<string>('QR::settlement_center')
  const [qrResult, setQrResult] = useState<any | null>(null)
  const [outcomeKey, setOutcomeKey] = useState<string>('accept_delivery_quest')
  const [outcomeStatus, setOutcomeStatus] = useState<string>('')
  const call = async (key: 'registry' | 'deps' | 'bindings' | 'qr' | 'map_points' | 'all') => {
    if (!token) return alert('Введите dev token')
    try {
      setBusy(key)
      if (key === 'registry') await convexClient.mutation(api.seed.seedQuestRegistryDev, { devToken: token })
      if (key === 'deps') await convexClient.mutation(api.seed.seedQuestDependenciesDev, { devToken: token })
      if (key === 'bindings') await convexClient.mutation(api.seed.seedMappointBindingsDev, { devToken: token })
      if (key === 'qr') await convexClient.mutation(api.seed.seedQrCodesDev, { devToken: token })
      if (key === 'map_points') await convexClient.mutation(api.seed.seedMapPointsDev, { devToken: token })
      if (key === 'all') {
        await convexClient.mutation(api.seed.seedQuestRegistryDev, { devToken: token })
        await convexClient.mutation(api.seed.seedQuestDependenciesDev, { devToken: token })
        await convexClient.mutation(api.seed.seedMapPointsDev, { devToken: token })
        await convexClient.mutation(api.seed.seedMappointBindingsDev, { devToken: token })
        await convexClient.mutation(api.seed.seedQrCodesDev, { devToken: token })
      }
      alert('Done')
    } catch (e) {
      logger.error('SEED', 'seed error', e as any)
      alert('Error: ' + (e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Developer</h1>
      <h2 className="text-lg font-semibold">Seeds</h2>
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
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" onClick={() => call('map_points')}>Seed Map Points</button>
        <button disabled={busy !== null} className="px-3 py-1 rounded bg-indigo-200 hover:bg-indigo-300 disabled:opacity-50" onClick={() => call('all')}>Seed ALL</button>
      </div>

      <h2 className="text-lg font-semibold pt-2">QR Resolve (server-first)</h2>
      <div className="flex items-center gap-2 flex-wrap">
        <input className="border rounded px-2 py-1" value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="QR::<pointKey>" />
        <button
          className="px-3 py-1 rounded bg-emerald-200 hover:bg-emerald-300"
          onClick={async () => {
            try {
              const res = await qrApiConvex.resolvePoint(qrCode)
              setQrResult(res)
            } catch (e) {
              logger.error('DIALOG', 'resolvePoint failed', e as any)
              alert('resolvePoint error: ' + (e as Error).message)
            }
          }}
        >Resolve</button>
        <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setQrResult(null)}>Clear</button>
      </div>
      {qrResult && (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-2 overflow-auto max-h-80">{JSON.stringify(qrResult, null, 2)}</pre>
      )}

      <h2 className="text-lg font-semibold pt-2">Apply Dialog Outcome</h2>
      <div className="flex items-center gap-2 flex-wrap">
        <input className="border rounded px-2 py-1" value={outcomeKey} onChange={(e) => setOutcomeKey(e.target.value)} placeholder="outcomeKey" />
        <button
          className="px-3 py-1 rounded bg-amber-200 hover:bg-amber-300"
          onClick={async () => {
            try {
              await questsApi.applyDialogOutcome(outcomeKey)
              setOutcomeStatus('OK')
            } catch (e) {
              setOutcomeStatus('ERROR')
              logger.error('DIALOG', 'applyDialogOutcome failed', e as any)
              alert('applyDialogOutcome error: ' + (e as Error).message)
            }
          }}
        >Apply</button>
        {outcomeStatus && <span className="text-xs text-gray-500">{outcomeStatus}</span>}
      </div>

      <h2 className="text-lg font-semibold pt-2">Auth & Profile</h2>
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={async () => {
            try {
              await (convexClient as any).mutation((api as any).auth.ensureUserFromIdentity, {})
              alert('ensureUserFromIdentity: OK')
            } catch (e) {
              logger.error('AUTH', 'ensureUserFromIdentity failed', e as any)
              alert('Error: ' + (e as Error).message)
            }
          }}
        >Ensure User From Identity</button>
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={async () => {
            try {
              await questsApi.bootstrapNewPlayer()
              alert('bootstrapNewPlayer: OK')
            } catch (e) {
              logger.error('AUTH', 'bootstrapNewPlayer failed', e as any)
              alert('Error: ' + (e as Error).message)
            }
          }}
        >Bootstrap New Player</button>
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={async () => {
            try {
              const me = await (convexClient as any).query((api as any).auth.me, {})
              if (!me?.userId) return alert('Not signed in')
              await questsApi.migrateDeviceToUser(me.userId as string)
              alert('migrateDeviceToUser: OK')
            } catch (e) {
              logger.error('AUTH', 'migrateDeviceToUser failed', e as any)
              alert('Error: ' + (e as Error).message)
            }
          }}
        >Migrate Device → User</button>
      </div>
      <h2 className="text-lg font-semibold pt-2">Visible Points Debug</h2>
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-3 py-1 rounded bg-emerald-200 hover:bg-emerald-300"
          onClick={async () => {
            try {
              const deviceId = getOrCreateDeviceId()
              const res = await (convexClient as any).query((api as any).mapPoints.listVisibleDebug, { deviceId })
              setDebug(res)
            } catch (e) {
              logger.error('MAP', 'listVisibleDebug failed', e as any)
              alert('Debug error: ' + (e as Error).message)
            }
          }}
        >
          Load listVisibleDebug
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={() => setDebug(null)}
        >
          Clear
        </button>
      </div>
      {debug && (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-2 overflow-auto max-h-96">
{JSON.stringify(debug, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default Component
