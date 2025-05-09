// Реэкспорт функций
export * from '../../../../features/player/api';

// Явный реэкспорт типов для избежания проблем с isolatedModules
export type { 
  InventoryItem, 
  ItemInfo, 
  InventoryItemWithDetails,
  PlayerData
} from '../../../../features/player/api'; 