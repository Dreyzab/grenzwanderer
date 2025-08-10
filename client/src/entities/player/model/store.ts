import { create } from 'zustand'
import logger from '@/shared/lib/logger'

interface PlayerState {
  credits: number
  skills: Set<string>
  addCredits: (amount: number) => void
  spendCredits: (amount: number) => boolean
  addSkill: (skill: string) => void
  removeSkill: (skill: string) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  credits: 0,
  skills: new Set<string>(),
  addCredits: (amount) =>
    set((s) => {
      const next = Math.max(0, (s.credits ?? 0) + amount)
      logger.info('PLAYER', 'addCredits', amount, '→', next)
      return { credits: next }
    }),
  spendCredits: (amount) => {
    const current = get().credits ?? 0
    if (current < amount) return false
    set({ credits: current - amount })
    logger.info('PLAYER', 'spendCredits', amount, '→', current - amount)
    return true
  },
  addSkill: (skill) =>
    set((s) => {
      const next = new Set(s.skills)
      next.add(skill)
      logger.info('PLAYER', 'addSkill', skill)
      return { skills: next }
    }),
  removeSkill: (skill) =>
    set((s) => {
      const next = new Set(s.skills)
      next.delete(skill)
      logger.info('PLAYER', 'removeSkill', skill)
      return { skills: next }
    }),
}))


