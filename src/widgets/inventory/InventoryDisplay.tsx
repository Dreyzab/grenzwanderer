import React, { useState } from 'react';

interface InventoryItem {
  id: string;
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

interface InventoryDisplayProps {
  items: InventoryItem[];
  equipmentSlots: EquipmentSlot[];
  maxCapacity: number;
  currentCapacity: number;
  money: number;
  onItemUse?: (itemId: string) => void;
  onItemEquip?: (itemId: string) => void;
  onItemUnequip?: (slotId: string) => void;
  onItemDrop?: (itemId: string, quantity: number) => void;
}

/**
 * Виджет для отображения инвентаря игрока и экипировки
 */
export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  items,
  equipmentSlots,
  maxCapacity,
  currentCapacity,
  money,
  onItemUse,
  onItemEquip,
  onItemUnequip,
  onItemDrop
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapons' | 'armor' | 'consumables' | 'quest' | 'misc'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dropQuantity, setDropQuantity] = useState(1);
  
  // Фильтрация предметов по типу
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'weapons') return item.type === 'weapon';
    if (activeTab === 'armor') return item.type === 'armor';
    if (activeTab === 'consumables') return item.type === 'consumable';
    if (activeTab === 'quest') return item.type === 'quest';
    if (activeTab === 'misc') return item.type === 'misc';
    return true;
  });
  
  const selectedItem = items.find(item => item.id === selectedItemId);
  
  // Обработчики действий
  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setDropQuantity(1);
  };
  
  const handleItemUse = () => {
    if (selectedItemId && onItemUse) {
      onItemUse(selectedItemId);
    }
  };
  
  const handleItemEquip = () => {
    if (selectedItemId && onItemEquip) {
      onItemEquip(selectedItemId);
    }
  };
  
  const handleItemUnequip = (slotId: string) => {
    if (onItemUnequip) {
      onItemUnequip(slotId);
    }
  };
  
  const handleItemDrop = () => {
    if (selectedItemId && onItemDrop && selectedItem) {
      onItemDrop(selectedItemId, Math.min(dropQuantity, selectedItem.quantity));
    }
  };
  
  return (
    <div className="inventory-display">
      <div className="inventory-header">
        <h2>Инвентарь</h2>
        <div className="inventory-capacity">
          {currentCapacity} / {maxCapacity}
        </div>
        <div className="inventory-money">
          <span className="money-icon">💰</span>
          {money}
        </div>
      </div>
      
      <div className="inventory-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Все
        </button>
        <button 
          className={`tab ${activeTab === 'weapons' ? 'active' : ''}`}
          onClick={() => setActiveTab('weapons')}
        >
          Оружие
        </button>
        <button 
          className={`tab ${activeTab === 'armor' ? 'active' : ''}`}
          onClick={() => setActiveTab('armor')}
        >
          Броня
        </button>
        <button 
          className={`tab ${activeTab === 'consumables' ? 'active' : ''}`}
          onClick={() => setActiveTab('consumables')}
        >
          Расходники
        </button>
        <button 
          className={`tab ${activeTab === 'quest' ? 'active' : ''}`}
          onClick={() => setActiveTab('quest')}
        >
          Квестовые
        </button>
        <button 
          className={`tab ${activeTab === 'misc' ? 'active' : ''}`}
          onClick={() => setActiveTab('misc')}
        >
          Разное
        </button>
      </div>
      
      <div className="inventory-content">
        <div className="inventory-grid">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className={`inventory-item ${item.rarity} ${selectedItemId === item.id ? 'selected' : ''} ${item.equipped ? 'equipped' : ''}`}
              onClick={() => handleItemClick(item.id)}
            >
              {item.icon ? (
                <img src={item.icon} alt={item.name} className="item-icon" />
              ) : (
                <div className="item-icon-placeholder">
                  {item.type === 'weapon' && '⚔️'}
                  {item.type === 'armor' && '🛡️'}
                  {item.type === 'consumable' && '🧪'}
                  {item.type === 'quest' && '📜'}
                  {item.type === 'misc' && '🔮'}
                </div>
              )}
              
              <div className="item-name">{item.name}</div>
              
              {item.stackable && item.quantity > 1 && (
                <div className="item-quantity">{item.quantity}</div>
              )}
              
              {item.equipped && (
                <div className="equipped-indicator">✓</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="equipment-panel">
          <h3>Экипировка</h3>
          <div className="equipment-slots">
            {equipmentSlots.map(slot => (
              <div 
                key={slot.id}
                className={`equipment-slot ${slot.type} ${slot.item ? 'filled' : 'empty'}`}
                onClick={() => slot.item && handleItemUnequip(slot.id)}
              >
                <div className="slot-name">{slot.name}</div>
                {slot.item ? (
                  <div className={`equipped-item ${slot.item.rarity}`}>
                    {slot.item.icon ? (
                      <img src={slot.item.icon} alt={slot.item.name} className="item-icon" />
                    ) : (
                      <div className="item-icon-placeholder">
                        {slot.type === 'weapon' && '⚔️'}
                        {slot.type === 'offhand' && '🛡️'}
                        {['head', 'chest', 'legs', 'hands', 'feet'].includes(slot.type) && '🥋'}
                        {slot.type === 'accessory' && '💍'}
                      </div>
                    )}
                    <div className="item-name">{slot.item.name}</div>
                  </div>
                ) : (
                  <div className="empty-slot-placeholder" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {selectedItem && (
          <div className="item-details">
            <h3>{selectedItem.name}</h3>
            <div className={`item-rarity ${selectedItem.rarity}`}>
              {selectedItem.rarity === 'common' && 'Обычный'}
              {selectedItem.rarity === 'uncommon' && 'Необычный'}
              {selectedItem.rarity === 'rare' && 'Редкий'}
              {selectedItem.rarity === 'epic' && 'Эпический'}
              {selectedItem.rarity === 'legendary' && 'Легендарный'}
            </div>
            
            <p className="item-description">{selectedItem.description}</p>
            
            {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
              <div className="item-stats">
                {Object.entries(selectedItem.stats).map(([stat, value]) => (
                  <div key={stat} className="item-stat">
                    <span className="stat-name">{stat}:</span>
                    <span className={`stat-value ${value > 0 ? 'positive' : value < 0 ? 'negative' : ''}`}>
                      {value > 0 ? `+${value}` : value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="item-actions">
              {['weapon', 'armor'].includes(selectedItem.type) && !selectedItem.equipped && (
                <button onClick={handleItemEquip}>Экипировать</button>
              )}
              
              {selectedItem.type === 'consumable' && (
                <button onClick={handleItemUse}>Использовать</button>
              )}
              
              {!selectedItem.equipped && selectedItem.type !== 'quest' && (
                <>
                  {selectedItem.stackable && selectedItem.quantity > 1 && (
                    <div className="drop-quantity-control">
                      <input
                        type="number"
                        min="1"
                        max={selectedItem.quantity}
                        value={dropQuantity}
                        onChange={(e) => setDropQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                      />
                    </div>
                  )}
                  <button 
                    className="drop-button"
                    onClick={handleItemDrop}
                  >
                    Выбросить
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 