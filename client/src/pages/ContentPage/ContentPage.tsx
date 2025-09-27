import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, BarChart3, Settings, FileText, Map, Sword, Package } from 'lucide-react'
import { AnalyticsDashboard } from '../../features/analytics/ui/AnalyticsDashboard'
import { useContentStore } from '../../features/content/model/store'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'
import { Button } from '../../shared/ui/components/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/components/Tabs'
import { cn } from '../../shared/lib/utils/cn'

export function ContentPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'quests' | 'analytics'>('overview')
  const { contentLibrary, getRecommendedContent } = useContentStore()

  const totalContent = Object.values(contentLibrary).reduce((sum, items) => sum + items.length, 0)

  const recommendedContent = getRecommendedContent(5, ['adventure', 'exploration'])

  const contentStats = {
    quests: contentLibrary.quests.length,
    dialogues: contentLibrary.dialogues.length,
    locations: contentLibrary.locations.length,
    items: contentLibrary.items.length,
    events: contentLibrary.events.length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Контент и аналитика</h1>
            <p className="text-zinc-400">
              Управление игровым контентом и анализ метрик
            </p>
          </div>

          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Создать контент
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">
              <FileText className="w-4 h-4 mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="quests">
              <Map className="w-4 h-4 mr-2" />
              Квесты
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Content Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Квесты', count: contentStats.quests, icon: Map, color: 'text-purple-400' },
                { label: 'Диалоги', count: contentStats.dialogues, icon: FileText, color: 'text-blue-400' },
                { label: 'Локации', count: contentStats.locations, icon: Map, color: 'text-green-400' },
                { label: 'Предметы', count: contentStats.items, icon: Package, color: 'text-yellow-400' },
                { label: 'События', count: contentStats.events, icon: Sword, color: 'text-red-400' },
              ].map(({ label, count, icon: Icon, color }) => (
                <AnimatedCard key={label} className="p-4 text-center">
                  <Icon className={cn('w-8 h-8 mx-auto mb-2', color)} />
                  <div className="text-2xl font-bold text-zinc-100 mb-1">
                    {count}
                  </div>
                  <div className="text-sm text-zinc-400">{label}</div>
                </AnimatedCard>
              ))}
            </div>

            {/* Recommended Content */}
            <AnimatedCard className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Рекомендуемый контент
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedContent.slice(0, 6).map((content) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-zinc-100">{content.name}</h4>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded',
                        content.difficulty <= 3 ? 'bg-green-900/30 text-green-400' :
                        content.difficulty <= 7 ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      )}>
                        Ур. {content.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {content.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{content.type}</span>
                      <span>{content.estimatedDuration} мин</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="quests" className="space-y-6">
            <AnimatedCard className="p-6">
              <div className="text-center text-zinc-400 py-8">
                <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Квесты</h3>
                <p>Система управления квестами будет здесь</p>
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
