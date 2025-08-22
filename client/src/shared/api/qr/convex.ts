// Convex removed at runtime: provide client-side no-ops
// import { api } from '../../../../convex/_generated/api'
// import { convexClient } from '@/shared/lib/convexClient'
import type { NextActionType } from '@/shared/constants'
import { usePlayerStore } from '@/entities/player/model/store'

export type QRResolvePointResult =
  | { status: 'not_found' }
  | { status: 'point_inactive' }
  | {
      status: 'ok'
      point: { key: string; title: string; dialogKey?: string; questId?: string; coordinates: { lat: number; lng: number }; eventKey?: string; npcId?: string }
      hasPda: boolean
      nextAction: NextActionType
      playerState: {
        phase?: number
        fame?: number
        flags?: string[]
        reputations?: Record<string, number>
        relationships?: Record<string, number>
        inventory?: string[]
        status?: string
        hasPda?: boolean
      } | null
    }

export const qrApiConvex = {
  resolvePoint: async (code: string) => {
    // Simple local QR: expect code = 'QR::<pointKey>' and return not_found by default
    if (!code?.startsWith('QR::')) return { status: 'not_found' } as QRResolvePointResult
    const pointKey = code.slice(4)
    return { status: 'ok', point: { key: pointKey, title: pointKey, coordinates: { lat: 0, lng: 0 } }, hasPda: true, nextAction: 'none' as NextActionType, playerState: null }
  },
  grantPda: async () => {
    try {
      // Mark PDA locally: add flag and inventory item
      usePlayerStore.setState((s) => {
        const flags = new Set<string>(s.flags ?? [])
        flags.add('has_pda')
        const inv = new Set<string>(s.inventory ?? [])
        inv.add('pda')
        return { flags: Array.from(flags), inventory: Array.from(inv) } as any
      })
      // Persist lightweight snapshot
      try {
        const raw = localStorage.getItem('player-state')
        const prev = raw ? JSON.parse(raw) : {}
        prev.flags = Array.from(new Set([...(prev.flags ?? []), 'has_pda']))
        prev.inventory = Array.from(new Set([...(prev.inventory ?? []), 'pda']))
        localStorage.setItem('player-state', JSON.stringify(prev))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[QR] Failed to persist player-state to localStorage', error)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[QR] grantPda failed', error)
    }
    return { ok: true }
  },
}


