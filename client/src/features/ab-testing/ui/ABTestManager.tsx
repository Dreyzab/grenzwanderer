import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, Square, BarChart3, Users, Target } from 'lucide-react'
import { useABTestStore } from '../model/abTestStore'
import { AnimatedCard } from '../../../shared/ui/components/AnimatedCard'
import { Button } from '../../../shared/ui/components/Button'
import { cn } from '../../../shared/lib/utils/cn'

interface ABTestManagerProps {
  className?: string
}

export function ABTestManager({ className }: ABTestManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const {
    activeTests,
    createTest,
    startTest,
    stopTest,
    completeTest,
    getTestPerformance,
    getVariantStats
  } = useABTestStore()

  const handleCreateTest = () => {
    // Здесь будет создание теста
    const testId = createTest({
      name: 'Test QR Scanner UI',
      description: 'A/B test for QR scanner interface',
      variants: [
        {
          id: 'variant_a',
          name: 'Original',
          content: { ui: 'original' },
          weight: 50,
          participants: [],
        },
        {
          id: 'variant_b',
          name: 'New Design',
          content: { ui: 'redesigned' },
          weight: 50,
          participants: [],
        },
      ],
      targetMetric: 'scan_success_rate',
      status: 'planning',
    })

    console.log('Created test:', testId)
    setShowCreateForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-yellow-400 bg-yellow-900/20'
      case 'active': return 'text-emerald-400 bg-emerald-900/20'
      case 'completed': return 'text-blue-400 bg-blue-900/20'
      case 'cancelled': return 'text-red-400 bg-red-900/20'
      default: return 'text-zinc-400 bg-zinc-900/20'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">A/B Тестирование</h3>
          <p className="text-zinc-400">Тестирование игровых механик и интерфейса</p>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать тест
        </Button>
      </div>

      {/* Create Test Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AnimatedCard className="p-6">
              <h4 className="text-lg font-semibold text-zinc-100 mb-4">Новый A/B тест</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Название</label>
                  <input
                    type="text"
                    placeholder="Название теста"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Целевая метрика</label>
                  <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100">
                    <option value="scan_success_rate">Успешность сканирования</option>
                    <option value="session_duration">Длительность сессии</option>
                    <option value="quest_completion">Завершение квестов</option>
                    <option value="user_retention">Удержание пользователей</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreateTest} className="bg-emerald-600 hover:bg-emerald-700">
                  Создать тест
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="secondary"
                >
                  Отмена
                </Button>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <AnimatedCard className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-zinc-100">{test.name}</h4>
                  <p className="text-sm text-zinc-400">{test.description}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded', getStatusColor(test.status))}>
                  {test.status}
                </span>
              </div>

              {/* Test Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {test.variants.reduce((sum, v) => sum + v.participants.length, 0)}
                  </div>
                  <div className="text-xs text-zinc-400">Участников</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {test.variants.length}
                  </div>
                  <div className="text-xs text-zinc-400">Вариантов</div>
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-2 mb-4">
                {test.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-2 bg-zinc-800/30 rounded"
                  >
                    <div>
                      <div className="font-medium text-zinc-100">{variant.name}</div>
                      <div className="text-xs text-zinc-400">
                        {variant.participants.length} участников
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-emerald-400">
                        {((variant.participants.length / test.variants.reduce((sum, v) => sum + v.participants.length, 0)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-zinc-500">конверсия</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {test.status === 'planning' && (
                  <Button
                    onClick={() => startTest(test.id)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Запустить
                  </Button>
                )}

                {test.status === 'active' && (
                  <Button
                    onClick={() => stopTest(test.id)}
                    size="sm"
                    variant="secondary"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Остановить
                  </Button>
                )}

                {test.status === 'completed' && (
                  <Button
                    onClick={() => completeTest(test.id)}
                    size="sm"
                    variant="secondary"
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Результаты
                  </Button>
                )}
              </div>
            </AnimatedCard>
          </motion.div>
        ))}
      </div>

      {activeTests.length === 0 && (
        <AnimatedCard className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Нет активных тестов</h3>
          <p className="text-zinc-400 mb-4">Создайте A/B тест для улучшения игрового опыта</p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать первый тест
          </Button>
        </AnimatedCard>
      )}
    </div>
  )
}
