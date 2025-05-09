/**
 * Реэкспорт из основного местоположения в src/features/player/api
 * Для совместимости со старыми импортами
 * @deprecated Используйте импорт из 'src/features/player/api'
 */
// Экспорт хука
export { useInventory } from '../../../../features/player/api';

// Экспорт типов
export type { InventoryItem, ItemInfo, InventoryItemWithDetails } from '../../../../features/player/api'; 