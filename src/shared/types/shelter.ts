/**
 * Типы, связанные с убежищем игрока и системой крафта
 */

// Типы убежищ
export enum ShelterType {
  BASIC = 'basic',            // базовое убежище
  UPGRADED = 'upgraded',      // улучшенное убежище
  FORTIFIED = 'fortified',    // укрепленное убежище
  ADVANCED = 'advanced',      // продвинутое убежище
  AUTOMATED = 'automated'     // автоматизированное убежище
}

// Зоны убежища
export enum ShelterArea {
  LIVING = 'living',          // жилая зона
  CRAFTING = 'crafting',      // зона крафта
  STORAGE = 'storage',        // склад
  MEDICAL = 'medical',        // медицинская зона
  RESEARCH = 'research',      // исследовательская зона
  DEFENSE = 'defense',        // защитные сооружения
  GARDEN = 'garden'           // сад/ферма
}

// Станции для крафта
export enum CraftingStation {
  WORKBENCH = 'workbench',            // верстак
  CHEMISTRY_SET = 'chemistrySet',     // набор для химии
  COOKING_STATION = 'cookingStation', // кухня
  ELECTRONICS = 'electronics',        // электронная станция
  WEAPONS_BENCH = 'weaponsBench',     // оружейный стол
  MEDICAL_BENCH = 'medicalBench',     // медицинский стол
  RECYCLER = 'recycler'               // переработчик
}

// Улучшения для убежища
export interface ShelterUpgrade {
  id: string;
  name: string;
  description: string;
  area: ShelterArea;
  level: number;
  requirements: {
    items: Array<{ itemId: string; quantity: number }>;
    skills?: Array<{ skillId: string; level: number }>;
  };
  effects: Array<{
    type: 'storage' | 'crafting' | 'production' | 'defense' | 'comfort';
    value: number;
  }>;
  installed: boolean;
  installationTime: number; // время установки в секундах
}

// Рецепт для крафта
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'medical' | 'food' | 'tool' | 'electronics' | 'misc';
  requiredStation: CraftingStation;
  ingredients: Array<{ itemId: string; quantity: number }>;
  result: { itemId: string; quantity: number };
  craftingTime: number; // время крафта в секундах
  skillRequirements?: Array<{ skillId: string; level: number }>;
  unlocked: boolean;
  discoverable: boolean;
}

// Данные убежища игрока
export interface PlayerShelter {
  id: string;
  playerId: string;
  type: ShelterType;
  location: {
    lat: number;
    lng: number;
  };
  name: string;
  areas: ShelterArea[];
  upgrades: ShelterUpgrade[];
  craftingStations: CraftingStation[];
  storage: {
    capacity: number;
    used: number;
  };
  energy: {
    capacity: number;
    current: number;
    production: number;
    consumption: number;
  };
  defense: number;
  lastVisited: number;
}

// Производственные процессы в убежище
export interface ShelterProduction {
  id: string;
  shelterId: string;
  recipeId: string;
  startTime: number;
  endTime: number;
  completed: boolean;
  claimed: boolean;
} 