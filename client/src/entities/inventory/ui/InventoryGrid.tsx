import { useState } from 'react'
import { useInventoryStore } from '../model/store'
import { InventorySlot } from './InventorySlot'
import { cn } from '../../../shared/lib/utils/cn'

interface InventoryGridProps {
  containerId: string
  className?: string
}

export function InventoryGrid({ containerId, className }: InventoryGridProps) {
  const container = useInventoryStore((state) => state.getContainer(containerId))
  const [dragOver, setDragOver] = useState(false)

  if (!container) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Контейнер не найден
      </div>
    )
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'inventory-item' && data.containerId !== containerId) {
        const { itemId, fromContainer } = data
        const rect = e.currentTarget.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) / 48) // 48px per cell
        const y = Math.floor((e.clientY - rect.top) / 48)

        useInventoryStore.getState().moveItem(
          itemId,
          fromContainer,
          containerId,
          { x, y, rotation: 0 }
        )
      }
    } catch (error) {
      console.error('Drop failed:', error)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">{container.name}</h3>
        <div className="text-sm text-zinc-400">
          {container.items.length}/{container.size.cells} слотов
          {container.maxWeight && (
            <span className="ml-4">
              {container.currentWeight.toFixed(1)}/{container.maxWeight}кг
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-2 transition-colors',
          dragOver
            ? 'border-emerald-400 bg-emerald-900/20'
            : 'border-zinc-600 bg-zinc-800/50'
        )}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${container.size.width}, 48px)`,
          gridTemplateRows: `repeat(${container.size.height}, 48px)`,
          gap: '2px',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Grid cells */}
        {Array.from({ length: container.size.width * container.size.height }).map((_, index) => {
          const x = index % container.size.width
          const y = Math.floor(index / container.size.width)

          // Check if cell is occupied by any item
          const occupiedItem = container.items.find(item => {
            const itemWidth = item.position.rotation % 180 === 0 ? item.size.width : item.size.height
            const itemHeight = item.position.rotation % 180 === 0 ? item.size.height : item.size.width
            return x >= item.position.x && x < item.position.x + itemWidth &&
                   y >= item.position.y && y < item.position.y + itemHeight
          })

          return (
            <div
              key={index}
              className={cn(
                'border border-zinc-600 rounded transition-colors',
                occupiedItem ? 'bg-zinc-700/50' : 'bg-zinc-800/30 hover:bg-zinc-700/30'
              )}
            />
          )
        })}

        {/* Items */}
        {container.items.map((item) => (
          <InventorySlot
            key={item.id}
            item={item}
            containerId={containerId}
            style={{
              gridColumnStart: item.position.x + 1,
              gridRowStart: item.position.y + 1,
              gridColumnEnd: item.position.x + (item.position.rotation % 180 === 0 ? item.size.width : item.size.height) + 1,
              gridRowEnd: item.position.y + (item.position.rotation % 180 === 0 ? item.size.height : item.size.width) + 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
