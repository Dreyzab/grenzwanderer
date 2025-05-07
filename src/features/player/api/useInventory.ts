import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { usePlayer } from './usePlayer';

export interface InventoryItem {
  _id: Id<"inventories">;
  itemId: string;
  ownerId: string;
  ownerType: 'player' | 'npc' | 'chest' | 'session';
  quantity: number;
  location: 'equipment' | 'backpack' | 'stash';
  equipped: boolean;
  slotType?: string;
}

export interface ItemInfo {
  _id: Id<"items">;
  itemId: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc';
  effects?: any;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image?: string;
  isNew?: boolean;
}

export interface InventoryItemWithDetails extends InventoryItem {
  details: ItemInfo | null;
}

// Добавляем моковые данные, чтобы работать с интерфейсом до реализации метода API
const MOCK_ITEMS: Record<string, ItemInfo> = {
  'item1': {
    _id: 'item1' as unknown as Id<"items">,
    itemId: 'item1',
    name: 'Осколок Звезд',
    type: 'weapon',
    description: 'Древнее оружие, выкованное из осколка упавшей звезды. Обладает мистической энергией.',
    rarity: 'rare',
    image: '/assets/items/starfragment.png',
    isNew: true
  },
  'item2': {
    _id: 'item2' as unknown as Id<"items">,
    itemId: 'item2',
    name: 'Легкий бронежилет',
    type: 'armor',
    description: 'Современный легкий бронежилет, обеспечивающий хорошую защиту без потери подвижности.',
    rarity: 'uncommon',
    image: '/assets/items/lightvest.png',
    isNew: false
  },
  'item3': {
    _id: 'item3' as unknown as Id<"items">,
    itemId: 'item3',
    name: 'Аптечка',
    type: 'consumable',
    description: 'Базовая аптечка с медикаментами для оказания первой помощи. Восстанавливает здоровье.',
    rarity: 'common',
    image: '/assets/items/medkit.png',
    isNew: false
  }
};

export function useInventory() {
  const { player } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Получаем предметы инвентаря для текущего игрока (используем 'skip' если игрок не определен)
  const inventoryItems = useQuery(
    api.inventory.getInventory, 
    player ? { 
      ownerId: player._id as unknown as string, 
      ownerType: "player" 
    } : 'skip'
  );
  
  // Используем моковые данные вместо вызова API, 
  // который нужно будет добавить в convex/inventory.ts
  const [itemDetails, setItemDetails] = useState<ItemInfo[]>([]);
  
  useEffect(() => {
    if (inventoryItems) {
      // Здесь будет вызов API getItemsDetails когда он будет реализован
      // Пока используем моковые данные
      const mockedDetails: ItemInfo[] = [];
      for (const item of inventoryItems) {
        if (MOCK_ITEMS[item.itemId]) {
          mockedDetails.push(MOCK_ITEMS[item.itemId]);
        }
      }
      setItemDetails(mockedDetails);
    }
  }, [inventoryItems]);
  
  // Мутации для управления инвентарем
  const equipItemMutation = useMutation(api.inventory.equipItem);
  const unequipItemMutation = useMutation(api.inventory.unequipItem);
  const useItemMutation = useMutation(api.inventory.useItem);
  const dropItemMutation = useMutation(api.inventory.moveItem);
  
  // Объединяем предметы инвентаря с деталями
  const inventoryWithDetails: InventoryItemWithDetails[] = [];
  
  useEffect(() => {
    if (inventoryItems !== undefined && itemDetails.length > 0) {
      setLoading(false);
    }
  }, [inventoryItems, itemDetails]);
  
  // Если данные загружены, формируем объединенные объекты
  if (inventoryItems && itemDetails) {
    for (const item of inventoryItems) {
      const details = itemDetails.find(detail => detail.itemId === item.itemId) || null;
      // Убеждаемся, что equipped всегда имеет значение
      inventoryWithDetails.push({
        ...item,
        equipped: item.equipped === undefined ? false : item.equipped,
        details
      });
    }
  }
  
  // Функции для управления инвентарем
  const equipItem = async (inventoryItemId: Id<"inventories">, slotType?: string) => {
    if (!player) return;
    try {
      await equipItemMutation({ 
        inventoryItemId, 
        playerId: player._id, 
        slotType 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при экипировке предмета');
    }
  };
  
  const unequipItem = async (inventoryItemId: Id<"inventories">) => {
    if (!player) return;
    try {
      await unequipItemMutation({ 
        inventoryItemId, 
        playerId: player._id 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при снятии предмета');
    }
  };
  
  const useItem = async (inventoryItemId: Id<"inventories">, quantity?: number) => {
    if (!player) return;
    try {
      await useItemMutation({ 
        inventoryItemId, 
        playerId: player._id, 
        quantity 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при использовании предмета');
    }
  };
  
  const dropItem = async (inventoryItemId: Id<"inventories">, quantity?: number) => {
    if (!player) return;
    try {
      // Выбрасываем предмет, перемещая его в сессию
      await dropItemMutation({ 
        inventoryItemId, 
        targetOwnerId: 'session', 
        targetOwnerType: 'session', 
        targetLocation: 'backpack',
        quantity 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при выбрасывании предмета');
    }
  };
  
  // Дополнительные функции для фильтрации и сортировки предметов
  const filterItems = (location: 'equipment' | 'backpack' | 'stash', itemType?: string) => {
    return inventoryWithDetails.filter(item => {
      const matchesLocation = item.location === location;
      const matchesType = !itemType || (item.details && item.details.type === itemType);
      return matchesLocation && matchesType;
    });
  };
  
  const getEquippedItems = () => {
    return inventoryWithDetails.filter(item => item.equipped);
  };
  
  const getBackpackItems = () => {
    return filterItems('backpack');
  };
  
  return {
    inventoryItems: inventoryWithDetails,
    loading,
    error,
    equipItem,
    unequipItem,
    useItem,
    dropItem,
    filterItems,
    getEquippedItems,
    getBackpackItems
  };
} 