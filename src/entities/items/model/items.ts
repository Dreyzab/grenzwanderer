import { Id } from "../../../../convex/_generated/dataModel";
import { ClassPath } from "../../player/model/playerAttributes";

// Типы редкости предметов
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Типы оружия по категориям урона
export type DamageType = 'cutting' | 'bludgeoning' | 'piercing' | 'fire' | 'electric' | 'poison' | 'magical' | 'ritual' | 'techno' | 'bio';

// Основные категории предметов
export type ItemCategory = 'weapon' | 'armor' | 'artifact' | 'consumable' | 'quest' | 'misc';

// Интерфейс базового предмета
export interface BaseItem {
  _id: Id<"items">; // ID предмета в базе данных
  itemId: string;   // Уникальный идентификатор типа предмета
  name: string;     // Название предмета
  description: string; // Описание предмета
  type: ItemCategory; // Тип предмета
  rarity: ItemRarity; // Редкость предмета
  weight: number;   // Вес предмета
  value: number;    // Стоимость в кредитах
  isNew?: boolean;  // Флаг "новый предмет"
  requirementLevel?: number; // Требуемый уровень персонажа
  requirementAttributes?: Partial<Record<string, number>>; // Требования к атрибутам
  image?: string;   // Путь к изображению предмета
  effects?: any;    // Специальные эффекты предмета
}

// Интерфейс для оружия
export interface Weapon extends BaseItem {
  type: 'weapon';
  weaponClass: ClassPath | 'hybrid'; // Класс оружия (физическое, магическое и т.д.)
  secondaryClass?: ClassPath; // Вторичный класс для гибридного оружия
  damageType: DamageType; // Тип наносимого урона
  damageMin: number; // Минимальный урон
  damageMax: number; // Максимальный урон
  attackSpeed: number; // Скорость атаки
  criticalChance?: number; // Шанс критического удара
  criticalMultiplier?: number; // Множитель критического урона
  special?: { // Специальные свойства оружия
    name: string;
    description: string;
    effectType: string;
    effectValue: number;
    chance?: number;
  }[];
  durability?: { // Прочность, если есть система износа
    current: number;
    max: number;
  };
  range?: 'melee' | 'ranged' | 'both'; // Дальность атаки
}

// Интерфейс для брони
export interface Armor extends BaseItem {
  type: 'armor';
  slotType: 'head' | 'body' | 'hands' | 'legs' | 'feet' | 'accessory'; // Тип слота
  armorValue: number; // Основное значение брони
  armorClass?: ClassPath | 'hybrid'; // Класс брони (как у оружия)
  resistances?: Partial<Record<DamageType, number>>; // Сопротивление различным типам урона
  attributeBonus?: Partial<Record<string, number>>; // Бонусы к атрибутам
  secondaryStatBonus?: Partial<Record<string, number>>; // Бонусы ко вторичным параметрам
  durability?: { // Прочность, если есть система износа
    current: number;
    max: number;
  };
  special?: { // Специальные свойства брони
    name: string;
    description: string;
    effectType: string;
    effectValue: number;
    condition?: string; // Условие активации эффекта
  }[];
}

// Интерфейс для артефактов (третий компонент способностей)
export interface Artifact extends BaseItem {
  type: 'artifact';
  artifactClass: ClassPath; // Класс артефакта
  primaryEffect: { // Основной эффект артефакта
    description: string;
    effectType: string;
    effectValue: number;
    scalesWithAttribute?: string; // С каким атрибутом масштабируется эффект
  };
  secondaryEffects?: { // Дополнительные эффекты
    description: string;
    effectType: string;
    effectValue: number;
    chance?: number;
  }[];
  compatibleWith?: ClassPath[]; // С какими классами оружия хорошо сочетается
  incompatibleWith?: ClassPath[]; // С какими классами оружия плохо сочетается
  cooldown?: number; // Перезарядка, если применимо
}

// Интерфейс для расходуемых предметов
export interface Consumable extends BaseItem {
  type: 'consumable';
  consumableType: 'healing' | 'resource' | 'buff' | 'utility' | 'attack'; // Тип расходника
  uses: number; // Количество использований
  effects: { // Эффекты при использовании
    target: string; // Цель эффекта (HP, стамина, бафф и т.д.)
    effectType: string;
    value: number;
    duration?: number; // Длительность в секундах или ходах
  }[];
  cooldown?: number; // Время перезарядки между использованиями
}

// Интерфейс для квестовых предметов
export interface QuestItem extends BaseItem {
  type: 'quest';
  questId: string; // ID квеста, к которому относится предмет
  objectiveId?: string; // ID цели квеста, если применимо
  isDroppable: boolean; // Можно ли выбросить предмет
  usableIn?: string[]; // ID локаций/NPC, где можно использовать
}

// Интерфейс для прочих предметов
export interface MiscItem extends BaseItem {
  type: 'misc';
  subtype?: string; // Подтип прочего предмета (компонент крафта, валюта и т.д.)
  stackable: boolean; // Можно ли складывать в стак
  maxStackSize?: number; // Максимальный размер стака
}

// Объединенный тип для всех видов предметов
export type Item = Weapon | Armor | Artifact | Consumable | QuestItem | MiscItem;

// Примеры оружия различных типов
export const EXAMPLE_WEAPONS: Weapon[] = [
  // Физическое оружие: Ржавая труба
  {
    _id: "weapon1" as unknown as Id<"items">,
    itemId: "rusted_pipe",
    name: "Ржавая труба",
    description: "Тяжелая металлическая труба, покрытая ржавчиной. Годится разве что для самообороны.",
    type: "weapon",
    rarity: "common",
    weaponClass: "physical",
    damageType: "bludgeoning",
    damageMin: 3,
    damageMax: 6,
    attackSpeed: 0.8,
    weight: 2.5,
    value: 5,
    special: [
      {
        name: "Низкая точность",
        description: "Снижена точность ударов из-за неудобной формы.",
        effectType: "accuracy_penalty",
        effectValue: -10,
      }
    ],
    image: "/assets/items/weapons/rusted_pipe.png"
  },
  
  // Оружие класса Техно: Импульсный пистолет
  {
    _id: "weapon2" as unknown as Id<"items">,
    itemId: "pulse_pistol",
    name: "Импульсный пистолет 'Шокер'",
    description: "Компактное техно-оружие, стреляющее электрическими импульсами. Особенно эффективно против электронных систем и роботов.",
    type: "weapon",
    rarity: "uncommon",
    weaponClass: "techno",
    damageType: "electric",
    damageMin: 5,
    damageMax: 12,
    attackSpeed: 1.2,
    criticalChance: 5,
    criticalMultiplier: 1.5,
    weight: 1.2,
    value: 250,
    requirementLevel: 5,
    requirementAttributes: {
      "technique": 10
    },
    special: [
      {
        name: "Электрошок",
        description: "Шанс парализовать цель на короткое время.",
        effectType: "paralysis",
        effectValue: 1, // 1 секунда или 1 ход
        chance: 20 // 20% шанс
      }
    ],
    range: "ranged",
    image: "/assets/items/weapons/pulse_pistol.png"
  },
  
  // Гибридное оружие: Рунный кинжал
  {
    _id: "weapon3" as unknown as Id<"items">,
    itemId: "runic_dagger",
    name: "Рунный кинжал",
    description: "Острый кинжал с выгравированными на лезвии таинственными рунами, мерцающими синим светом.",
    type: "weapon",
    rarity: "uncommon",
    weaponClass: "hybrid",
    secondaryClass: "magical",
    damageType: "piercing", // Базовый тип урона - проникающий
    damageMin: 4,
    damageMax: 8,
    attackSpeed: 1.5,
    criticalChance: 10,
    criticalMultiplier: 1.8,
    weight: 0.8,
    value: 320,
    requirementLevel: 7,
    requirementAttributes: {
      "agility": 8,
      "intelligence": 6
    },
    special: [
      {
        name: "Накопление заряда",
        description: "Каждая успешная атака дает 1 заряд. При 3 зарядах следующая способность класса Магия или Ритуал кастуется мгновенно.",
        effectType: "charge_accumulation",
        effectValue: 1
      }
    ],
    range: "melee",
    image: "/assets/items/weapons/runic_dagger.png"
  }
];

// Примеры брони различных типов
export const EXAMPLE_ARMORS: Armor[] = [
  // Обычная броня: Поношенная кожаная куртка
  {
    _id: "armor1" as unknown as Id<"items">,
    itemId: "worn_leather_jacket",
    name: "Поношенная кожаная куртка",
    description: "Старая кожаная куртка, видавшая лучшие дни. Предоставляет минимальную защиту.",
    type: "armor",
    slotType: "body",
    armorValue: 10,
    rarity: "common",
    weight: 3.0,
    value: 50,
    image: "/assets/items/armors/worn_leather_jacket.png"
  },
  
  // Продвинутая броня: Тяжелый бронежилет
  {
    _id: "armor2" as unknown as Id<"items">,
    itemId: "cerberus_heavy_vest",
    name: "Тяжелый бронежилет 'Цербер'",
    description: "Тактический бронежилет с композитными пластинами. Обеспечивает высокую защиту от физического урона ценой подвижности.",
    type: "armor",
    slotType: "body",
    armorClass: "physical",
    armorValue: 35,
    resistances: {
      "cutting": 30,
      "bludgeoning": 25,
      "piercing": 35,
      "fire": 15
    },
    rarity: "rare",
    weight: 8.5,
    value: 850,
    requirementLevel: 12,
    requirementAttributes: {
      "strength": 12
    },
    attributeBonus: {
      "strength": 1
    },
    secondaryStatBonus: {
      "evasion": -15, // Снижает уклонение
    },
    special: [
      {
        name: "Взрывоустойчивость",
        description: "Снижает урон от взрывов на 20%.",
        effectType: "explosion_resistance",
        effectValue: 20
      }
    ],
    image: "/assets/items/armors/cerberus_vest.png"
  }
];

// Примеры артефактов для создания способностей
export const EXAMPLE_ARTIFACTS: Artifact[] = [
  // Артефакт огня
  {
    _id: "artifact1" as unknown as Id<"items">,
    itemId: "eternal_flame_shard",
    name: "Осколок Вечного Пламени",
    description: "Светящийся кристалл, излучающий постоянное тепло. При активации превращается в бушующее пламя.",
    type: "artifact",
    artifactClass: "magical",
    rarity: "rare",
    primaryEffect: {
      description: "Придает способностям дополнительный огненный урон",
      effectType: "add_damage_type",
      effectValue: 15, // Добавляет 15% от основного урона как огненный
      scalesWithAttribute: "intelligence"
    },
    secondaryEffects: [
      {
        description: "Шанс поджечь цель",
        effectType: "apply_dot",
        effectValue: 5, // 5 урона за тик
        chance: 15 // 15% шанс
      }
    ],
    compatibleWith: ["magical", "ritual"],
    incompatibleWith: ["techno"],
    weight: 0.5,
    value: 750,
    requirementLevel: 10,
    image: "/assets/items/artifacts/eternal_flame.png"
  },
  
  // Техно-артефакт
  {
    _id: "artifact2" as unknown as Id<"items">,
    itemId: "neural_amplifier",
    name: "Нейросетевой Усилитель",
    description: "Компактное устройство с нейроинтерфейсом, повышающее точность и эффективность действий.",
    type: "artifact",
    artifactClass: "techno",
    rarity: "uncommon",
    primaryEffect: {
      description: "Увеличивает точность и шанс критического удара",
      effectType: "accuracy_crit_boost",
      effectValue: 10, // +10% к точности и крит.шансу
      scalesWithAttribute: "technique"
    },
    secondaryEffects: [
      {
        description: "Помечает цель, делая ее уязвимой для следующей атаки союзника",
        effectType: "target_marking",
        effectValue: 15, // +15% к урону по помеченной цели
        chance: 35 // 35% шанс
      }
    ],
    compatibleWith: ["techno", "physical"],
    cooldown: 30, // 30 секунд перезарядки
    weight: 0.3,
    value: 420,
    requirementLevel: 8,
    requirementAttributes: {
      "technique": 12
    },
    image: "/assets/items/artifacts/neural_amplifier.png"
  }
];

// Примеры расходников
export const EXAMPLE_CONSUMABLES: Consumable[] = [
  // Лечебная аптечка
  {
    _id: "consumable1" as unknown as Id<"items">,
    itemId: "standard_medkit",
    name: "Стандартная аптечка",
    description: "Базовый набор медикаментов для оказания первой помощи. Содержит антисептики, бинты и обезболивающие.",
    type: "consumable",
    consumableType: "healing",
    rarity: "common",
    uses: 1,
    effects: [
      {
        target: "health",
        effectType: "restore_percentage",
        value: 30 // Восстанавливает 30% здоровья
      }
    ],
    cooldown: 60, // Секунд между использованиями
    weight: 0.5,
    value: 100,
    image: "/assets/items/consumables/medkit.png"
  },
  
  // Стимулятор
  {
    _id: "consumable2" as unknown as Id<"items">,
    itemId: "berserker_stim",
    name: "Стимулятор 'Берсерк'",
    description: "Мощный химический стимулятор, повышающий физические возможности и агрессию, но снижающий защитные функции организма.",
    type: "consumable",
    consumableType: "buff",
    rarity: "uncommon",
    uses: 1,
    effects: [
      {
        target: "physical_damage",
        effectType: "percentage_boost",
        value: 20, // +20% к физическому урону
        duration: 180 // 3 минуты
      },
      {
        target: "armor",
        effectType: "percentage_reduction",
        value: 15, // -15% к броне
        duration: 180 // 3 минуты
      }
    ],
    cooldown: 300, // 5 минут между использованиями
    weight: 0.2,
    value: 250,
    image: "/assets/items/consumables/berserker_stim.png"
  }
];

// Функция для проверки, соответствует ли игрок требованиям предмета
export function playerMeetsRequirements(
  item: Item, 
  playerLevel: number, 
  playerAttributes: Record<string, number>
): boolean {
  // Проверка требуемого уровня
  if (item.requirementLevel && playerLevel < item.requirementLevel) {
    return false;
  }
  
  // Проверка требуемых атрибутов
  if (item.requirementAttributes) {
    for (const [attr, value] of Object.entries(item.requirementAttributes)) {
      if (!playerAttributes[attr] || playerAttributes[attr] < (value ?? 0)) {
        return false;
      }
    }
  }
  
  return true;
}

// Функция для получения цвета редкости предмета (для стилизации)
export function getRarityColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common': return '#b0b0b0'; // Серый
    case 'uncommon': return '#2ecc71'; // Зеленый
    case 'rare': return '#3498db'; // Синий
    case 'epic': return '#9b59b6'; // Фиолетовый
    case 'legendary': return '#f39c12'; // Оранжевый
    default: return '#b0b0b0';
  }
}

// Функция для получения названия редкости на русском
export function getRarityName(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common': return 'Обычный';
    case 'uncommon': return 'Необычный';
    case 'rare': return 'Редкий';
    case 'epic': return 'Эпический';
    case 'legendary': return 'Легендарный';
    default: return 'Обычный';
  }
} 