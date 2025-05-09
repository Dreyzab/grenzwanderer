import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { useInventory } from '@/features/player/api/useInventory';

// Определяем вкладки инвентаря
type InventoryTab = 'inventory' | 'equipment';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('inventory');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Получаем данные инвентаря
  const {
    inventoryItems,
    equippedItems,
    isLoading,
    equipItem,
    unequipItem,
    useItem,
    dropItem
  } = useInventory();
  
  // Выбор предмета из инвентаря
  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId === selectedItemId ? null : itemId);
  };
  
  // Экипировка предмета
  const handleEquipItem = (itemId: string) => {
    equipItem(itemId);
    setSelectedItemId(null);
  };
  
  // Снятие предмета
  const handleUnequipItem = (itemId: string) => {
    unequipItem(itemId);
    setSelectedItemId(null);
  };
  
  // Использование предмета
  const handleUseItem = (itemId: string) => {
    useItem(itemId);
    setSelectedItemId(null);
  };
  
  // Выбрасывание предмета
  const handleDropItem = (itemId: string) => {
    if (window.confirm('Вы уверены, что хотите выбросить этот предмет?')) {
      dropItem(itemId);
      setSelectedItemId(null);
    }
  };
  
  // Получаем выбранный предмет
  const selectedItem = selectedItemId 
    ? [...inventoryItems, ...equippedItems].find(item => item.id === selectedItemId) 
    : null;
  
  return (
    <PageLayout
      header={
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-heading text-center">Инвентарь</h1>
          
          {/* Вкладки */}
          <div className="flex border-b border-surface-variant">
            <button 
              className={`py-2 px-4 ${activeTab === 'inventory' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('inventory')}
            >
              Инвентарь
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'equipment' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('equipment')}
            >
              Экипировка
            </button>
          </div>
        </div>
      }
      content={
        <div className="h-full flex flex-col md:flex-row">
          {/* Основная панель (инвентарь или экипировка) */}
          <div className="md:w-2/3 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-lg text-text-secondary">Загрузка инвентаря...</div>
              </div>
            ) : activeTab === 'inventory' ? (
              /* Сетка инвентаря */
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {inventoryItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-surface p-2 rounded cursor-pointer border-2 ${selectedItemId === item.id ? 'border-accent' : 'border-transparent'}`}
                    onClick={() => handleSelectItem(item.id)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div 
                        className={`w-12 h-12 rounded bg-surface-variant mb-1 flex items-center justify-center text-${item.rarity || 'common'}`}
                      >
                        {item.icon || '?'}
                      </div>
                      <div className="text-xs truncate w-full">{item.name}</div>
                      {item.quantity > 1 && <div className="text-xs text-text-secondary">x{item.quantity}</div>}
                    </div>
                  </div>
                ))}
                {inventoryItems.length === 0 && (
                  <div className="col-span-full text-center py-8 text-text-secondary">
                    Ваш инвентарь пуст
                  </div>
                )}
              </div>
            ) : (
              /* Слоты экипировки */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {[
                  {id: 'head', name: 'Голова'},
                  {id: 'chest', name: 'Грудь'},
                  {id: 'hands', name: 'Руки'},
                  {id: 'legs', name: 'Ноги'},
                  {id: 'feet', name: 'Ступни'},
                  {id: 'weapon', name: 'Оружие'},
                  {id: 'off-hand', name: 'Левая рука'},
                  {id: 'accessory1', name: 'Аксессуар 1'},
                  {id: 'accessory2', name: 'Аксессуар 2'}
                ].map((slot) => {
                  const equippedItem = equippedItems.find(item => item.slot === slot.id);
                  return (
                    <div 
                      key={slot.id} 
                      className={`bg-surface p-3 rounded-lg flex flex-col items-center ${equippedItem ? 'cursor-pointer' : 'opacity-50'}`}
                      onClick={() => equippedItem && handleSelectItem(equippedItem.id)}
                    >
                      <div className="text-sm text-text-secondary mb-1">{slot.name}</div>
                      {equippedItem ? (
                        <div className="flex flex-col items-center">
                          <div 
                            className={`w-16 h-16 rounded bg-surface-variant mb-1 flex items-center justify-center text-${equippedItem.rarity || 'common'}`}
                          >
                            {equippedItem.icon || '?'}
                          </div>
                          <div className="text-sm truncate w-full text-center">{equippedItem.name}</div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 border-2 border-dashed border-surface-variant rounded flex items-center justify-center">
                          <span className="text-text-disabled">Пусто</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Панель деталей выбранного предмета */}
          <div className="md:w-1/3 p-4 bg-surface-variant">
            {selectedItem ? (
              <div className="flex flex-col h-full">
                <div className="text-xl font-medium mb-2">{selectedItem.name}</div>
                
                <div className="text-sm text-text-secondary mb-4">
                  {selectedItem.type || 'Предмет'} • {selectedItem.rarity || 'Обычный'}
                </div>
                
                {selectedItem.description && (
                  <div className="mb-4 text-sm">{selectedItem.description}</div>
                )}
                
                {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Характеристики:</div>
                    <ul className="text-sm">
                      {Object.entries(selectedItem.stats).map(([stat, value]) => (
                        <li key={stat} className="flex justify-between">
                          <span>{stat}</span>
                          <span className={value > 0 ? 'text-success' : 'text-error'}>
                            {value > 0 ? '+' : ''}{value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-auto">
                  <div className="flex flex-col gap-2">
                    {!selectedItem.equipped && (
                      <>
                        <button 
                          className="bg-accent text-surface py-2 px-4 rounded"
                          onClick={() => handleEquipItem(selectedItem.id)}
                        >
                          Экипировать
                        </button>
                        
                        {selectedItem.usable && (
                          <button 
                            className="bg-surface text-accent border border-accent py-2 px-4 rounded"
                            onClick={() => handleUseItem(selectedItem.id)}
                          >
                            Использовать
                          </button>
                        )}
                      </>
                    )}
                    
                    {selectedItem.equipped && (
                      <button 
                        className="bg-accent text-surface py-2 px-4 rounded"
                        onClick={() => handleUnequipItem(selectedItem.id)}
                      >
                        Снять
                      </button>
                    )}
                    
                    <button 
                      className="bg-error text-surface py-2 px-4 rounded"
                      onClick={() => handleDropItem(selectedItem.id)}
                    >
                      Выбросить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary">
                {activeTab === 'inventory' 
                  ? 'Выберите предмет из инвентаря для просмотра деталей'
                  : 'Выберите экипированный предмет для просмотра деталей'
                }
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}; 