import React from 'react';
import styles from './ItemGrid.module.css';
import { useInventory, InventoryItemWithDetails } from '../../../../features/player/api/useInventory';

interface ItemGridProps {
  selectedItemId: string | null;
  onItemSelect: (itemId: string) => void;
  sortOption: 'newest' | 'rarity' | 'type' | 'name';
  filterOption: 'all' | 'weapons' | 'armor' | 'consumables' | 'quest';
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  selectedItemId,
  onItemSelect,
  sortOption,
  filterOption
}) => {
  const { inventoryItems, loading } = useInventory();
  
  // Получение предметов рюкзака (не экипированные)
  const backpackItems = inventoryItems.filter(item => 
    item.location === 'backpack' && !item.equipped
  );
  
  // Фильтрация предметов
  let filteredItems = [...backpackItems];
  
  if (filterOption !== 'all') {
    const filterMap: Record<string, string> = {
      'weapons': 'weapon',
      'armor': 'armor',
      'consumables': 'consumable',
      'quest': 'quest'
    };
    
    filteredItems = filteredItems.filter(item => 
      item.details?.type === filterMap[filterOption]
    );
  }
  
  // Сортировка предметов
  filteredItems.sort((a, b) => {
    if (!a.details || !b.details) return 0;
    
    switch (sortOption) {
      case 'newest':
        return (a.details.isNew === b.details.isNew) ? 0 : a.details.isNew ? -1 : 1;
      case 'rarity': 
        const rarityOrder = { 'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
        const aRarity = a.details.rarity || 'common';
        const bRarity = b.details.rarity || 'common';
        return (rarityOrder[bRarity] || 0) - (rarityOrder[aRarity] || 0);
      case 'type':
        return (a.details.type || '').localeCompare(b.details.type || '');
      case 'name':
        return (a.details.name || '').localeCompare(b.details.name || '');
      default:
        return 0;
    }
  });
  
  if (loading) {
    return (
      <div className={styles.loading}>
        Загрузка инвентаря...
      </div>
    );
  }
  
  return (
    <div className={styles.itemGrid}>
      {filteredItems.length > 0 ? (
        filteredItems.map(item => (
          <div 
            key={item._id} 
            className={`${styles.itemCell} ${selectedItemId === item._id ? styles.selected : ''} ${styles[item.details?.rarity || 'common']}`}
            onClick={() => onItemSelect(item._id)}
          >
            <div className={styles.itemImage}>
              <img src={item.details?.image || '/assets/items/placeholder.png'} alt={item.details?.name || 'Предмет'} />
              {item.details?.isNew && <span className={styles.newBadge}>Новый</span>}
              {item.quantity > 1 && <span className={styles.quantityBadge}>{item.quantity}</span>}
            </div>
            <div className={styles.itemName}>{item.details?.name || 'Неизвестный предмет'}</div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>Нет предметов, соответствующих фильтру</div>
      )}
    </div>
  );
}; 