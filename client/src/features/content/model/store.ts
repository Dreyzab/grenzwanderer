import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ContentItem,
  ContentBalance,
  ContentAnalytics,
  ABTest,
  ContentLibrary,
  ContentValidation,
  ContentGenerationRule
} from './types'

interface ContentStore {
  // State
  contentLibrary: ContentLibrary
  activeContent: Record<string, ContentItem>
  balanceData: Record<string, ContentBalance>
  abTests: ABTest[]
  analytics: Record<string, ContentAnalytics>
  generationRules: ContentGenerationRule[]

  // Actions
  loadContent: (type: string) => Promise<void>
  addContent: (content: ContentItem) => void
  updateContent: (contentId: string, updates: Partial<ContentItem>) => void
  removeContent: (contentId: string) => void
  validateContent: (content: ContentItem) => ContentValidation

  // Balance management
  updateBalanceMetrics: (contentId: string, metrics: Partial<ContentBalance['metrics']>) => void
  addPlayerFeedback: (contentId: string, feedback: any) => void
  adjustBalance: (contentId: string, adjustment: any) => void

  // A/B Testing
  createABTest: (test: Omit<ABTest, 'id'>) => string
  assignUserToVariant: (testId: string, userId: string) => string
  completeABTest: (testId: string) => void
  getABTestResults: (testId: string) => ABTest['results']

  // Analytics
  trackContentView: (contentId: string, userId: string) => void
  trackContentCompletion: (contentId: string, userId: string, timeSpent: number) => void
  getContentAnalytics: (contentId: string) => ContentAnalytics | null

  // Content generation
  generateContent: (type: string, parameters: any) => ContentItem | null
  applyGenerationRules: (content: ContentItem, rules: ContentGenerationRule[]) => ContentItem

  // Selectors
  getContentById: (contentId: string) => ContentItem | undefined
  getContentByType: (type: string) => ContentItem[]
  getContentByTags: (tags: string[]) => ContentItem[]
  getContentByDifficulty: (min: number, max: number) => ContentItem[]
  getRecommendedContent: (playerLevel: number, preferences: string[]) => ContentItem[]
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      contentLibrary: {
        quests: [],
        dialogues: [],
        locations: [],
        npcs: [],
        items: [],
        events: [],
        tutorials: [],
      },
      activeContent: {},
      balanceData: {},
      abTests: [],
      analytics: {},
      generationRules: [],

      loadContent: async (type) => {
        try {
          // Здесь будет загрузка из Convex
          // const content = await getContentByType(type)
          // set(state => ({
          //   contentLibrary: {
          //     ...state.contentLibrary,
          //     [type]: content
          //   }
          // }))
        } catch (error) {
          console.error('Failed to load content:', error)
        }
      },

      addContent: (content) => {
        set((state) => ({
          contentLibrary: {
            ...state.contentLibrary,
            [content.type]: [...state.contentLibrary[content.type as keyof ContentLibrary], content],
          },
          activeContent: {
            ...state.activeContent,
            [content.id]: content,
          },
        }))
      },

      updateContent: (contentId, updates) => {
        set((state) => ({
          contentLibrary: Object.fromEntries(
            Object.entries(state.contentLibrary).map(([type, items]) => [
              type,
              items.map(item =>
                item.id === contentId ? { ...item, ...updates } : item
              ),
            ])
          ) as ContentLibrary,
          activeContent: {
            ...state.activeContent,
            [contentId]: state.activeContent[contentId]
              ? { ...state.activeContent[contentId], ...updates }
              : undefined,
          },
        }))
      },

      removeContent: (contentId) => {
        set((state) => {
          const newLibrary = { ...state.contentLibrary }
          Object.keys(newLibrary).forEach(type => {
            newLibrary[type as keyof ContentLibrary] = newLibrary[type as keyof ContentLibrary].filter(
              item => item.id !== contentId
            )
          })

          const newActiveContent = { ...state.activeContent }
          delete newActiveContent[contentId]

          return {
            contentLibrary: newLibrary,
            activeContent: newActiveContent,
          }
        })
      },

      validateContent: (content) => {
        const errors: string[] = []
        const warnings: string[] = []
        const suggestions: string[] = []

        // Валидация базовых полей
        if (!content.name || content.name.length < 3) {
          errors.push('Название должно содержать минимум 3 символа')
        }

        if (!content.description || content.description.length < 10) {
          errors.push('Описание должно содержать минимум 10 символов')
        }

        // Валидация сложности
        if (content.difficulty < 1 || content.difficulty > 10) {
          errors.push('Сложность должна быть от 1 до 10')
        }

        // Валидация длительности
        if (content.estimatedDuration < 1) {
          errors.push('Предполагаемая длительность должна быть положительной')
        }

        // Предупреждения
        if (content.estimatedDuration > 60) {
          warnings.push('Слишком долгий контент может утомлять игроков')
        }

        if (content.difficulty > 7 && content.estimatedDuration < 10) {
          warnings.push('Высокая сложность с короткой длительностью может быть фрустрирующей')
        }

        // Предложения
        if (!content.tags || content.tags.length === 0) {
          suggestions.push('Добавьте теги для лучшей категоризации')
        }

        if (!content.prerequisites || content.prerequisites.length === 0) {
          suggestions.push('Рассмотрите добавление предусловий для лучшего опыта')
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          suggestions,
          estimatedDifficulty: content.difficulty,
          estimatedDuration: content.estimatedDuration,
        }
      },

      updateBalanceMetrics: (contentId, metrics) => {
        set((state) => ({
          balanceData: {
            ...state.balanceData,
            [contentId]: {
              ...state.balanceData[contentId],
              metrics: {
                ...state.balanceData[contentId]?.metrics,
                ...metrics,
              },
              lastAnalyzed: Date.now(),
            },
          },
        }))
      },

      addPlayerFeedback: (contentId, feedback) => {
        const feedbackData: any = {
          playerId: feedback.playerId,
          rating: feedback.rating,
          comment: feedback.comment,
          timestamp: Date.now(),
          sessionData: feedback.sessionData,
        }

        set((state) => ({
          balanceData: {
            ...state.balanceData,
            [contentId]: {
              ...state.balanceData[contentId],
              playerFeedback: [
                ...(state.balanceData[contentId]?.playerFeedback || []),
                feedbackData,
              ],
            },
          },
        }))
      },

      adjustBalance: (contentId, adjustment) => {
        set((state) => ({
          balanceData: {
            ...state.balanceData,
            [contentId]: {
              ...state.balanceData[contentId],
              adjustments: [
                ...(state.balanceData[contentId]?.adjustments || []),
                {
                  timestamp: Date.now(),
                  changes: adjustment.changes,
                  reason: adjustment.reason,
                  expectedImpact: adjustment.expectedImpact,
                },
              ],
            },
          },
        }))
      },

      createABTest: (test) => {
        const testId = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newTest: ABTest = {
          ...test,
          id: testId,
          status: 'planning',
        }

        set((state) => ({
          abTests: [...state.abTests, newTest],
        }))

        return testId
      },

      assignUserToVariant: (testId, userId) => {
        const { abTests } = get()
        const test = abTests.find(t => t.id === testId)

        if (!test || test.status !== 'active') {
          return ''
        }

        // Простая round-robin дистрибуция
        const variantIndex = parseInt(userId.slice(-1), 16) % test.variants.length
        const selectedVariant = test.variants[variantIndex].id

        set((state) => ({
          abTests: state.abTests.map(t =>
            t.id === testId
              ? {
                  ...t,
                  variants: t.variants.map(v =>
                    v.id === selectedVariant
                      ? { ...v, participants: [...v.participants, userId] }
                      : v
                  ),
                }
              : t
          ),
        }))

        return selectedVariant
      },

      completeABTest: (testId) => {
        set((state) => ({
          abTests: state.abTests.map(test =>
            test.id === testId
              ? { ...test, status: 'completed', endDate: Date.now() }
              : test
          ),
        }))
      },

      getABTestResults: (testId) => {
        const { abTests } = get()
        const test = abTests.find(t => t.id === testId)
        return test?.results || null
      },

      trackContentView: (contentId, userId) => {
        set((state) => ({
          analytics: {
            ...state.analytics,
            [contentId]: {
              ...state.analytics[contentId],
              totalViews: (state.analytics[contentId]?.totalViews || 0) + 1,
              uniquePlayers: state.analytics[contentId]?.uniquePlayers || new Set(),
            },
          },
        }))

        // Добавляем пользователя в уникальные просмотры
        set((state) => {
          const currentUnique = state.analytics[contentId]?.uniquePlayers || new Set()
          currentUnique.add(userId)

          return {
            analytics: {
              ...state.analytics,
              [contentId]: {
                ...state.analytics[contentId],
                uniquePlayers: currentUnique,
              },
            },
          }
        })
      },

      trackContentCompletion: (contentId, userId, timeSpent) => {
        set((state) => ({
          analytics: {
            ...state.analytics,
            [contentId]: {
              ...state.analytics[contentId],
              completionRate: (state.analytics[contentId]?.completionRate || 0) + 1,
              timeSpent: (state.analytics[contentId]?.timeSpent || 0) + timeSpent,
            },
          },
        }))
      },

      getContentAnalytics: (contentId) => {
        return get().analytics[contentId] || null
      },

      generateContent: (type, parameters) => {
        // Здесь будет генерация контента на основе правил
        const rules = get().generationRules.filter(r => r.parameters.type === type)

        if (rules.length === 0) {
          return null
        }

        // Простая генерация на основе первого правила
        const rule = rules[0]
        const content: ContentItem = {
          id: `generated_${Date.now()}`,
          type: type as any,
          name: parameters.name || `Generated ${type}`,
          description: parameters.description || 'Generated content',
          content: parameters.content || {},
          metadata: {
            author: 'system',
            version: '1.0',
            language: 'ru',
            category: type,
            targetAudience: 'all',
            balanceRating: 5,
          },
          tags: parameters.tags || [],
          difficulty: parameters.difficulty || 5,
          estimatedDuration: parameters.duration || 30,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        return get().applyGenerationRules(content, rules)
      },

      applyGenerationRules: (content, rules) => {
        let modifiedContent = { ...content }

        rules.forEach(rule => {
          // Применяем правила генерации
          switch (rule.type) {
            case 'random':
              // Добавляем случайные элементы
              break
            case 'procedural':
              // Процедурная генерация
              break
            case 'template':
              // Шаблонная генерация
              break
          }
        })

        return modifiedContent
      },

      // Selectors
      getContentById: (contentId) => {
        const { activeContent } = get()
        return activeContent[contentId]
      },

      getContentByType: (type) => {
        const { contentLibrary } = get()
        return contentLibrary[type as keyof ContentLibrary] || []
      },

      getContentByTags: (tags) => {
        const allContent = Object.values(get().activeContent)
        return allContent.filter(content =>
          tags.some(tag => content.tags.includes(tag))
        )
      },

      getContentByDifficulty: (min, max) => {
        const allContent = Object.values(get().activeContent)
        return allContent.filter(content =>
          content.difficulty >= min && content.difficulty <= max
        )
      },

      getRecommendedContent: (playerLevel, preferences) => {
        const allContent = Object.values(get().activeContent)

        return allContent
          .filter(content => {
            // Фильтр по уровню сложности
            const difficultyMatch = Math.abs(content.difficulty - playerLevel) <= 2

            // Фильтр по предпочтениям
            const preferenceMatch = preferences.some(pref =>
              content.tags.includes(pref)
            )

            return difficultyMatch && preferenceMatch
          })
          .sort((a, b) => {
            // Сортировка по релевантности
            const aScore = Math.abs(a.difficulty - playerLevel) +
                          (preferences.some(pref => a.tags.includes(pref)) ? 0 : 1)
            const bScore = Math.abs(b.difficulty - playerLevel) +
                          (preferences.some(pref => b.tags.includes(pref)) ? 0 : 1)

            return aScore - bScore
          })
          .slice(0, 10)
      },
    }),
    {
      name: 'grenzwanderer-content',
      partialize: (state) => ({
        contentLibrary: state.contentLibrary,
        balanceData: state.balanceData,
        abTests: state.abTests,
      }),
    }
  )
)
