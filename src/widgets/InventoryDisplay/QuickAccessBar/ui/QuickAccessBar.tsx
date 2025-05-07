import React, { useState } from 'react';
import styles from './QuickAccessBar.module.css';
import { useInventory, InventoryItemWithDetails } from '../../../../features/player/api/useInventory';

interface QuickAccessBarProps {
  onAssignSlot: (itemId: string, slotIndex: number) => void;
  onUseItem: (itemId: string) => void;
  onItemSelect: (itemId: string) => void;
}

// Количество слотов быстрого доступа
const SLOT_COUNT = 6;

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  onAssignSlot,
  onUseItem,
  onItemSelect
}) => {
  const { inventoryItems, loading, error } = useInventory();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  
  // Получаем предметы, подходящие для быстрого доступа (расходники)
  const usableItems = inventoryItems.filter(item => 
    item.details?.type === 'consumable' && !item.equipped
  );
  
  // Получаем предметы, присвоенные быстрым слотам
  // В реальном приложении здесь будет логика получения назначенных предметов из базы данных
  // Пока используем временное решение: считаем, что quickSlot хранится в эффектах предмета
  const getQuickSlotItem = (slotIndex: number): InventoryItemWithDetails | null => {
    const item = usableItems.find(item => 
      item.details?.effects && item.details.effects.quickSlot === slotIndex
    );
    return item || null;
  };
  
  // Обработчик перетаскивания предмета
  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };
  
  // Обработчик отпускания предмета на слоте
  const handleDrop = (slotIndex: number) => {
    if (draggedItemId) {
      onAssignSlot(draggedItemId, slotIndex);
      setDraggedItemId(null);
    }
  };
  
  // Обработчик окончания перетаскивания
  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  if (loading) {
    return (
      <div className={styles.loading}>
        Загрузка быстрого доступа...
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
  
  // Рендер кнопки для слота
  const renderSlotButton = (index: number) => {
    const item = getQuickSlotItem(index);
    const slotNumber = index + 1;
    
    return (
      <div 
        key={`slot-${index}`}
        className={`${styles.quickSlot} ${item ? styles.filled : styles.empty}`}
        onClick={() => item && onUseItem(item._id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(index)}
      >
        {item ? (
          <div className={styles.slotContent}>
            <img 
              src={item.details?.image || '/assets/items/placeholder.png'} 
              alt={item.details?.name || 'Предмет'} 
              className={styles.itemImage} 
              onClick={(e) => {
                e.stopPropagation();
                onItemSelect(item._id);
              }}
            />
            <span className={styles.keyBinding}>{slotNumber}</span>
            
            {item.quantity > 1 && (
              <span className={styles.quantity}>{item.quantity}</span>
            )}
            
            <span className={styles.itemName}>{item.details?.name || 'Предмет'}</span>
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
  
  // Рендер доступных предметов для перетаскивания
  const renderDraggableItems = () => {
    return (
      <div className={styles.draggableItems}>
        <h3>Доступные предметы:</h3>
        <div className={styles.itemsList}>
          {usableItems.length > 0 ? (
            usableItems.map(item => (
              <div 
                key={item._id}
                className={styles.draggableItem}
                draggable
                onDragStart={() => handleDragStart(item._id)}
                onDragEnd={handleDragEnd}
                onClick={() => onItemSelect(item._id)}
              >
                <img 
                  src={item.details?.image || '/assets/items/placeholder.png'} 
                  alt={item.details?.name || 'Предмет'} 
                />
                <span>{item.details?.name || 'Предмет'}</span>
                <span className={styles.dragItemQuantity}>x{item.quantity}</span>
              </div>
            ))
          ) : (
            <div className={styles.noItems}>Нет доступных предметов</div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.quickAccessBar}>
      <div className={styles.slotsContainer}>
        {Array.from({ length: SLOT_COUNT }).map((_, index) => renderSlotButton(index))}
      </div>
      
      {renderDraggableItems()}
      
      <div className={styles.helpText}>
        <p>Перетащите предметы на слоты для быстрого доступа или нажмите клавиши 1-6 для использования</p>
      </div>
    </div>
  );
}; 