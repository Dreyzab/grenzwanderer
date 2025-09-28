import { create } from 'zustand'

export interface Reputation {
  combat: number
  exploration: number
  social: number
  reliability: number
}

export interface PlayerState {
  id: string | null
  name: string | null
  phase: number
  fame: number
  faction?: string | null
  reputation: Reputation
  lastSyncAt: number | null
}

interface PlayerStore extends PlayerState {
  setPlayer: (player: Partial<PlayerState>) => void
  reset: () => void
}

const initialState: PlayerState = {
  id: null,
  name: null,
  phase: 1,
  fame: 0,
  faction: null,
  reputation: {
    combat: 0,
    exploration: 0,
    social: 0,
    reliability: 0,
  },
  lastSyncAt: null,
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,
  setPlayer: (player) => set((state) => ({
    ...state,
    ...player,
    reputation: {
      ...state.reputation,
      ...(player.reputation ?? {}),
    },
  })),
  reset: () => set(() => initialState),
}))
