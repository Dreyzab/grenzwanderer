import React, { useState } from 'react';
import { useConvexQuery, useConvexMutation } from '../../shared/hooks';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface InventoryItem {
  _id: Id<'items'>;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  stackable: boolean;
  quantity: number;
  equipped?: boolean;
  stats?: Record<string, number>;
}

interface EquipmentSlot {
  id: string;
  type: 'head' | 'chest' | 'legs' | 'hands' | 'feet' | 'weapon' | 'offhand' | 'accessory';
  name: string;
  item?: InventoryItem;
}

interface InventoryWidgetProps {
  playerId: Id<'players'>;
}

/**
 * Виджет для отображения и управления инвентарем игрока
 * Использует Convex API для получения и обновления данных в реальном времени
 */
export const InventoryWidget: React.FC<InventoryWidgetProps> = ({ playerId }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapons' | 'armor' | 'consumables' | 'quest' | 'misc'>('all');
  const [selectedItemId, setSelectedItemId] = useState<Id<'items'> | null>(null);
  const [dropQuantity, setDropQuantity] = useState(1);
  
  // Получение данных инвентаря с помощью Convex
  const { data: inventoryData, isLoading: isLoadingInventory } = useConvexQuery(
    api.inventory.getPlayerInventory,
    { playerId },
    {
      fallbackData: {
        items: [],
        equipment: [],
        capacity: { max: 20, current: 0 },
        money: 0
      }
    }
  );
  
  // Мутации для операций с инвентарем
  const { mutate: useItem } = useConvexMutation(
    api.inventory.useItem,
    {
      onSuccess: () => {
        setSelectedItemId(null);
      },
      onError: (error) => {
        console.error("Ошибка при использовании предмета:", error);
      }
    }
  );
  
  const { mutate: equipItem } = useConvexMutation(
    api.inventory.equipItem,
    {
      onSuccess: () => {
        setSelectedItemId(null);
      },
      onError: (error) => {
        console.error("Ошибка при экипировке предмета:", error);
      }
    }
  );
  
  const { mutate: unequipItem } = useConvexMutation(
    api.inventory.unequipItem,
    {
      onSuccess: () => {},
      onError: (error) => {
        console.error("Ошибка при снятии предмета:", error);
      }
    }
  );
  
  const { mutate: dropItem } = useConvexMutation(
    api.inventory.dropItem,
    {
      onSuccess: () => {
        setSelectedItemId(null);
        setDropQuantity(1);
      },
      onError: (error) => {
        console.error("Ошибка при выбрасывании предмета:", error);
      }
    }
  );
  
  // Фильтрация предметов по типу
  const filteredItems = !inventoryData ? [] : inventoryData.items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'weapons') return item.type === 'weapon';
    if (activeTab === 'armor') return item.type === 'armor';
    if (activeTab === 'consumables') return item.type === 'consumable';
    if (activeTab === 'quest') return item.type === 'quest';
    if (activeTab === 'misc') return item.type === 'misc';
    return true;
  });
  
  const selectedItem = inventoryData?.items.find(item => item._id === selectedItemId);
  
  // Обработчики действий
  const handleItemClick = (itemId: Id<'items'>) => {
    setSelectedItemId(itemId === selectedItemId ? null : itemId);
    setDropQuantity(1);
  };
  
  const handleItemUse = () => {
    if (selectedItemId) {
      useItem({ itemId: selectedItemId, playerId });
    }
  };
  
  const handleItemEquip = () => {
    if (selectedItemId) {
      equipItem({ itemId: selectedItemId, playerId });
    }
  };
  
  const handleItemUnequip = (slotId: string) => {
    unequipItem({ slotId, playerId });
  };
  
  const handleItemDrop = () => {
    if (selectedItemId && selectedItem) {
      dropItem({
        itemId: selectedItemId,
        playerId,
        quantity: Math.min(dropQuantity, selectedItem.quantity)
      });
    }
  };
  
  // Отображение загрузочного состояния
  if (isLoadingInventory) {
    return (
      <div className="bg-surface-variant p-4 rounded-lg animate-pulse">
        <div className="h-8 bg-surface w-1/3 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array(9).fill(0).map((_, index) => (
            <div key={index} className="h-20 bg-surface rounded"></div>
          ))}
        </div>
        <div className="h-40 bg-surface rounded"></div>
      </div>
    );
  }
  
  if (!inventoryData) {
    return <div className="bg-error-container p-4 rounded-lg text-error">Ошибка загрузки инвентаря</div>;
  }
  
  const { items, equipment, capacity, money } = inventoryData;
  
  return (
    <div className="inventory-widget bg-surface-variant p-4 rounded-lg">
      <div className="inventory-header flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading">Инвентарь</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            {capacity.current} / {capacity.max}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-on-secondary-container">💰</span>
            <span>{money}</span>
          </div>
        </div>
      </div>
      
      <div className="tabs flex mb-4 border-b border-surface">
        <button 
          className={`tab px-3 py-2 ${activeTab === 'all' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Все
        </button>
        <button 
          className={`tab px-3 py-2 ${activeTab === 'weapons' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('weapons')}
        >
          Оружие
        </button>
        <button 
          className={`tab px-3 py-2 ${activeTab === 'armor' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('armor')}
        >
          Броня
        </button>
        <button 
          className={`tab px-3 py-2 ${activeTab === 'consumables' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('consumables')}
        >
          Расходники
        </button>
        <button 
          className={`tab px-3 py-2 ${activeTab === 'quest' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('quest')}
        >
          Квестовые
        </button>
        <button 
          className={`tab px-3 py-2 ${activeTab === 'misc' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('misc')}
        >
          Разное
        </button>
      </div>
      
      <div className="inventory-content grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="inventory-grid col-span-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-8 text-text-secondary">
                В инвентаре нет предметов этого типа
              </div>
            )}
            
            {filteredItems.map(item => (
              <div 
                key={item._id}
                className={`
                  inventory-item p-2 rounded cursor-pointer relative
                  ${item.rarity === 'legendary' ? 'bg-amber-100 border border-amber-500' :
                    item.rarity === 'epic' ? 'bg-purple-100 border border-purple-500' :
                    item.rarity === 'rare' ? 'bg-blue-100 border border-blue-500' :
                    item.rarity === 'uncommon' ? 'bg-green-100 border border-green-500' :
                    'bg-surface border border-surface-variant'}
                  ${selectedItemId === item._id ? 'ring-2 ring-primary' : ''}
                  ${item.equipped ? 'opacity-50' : ''}
                `}
                onClick={() => handleItemClick(item._id)}
              >
                <div className="aspect-square mb-1 flex items-center justify-center bg-surface rounded">
                  {item.icon ? (
                    <img src={item.icon} alt={item.name} className="w-8 h-8" />
                  ) : (
                    <div className="text-xl">
                      {item.type === 'weapon' && '⚔️'}
                      {item.type === 'armor' && '🛡️'}
                      {item.type === 'consumable' && '🧪'}
                      {item.type === 'quest' && '📜'}
                      {item.type === 'misc' && '🔮'}
                    </div>
                  )}
                </div>
                
                <div className="text-xs font-medium truncate">{item.name}</div>
                
                {item.stackable && item.quantity > 1 && (
                  <div className="absolute top-1 right-1 text-xs bg-surface rounded-full w-5 h-5 flex items-center justify-center">
                    {item.quantity}
                  </div>
                )}
                
                {item.equipped && (
                  <div className="absolute top-1 left-1 text-xs bg-primary rounded-full w-5 h-5 flex items-center justify-center text-on-primary">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="details-panel">
          {selectedItem ? (
            <div className="bg-surface p-3 rounded">
              <h3 className="text-lg font-medium mb-2">{selectedItem.name}</h3>
              
              <div className={`text-xs mb-2 inline-block px-2 py-0.5 rounded
                ${selectedItem.rarity === 'legendary' ? 'bg-amber-100 text-amber-800' :
                 selectedItem.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                 selectedItem.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                 selectedItem.rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                 'bg-gray-100 text-gray-800'}
              `}>
                {selectedItem.rarity === 'common' && 'Обычный'}
                {selectedItem.rarity === 'uncommon' && 'Необычный'}
                {selectedItem.rarity === 'rare' && 'Редкий'}
                {selectedItem.rarity === 'epic' && 'Эпический'}
                {selectedItem.rarity === 'legendary' && 'Легендарный'}
              </div>
              
              <p className="text-sm mb-3">{selectedItem.description}</p>
              
              {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                <div className="mb-3 bg-surface-variant p-2 rounded text-sm">
                  {Object.entries(selectedItem.stats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between">
                      <span>{stat}:</span>
                      <span className={value > 0 ? 'text-success' : 'text-error'}>
                        {value > 0 ? `+${value}` : value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-4">
                {['weapon', 'armor'].includes(selectedItem.type) && !selectedItem.equipped && (
                  <button 
                    className="bg-primary text-on-primary px-3 py-1 rounded text-sm"
                    onClick={handleItemEquip}
                  >
                    Экипировать
                  </button>
                )}
                
                {selectedItem.type === 'consumable' && (
                  <button 
                    className="bg-primary text-on-primary px-3 py-1 rounded text-sm"
                    onClick={handleItemUse}
                  >
                    Использовать
                  </button>
                )}
                
                {!selectedItem.equipped && selectedItem.type !== 'quest' && (
                  <div className="flex gap-1">
                    {selectedItem.stackable && selectedItem.quantity > 1 ? (
                      <>
                        <input 
                          type="number" 
                          className="w-12 p-1 border border-surface-variant rounded text-sm"
                          value={dropQuantity}
                          min={1}
                          max={selectedItem.quantity}
                          onChange={(e) => setDropQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                        />
                        <button 
                          className="bg-error text-on-error px-3 py-1 rounded text-sm"
                          onClick={handleItemDrop}
                        >
                          Выбросить
                        </button>
                      </>
                    ) : (
                      <button 
                        className="bg-error text-on-error px-3 py-1 rounded text-sm"
                        onClick={handleItemDrop}
                      >
                        Выбросить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="equipment-panel bg-surface p-3 rounded">
              <h3 className="text-lg font-medium mb-2">Экипировка</h3>
              <div className="grid grid-cols-2 gap-2">
                {equipment.map(slot => (
                  <div 
                    key={slot.id}
                    className={`equipment-slot p-2 border border-surface-variant rounded cursor-pointer ${slot.item ? 'bg-surface-variant' : 'bg-surface'}`}
                    onClick={() => slot.item && handleItemUnequip(slot.id)}
                  >
                    <div className="text-xs text-text-secondary">{slot.name}</div>
                    {slot.item ? (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-6 h-6 flex items-center justify-center bg-surface rounded">
                          {slot.item.icon ? (
                            <img src={slot.item.icon} alt={slot.item.name} className="w-4 h-4" />
                          ) : (
                            <div className="text-sm">
                              {slot.type === 'weapon' && '⚔️'}
                              {['head', 'chest', 'legs', 'hands', 'feet'].includes(slot.type) && '🛡️'}
                              {slot.type === 'offhand' && '🛡️'}
                              {slot.type === 'accessory' && '💍'}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium truncate">{slot.item.name}</div>
                      </div>
                    ) : (
                      <div className="text-xs italic text-text-disabled mt-1">Пусто</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryWidget; 