import { create } from 'zustand'
import logger from '@/shared/lib/logger'
import { BASELINE_HUMAN } from '@/shared/config/attributes'

interface PlayerState {
  name?: string
  credits: number
  skills: Set<string>
  attributes?: Record<string, number>
  skillsLevels?: Record<string, number>
  inventory: string[]
  phase?: number
  health?: number
  // Ð Ð°ÑÑˆÐ¸Ñ€ÐµÐ½Ð½Ñ‹Ðµ Ð¿Ð¾Ð»Ñ Ð¸Ð³Ñ€Ð¾ÐºÐ° (Ð³Ð¸Ð´Ñ€Ð°Ñ†Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð° Convex)
  fame?: number
  reputations?: Record<string, number>
  relationships?: Record<string, number>
  flags?: string[]
  status?: string

  addCredits: (amount: number) => void
  spendCredits: (amount: number) => boolean
  addSkill: (skill: string) => void
  removeSkill: (skill: string) => void
  addItem: (itemId: string) => void
  removeItem: (itemId: string) => void
  hasItem: (itemId: string) => boolean
  setPhase: (phase: number) => void
  incrementSkill: (key: string, delta?: number) => void
  setSkill: (key: string, value: number) => void
  getSkill: (key: string) => number
  setAttribute?: (key: string, value: number) => void
  incAttribute?: (key: string, delta?: number) => void

  hydrateFromServer: (p: {
    phase?: number | null
    health?: number | null
    fame?: number | null
    reputations?: Record<string, number> | null
    relationships?: Record<string, number> | null
    flags?: string[] | null
    status?: string | null
    inventory?: string[] | null
  } | null) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  name: '',
  credits: 0,
  skills: new Set<string>(),
  attributes: { ...BASELINE_HUMAN },
  skillsLevels: {
    logic: 0,
    empathy: 0,
    cynicism: 0,
    authority: 0,
    paranoia: 0,
    intuition: 0,
    technophile: 0,
    encyclopedia: 0,
    reflexes: 0,
    endurance: 0,
    dopamine: 0,
    philosophy: 0,
  },
  inventory: [],
  phase: 0,
  health: 1,
  fame: 0,
  reputations: {},
  relationships: {},
  flags: [],
  status: 'refugee',
  setPhase: (phase: number) => set(() => {
    logger.info('STORE', 'setPhase', phase)
    const next: Pick<PlayerState, 'phase'> = { phase }
    return next
  }),
  incrementSkill: (key, delta = 1) =>
    set((s) => {
      const curr = (s.skillsLevels ?? {})[key] ?? 0
      const next = Math.max(0, curr + delta)
      const skillsLevels = { ...(s.skillsLevels ?? {}), [key]: next }
      logger.info('STORE', 'incrementSkill', { key, delta, level: next })
      return { skillsLevels }
    }),
  setSkill: (key, value) =>
    set((s) => {
      const lvl = Math.max(0, Math.floor(value))
      const skillsLevels = { ...(s.skillsLevels ?? {}), [key]: lvl }
      logger.info('STORE', 'setSkill', { key, level: lvl })
      return { skillsLevels }
    }),
  getSkill: (key) => {
    try { return (get().skillsLevels ?? {})[key] ?? 0 } catch { return 0 }
  },
  setAttribute: (key: string, value: number) =>
    set((s) => {
      const attrs = { ...(s.attributes ?? {}) }
      const v = Math.max(0, Math.floor(value))
      attrs[key] = v
      logger.info('STORE', 'setAttribute', { key, value: v })
      return { attributes: attrs } as any
    }),
  incAttribute: (key: string, delta = 1) =>
    set((s) => {
      const attrs = { ...(s.attributes ?? {}) }
      const curr = Number(attrs[key] ?? 0)
      const next = Math.max(0, curr + delta)
      attrs[key] = next
      logger.info('STORE', 'incAttribute', { key, delta, value: next })
      return { attributes: attrs } as any
    }),
  addCredits: (amount) =>
    set((s) => {
      const next = Math.max(0, (s.credits ?? 0) + amount)
      logger.info('STORE', 'addCredits', amount, 'â†’', next)
      return { credits: next }
    }),
  spendCredits: (amount) => {
    const current = get().credits ?? 0
    if (current < amount) return false
    set({ credits: current - amount })
    logger.info('STORE', 'spendCredits', amount, 'â†’', current - amount)
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
  addItem: (itemId) =>
    set((s) => {
      if (!itemId) return s as any
      if ((s.inventory ?? []).includes(itemId)) return s as any
      const next = [...(s.inventory ?? []), itemId]
      logger.info('STORE', 'addItem', itemId)
      return { inventory: next }
    }),
  removeItem: (itemId) =>
    set((s) => {
      const next = (s.inventory ?? []).filter((i) => i !== itemId)
      logger.info('STORE', 'removeItem', itemId)
      return { inventory: next }
    }),
  hasItem: (itemId) => {
    try {
      return (get().inventory ?? []).includes(itemId)
    } catch {
      return false
    }
  },
  hydrateFromServer: (p) =>
    set((s) => {
      if (!p) return s
      // Ð˜Ð½Ð²ÐµÐ½Ñ‚Ð°Ñ€ÑŒ ÑÐ»Ð¸Ð²Ð°ÐµÐ¼ (server âˆª local), Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð½Ðµ Ñ‚ÐµÑ€ÑÑ‚ÑŒ Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¾ Ð²Ñ‹Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð¿Ñ€ÐµÐ´Ð¼ÐµÑ‚Ñ‹ Ð´Ð¾ ÑÐ¸Ð½ÐºÐ°
      const mergedInventory = Array.from(new Set([...(s.inventory ?? []), ...((p.inventory ?? []) as string[])]))
      const next = {
        phase: p.phase ?? s.phase ?? 0,
        health: p.health ?? s.health ?? 1,
        fame: p.fame ?? s.fame ?? 0,
        reputations: p.reputations ?? s.reputations ?? {},
        relationships: p.relationships ?? s.relationships ?? {},
        flags: p.flags ?? s.flags ?? [],
        status: p.status ?? s.status ?? 'refugee',
        inventory: mergedInventory,
      }
      logger.info('STORE', 'hydratePlayer', next)
      return next as any
    }),
}))





