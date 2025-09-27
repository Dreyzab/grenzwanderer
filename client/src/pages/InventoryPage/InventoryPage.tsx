import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../entities/inventory/model/store'
import { InventoryGrid } from '../../entities/inventory/ui/InventoryGrid'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'
import { Button } from '../../shared/ui/components/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/components/Tabs'
import { Package, Weight, Grid3X3, List } from 'lucide-react'

export function InventoryPage() {
  const { containers, activeContainerId } = useInventoryStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const containerIds = Object.keys(containers)
  const activeContainer = containers[activeContainerId]

  const containerStats = containerIds.map(id => {
    const container = containers[id]
    return {
      id,
      name: container.name,
      items: container.items.length,
      weight: container.currentWeight,
      maxWeight: container.maxWeight,
      capacity: `${container.items.length}/${container.size.cells}`,
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Инвентарь</h1>
            <p className="text-zinc-400">Управление предметами и снаряжением</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Сетка
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              Список
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Container Tabs */}
          <div className="lg:col-span-1">
            <AnimatedCard className="p-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Контейнеры
              </h3>

              <Tabs value={activeContainerId} className="w-full">
                <TabsList className="grid w-full grid-cols-1 gap-1">
                  {containerIds.map((containerId) => (
                    <TabsTrigger
                      key={containerId}
                      value={containerId}
                      className="w-full justify-start text-left p-2"
                      onClick={() => useInventoryStore.setState({ activeContainerId: containerId })}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{containers[containerId].name}</span>
                        <span className="text-xs text-zinc-400 ml-2">
                          {containers[containerId].items.length}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Container Stats */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-zinc-300 flex items-center">
                  <Weight className="w-4 h-4 mr-2" />
                  Статистика
                </h4>
                {containerStats.map((stat) => (
                  <div key={stat.id} className="text-xs text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>{stat.name}</span>
                      <span>{stat.items} предметов</span>
                    </div>
                    {stat.maxWeight && (
                      <div className="flex justify-between">
                        <span>Вес</span>
                        <span>{stat.weight.toFixed(1)}/{stat.maxWeight}кг</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Вместимость</span>
                      <span>{stat.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatedCard className="p-6">
              {activeContainer ? (
                <InventoryGrid containerId={activeContainerId} />
              ) : (
                <div className="text-center text-zinc-400 py-8">
                  Выберите контейнер для просмотра
                </div>
              )}
            </AnimatedCard>
          </div>
        </div>

        {/* Quick Actions */}
        <AnimatedCard className="p-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Быстрые действия</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm">
              Автосортировка
            </Button>
            <Button variant="secondary" size="sm">
              Оптимизировать размещение
            </Button>
            <Button variant="secondary" size="sm">
              Очистить контейнер
            </Button>
            <Button variant="secondary" size="sm">
              Экспорт инвентаря
            </Button>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}
