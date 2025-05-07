import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { InventoryDisplay } from '@/widgets/InventoryDisplay';
import { ItemGrid } from '@/widgets/InventoryDisplay/ItemGrid';
import { EquipmentSlots } from '@/widgets/InventoryDisplay/EquipmentSlots';
import { ItemInfoCard } from '@/widgets/InventoryDisplay/ItemInfoCard';
import { QuickAccessBar } from '@/widgets/InventoryDisplay/QuickAccessBar';
import styles from './InventoryPage.module.css';

// Типы для сортировки предметов
type SortOption = 'newest' | 'rarity' | 'type' | 'name';
type FilterOption = 'all' | 'weapons' | 'armor' | 'consumables' | 'quest';

export const InventoryPage: React.FC = () => {
  // Состояние для отслеживания выбранного предмета
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Состояние для сортировки и фильтрации
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  
  // Обработчики событий
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
  };
  
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };
  
  const handleFilterChange = (option: FilterOption) => {
    setFilterOption(option);
  };
  
  const handleEquipItem = (itemId: string, slotId: string) => {
    console.log(`Экипирован предмет ${itemId} в слот ${slotId}`);
    // Здесь будет вызов соответствующего API
  };
  
  const handleUnequipItem = (slotId: string) => {
    console.log(`Снят предмет из слота ${slotId}`);
    // Здесь будет вызов соответствующего API
  };
  
  const handleUseItem = (itemId: string) => {
    console.log(`Использован предмет ${itemId}`);
    // Здесь будет вызов соответствующего API
  };
  
  const handleDropItem = (itemId: string) => {
    console.log(`Выброшен предмет ${itemId}`);
    // Здесь будет вызов соответствующего API
  };
  
  const handleQuickSlotAssign = (itemId: string, slotIndex: number) => {
    console.log(`Предмет ${itemId} назначен на быстрый слот ${slotIndex}`);
    // Здесь будет вызов соответствующего API
  };

  return (
    <PageLayout>
      <div className={styles.inventoryPage}>
        <header className={styles.inventoryHeader}>
          <h1>Инвентарь</h1>
          <div className={styles.controlsPanel}>
            <div className={styles.filterControl}>
              <label>Фильтр:</label>
              <select 
                value={filterOption}
                onChange={(e) => handleFilterChange(e.target.value as FilterOption)}
                className={styles.selectControl}
              >
                <option value="all">Все предметы</option>
                <option value="weapons">Оружие</option>
                <option value="armor">Броня</option>
                <option value="consumables">Расходники</option>
                <option value="quest">Квестовые</option>
              </select>
            </div>
            
            <div className={styles.sortControl}>
              <label>Сортировка:</label>
              <select 
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className={styles.selectControl}
              >
                <option value="newest">По новизне</option>
                <option value="rarity">По редкости</option>
                <option value="type">По типу</option>
                <option value="name">По названию</option>
              </select>
            </div>
          </div>
        </header>
        
        <div className={styles.inventoryContent}>
          <div className={styles.equipmentSection}>
            <h2>Экипировка</h2>
            <EquipmentSlots 
              onEquip={handleEquipItem}
              onUnequip={handleUnequipItem}
            />
          </div>
          
          <div className={styles.inventoryMainSection}>
            <div className={styles.itemsSection}>
              <h2>Предметы</h2>
              <div className={styles.itemsContainer}>
                <ItemGrid 
                  selectedItemId={selectedItemId}
                  onItemSelect={handleItemSelect}
                  sortOption={sortOption}
                  filterOption={filterOption}
                />
              </div>
            </div>
            
            <div className={styles.itemDetailsSection}>
              {selectedItemId ? (
                <ItemInfoCard 
                  itemId={selectedItemId}
                  onUse={handleUseItem}
                  onDrop={handleDropItem}
                  onEquip={handleEquipItem}
                />
              ) : (
                <div className={styles.emptySelection}>
                  <p>Выберите предмет для просмотра деталей</p>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.quickAccessSection}>
            <h2>Быстрый доступ</h2>
            <QuickAccessBar 
              onAssignSlot={handleQuickSlotAssign}
              onUseItem={handleUseItem}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}; 