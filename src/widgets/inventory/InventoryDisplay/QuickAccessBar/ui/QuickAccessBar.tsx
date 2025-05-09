import React, { useState } from 'react';
import styles from './QuickAccessBar.module.css';
import { useInventory, InventoryItemWithDetails } from '../../../../features/player/api';

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
  const usableItems = inventoryItems.filter((item: InventoryItemWithDetails) => 
    item.details?.type === 'consumable' && !item.equipped
  );
  
  // Получаем предметы, присвоенные быстрым слотам
  // В реальном приложении здесь будет логика получения назначенных предметов из базы данных
  // Пока используем временное решение: считаем, что quickSlot хранится в эффектах предмета
  const getQuickSlotItem = (slotIndex: number): InventoryItemWithDetails | null => {
    const item = usableItems.find((item: InventoryItemWithDetails) => 
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
      <div className="flex justify-center items-center p-4 text-text-secondary">
        Загрузка быстрого доступа...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-error text-center">
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
        className={`relative w-16 h-16 rounded-md cursor-pointer transition-all overflow-hidden
          ${item 
            ? 'bg-surface border border-border-color shadow-sm ' + styles.filled
            : 'bg-black bg-opacity-5 border border-dashed border-border-color'}`}
        onClick={() => item && onUseItem(item._id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(index)}
      >
        {item ? (
          <div className="relative w-full h-full flex justify-center items-center">
            <img 
              src={item.details?.image || '/assets/items/placeholder.png'} 
              alt={item.details?.name || 'Предмет'} 
              className="max-w-[80%] max-h-[80%] object-contain" 
              onClick={(e) => {
                e.stopPropagation();
                onItemSelect(item._id);
              }}
            />
            <span className="absolute top-0.5 left-0.5 bg-black bg-opacity-50 text-white text-xs p-0.5 rounded font-bold">
              {slotNumber}
            </span>
            
            {item.quantity > 1 && (
              <span className="absolute bottom-0.5 right-0.5 bg-black bg-opacity-60 text-white text-xs p-0.5 rounded">
                {item.quantity}
              </span>
            )}
            
            <span className="absolute bottom-0 left-0 w-full text-[8px] p-0.5 text-center bg-black bg-opacity-70 text-white opacity-0 transition-opacity duration-200">
              {item.details?.name || 'Предмет'}
            </span>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <span className="absolute top-0.5 left-0.5 bg-black bg-opacity-50 text-white text-xs p-0.5 rounded font-bold">
              {slotNumber}
            </span>
            <span className="text-text-secondary text-opacity-60 text-xs">Пусто</span>
          </div>
        )}
      </div>
    );
  };
  
  // Рендер доступных предметов для перетаскивания
  const renderDraggableItems = () => {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-heading mb-2">Доступные предметы:</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {usableItems.length > 0 ? (
            usableItems.map((item: InventoryItemWithDetails) => (
              <div 
                key={item._id}
                className={`relative bg-surface border border-border-color p-2 rounded-md flex flex-col items-center ${styles.draggableItem}`}
                draggable
                onDragStart={() => handleDragStart(item._id)}
                onDragEnd={handleDragEnd}
                onClick={() => onItemSelect(item._id)}
              >
                <img 
                  src={item.details?.image || '/assets/items/placeholder.png'} 
                  alt={item.details?.name || 'Предмет'} 
                  className="w-10 h-10 object-contain mb-1"
                />
                <span className="text-xs text-center truncate w-full">{item.details?.name || 'Предмет'}</span>
                <span className={styles.dragItemQuantity}>x{item.quantity}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-text-secondary p-4">Нет доступных предметов</div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col w-full gap-2.5">
      <div className="flex justify-between gap-2.5">
        {Array.from({ length: SLOT_COUNT }).map((_, index) => renderSlotButton(index))}
      </div>
      
      {renderDraggableItems()}
      
      <div className="text-sm text-text-secondary text-center italic p-1.5">
        <p className="m-0">Перетащите предметы на слоты для быстрого доступа или нажмите клавиши 1-6 для использования</p>
      </div>
    </div>
  );
}; 