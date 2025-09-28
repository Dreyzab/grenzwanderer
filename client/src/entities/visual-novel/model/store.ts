import { create } from 'zustand'

export interface VisualNovelScene {
  id: string
  title: string
  content: string
  options?: Array<{
    id: string
    label: string
    nextSceneId?: string
  }>
}

interface VisualNovelStore {
  scenes: Record<string, VisualNovelScene>
  setScenes: (scenes: Record<string, VisualNovelScene>) => void
}

export const useVNStore = create<VisualNovelStore>((set) => ({
  scenes: {},
  setScenes: (scenes) => set({ scenes })
}))


