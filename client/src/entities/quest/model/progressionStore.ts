import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PhaseId } from './catalog'
import { questsApi } from '@/shared/api/quests'

interface ProgressionState {
  phase: PhaseId
  setPhase: (phase: PhaseId) => void
  hydrateFromServer: () => Promise<void>
}

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set) => ({
      phase: 0,
      setPhase: (phase) => {
        set({ phase })
        void questsApi.setPlayerPhase(phase)
      },
      hydrateFromServer: async () => {
        try {
          const state = await questsApi.getPlayerState()
          if (state && typeof state.phase === 'number') set({ phase: state.phase as PhaseId })
        } catch {
          // ignore
        }
      },
    }),
    {
      name: 'player-progression',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ phase: s.phase }),
    },
  ),
)


