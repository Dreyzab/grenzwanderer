import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ABTest, ABVariant, ABTestResults } from '../../content/model/types'

interface ABTestStore {
  // State
  activeTests: ABTest[]
  userAssignments: Record<string, string> // testId -> variantId
  testResults: Record<string, ABTestResults>

  // Actions
  createTest: (test: Omit<ABTest, 'id' | 'status'>) => string
  startTest: (testId: string) => void
  stopTest: (testId: string) => void
  assignUserToTest: (testId: string, userId: string) => string | null
  recordTestResult: (testId: string, userId: string, metric: string, value: number) => void
  completeTest: (testId: string) => void

  // Analytics
  getTestPerformance: (testId: string) => any
  getVariantStats: (testId: string, variantId: string) => any
  calculateStatisticalSignificance: (testId: string) => number

  // Selectors
  getActiveTests: () => ABTest[]
  getUserActiveTests: (userId: string) => ABTest[]
  getTestById: (testId: string) => ABTest | undefined
  getVariantForUser: (testId: string, userId: string) => ABVariant | null
}

export const useABTestStore = create<ABTestStore>()(
  persist(
    (set, get) => ({
      activeTests: [],
      userAssignments: {},
      testResults: {},

      createTest: (testData) => {
        const testId = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const test: ABTest = {
          ...testData,
          id: testId,
          status: 'planning',
        }

        set((state) => ({
          activeTests: [...state.activeTests, test],
        }))

        return testId
      },

      startTest: (testId) => {
        set((state) => ({
          activeTests: state.activeTests.map(test =>
            test.id === testId
              ? { ...test, status: 'active', startDate: Date.now() }
              : test
          ),
        }))
      },

      stopTest: (testId) => {
        set((state) => ({
          activeTests: state.activeTests.map(test =>
            test.id === testId
              ? { ...test, status: 'completed', endDate: Date.now() }
              : test
          ),
        }))
      },

      assignUserToTest: (testId, userId) => {
        const { activeTests } = get()
        const test = activeTests.find(t => t.id === testId)

        if (!test || test.status !== 'active') {
          return null
        }

        // Проверяем, не назначен ли уже пользователь
        const existingAssignment = get().userAssignments[testId]
        if (existingAssignment) {
          return existingAssignment
        }

        // Weighted random selection
        const random = Math.random()
        let cumulativeWeight = 0

        for (const variant of test.variants) {
          cumulativeWeight += variant.weight
          if (random <= cumulativeWeight) {
            set((state) => ({
              userAssignments: {
                ...state.userAssignments,
                [testId]: variant.id,
              },
            }))

            // Добавляем пользователя в список участников варианта
            set((state) => ({
              activeTests: state.activeTests.map(t =>
                t.id === testId
                  ? {
                      ...t,
                      variants: t.variants.map(v =>
                        v.id === variant.id
                          ? { ...v, participants: [...v.participants, userId] }
                          : v
                      ),
                    }
                  : t
              ),
            }))

            return variant.id
          }
        }

        return null
      },

      recordTestResult: (testId, userId, metric, value) => {
        // Здесь будет запись результатов для анализа
        console.log('Recording test result:', { testId, userId, metric, value })

        // В будущем можно добавить хранение метрик для каждого варианта
        set((state) => ({
          testResults: {
            ...state.testResults,
            [testId]: {
              ...state.testResults[testId],
              variantResults: {
                ...state.testResults[testId]?.variantResults,
                // Здесь будет накопление метрик
              },
            },
          },
        }))
      },

      completeTest: (testId) => {
        const test = get().activeTests.find(t => t.id === testId)
        if (!test) return

        // Вычисляем результаты
        const results = get().calculateTestResults(testId)

        set((state) => ({
          activeTests: state.activeTests.map(t =>
            t.id === testId
              ? { ...t, status: 'completed', endDate: Date.now(), results }
              : t
          ),
          testResults: {
            ...state.testResults,
            [testId]: results,
          },
        }))
      },

      getTestPerformance: (testId) => {
        const test = get().activeTests.find(t => t.id === testId)
        if (!test) return null

        // Вычисляем производительность каждого варианта
        return test.variants.map(variant => ({
          variantId: variant.id,
          name: variant.name,
          participants: variant.participants.length,
          conversionRate: variant.participants.length / test.variants.reduce((sum, v) => sum + v.participants.length, 0),
          // Здесь будут дополнительные метрики
        }))
      },

      getVariantStats: (testId, variantId) => {
        const test = get().activeTests.find(t => t.id === testId)
        if (!test) return null

        const variant = test.variants.find(v => v.id === variantId)
        if (!variant) return null

        return {
          participants: variant.participants.length,
          weight: variant.weight,
          // Здесь будут детальные статистики
        }
      },

      calculateStatisticalSignificance: (testId) => {
        // Упрощенный расчет статистической значимости
        // В реальности нужно использовать t-test или другие статистические методы

        const test = get().activeTests.find(t => t.id === testId)
        if (!test || test.variants.length < 2) return 0

        // Пример простого расчета
        const variant1 = test.variants[0]
        const variant2 = test.variants[1]

        if (variant1.participants.length === 0 || variant2.participants.length === 0) {
          return 0
        }

        // Имитация расчета значимости
        const conversion1 = variant1.participants.length / (variant1.participants.length + variant2.participants.length)
        const conversion2 = variant2.participants.length / (variant1.participants.length + variant2.participants.length)

        return Math.abs(conversion1 - conversion2) * 100
      },

      calculateTestResults: (testId) => {
        const test = get().activeTests.find(t => t.id === testId)
        if (!test) return null

        // Определяем победителя
        let winner = test.variants[0].id
        let maxParticipants = test.variants[0].participants.length

        test.variants.forEach(variant => {
          if (variant.participants.length > maxParticipants) {
            maxParticipants = variant.participants.length
            winner = variant.id
          }
        })

        const confidence = get().calculateStatisticalSignificance(testId)

        return {
          winner,
          confidence,
          statisticalSignificance: confidence > 5 ? 0.95 : 0.5, // Упрощенный расчет
          variantResults: test.variants.reduce((acc, variant) => {
            acc[variant.id] = {
              participants: variant.participants.length,
              conversionRate: variant.participants.length / test.variants.reduce((sum, v) => sum + v.participants.length, 0),
            }
            return acc
          }, {} as Record<string, any>),
        }
      },

      // Selectors
      getActiveTests: () => {
        const { activeTests } = get()
        return activeTests.filter(test => test.status === 'active')
      },

      getUserActiveTests: (userId) => {
        const { activeTests, userAssignments } = get()
        const userTestIds = Object.keys(userAssignments).filter(testId =>
          userAssignments[testId] && activeTests.some(t => t.id === testId)
        )

        return activeTests.filter(test => userTestIds.includes(test.id))
      },

      getTestById: (testId) => {
        const { activeTests } = get()
        return activeTests.find(test => test.id === testId)
      },

      getVariantForUser: (testId, userId) => {
        const test = get().getTestById(testId)
        const variantId = get().userAssignments[testId]

        if (!test || !variantId) return null

        return test.variants.find(v => v.id === variantId) || null
      },
    }),
    {
      name: 'grenzwanderer-ab-tests',
      partialize: (state) => ({
        activeTests: state.activeTests,
        userAssignments: state.userAssignments,
        testResults: state.testResults,
      }),
    }
  )
)
