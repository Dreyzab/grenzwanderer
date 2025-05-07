import React from 'react';
import styles from './ItemGrid.module.css';

interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image: string;
  isNew: boolean;
}

interface ItemGridProps {
  selectedItemId: string | null;
  onItemSelect: (itemId: string) => void;
  sortOption: 'newest' | 'rarity' | 'type' | 'name';
  filterOption: 'all' | 'weapons' | 'armor' | 'consumables' | 'quest';
}

// Моковые данные для примера
const MOCK_ITEMS: Item[] = [
  {
    id: 'item1',
    name: 'Осколок Звезд',
    type: 'weapon',
    rarity: 'rare',
    image: '/assets/items/starfragment.png',
    isNew: true
  },
  {
    id: 'item2',
    name: 'Легкий бронежилет',
    type: 'armor',
    rarity: 'uncommon',
    image: '/assets/items/lightvest.png',
    isNew: false
  },
  {
    id: 'item3',
    name: 'Аптечка',
    type: 'consumable',
    rarity: 'common',
    image: '/assets/items/medkit.png',
    isNew: false
  },
  {
    id: 'item4',
    name: 'Таинственный ключ',
    type: 'quest',
    rarity: 'epic',
    image: '/assets/items/mysterykey.png',
    isNew: true
  },
  {
    id: 'item5',
    name: 'Электронная отмычка',
    type: 'quest',
    rarity: 'uncommon',
    image: '/assets/items/lockpick.png',
    isNew: false
  }
];

export const ItemGrid: React.FC<ItemGridProps> = ({
  selectedItemId,
  onItemSelect,
  sortOption,
  filterOption
}) => {
  // Фильтрация предметов
  let filteredItems = [...MOCK_ITEMS];
  
  if (filterOption !== 'all') {
    const filterMap = {
      'weapons': 'weapon',
      'armor': 'armor',
      'consumables': 'consumable',
      'quest': 'quest'
    };
    
    filteredItems = filteredItems.filter(item => 
      item.type === filterMap[filterOption as keyof typeof filterMap]
    );
  }
  
  // Сортировка предметов
  filteredItems.sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1;
      case 'rarity': 
        const rarityOrder = { 'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      case 'type':
        return a.type.localeCompare(b.type);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  
  return (
    <div className={styles.itemGrid}>
      {filteredItems.length > 0 ? (
        filteredItems.map(item => (
          <div 
            key={item.id} 
            className={`${styles.itemCell} ${selectedItemId === item.id ? styles.selected : ''} ${styles[item.rarity]}`}
            onClick={() => onItemSelect(item.id)}
          >
            <div className={styles.itemImage}>
              <img src={item.image} alt={item.name} />
              {item.isNew && <span className={styles.newBadge}>Новый</span>}
            </div>
            <div className={styles.itemName}>{item.name}</div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>Нет предметов, соответствующих фильтру</div>
      )}
    </div>
  );
}; 