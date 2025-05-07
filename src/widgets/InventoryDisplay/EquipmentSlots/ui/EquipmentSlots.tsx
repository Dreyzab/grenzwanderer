import React from 'react';
import styles from './EquipmentSlots.module.css';

interface EquippedItem {
  id: string;
  name: string;
  image: string;
  slotId: string;
}

interface EquipmentSlotsProps {
  onEquip: (itemId: string, slotId: string) => void;
  onUnequip: (slotId: string) => void;
}

// Определение слотов экипировки
const EQUIPMENT_SLOTS = [
  { id: 'head', label: 'Голова', icon: '🧢' },
  { id: 'body', label: 'Корпус', icon: '👕' },
  { id: 'legs', label: 'Ноги', icon: '👖' },
  { id: 'weapon', label: 'Оружие', icon: '🔫' },
  { id: 'offhand', label: 'Доп. оружие', icon: '🗡️' },
  { id: 'accessory', label: 'Аксессуар', icon: '⌚' }
];

// Моковые данные экипированных предметов
const MOCK_EQUIPPED_ITEMS: EquippedItem[] = [
  {
    id: 'helmet1',
    name: 'Защитный шлем',
    image: '/assets/items/helmet.png',
    slotId: 'head'
  },
  {
    id: 'kevlar1',
    name: 'Кевларовый жилет',
    image: '/assets/items/kevlar.png',
    slotId: 'body'
  },
  {
    id: 'gun1',
    name: 'Бластер "Астра"',
    image: '/assets/items/blaster.png',
    slotId: 'weapon'
  }
];

export const EquipmentSlots: React.FC<EquipmentSlotsProps> = ({
  onEquip,
  onUnequip
}) => {
  // Функция для получения экипированного предмета по ID слота
  const getEquippedItem = (slotId: string): EquippedItem | undefined => {
    return MOCK_EQUIPPED_ITEMS.find(item => item.slotId === slotId);
  };

  return (
    <div className={styles.equipmentSlotsContainer}>
      <div className={styles.characterSilhouette}>
        <div className={styles.silhouetteImage}>
          {/* Здесь может быть изображение силуэта персонажа */}
          <span className={styles.silhouetteIcon}>👤</span>
        </div>
      </div>
      
      <div className={styles.slotsGrid}>
        {EQUIPMENT_SLOTS.map(slot => {
          const equippedItem = getEquippedItem(slot.id);
          
          return (
            <div key={slot.id} className={styles.slotContainer}>
              <div className={styles.slotLabel}>{slot.label}</div>
              <div 
                className={`${styles.slot} ${equippedItem ? styles.equipped : ''}`}
                title={equippedItem ? `${equippedItem.name} (Нажмите, чтобы снять)` : `Пустой слот ${slot.label}`}
                onClick={() => equippedItem && onUnequip(slot.id)}
              >
                {equippedItem ? (
                  <div className={styles.equippedItem}>
                    <img src={equippedItem.image} alt={equippedItem.name} />
                    <span className={styles.itemName}>{equippedItem.name}</span>
                  </div>
                ) : (
                  <div className={styles.emptySlot}>
                    <span className={styles.slotIcon}>{slot.icon}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className={styles.statsInfo}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Защита:</span>
          <span className={styles.statValue}>120</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Урон:</span>
          <span className={styles.statValue}>75</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Бонусы:</span>
          <span className={styles.statValue}>+15% к крит. урону</span>
        </div>
      </div>
    </div>
  );
}; 