import React from 'react';
import styles from './ItemInfoCard.module.css';

interface ItemInfoCardProps {
  itemId: string;
  onUse: (itemId: string) => void;
  onDrop: (itemId: string) => void;
  onEquip: (itemId: string, slotId: string) => void;
}

interface ItemDetails {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image: string;
  description: string;
  stats: { [key: string]: number | string };
  equippableSlots?: string[];
  isEquipped?: boolean;
  durability?: { current: number; max: number };
}

// Моковые данные предметов
const MOCK_ITEMS: Record<string, ItemDetails> = {
  'item1': {
    id: 'item1',
    name: 'Осколок Звезд',
    type: 'weapon',
    rarity: 'rare',
    image: '/assets/items/starfragment.png',
    description: 'Древнее оружие, выкованное из осколка упавшей звезды. Обладает мистической энергией.',
    stats: {
      'Урон': 75,
      'Скорость атаки': 1.2,
      'Крит. шанс': '15%',
      'Бонус': '+10% к урону по механическим противникам'
    },
    equippableSlots: ['weapon'],
    durability: { current: 85, max: 100 }
  },
  'item2': {
    id: 'item2',
    name: 'Легкий бронежилет',
    type: 'armor',
    rarity: 'uncommon',
    image: '/assets/items/lightvest.png',
    description: 'Современный легкий бронежилет, обеспечивающий хорошую защиту без потери подвижности.',
    stats: {
      'Защита': 45,
      'Вес': 3.2,
      'Сопротивление огню': '10%',
      'Бонус': '+5% к скорости передвижения'
    },
    equippableSlots: ['body'],
    durability: { current: 70, max: 100 },
    isEquipped: true
  },
  'item3': {
    id: 'item3',
    name: 'Аптечка',
    type: 'consumable',
    rarity: 'common',
    image: '/assets/items/medkit.png',
    description: 'Базовая аптечка с медикаментами для оказания первой помощи. Восстанавливает здоровье.',
    stats: {
      'Восстановление здоровья': 50,
      'Время использования': '2 сек',
      'Бонус': 'Останавливает кровотечение'
    }
  },
  'item4': {
    id: 'item4',
    name: 'Таинственный ключ',
    type: 'quest',
    rarity: 'epic',
    image: '/assets/items/mysterykey.png',
    description: 'Древний ключ странной формы. Неизвестно, что он открывает, но кажется важным.',
    stats: {
      'Требуется для': 'Квест "Тайны Старого города"',
      'Прогресс': 'Этап 2/5'
    }
  },
  'item5': {
    id: 'item5',
    name: 'Электронная отмычка',
    type: 'quest',
    rarity: 'uncommon',
    image: '/assets/items/lockpick.png',
    description: 'Устройство для взлома электронных замков. Может быть использовано специалистами.',
    stats: {
      'Требуется для': 'Различные задания',
      'Шанс успеха': '75%',
      'Перезарядка': '30 сек'
    }
  }
};

export const ItemInfoCard: React.FC<ItemInfoCardProps> = ({
  itemId,
  onUse,
  onDrop,
  onEquip
}) => {
  const item = MOCK_ITEMS[itemId];
  
  if (!item) {
    return (
      <div className={styles.notFound}>
        Предмет не найден
      </div>
    );
  }
  
  // Функция для определения цвета редкости
  const getRarityColor = (rarity: string): string => {
    const rarityColors: Record<string, string> = {
      'common': '#b0b0b0',
      'uncommon': '#2ecc71',
      'rare': '#3498db',
      'epic': '#9b59b6',
      'legendary': '#f39c12'
    };
    return rarityColors[rarity] || '#b0b0b0';
  };
  
  // Функция для получения текстового представления редкости
  const getRarityText = (rarity: string): string => {
    const rarityTexts: Record<string, string> = {
      'common': 'Обычный',
      'uncommon': 'Необычный',
      'rare': 'Редкий',
      'epic': 'Эпический',
      'legendary': 'Легендарный'
    };
    return rarityTexts[rarity] || 'Обычный';
  };
  
  // Функция для получения текстового представления типа
  const getTypeText = (type: string): string => {
    const typeTexts: Record<string, string> = {
      'weapon': 'Оружие',
      'armor': 'Броня',
      'consumable': 'Расходник',
      'quest': 'Квестовый'
    };
    return typeTexts[type] || 'Предмет';
  };

  return (
    <div className={styles.itemInfoCard}>
      <div 
        className={styles.itemHeader} 
        style={{ borderColor: getRarityColor(item.rarity) }}
      >
        <div className={styles.itemImage}>
          <img src={item.image} alt={item.name} />
        </div>
        <div className={styles.itemTitleInfo}>
          <h3 className={styles.itemName}>{item.name}</h3>
          <div className={styles.itemMeta}>
            <span 
              className={styles.itemRarity} 
              style={{ color: getRarityColor(item.rarity) }}
            >
              {getRarityText(item.rarity)}
            </span>
            <span className={styles.itemType}>{getTypeText(item.type)}</span>
          </div>
          {item.durability && (
            <div className={styles.durabilityBar}>
              <div 
                className={styles.durabilityFill} 
                style={{ 
                  width: `${(item.durability.current / item.durability.max) * 100}%`,
                  backgroundColor: item.durability.current < 30 ? '#e74c3c' : '#2ecc71'
                }}
              ></div>
              <span className={styles.durabilityText}>
                {item.durability.current}/{item.durability.max}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.itemDescription}>
        <p>{item.description}</p>
      </div>
      
      <div className={styles.itemStats}>
        <h4>Характеристики:</h4>
        <ul className={styles.statsList}>
          {Object.entries(item.stats).map(([key, value]) => (
            <li key={key} className={styles.statItem}>
              <span className={styles.statLabel}>{key}:</span>
              <span className={styles.statValue}>{value}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className={styles.itemActions}>
        {item.type === 'consumable' && (
          <button 
            className={`${styles.actionButton} ${styles.useButton}`}
            onClick={() => onUse(item.id)}
          >
            Использовать
          </button>
        )}
        
        {item.equippableSlots && !item.isEquipped && (
          <button 
            className={`${styles.actionButton} ${styles.equipButton}`}
            onClick={() => onEquip(item.id, item.equippableSlots![0])}
          >
            Экипировать
          </button>
        )}
        
        {item.isEquipped && (
          <button 
            className={`${styles.actionButton} ${styles.unequipButton}`}
            onClick={() => onEquip(item.id, '')}
          >
            Снять
          </button>
        )}
        
        {item.type !== 'quest' && (
          <button 
            className={`${styles.actionButton} ${styles.dropButton}`}
            onClick={() => onDrop(item.id)}
          >
            Выбросить
          </button>
        )}
      </div>
    </div>
  );
}; 