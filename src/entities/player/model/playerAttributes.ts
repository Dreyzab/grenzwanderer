import { createStore, createEvent } from 'effector';

// Основные атрибуты (Primary Attributes)
export interface PrimaryAttributes {
  strength: number;       // STR - Сила (физический урон ближнего боя, переносимый вес)
  agility: number;        // AGI - Ловкость (шанс крита, уклонение, точность)
  intelligence: number;   // INT - Интеллект (магический урон, запас маны)
  technique: number;      // TCH - Техника (эффективность Техно-способностей)
  biopotential: number;   // BIO - Биопотенциал (урон и эффективность Био-способностей)
  ritualKnowledge: number; // RIT - Ритуальное Знание (эффективность Ритуальных способностей)
}

// Вторичные параметры (Secondary Stats)
export interface SecondaryStats {
  health: { current: number; max: number };    // HP - текущее и максимальное здоровье
  stamina: { current: number; max: number };   // Выносливость - ресурс для физических и Техно-способностей
  mana: { current: number; max: number };      // Мана - ресурс для Магических, Ритуальных и Био-способностей
  armor: number;                               // Броня - снижает физический урон
  resistances: {                               // Сопротивления различным типам урона
    physical: number;
    magical: number;
    techno: number;
    bio: number;
    ritual: number;
  };
  critChance: number;                          // Шанс критического удара
  critMultiplier: number;                      // Множитель критического урона
  evasion: number;                             // Шанс уклонения от атаки
  accuracy: number;                            // Противодействует уклонению цели
  attackSpeed: number;                         // Скорость атаки
  castSpeed: number;                           // Скорость применения способностей
  carryWeight: {                               // Переносимый вес
    current: number;
    max: number;
  };
}

// Пять основных классов способностей
export type ClassPath = 'physical' | 'magical' | 'techno' | 'bio' | 'ritual';

// Описание пути развития
export interface ClassPathInfo {
  id: ClassPath;
  name: string;
  description: string;
  primaryAttribute: keyof PrimaryAttributes; // Основной атрибут, связанный с путем
  secondaryAttribute?: keyof PrimaryAttributes; // Дополнительный атрибут (если есть)
  icon: string; // Путь к иконке
}

// Информация о путях развития
export const CLASS_PATHS: Record<ClassPath, ClassPathInfo> = {
  physical: {
    id: 'physical',
    name: 'Путь Физики',
    description: 'Развитие физических способностей, оружейного мастерства и боевых техник.',
    primaryAttribute: 'strength',
    secondaryAttribute: 'agility',
    icon: '/icons/paths/physical.svg'
  },
  magical: {
    id: 'magical',
    name: 'Путь Магии',
    description: 'Изучение мистических искусств, элементальной магии и управления энергией.',
    primaryAttribute: 'intelligence',
    icon: '/icons/paths/magical.svg'
  },
  techno: {
    id: 'techno',
    name: 'Путь Техники',
    description: 'Совершенствование технологического мастерства, инженерии и создания устройств.',
    primaryAttribute: 'technique',
    icon: '/icons/paths/techno.svg'
  },
  bio: {
    id: 'bio',
    name: 'Путь Биопотенциала',
    description: 'Раскрытие биологических возможностей, адаптаций и манипуляций организмом.',
    primaryAttribute: 'biopotential',
    icon: '/icons/paths/bio.svg'
  },
  ritual: {
    id: 'ritual',
    name: 'Путь Ритуального Знания',
    description: 'Постижение древних ритуалов, взаимодействие с духами и альтернативными измерениями.',
    primaryAttribute: 'ritualKnowledge',
    icon: '/icons/paths/ritual.svg'
  }
};

// Уровни игрока
export interface PlayerLevel {
  level: number;
  currentXP: number;
  requiredXP: number;
  availableAttributePoints: number;
  availableSkillPoints: number;
}

// Начальные значения атрибутов
const DEFAULT_PRIMARY_ATTRIBUTES: PrimaryAttributes = {
  strength: 5,
  agility: 5,
  intelligence: 5,
  technique: 5,
  biopotential: 5,
  ritualKnowledge: 5
};

// Формулы для вычисления вторичных параметров
export const STAT_FORMULAS = {
  maxHealth: (attrs: PrimaryAttributes) => 100 + attrs.strength * 10,
  maxStamina: (attrs: PrimaryAttributes) => 100 + (attrs.strength + attrs.agility) * 5,
  maxMana: (attrs: PrimaryAttributes) => 100 + attrs.intelligence * 10,
  physicalResistance: () => 0, // Базовая физическая защита, без бонусов атрибутов
  magicalResistance: (attrs: PrimaryAttributes) => attrs.intelligence * 2,
  technoResistance: (attrs: PrimaryAttributes) => attrs.technique * 2,
  bioResistance: (attrs: PrimaryAttributes) => attrs.biopotential * 2,
  ritualResistance: (attrs: PrimaryAttributes) => attrs.ritualKnowledge * 2,
  critChance: (attrs: PrimaryAttributes) => 5 + attrs.agility * 0.5,
  critMultiplier: (attrs: PrimaryAttributes) => 1.5 + attrs.agility * 0.03,
  evasion: (attrs: PrimaryAttributes) => attrs.agility * 0.5,
  accuracy: (attrs: PrimaryAttributes) => 80 + attrs.agility * 1,
  attackSpeed: (attrs: PrimaryAttributes) => 100 + attrs.agility * 1,
  castSpeed: (attrs: PrimaryAttributes) => 100 + attrs.intelligence * 1,
  maxCarryWeight: (attrs: PrimaryAttributes) => 50 + attrs.strength * 5
};

// Начальные значения вторичных параметров
const calculateSecondaryStats = (primary: PrimaryAttributes): SecondaryStats => {
  return {
    health: {
      current: STAT_FORMULAS.maxHealth(primary),
      max: STAT_FORMULAS.maxHealth(primary)
    },
    stamina: {
      current: STAT_FORMULAS.maxStamina(primary),
      max: STAT_FORMULAS.maxStamina(primary)
    },
    mana: {
      current: STAT_FORMULAS.maxMana(primary),
      max: STAT_FORMULAS.maxMana(primary)
    },
    armor: 0,
    resistances: {
      physical: STAT_FORMULAS.physicalResistance(),
      magical: STAT_FORMULAS.magicalResistance(primary),
      techno: STAT_FORMULAS.technoResistance(primary),
      bio: STAT_FORMULAS.bioResistance(primary),
      ritual: STAT_FORMULAS.ritualResistance(primary)
    },
    critChance: STAT_FORMULAS.critChance(primary),
    critMultiplier: STAT_FORMULAS.critMultiplier(primary),
    evasion: STAT_FORMULAS.evasion(primary),
    accuracy: STAT_FORMULAS.accuracy(primary),
    attackSpeed: STAT_FORMULAS.attackSpeed(primary),
    castSpeed: STAT_FORMULAS.castSpeed(primary),
    carryWeight: {
      current: 0,
      max: STAT_FORMULAS.maxCarryWeight(primary)
    }
  };
};

// Начальное значение уровня
const DEFAULT_PLAYER_LEVEL: PlayerLevel = {
  level: 1,
  currentXP: 0,
  requiredXP: 1000,
  availableAttributePoints: 0,
  availableSkillPoints: 0
};

// События для обновления атрибутов
export const updatePrimaryAttribute = createEvent<{attribute: keyof PrimaryAttributes, value: number}>();
export const updateSecondaryStats = createEvent<Partial<SecondaryStats>>();
export const addExperience = createEvent<number>();
export const levelUp = createEvent();
export const resetAttributes = createEvent();

// Хранилище первичных атрибутов
export const $primaryAttributes = createStore<PrimaryAttributes>(DEFAULT_PRIMARY_ATTRIBUTES)
  .on(updatePrimaryAttribute, (state, {attribute, value}) => ({
    ...state,
    [attribute]: Math.max(1, state[attribute] + value) // Атрибуты не могут быть ниже 1
  }))
  .on(resetAttributes, () => DEFAULT_PRIMARY_ATTRIBUTES);

// Хранилище вторичных параметров
export const $secondaryStats = createStore<SecondaryStats>(calculateSecondaryStats(DEFAULT_PRIMARY_ATTRIBUTES))
  .on(updateSecondaryStats, (state, updates) => ({
    ...state,
    ...updates
  }));

// Обновление вторичных параметров при изменении первичных атрибутов
$primaryAttributes.watch(attributes => {
  updateSecondaryStats(calculateSecondaryStats(attributes));
});

// Хранилище уровня игрока
export const $playerLevel = createStore<PlayerLevel>(DEFAULT_PLAYER_LEVEL)
  .on(addExperience, (state, xp) => {
    const newXP = state.currentXP + xp;
    if (newXP >= state.requiredXP) {
      // Если достигнуто необходимое количество опыта, вызываем событие levelUp
      levelUp();
      return {
        ...state,
        currentXP: newXP - state.requiredXP,
      };
    } else {
      return {
        ...state,
        currentXP: newXP
      };
    }
  })
  .on(levelUp, (state) => ({
    level: state.level + 1,
    currentXP: state.currentXP,
    requiredXP: Math.floor(state.requiredXP * 1.5), // Каждый следующий уровень требует на 50% больше опыта
    availableAttributePoints: state.availableAttributePoints + 2, // При повышении уровня даем 2 очка атрибутов
    availableSkillPoints: state.availableSkillPoints + 1 // При повышении уровня даем 1 очко навыков
  }));

// Селекторы для получения данных
export const selectPlayerAttributes = () => $primaryAttributes.getState();
export const selectSecondaryStats = () => $secondaryStats.getState();
export const selectPlayerLevel = () => $playerLevel.getState();
export const selectAvailableAttributePoints = () => $playerLevel.getState().availableAttributePoints;
export const selectAvailableSkillPoints = () => $playerLevel.getState().availableSkillPoints;

// Хук для использования в компонентах (будет реализован с effector-react)
export const usePlayerAttributes = () => {
  // Будет реализовано с effector-react
  return {
    attributes: selectPlayerAttributes(),
    secondaryStats: selectSecondaryStats(),
    level: selectPlayerLevel(),
    availableAttributePoints: selectAvailableAttributePoints(),
    availableSkillPoints: selectAvailableSkillPoints(),
    updateAttribute: (attribute: keyof PrimaryAttributes, value: number) => 
      updatePrimaryAttribute({ attribute, value }),
    addXP: (amount: number) => addExperience(amount),
    resetAllAttributes: () => resetAttributes()
  };
}; 