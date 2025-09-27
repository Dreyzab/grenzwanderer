import { InventoryItem, ContainerType } from '../model/types'

export const createTestItems = (): InventoryItem[] => [
  {
    id: 'weapon_ak74',
    templateId: 'ak74',
    name: 'АК-74',
    description: 'Автомат Калашникова 1974 года',
    type: 'weapon',
    rarity: 'common',
    size: { width: 2, height: 1, rotatable: true },
    position: { x: 0, y: 0, rotation: 0 },
    stackSize: 1,
    maxStackSize: 1,
    condition: 85,
    properties: {
      weight: 3.6,
      value: 15000,
      durability: 85,
      maxDurability: 100,
      damage: {
        physical: [35, 45],
        energy: [0, 0],
        critical: 2.0,
        penetration: 35
      }
    },
    metadata: {
      foundDate: new Date('2025-01-15'),
      isQuestItem: false,
      isSecure: false,
      tags: ['weapon', 'assault_rifle']
    }
  },
  {
    id: 'ammo_545x39',
    templateId: '545x39_bp',
    name: '5.45x39 BP',
    description: 'Бронебойные патроны 5.45x39мм',
    type: 'misc',
    rarity: 'common',
    size: { width: 1, height: 1, rotatable: false },
    position: { x: 3, y: 0, rotation: 0 },
    stackSize: 60,
    maxStackSize: 60,
    condition: 100,
    properties: {
      weight: 0.012,
      value: 180
    },
    metadata: {
      foundDate: new Date('2025-01-15'),
      isQuestItem: false,
      isSecure: false,
      tags: ['ammunition', '545x39']
    }
  },
  {
    id: 'armor_6b43',
    templateId: '6b43',
    name: '6Б43',
    description: 'Бронежилет 6Б43',
    type: 'armor',
    rarity: 'uncommon',
    size: { width: 3, height: 2, rotatable: false },
    position: { x: 0, y: 2, rotation: 0 },
    stackSize: 1,
    maxStackSize: 1,
    condition: 92,
    properties: {
      weight: 9.2,
      value: 45000,
      armor: 45
    },
    metadata: {
      foundDate: new Date('2025-01-10'),
      isQuestItem: false,
      isSecure: false,
      tags: ['armor', 'body_armor']
    }
  },
  {
    id: 'medkit_ifak',
    templateId: 'ifak',
    name: 'IFAK',
    description: 'Индивидуальная аптечка первой помощи',
    type: 'medical',
    rarity: 'rare',
    size: { width: 1, height: 2, rotatable: false },
    position: { x: 5, y: 1, rotation: 0 },
    stackSize: 1,
    maxStackSize: 1,
    condition: 100,
    properties: {
      weight: 0.4,
      value: 8500
    },
    metadata: {
      foundDate: new Date('2025-01-12'),
      isQuestItem: false,
      isSecure: true,
      tags: ['medical', 'first_aid']
    }
  },
  {
    id: 'food_mre',
    templateId: 'mre',
    name: 'MRE',
    description: 'Сухой паёк',
    type: 'food',
    rarity: 'common',
    size: { width: 1, height: 1, rotatable: false },
    position: { x: 4, y: 3, rotation: 0 },
    stackSize: 3,
    maxStackSize: 5,
    condition: 100,
    properties: {
      weight: 0.6,
      value: 800
    },
    metadata: {
      foundDate: new Date('2025-01-14'),
      isQuestItem: false,
      isSecure: false,
      tags: ['food', 'rations']
    }
  },
  {
    id: 'key_dorm',
    templateId: 'dorm_key',
    name: 'Ключ от комнаты',
    description: 'Ключ от комнаты в общежитии',
    type: 'key',
    rarity: 'uncommon',
    size: { width: 1, height: 1, rotatable: false },
    position: { x: 6, y: 2, rotation: 0 },
    stackSize: 1,
    maxStackSize: 1,
    condition: 100,
    properties: {
      weight: 0.01,
      value: 25000
    },
    metadata: {
      foundDate: new Date('2025-01-08'),
      isQuestItem: true,
      isSecure: false,
      tags: ['key', 'quest_item']
    }
  }
]

export const createTestContainers = () => ({
  stash: {
    id: 'stash',
    name: 'Основное хранилище',
    type: 'stash' as ContainerType,
    size: { width: 10, height: 8, cells: 80 },
    items: [],
    maxWeight: 50,
    currentWeight: 0,
  },
  backpack: {
    id: 'backpack',
    name: 'Рюкзак',
    type: 'backpack' as ContainerType,
    size: { width: 6, height: 4, cells: 24 },
    items: [],
    maxWeight: 20,
    currentWeight: 0,
  },
  vest: {
    id: 'vest',
    name: 'Разгрузочный жилет',
    type: 'vest' as ContainerType,
    size: { width: 8, height: 2, cells: 16 },
    items: [],
    maxWeight: 15,
    currentWeight: 0,
  },
  pockets: {
    id: 'pockets',
    name: 'Карманы',
    type: 'pockets' as ContainerType,
    size: { width: 2, height: 4, cells: 8 },
    items: [],
    maxWeight: 3,
    currentWeight: 0,
  },
})
