import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { ItemGrid } from '@/widgets/inventory/InventoryDisplay/ItemGrid';
import { EquipmentSlots } from '@/widgets/inventory/InventoryDisplay/EquipmentSlots';
import { ItemInfoCard } from '@/widgets/inventory/InventoryDisplay/ItemInfoCard';
import { QuickAccessBar } from '@/widgets/inventory/InventoryDisplay/QuickAccessBar';
import { useInventory } from '@/features/player/api/useInventory';
import { Id } from '../../../../convex/_generated/dataModel';

// Типы для сортировки предметов
type SortOption = 'newest' | 'rarity' | 'type' | 'name';
type FilterOption = 'all' | 'weapons' | 'armor' | 'consumables' | 'quest';

export const InventoryPage: React.FC = () => {
  // Состояние для отслеживания выбранного предмета
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Состояние для сортировки и фильтрации
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  
  // Используем наш хук для работы с инвентарем
  const { 
    equipItem, 
    unequipItem, 
    useItem, 
    dropItem, 
    loading, 
    error 
  } = useInventory();
  
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
    equipItem(itemId as Id<"inventories">, slotId);
  };
  
  const handleUnequipItem = (slotId: string) => {
    console.log(`Снят предмет из слота ${slotId}`);
    // В нашей реализации нам нужно знать ID предмета для снятия
    // Это можно добавить позже, когда компонент EquipmentSlots сможет передавать itemId
  };
  
  const handleUseItem = (itemId: string) => {
    console.log(`Использован предмет ${itemId}`);
    useItem(itemId as Id<"inventories">);
  };
  
  const handleDropItem = (itemId: string) => {
    console.log(`Выброшен предмет ${itemId}`);
    dropItem(itemId as Id<"inventories">);
  };
  
  const handleQuickSlotAssign = (itemId: string, slotIndex: number) => {
    console.log(`Предмет ${itemId} назначен на быстрый слот ${slotIndex}`);
    // Здесь будет реализация назначения предмета на быстрый слот
    // Это может быть реализовано как специальный эффект предмета в базе данных
  };

  // Рендерим загрузчик при загрузке данных
  if (loading) {
    return (
      <PageLayout
        content={
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-text-secondary">Загрузка инвентаря...</p>
          </div>
        }
      />
    );
  }

  // Рендерим ошибку, если она возникла
  if (error) {
    return (
      <PageLayout
        content={
          <div className="flex flex-col items-center justify-center p-8 bg-error-container rounded-lg">
            <p className="text-on-error-container mb-4">Ошибка загрузки инвентаря: {error}</p>
            <button 
              className="bg-primary text-on-primary px-4 py-2 rounded" 
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </button>
          </div>
        }
      />
    );
  }

  // Заголовок страницы
  const pageHeader = (
    <>
      <h1 className="text-2xl font-heading text-center">Инвентарь</h1>
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Фильтр:</label>
          <select 
            value={filterOption}
            onChange={(e) => handleFilterChange(e.target.value as FilterOption)}
            className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded border border-outline"
          >
            <option value="all">Все предметы</option>
            <option value="weapons">Оружие</option>
            <option value="armor">Броня</option>
            <option value="consumables">Расходники</option>
            <option value="quest">Квестовые</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm">Сортировка:</label>
          <select 
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded border border-outline"
          >
            <option value="newest">По новизне</option>
            <option value="rarity">По редкости</option>
            <option value="type">По типу</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>
    </>
  );

  // Основной контент страницы
  const pageContent = (
    <div className="flex flex-col gap-6">
      {/* Секция экипировки */}
      <div className="bg-surface p-4 rounded-lg shadow">
        <h2 className="text-lg font-heading mb-4">Экипировка</h2>
        <EquipmentSlots 
          onEquip={handleEquipItem}
          onUnequip={handleUnequipItem}
          onItemSelect={handleItemSelect}
        />
      </div>
      
      {/* Основная секция инвентаря */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Список предметов */}
        <div className="bg-surface p-4 rounded-lg shadow flex-1">
          <h2 className="text-lg font-heading mb-4">Предметы</h2>
          <ItemGrid 
            selectedItemId={selectedItemId}
            onItemSelect={handleItemSelect}
            sortOption={sortOption}
            filterOption={filterOption}
          />
        </div>
        
        {/* Детали предмета */}
        <div className="bg-surface p-4 rounded-lg shadow w-full lg:w-80">
          <h2 className="text-lg font-heading mb-4">Детали предмета</h2>
          {selectedItemId ? (
            <ItemInfoCard 
              itemId={selectedItemId}
              onUse={handleUseItem}
              onDrop={handleDropItem}
              onEquip={handleEquipItem}
            />
          ) : (
            <div className="text-center text-text-secondary p-4">
              <p>Выберите предмет для просмотра деталей</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Секция быстрого доступа */}
      <div className="bg-surface p-4 rounded-lg shadow">
        <h2 className="text-lg font-heading mb-4">Быстрый доступ</h2>
        <QuickAccessBar 
          onAssignSlot={handleQuickSlotAssign}
          onUseItem={handleUseItem}
          onItemSelect={handleItemSelect}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      header={pageHeader}
      content={pageContent}
    />
  );
}; 