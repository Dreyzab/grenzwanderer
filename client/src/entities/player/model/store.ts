import { create } from 'zustand'
import logger from '@/shared/lib/logger'

interface PlayerState {
  credits: number
  skills: Set<string>
  // Расширенные поля игрока (гидрация с сервера Convex)
  fame?: number
  reputations?: Record<string, number>
  relationships?: Record<string, number>
  flags?: string[]
  status?: string

  addCredits: (amount: number) => void
  spendCredits: (amount: number) => boolean
  addSkill: (skill: string) => void
  removeSkill: (skill: string) => void

  hydrateFromServer: (p: {
    fame?: number | null
    reputations?: Record<string, number> | null
    relationships?: Record<string, number> | null
    flags?: string[] | null
    status?: string | null
  } | null) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  credits: 0,
  skills: new Set<string>(),
  fame: 0,
  reputations: {},
  relationships: {},
  flags: [],
  status: 'refugee',
  addCredits: (amount) =>
    set((s) => {
      const next = Math.max(0, (s.credits ?? 0) + amount)
      logger.info('STORE', 'addCredits', amount, '→', next)
      return { credits: next }
    }),
  spendCredits: (amount) => {
    const current = get().credits ?? 0
    if (current < amount) return false
    set({ credits: current - amount })
      logger.info('STORE', 'spendCredits', amount, '→', current - amount)
    return true
  },
  addSkill: (skill) =>
    set((s) => {
      const next = new Set(s.skills)
      next.add(skill)
        logger.info('STORE', 'addSkill', skill)
      return { skills: next }
    }),
  removeSkill: (skill) =>
    set((s) => {
      const next = new Set(s.skills)
      next.delete(skill)
        logger.info('STORE', 'removeSkill', skill)
      return { skills: next }
    }),
  hydrateFromServer: (p) =>
    set((s) => {
      if (!p) return s
      const next = {
        fame: p.fame ?? s.fame ?? 0,
        reputations: p.reputations ?? s.reputations ?? {},
        relationships: p.relationships ?? s.relationships ?? {},
        flags: p.flags ?? s.flags ?? [],
        status: p.status ?? s.status ?? 'refugee',
      }
      logger.info('STORE', 'hydratePlayer', next)
      return next as any
    }),
}))


