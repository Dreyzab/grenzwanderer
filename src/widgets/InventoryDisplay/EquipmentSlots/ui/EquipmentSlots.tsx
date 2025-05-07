import React from 'react';
import styles from './EquipmentSlots.module.css';
import { useInventory, InventoryItemWithDetails } from '../../../../features/player/api/useInventory';
import { Id } from '../../../../../convex/_generated/dataModel';

interface EquipmentSlotsProps {
  onEquip: (itemId: string, slotId: string) => void;
  onUnequip: (slotId: string) => void;
  onItemSelect: (itemId: string) => void;
}

// Определение слотов экипировки
const EQUIPMENT_SLOTS = [
  { id: 'head', label: 'Голова', icon: '🧢' },
  { id: 'body', label: 'Корпус', icon: '👕' },
  { id: 'legs', label: 'Ноги', icon: '👖' },
  { id: 'primary', label: 'Оружие', icon: '🔫' },
  { id: 'secondary', label: 'Доп. оружие', icon: '🗡️' },
  { id: 'accessory', label: 'Аксессуар', icon: '⌚' }
];

export const EquipmentSlots: React.FC<EquipmentSlotsProps> = ({
  onEquip,
  onUnequip,
  onItemSelect
}) => {
  const { inventoryItems, loading, error } = useInventory();
  
  // Получаем экипированные предметы
  const equippedItems = inventoryItems.filter(item => 
    item.equipped && item.location === 'equipment'
  );
  
  // Функция для получения экипированного предмета по ID слота
  const getEquippedItem = (slotId: string): InventoryItemWithDetails | undefined => {
    return equippedItems.find(item => item.slotType === slotId);
  };
  
  if (loading) {
    return (
      <div className={styles.loading}>
        Загрузка экипировки...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.error}>
        Ошибка: {error}
      </div>
    );
  }

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
                title={equippedItem ? `${equippedItem.details?.name || 'Предмет'} (Нажмите, чтобы снять)` : `Пустой слот ${slot.label}`}
                onClick={() => {
                  if (equippedItem) {
                    onUnequip(slot.id);
                    // Также выбираем этот предмет для отображения деталей
                    onItemSelect(equippedItem._id);
                  }
                }}
              >
                {equippedItem ? (
                  <div className={styles.equippedItem}>
                    <img 
                      src={equippedItem.details?.image || '/assets/items/placeholder.png'} 
                      alt={equippedItem.details?.name || 'Предмет'} 
                    />
                    <span className={styles.itemName}>
                      {equippedItem.details?.name || 'Неизвестный предмет'}
                    </span>
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
          <span className={styles.statValue}>
            {calculateTotalStat(equippedItems, 'armor') || 0}
          </span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Урон:</span>
          <span className={styles.statValue}>
            {calculateTotalStat(equippedItems, 'damage') || 0}
          </span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Бонусы:</span>
          <span className={styles.statValue}>
            {getEquipmentBonuses(equippedItems) || 'Нет'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Вспомогательные функции
function calculateTotalStat(items: InventoryItemWithDetails[], statName: string): number {
  let total = 0;
  
  for (const item of items) {
    if (item.details?.effects && typeof item.details.effects[statName] === 'number') {
      total += item.details.effects[statName] as number;
    }
  }
  
  return total;
}

function getEquipmentBonuses(items: InventoryItemWithDetails[]): string {
  // Здесь можно реализовать логику расчета сетовых бонусов или других специальных бонусов
  // Пока просто возвращаем заглушку
  const bonuses: string[] = [];
  
  for (const item of items) {
    if (item.details?.effects && typeof item.details.effects['bonus'] === 'string') {
      bonuses.push(item.details.effects['bonus'] as string);
    }
  }
  
  return bonuses.length > 0 ? bonuses.join(', ') : 'Нет';
} 