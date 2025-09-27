import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  InventoryItem,
  InventoryContainer,
  InventoryState,
  GridPosition,
  ValidationResult,
  ValidationError,
  MoveResult,
  ItemSize
} from './types'

interface InventoryStore extends InventoryState {
  // Actions
  createContainer: (container: Omit<InventoryContainer, 'id' | 'items' | 'currentWeight'>) => string
  addItem: (containerId: string, item: InventoryItem) => boolean
  moveItem: (itemId: string, fromContainer: string, toContainer: string, position: GridPosition) => MoveResult
  removeItem: (containerId: string, itemId: string) => boolean
  rotateItem: (containerId: string, itemId: string) => boolean
  splitItem: (containerId: string, itemId: string, amount: number) => InventoryItem | null
  mergeItems: (containerId: string, fromItemId: string, toItemId: string) => boolean

  // Validation
  canPlaceItem: (containerId: string, item: InventoryItem, position: GridPosition) => ValidationResult
  findBestPosition: (containerId: string, item: InventoryItem) => GridPosition | null

  // Selectors
  getContainer: (containerId: string) => InventoryContainer | undefined
  getItem: (containerId: string, itemId: string) => InventoryItem | undefined
  getItemsByType: (containerId: string, type: string) => InventoryItem[]
  getTotalWeight: (containerId: string) => number
  getAvailableSpace: (containerId: string) => number
}

const createDefaultContainer = (id: string, type: string, width: number, height: number): InventoryContainer => ({
  id,
  name: `${type} container`,
  type: type as any,
  size: { width, height, cells: width * height },
  items: [],
  currentWeight: 0,
})

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      containers: {
        stash: createDefaultContainer('stash', 'stash', 10, 10),
        backpack: createDefaultContainer('backpack', 'backpack', 6, 8),
        vest: createDefaultContainer('vest', 'vest', 8, 3),
        pockets: createDefaultContainer('pockets', 'pockets', 2, 4),
      },
      activeContainerId: 'stash',

      createContainer: (container) => {
        const id = `container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newContainer: InventoryContainer = {
          ...container,
          id,
          items: [],
          currentWeight: 0,
        }

        set((state) => ({
          containers: {
            ...state.containers,
            [id]: newContainer,
          },
        }))

        return id
      },

      addItem: (containerId, item) => {
        const container = get().getContainer(containerId)
        if (!container) return false

        const bestPosition = get().findBestPosition(containerId, item)
        if (!bestPosition) return false

        const validation = get().canPlaceItem(containerId, item, bestPosition)
        if (!validation.valid) return false

        const itemWithPosition = { ...item, position: bestPosition }

        set((state) => ({
          containers: {
            ...state.containers,
            [containerId]: {
              ...container,
              items: [...container.items, itemWithPosition],
              currentWeight: container.currentWeight + item.properties.weight,
            },
          },
        }))

        return true
      },

      moveItem: (itemId, fromContainer, toContainer, position) => {
        const fromContainerData = get().getContainer(fromContainer)
        const toContainerData = get().getContainer(toContainer)
        const item = get().getItem(fromContainer, itemId)

        if (!fromContainerData || !toContainerData || !item) {
          return { success: false, error: ValidationError.ITEM_TOO_LARGE }
        }

        const validation = get().canPlaceItem(toContainer, item, position)
        if (!validation.valid) {
          return { success: false, error: validation.errors[0] as ValidationError }
        }

        // Remove from source container
        const updatedFromItems = fromContainerData.items.filter(i => i.id !== itemId)
        const updatedFromWeight = fromContainerData.currentWeight - item.properties.weight

        // Add to destination container
        const itemWithNewPosition = { ...item, position }
        const updatedToItems = [...toContainerData.items, itemWithNewPosition]
        const updatedToWeight = toContainerData.currentWeight + item.properties.weight

        set((state) => ({
          containers: {
            ...state.containers,
            [fromContainer]: {
              ...fromContainerData,
              items: updatedFromItems,
              currentWeight: updatedFromWeight,
            },
            [toContainer]: {
              ...toContainerData,
              items: updatedToItems,
              currentWeight: updatedToWeight,
            },
          },
        }))

        return { success: true, newPosition: position }
      },

      removeItem: (containerId, itemId) => {
        const container = get().getContainer(containerId)
        if (!container) return false

        const item = container.items.find(i => i.id === itemId)
        if (!item) return false

        const updatedItems = container.items.filter(i => i.id !== itemId)
        const updatedWeight = container.currentWeight - item.properties.weight

        set((state) => ({
          containers: {
            ...state.containers,
            [containerId]: {
              ...container,
              items: updatedItems,
              currentWeight: updatedWeight,
            },
          },
        }))

        return true
      },

      rotateItem: (containerId, itemId) => {
        const container = get().getContainer(containerId)
        if (!container) return false

        const itemIndex = container.items.findIndex(i => i.id === itemId)
        if (itemIndex === -1) return false

        const item = container.items[itemIndex]
        if (!item.size.rotatable) return false

        const newRotation = ((item.position.rotation + 90) % 360) as 0 | 90 | 180 | 270
        const rotatedSize = newRotation % 180 === 0
          ? item.size
          : { width: item.size.height, height: item.size.width, rotatable: item.size.rotatable }

        const newItem = { ...item, position: { ...item.position, rotation: newRotation }, size: rotatedSize }

        const validation = get().canPlaceItem(containerId, newItem, newItem.position)
        if (!validation.valid) return false

        const updatedItems = [...container.items]
        updatedItems[itemIndex] = newItem

        set((state) => ({
          containers: {
            ...state.containers,
            [containerId]: {
              ...container,
              items: updatedItems,
            },
          },
        }))

        return true
      },

      splitItem: (containerId, itemId, amount) => {
        const container = get().getContainer(containerId)
        if (!container) return null

        const item = container.items.find(i => i.id === itemId)
        if (!item || item.stackSize <= 1 || amount >= item.stackSize) return null

        const newStackSize = item.stackSize - amount
        const newItem = {
          ...item,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          stackSize: amount,
        }

        // Update original item
        const updatedItems = container.items.map(i =>
          i.id === itemId ? { ...i, stackSize: newStackSize } : i
        )

        set((state) => ({
          containers: {
            ...state.containers,
            [containerId]: {
              ...container,
              items: updatedItems,
            },
          },
        }))

        return newItem
      },

      mergeItems: (containerId, fromItemId, toItemId) => {
        const container = get().getContainer(containerId)
        if (!container) return false

        const fromItem = container.items.find(i => i.id === fromItemId)
        const toItem = container.items.find(i => i.id === toItemId)

        if (!fromItem || !toItem || fromItem.templateId !== toItem.templateId) return false
        if (toItem.stackSize >= toItem.maxStackSize) return false

        const spaceAvailable = toItem.maxStackSize - toItem.stackSize
        const mergeAmount = Math.min(spaceAvailable, fromItem.stackSize)

        const updatedItems = container.items.map(item => {
          if (item.id === toItemId) {
            return { ...item, stackSize: item.stackSize + mergeAmount }
          }
          if (item.id === fromItemId) {
            const newStackSize = item.stackSize - mergeAmount
            return newStackSize > 0 ? { ...item, stackSize: newStackSize } : null
          }
          return item
        }).filter(Boolean) as InventoryItem[]

        set((state) => ({
          containers: {
            ...state.containers,
            [containerId]: {
              ...container,
              items: updatedItems,
            },
          },
        }))

        return true
      },

      canPlaceItem: (containerId, item, position) => {
        const container = get().getContainer(containerId)
        if (!container) {
          return { valid: false, errors: [ValidationError.CONTAINER_FULL], warnings: [] }
        }

        const errors: ValidationError[] = []
        const warnings: string[] = []

        // Check bounds
        const itemWidth = position.rotation % 180 === 0 ? item.size.width : item.size.height
        const itemHeight = position.rotation % 180 === 0 ? item.size.height : item.size.width

        if (position.x + itemWidth > container.size.width || position.y + itemHeight > container.size.height) {
          errors.push(ValidationError.ITEM_TOO_LARGE)
        }

        // Check collisions
        const occupiedCells = new Set<string>()
        container.items.forEach(existingItem => {
          if (existingItem.id === item.id) return // Skip self when moving

          const existingWidth = existingItem.position.rotation % 180 === 0
            ? existingItem.size.width
            : existingItem.size.height
          const existingHeight = existingItem.position.rotation % 180 === 0
            ? existingItem.size.height
            : existingItem.size.width

          for (let x = existingItem.position.x; x < existingItem.position.x + existingWidth; x++) {
            for (let y = existingItem.position.y; y < existingItem.position.y + existingHeight; y++) {
              occupiedCells.add(`${x},${y}`)
            }
          }
        })

        for (let x = position.x; x < position.x + itemWidth; x++) {
          for (let y = position.y; y < position.y + itemHeight; y++) {
            if (occupiedCells.has(`${x},${y}`)) {
              errors.push(ValidationError.POSITION_OCCUPIED)
            }
          }
        }

        // Check weight limit
        if (container.maxWeight && container.currentWeight + item.properties.weight > container.maxWeight) {
          errors.push(ValidationError.WEIGHT_LIMIT_EXCEEDED)
        }

        return {
          valid: errors.length === 0,
          errors,
          warnings,
        }
      },

      findBestPosition: (containerId, item) => {
        const container = get().getContainer(containerId)
        if (!container) return null

        // Simple first-fit algorithm
        for (let y = 0; y <= container.size.height - item.size.height; y++) {
          for (let x = 0; x <= container.size.width - item.size.width; x++) {
            const position = { x, y, rotation: 0 }
            const validation = get().canPlaceItem(containerId, item, position)
            if (validation.valid) {
              return position
            }
          }
        }

        return null
      },

      // Selectors
      getContainer: (containerId) => {
        return get().containers[containerId]
      },

      getItem: (containerId, itemId) => {
        const container = get().getContainer(containerId)
        return container?.items.find(i => i.id === itemId)
      },

      getItemsByType: (containerId, type) => {
        const container = get().getContainer(containerId)
        return container?.items.filter(i => i.type === type) || []
      },

      getTotalWeight: (containerId) => {
        const container = get().getContainer(containerId)
        return container?.currentWeight || 0
      },

      getAvailableSpace: (containerId) => {
        const container = get().getContainer(containerId)
        return container ? container.size.cells - container.items.length : 0
      },
    }),
    {
      name: 'grenzwanderer-inventory',
      partialize: (state) => ({
        containers: state.containers,
        activeContainerId: state.activeContainerId,
      }),
    }
  )
)
