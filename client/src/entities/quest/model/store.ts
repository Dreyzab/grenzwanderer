import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Quest, QuestProgress } from './types'

interface QuestStore {
  // Состояние квестов
  availableQuests: Quest[]
  activeQuests: QuestProgress[]
  completedQuests: string[]

  // Действия
  loadQuests: () => Promise<void>
  startQuest: (questId: string) => Promise<void>
  updateQuestProgress: (questId: string, objectiveId: string, completed: boolean) => void
  completeQuest: (questId: string) => Promise<void>

  // Селекторы
  getQuestById: (questId: string) => Quest | undefined
  getActiveQuestProgress: (questId: string) => QuestProgress | undefined
  getAvailableQuests: () => Quest[]
  getCompletedQuestsCount: () => number
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      availableQuests: [],
      activeQuests: [],
      completedQuests: [],

      loadQuests: async () => {
        try {
          // Здесь будет загрузка квестов из Convex
          // const quests = await getAvailableQuests({ userId })
          // set({ availableQuests: quests })
        } catch (error) {
          console.error('Failed to load quests:', error)
        }
      },

      startQuest: async (questId: string) => {
        try {
          const quest = get().getQuestById(questId)
          if (!quest) return

          // Здесь будет вызов Convex mutation
          // await startQuest({ userId, questId })

          const progress: QuestProgress = {
            questId,
            status: 'in_progress',
            objectives: quest.objectives.reduce((acc, obj) => {
              acc[obj.id] = false
              return acc
            }, {} as Record<string, boolean>),
            startedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }

          set((state) => ({
            activeQuests: [...state.activeQuests, progress],
          }))
        } catch (error) {
          console.error('Failed to start quest:', error)
        }
      },

      updateQuestProgress: (questId: string, objectiveId: string, completed: boolean) => {
        set((state) => ({
          activeQuests: state.activeQuests.map((progress) =>
            progress.questId === questId
              ? {
                  ...progress,
                  objectives: {
                    ...progress.objectives,
                    [objectiveId]: completed,
                  },
                  updatedAt: Date.now(),
                }
              : progress
          ),
        }))

        // Проверить, все ли objectives выполнены
        const progress = get().getActiveQuestProgress(questId)
        if (progress) {
          const allCompleted = Object.values(progress.objectives).every(Boolean)
          if (allCompleted) {
            get().completeQuest(questId)
          }
        }
      },

      completeQuest: async (questId: string) => {
        try {
          // Здесь будет вызов Convex mutation
          // await completeQuest({ userId, questId })

          set((state) => ({
            activeQuests: state.activeQuests.filter((p) => p.questId !== questId),
            completedQuests: [...state.completedQuests, questId],
          }))
        } catch (error) {
          console.error('Failed to complete quest:', error)
        }
      },

      getQuestById: (questId: string) => {
        return get().availableQuests.find((q) => q.id === questId)
      },

      getActiveQuestProgress: (questId: string) => {
        return get().activeQuests.find((p) => p.questId === questId)
      },

      getAvailableQuests: () => {
        return get().availableQuests.filter((q) => q.isActive)
      },

      getCompletedQuestsCount: () => {
        return get().completedQuests.length
      },
    }),
    {
      name: 'grenzwanderer-quests',
      partialize: (state) => ({
        activeQuests: state.activeQuests,
        completedQuests: state.completedQuests,
      }),
    }
  )
)
