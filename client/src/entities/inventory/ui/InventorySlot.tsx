import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../model/store'
import { InventoryItem } from '../model/types'
import { cn } from '../../../shared/lib/utils/cn'
import { RotateCcw, Copy, Info } from 'lucide-react'

interface InventorySlotProps {
  item: InventoryItem
  containerId: string
  style?: React.CSSProperties
  className?: string
}

export function InventorySlot({ item, containerId, style, className }: InventorySlotProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const { removeItem, rotateItem, splitItem, getContainer } = useInventoryStore()

  const container = getContainer(containerId)
  const rarityColors = {
    common: 'border-zinc-500 bg-zinc-800',
    uncommon: 'border-green-500 bg-green-900',
    rare: 'border-blue-500 bg-blue-900',
    epic: 'border-purple-500 bg-purple-900',
    legendary: 'border-yellow-500 bg-yellow-900'
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'inventory-item',
      itemId: item.id,
      containerId,
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowActions(!showActions)
  }

  const handleRotate = () => {
    rotateItem(containerId, item.id)
    setShowActions(false)
  }

  const handleSplit = () => {
    const newItem = splitItem(containerId, item.id, Math.floor(item.stackSize / 2))
    if (newItem) {
      // Add to the same container for now
      useInventoryStore.getState().addItem(containerId, newItem)
    }
    setShowActions(false)
  }

  const handleRemove = () => {
    removeItem(containerId, item.id)
    setShowActions(false)
  }

  return (
    <motion.div
      className={cn(
        'relative border-2 rounded cursor-move select-none overflow-hidden',
        'hover:border-zinc-300 transition-colors',
        rarityColors[item.rarity],
        isDragging && 'opacity-50 scale-95',
        className
      )}
      style={style}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Item icon/placeholder */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
        <div className="text-2xl font-bold text-zinc-300">
          {item.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Item info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1">
        <div className="truncate font-medium">{item.name}</div>
        {item.stackSize > 1 && (
          <div className="text-zinc-300">{item.stackSize}</div>
        )}
        {item.condition < 100 && (
          <div className="text-yellow-400">{item.condition}%</div>
        )}
      </div>

      {/* Rotation indicator */}
      {item.size.rotatable && item.position.rotation !== 0 && (
        <div className="absolute top-1 right-1">
          <RotateCcw className="w-3 h-3 text-zinc-400" />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-zinc-900 border border-zinc-600 rounded-lg p-3 min-w-48 shadow-xl">
            <h4 className="font-semibold text-zinc-100 mb-1">{item.name}</h4>
            <p className="text-sm text-zinc-300 mb-2">{item.description}</p>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Тип:</span>
                <span className="text-zinc-200 capitalize">{item.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Редкость:</span>
                <span className={cn(
                  'capitalize',
                  item.rarity === 'legendary' && 'text-yellow-400',
                  item.rarity === 'epic' && 'text-purple-400',
                  item.rarity === 'rare' && 'text-blue-400',
                  item.rarity === 'uncommon' && 'text-green-400',
                  item.rarity === 'common' && 'text-zinc-400'
                )}>
                  {item.rarity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Вес:</span>
                <span className="text-zinc-200">{item.properties.weight}кг</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Стоимость:</span>
                <span className="text-emerald-400">{item.properties.value}₽</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context menu actions */}
      {showActions && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl">
          {item.size.rotatable && (
            <button
              onClick={handleRotate}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Повернуть
            </button>
          )}
          {item.stackSize > 1 && (
            <button
              onClick={handleSplit}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Разделить
            </button>
          )}
          <button
            onClick={handleRemove}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
          >
            <Info className="w-4 h-4" />
            Удалить
          </button>
        </div>
      )}
    </motion.div>
  )
}
