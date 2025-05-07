import React from 'react';
import styles from './QuickAccessBar.module.css';

interface QuickSlotItem {
  id: string;
  name: string;
  image: string;
  cooldown?: {
    current: number;
    max: number;
  };
  quantity?: number;
}

interface QuickAccessBarProps {
  onAssignSlot: (itemId: string, slotIndex: number) => void;
  onUseItem: (itemId: string) => void;
}

// Количество слотов быстрого доступа
const SLOT_COUNT = 6;

// Моковые данные для быстрых слотов
const MOCK_QUICK_SLOTS: (QuickSlotItem | null)[] = [
  {
    id: 'item3',
    name: 'Аптечка',
    image: '/assets/items/medkit.png',
    quantity: 3
  },
  {
    id: 'item6',
    name: 'Стимулятор',
    image: '/assets/items/stimulator.png',
    cooldown: {
      current: 45,
      max: 120
    },
    quantity: 1
  },
  null, // пустой слот
  {
    id: 'item7',
    name: 'Дымовая граната',
    image: '/assets/items/smokebomb.png',
    quantity: 2
  },
  null, // пустой слот
  null  // пустой слот
];

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  onAssignSlot,
  onUseItem
}) => {
  // Получение элемента для слота по индексу
  const getSlotItem = (index: number): QuickSlotItem | null => {
    if (index >= 0 && index < MOCK_QUICK_SLOTS.length) {
      return MOCK_QUICK_SLOTS[index];
    }
    return null;
  };
  
  // Рендер кнопки для слота
  const renderSlotButton = (index: number) => {
    const item = getSlotItem(index);
    const slotNumber = index + 1;
    
    return (
      <div 
        key={`slot-${index}`}
        className={`${styles.quickSlot} ${item ? styles.filled : styles.empty}`}
        onClick={() => item && onUseItem(item.id)}
      >
        {item ? (
          <div className={styles.slotContent}>
            <img src={item.image} alt={item.name} className={styles.itemImage} />
            <span className={styles.keyBinding}>{slotNumber}</span>
            
            {item.quantity !== undefined && (
              <span className={styles.quantity}>{item.quantity}</span>
            )}
            
            {item.cooldown && (
              <div 
                className={styles.cooldownOverlay}
                style={{
                  height: `${(item.cooldown.current / item.cooldown.max) * 100}%`
                }}
              ></div>
            )}
            
            <span className={styles.itemName}>{item.name}</span>
          </div>
        ) : (
          <div className={styles.emptySlot}>
            <span className={styles.keyBinding}>{slotNumber}</span>
            <span className={styles.emptyText}>Пусто</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={styles.quickAccessBar}>
      <div className={styles.slotsContainer}>
        {Array.from({ length: SLOT_COUNT }).map((_, index) => renderSlotButton(index))}
      </div>
      
      <div className={styles.helpText}>
        <p>Перетащите предметы на слоты для быстрого доступа или нажмите клавиши 1-6 для использования</p>
      </div>
    </div>
  );
}; 