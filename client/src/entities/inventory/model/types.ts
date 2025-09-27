export interface InventoryItem {
  id: string
  templateId: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  size: ItemSize
  position: GridPosition
  stackSize: number
  maxStackSize: number
  condition: number // 0-100%
  properties: ItemProperties
  modSlots?: ModSlot[]
  contains?: InventoryContainer
  metadata: ItemMetadata
}

export interface ItemSize {
  width: number
  height: number
  rotatable: boolean
}

export interface GridPosition {
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
}

export interface ItemProperties {
  weight: number
  value: number
  durability?: number
  maxDurability?: number
  damage?: DamageRange
  armor?: number
  effects?: ItemEffect[]
}

export interface DamageRange {
  physical: [number, number]
  energy: [number, number]
  critical: number
  penetration: number
}

export interface ItemEffect {
  type: 'buff' | 'debuff' | 'heal' | 'damage'
  value: number
  duration?: number
}

export interface ModSlot {
  type: ModType
  compatibleItems: string[]
  installedMod?: InventoryItem
}

export type ModType =
  | 'scope'
  | 'barrel'
  | 'magazine'
  | 'stock'
  | 'grip'
  | 'muzzle'

export interface ItemMetadata {
  foundDate: Date
  foundLocation?: string
  isQuestItem: boolean
  isSecure: boolean
  tags: string[]
}

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'medical'
  | 'food'
  | 'tool'
  | 'key'
  | 'quest'
  | 'currency'
  | 'misc'

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'

export interface InventoryContainer {
  id: string
  name: string
  type: ContainerType
  size: GridSize
  items: InventoryItem[]
  restrictions?: ItemFilter
  parent?: string
  maxWeight?: number
  currentWeight: number
}

export interface GridSize {
  width: number
  height: number
  cells: number
}

export type ContainerType =
  | 'stash'
  | 'backpack'
  | 'vest'
  | 'pockets'
  | 'secure'
  | 'weapon_case'
  | 'ammo_box'
  | 'temporary'

export interface ItemFilter {
  allowedTypes?: ItemType[]
  allowedRarities?: ItemRarity[]
  maxWeight?: number
  maxSize?: ItemSize
}

export interface InventoryState {
  containers: Record<string, InventoryContainer>
  activeContainerId: string
  dragState?: DragState
  selectedItemId?: string
}

export interface DragState {
  itemId: string
  fromContainer: string
  offsetX: number
  offsetY: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
  autoCorrect?: GridPosition
}

export enum ValidationError {
  ITEM_TOO_LARGE = 'item_too_large',
  POSITION_OCCUPIED = 'position_occupied',
  INVALID_ITEM_TYPE = 'invalid_item_type',
  CONTAINER_FULL = 'container_full',
  WEIGHT_LIMIT_EXCEEDED = 'weight_limit_exceeded',
  ITEM_RESTRICTIONS = 'item_restictions'
}

export interface MoveResult {
  success: boolean
  newPosition?: GridPosition
  error?: ValidationError
}
