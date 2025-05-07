import { createStore, createEvent } from 'effector';
import { ClassPath, CLASS_PATHS } from './playerAttributes';

// Интерфейс для отдельного навыка в пути развития
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  level: number; // Уровень в дереве навыков (1, 2, 3 и т.д.)
  path: ClassPath;
  cost: number; // Стоимость в очках навыков
  effects: SkillEffect[];
  prerequisites: string[]; // ID родительских навыков, которые должны быть разблокированы
  isCapstone: boolean; // Является ли навык вершиной пути (капстоуном)
  icon?: string; // Путь к иконке навыка
}

// Интерфейс для эффекта навыка
export interface SkillEffect {
  type: EffectType;
  target: string;
  value: number;
  description: string;
}

// Типы эффектов, которые могут давать навыки
export type EffectType = 
  | 'damage_increase' 
  | 'damage_reduction'
  | 'cooldown_reduction'
  | 'resource_cost_reduction'
  | 'attribute_bonus'
  | 'resistance_bonus'
  | 'critical_chance_bonus'
  | 'critical_damage_bonus'
  | 'healing_bonus'
  | 'resource_regeneration_bonus'
  | 'effect_duration_bonus'
  | 'special'; // Для особых эффектов, которые не попадают в стандартные категории

// Интерфейс для прогресса в пути развития
export interface PathProgress {
  path: ClassPath;
  level: number; // Общий уровень продвижения по пути
  experience: number; // Текущий опыт в пути
  experienceToNextLevel: number; // Опыт, необходимый для следующего уровня в пути
  unlockedNodes: string[]; // ID разблокированных навыков
  activeNodes: string[]; // ID активных навыков
}

// Определение структуры данных для хранения прогресса по всем путям
export interface PlayerSkillsState {
  paths: Record<ClassPath, PathProgress>;
  availableSkillPoints: number; // Доступные очки навыков для распределения
  spentSkillPoints: Record<ClassPath, number>; // Потраченные очки по каждому пути
}

// Определение путей развития и их базовые данные
export const DEVELOPMENT_PATHS = CLASS_PATHS;

// Константы для расчета опыта и уровней путей
export const SKILL_PATH_XP_MULTIPLIER = 1.5; // Множитель для следующего уровня пути
export const SKILL_PATH_BASE_XP = 1000; // Базовый опыт для первого уровня пути

// Вычисление опыта, необходимого для уровня пути
export function calculateXpForPathLevel(level: number): number {
  return Math.floor(SKILL_PATH_BASE_XP * Math.pow(SKILL_PATH_XP_MULTIPLIER, level - 1));
}

// Примеры навыков для всех путей
export const ALL_SKILL_NODES: SkillNode[] = [
  // Путь Физики (Physical)
  {
    id: 'phys_weapon_mastery',
    name: 'Мастерство оружия',
    description: 'Увеличивает физический урон от оружия на 5%.',
    level: 1,
    path: 'physical',
    cost: 1,
    effects: [
      { 
        type: 'damage_increase', 
        target: 'physical_weapons', 
        value: 5, 
        description: '+5% к урону от физического оружия' 
      }
    ],
    prerequisites: [],
    isCapstone: false,
    icon: '/icons/skills/weapon_mastery.svg'
  },
  {
    id: 'phys_endurance',
    name: 'Выносливость',
    description: 'Увеличивает максимальный запас выносливости на 10%.',
    level: 1,
    path: 'physical',
    cost: 1,
    effects: [
      { 
        type: 'special', 
        target: 'max_stamina', 
        value: 10, 
        description: '+10% к максимальной выносливости' 
      }
    ],
    prerequisites: [],
    isCapstone: false,
    icon: '/icons/skills/endurance.svg'
  },
  {
    id: 'phys_combat_reflexes',
    name: 'Боевые рефлексы',
    description: 'Увеличивает шанс уклонения на 3% и точность на 5%.',
    level: 2,
    path: 'physical',
    cost: 2,
    effects: [
      { 
        type: 'special', 
        target: 'evasion', 
        value: 3, 
        description: '+3% к шансу уклонения' 
      },
      { 
        type: 'special', 
        target: 'accuracy', 
        value: 5, 
        description: '+5% к точности' 
      }
    ],
    prerequisites: ['phys_weapon_mastery'],
    isCapstone: false,
    icon: '/icons/skills/combat_reflexes.svg'
  },
  {
    id: 'phys_critical_strike',
    name: 'Критический удар',
    description: 'Увеличивает шанс критического удара на 3% и урон от критических ударов на 10%.',
    level: 2,
    path: 'physical',
    cost: 2,
    effects: [
      { 
        type: 'critical_chance_bonus', 
        target: 'all', 
        value: 3, 
        description: '+3% к шансу критического удара' 
      },
      { 
        type: 'critical_damage_bonus', 
        target: 'all', 
        value: 10, 
        description: '+10% к урону от критических ударов' 
      }
    ],
    prerequisites: ['phys_endurance'],
    isCapstone: false,
    icon: '/icons/skills/critical_strike.svg'
  },
  {
    id: 'phys_weapons_specialist',
    name: 'Специалист по оружию',
    description: 'Позволяет эффективнее комбинировать физическое оружие с другими классами артефактов.',
    level: 3,
    path: 'physical',
    cost: 3,
    effects: [
      { 
        type: 'special', 
        target: 'cross_class_combo', 
        value: 15, 
        description: '+15% эффективность при комбинировании физического оружия с артефактами других классов' 
      }
    ],
    prerequisites: ['phys_combat_reflexes', 'phys_critical_strike'],
    isCapstone: false,
    icon: '/icons/skills/weapons_specialist.svg'
  },
  {
    id: 'phys_capstone_berserker',
    name: 'Берсерк',
    description: 'Когда ваше здоровье падает ниже 30%, вы получаете +25% к физическому урону и +15% к скорости атаки на 3 хода.',
    level: 4,
    path: 'physical',
    cost: 5,
    effects: [
      { 
        type: 'special', 
        target: 'berserker_rage', 
        value: 1, 
        description: 'Активирует ярость берсерка при низком здоровье' 
      }
    ],
    prerequisites: ['phys_weapons_specialist'],
    isCapstone: true,
    icon: '/icons/skills/berserker.svg'
  },

  // Путь Магии (Magical)
  {
    id: 'mag_arcane_focus',
    name: 'Арканический фокус',
    description: 'Увеличивает урон от магических способностей на 5%.',
    level: 1,
    path: 'magical',
    cost: 1,
    effects: [
      { 
        type: 'damage_increase', 
        target: 'magical_abilities', 
        value: 5, 
        description: '+5% к урону от магических способностей' 
      }
    ],
    prerequisites: [],
    isCapstone: false,
    icon: '/icons/skills/arcane_focus.svg'
  },
  // Другие навыки для пути магии...
  
  // Путь Техники (Techno)
  {
    id: 'tech_weaponsmith',
    name: 'Оружейник',
    description: 'Увеличивает урон от техно-оружия на 5%.',
    level: 1,
    path: 'techno',
    cost: 1,
    effects: [
      { 
        type: 'damage_increase', 
        target: 'techno_weapons', 
        value: 5, 
        description: '+5% к урону техно-оружия' 
      }
    ],
    prerequisites: [],
    isCapstone: false,
    icon: '/icons/skills/weaponsmith.svg'
  },
  {
    id: 'tech_efficient_cooling',
    name: 'Эффективное Охлаждение',
    description: 'Скорость снижения Перегрева увеличена на 10%.',
    level: 1,
    path: 'techno',
    cost: 1,
    effects: [
      { 
        type: 'cooldown_reduction', 
        target: 'techno_abilities', 
        value: 10, 
        description: '+10% к скорости снижения Перегрева' 
      }
    ],
    prerequisites: [],
    isCapstone: false,
    icon: '/icons/skills/efficient_cooling.svg'
  },
  {
    id: 'tech_engineering_eye',
    name: 'Инженерный Взгляд',
    description: 'Увеличивает шанс найти дополнительные детали при разборе Техно-предметов на 10%.',
    level: 1,
    path: 'techno',
    cost: 1,
    effects: [
      { 
        type: 'special', 
        target: 'scrap_bonus', 
        value: 10, 
        description: '+10% к шансу получить дополнительные компоненты при разборке' 
      }
    ],
    prerequisites: [],
    isCapstone: false,
    icon: '/icons/skills/engineering_eye.svg'
  },
  {
    id: 'tech_turret_specialist',
    name: 'Специалист по Турелям',
    description: 'Увеличивает здоровье и урон призываемых турелей на 15%.',
    level: 2,
    path: 'techno',
    cost: 2,
    effects: [
      { 
        type: 'special', 
        target: 'turret_health', 
        value: 15, 
        description: '+15% к здоровью турелей' 
      },
      { 
        type: 'damage_increase', 
        target: 'turret_damage', 
        value: 15, 
        description: '+15% к урону турелей' 
      }
    ],
    prerequisites: ['tech_weaponsmith'],
    isCapstone: false,
    icon: '/icons/skills/turret_specialist.svg'
  },
  {
    id: 'tech_hack_master',
    name: 'Мастер Взлома',
    description: 'Снижает сложность мини-игр взлома, открывает новые опции взаимодействия с Техно-объектами.',
    level: 2,
    path: 'techno',
    cost: 2,
    effects: [
      { 
        type: 'special', 
        target: 'hacking_difficulty', 
        value: -25, 
        description: '-25% к сложности взлома' 
      }
    ],
    prerequisites: ['tech_engineering_eye'],
    isCapstone: false,
    icon: '/icons/skills/hack_master.svg'
  },
  {
    id: 'tech_enhanced_ammo',
    name: 'Усиленные Боеприпасы',
    description: 'Добавляет 5% шанс, что Техно-атаки наложат эффект "Пробитие брони".',
    level: 2,
    path: 'techno',
    cost: 2,
    effects: [
      { 
        type: 'special', 
        target: 'armor_penetration_chance', 
        value: 5, 
        description: '5% шанс пробить броню противника' 
      }
    ],
    prerequisites: ['tech_efficient_cooling'],
    isCapstone: false,
    icon: '/icons/skills/enhanced_ammo.svg'
  },
  {
    id: 'tech_experimental_mods',
    name: 'Экспериментальные Модификации',
    description: 'Позволяет комбинировать Техно-артефакты с оружием других классов с меньшими штрафами.',
    level: 3,
    path: 'techno',
    cost: 3,
    effects: [
      { 
        type: 'special', 
        target: 'cross_class_penalty', 
        value: -30, 
        description: '-30% к штрафам при комбинировании Техно с другими классами' 
      }
    ],
    prerequisites: ['tech_turret_specialist', 'tech_hack_master'],
    isCapstone: false,
    icon: '/icons/skills/experimental_mods.svg'
  },
  {
    id: 'tech_emergency_protocol',
    name: 'Экстренный Протокол',
    description: 'При падении HP ниже 30%, следующая Техно-способность не генерирует Перегрев.',
    level: 3,
    path: 'techno',
    cost: 3,
    effects: [
      { 
        type: 'special', 
        target: 'emergency_cooldown', 
        value: 100, 
        description: '100% шанс избежать Перегрева при HP < 30%' 
      }
    ],
    prerequisites: ['tech_enhanced_ammo'],
    isCapstone: false,
    icon: '/icons/skills/emergency_protocol.svg'
  },
  {
    id: 'tech_capstone_cybernetic_fusion',
    name: 'Кибернетическое Слияние',
    description: 'Ваш организм сливается с технологией, повышая эффективность всех Техно-способностей на 25% и снижая их стоимость на 15%.',
    level: 4,
    path: 'techno',
    cost: 5,
    effects: [
      { 
        type: 'damage_increase', 
        target: 'techno_abilities', 
        value: 25, 
        description: '+25% к эффективности всех Техно-способностей' 
      },
      { 
        type: 'resource_cost_reduction', 
        target: 'techno_abilities', 
        value: 15, 
        description: '-15% к стоимости использования Техно-способностей' 
      }
    ],
    prerequisites: ['tech_experimental_mods', 'tech_emergency_protocol'],
    isCapstone: true,
    icon: '/icons/skills/cybernetic_fusion.svg'
  },
  
  // Аналогично добавляются навыки для путей Bio и Ritual...
];

// События для управления навыками
export const unlockSkill = createEvent<string>(); // ID навыка для разблокировки
export const addSkillPathExperience = createEvent<{ path: ClassPath, amount: number }>();
export const skillPathLevelUp = createEvent<ClassPath>();
export const resetSkillPath = createEvent<ClassPath>();
export const resetAllSkillPaths = createEvent();
export const setAvailableSkillPoints = createEvent<number>();

// Создание начального состояния для путей навыков
const createInitialPathProgress = (): Record<ClassPath, PathProgress> => {
  const paths: Partial<Record<ClassPath, PathProgress>> = {};
  
  Object.keys(DEVELOPMENT_PATHS).forEach((pathKey) => {
    const path = pathKey as ClassPath;
    paths[path] = {
      path,
      level: 0,
      experience: 0,
      experienceToNextLevel: calculateXpForPathLevel(1),
      unlockedNodes: [],
      activeNodes: []
    };
  });
  
  return paths as Record<ClassPath, PathProgress>;
};

// Начальное состояние для всех навыков игрока
const initialSkillsState: PlayerSkillsState = {
  paths: createInitialPathProgress(),
  availableSkillPoints: 0,
  spentSkillPoints: {
    physical: 0,
    magical: 0,
    techno: 0,
    bio: 0,
    ritual: 0
  }
};

// Хранилище навыков игрока
export const $playerSkills = createStore<PlayerSkillsState>(initialSkillsState)
  // Разблокировка навыка
  .on(unlockSkill, (state, skillId) => {
    const skill = ALL_SKILL_NODES.find(node => node.id === skillId);
    if (!skill) return state;
    
    const path = skill.path;
    const pathProgress = state.paths[path];
    
    // Если уже разблокирован или недостаточно очков навыков, не меняем состояние
    if (
      pathProgress.unlockedNodes.includes(skillId) || 
      state.availableSkillPoints < skill.cost
    ) {
      return state;
    }
    
    // Проверяем, выполнены ли требования для разблокировки
    if (!isSkillAvailable(state.paths, skill)) {
      return state;
    }
    
    return {
      ...state,
      paths: {
        ...state.paths,
        [path]: {
          ...pathProgress,
          unlockedNodes: [...pathProgress.unlockedNodes, skillId],
          activeNodes: [...pathProgress.activeNodes, skillId]
        }
      },
      availableSkillPoints: state.availableSkillPoints - skill.cost,
      spentSkillPoints: {
        ...state.spentSkillPoints,
        [path]: state.spentSkillPoints[path] + skill.cost
      }
    };
  })
  // Добавление опыта в путь навыков
  .on(addSkillPathExperience, (state, { path, amount }) => {
    const pathProgress = state.paths[path];
    const newExperience = pathProgress.experience + amount;
    
    if (newExperience >= pathProgress.experienceToNextLevel) {
      // Если достаточно опыта для нового уровня, вызываем событие повышения уровня
      skillPathLevelUp(path);
      
      return {
        ...state,
        paths: {
          ...state.paths,
          [path]: {
            ...pathProgress,
            experience: newExperience - pathProgress.experienceToNextLevel
          }
        }
      };
    } else {
      return {
        ...state,
        paths: {
          ...state.paths,
          [path]: {
            ...pathProgress,
            experience: newExperience
          }
        }
      };
    }
  })
  // Повышение уровня в пути навыков
  .on(skillPathLevelUp, (state, path) => {
    const pathProgress = state.paths[path];
    const newLevel = pathProgress.level + 1;
    
    return {
      ...state,
      paths: {
        ...state.paths,
        [path]: {
          ...pathProgress,
          level: newLevel,
          experienceToNextLevel: calculateXpForPathLevel(newLevel + 1)
        }
      }
    };
  })
  // Сброс пути навыков (для respec)
  .on(resetSkillPath, (state, path) => {
    const returnedPoints = state.spentSkillPoints[path];
    const resetPathProgress: PathProgress = {
      path,
      level: 0,
      experience: 0,
      experienceToNextLevel: calculateXpForPathLevel(1),
      unlockedNodes: [],
      activeNodes: []
    };
    
    return {
      ...state,
      paths: {
        ...state.paths,
        [path]: resetPathProgress
      },
      availableSkillPoints: state.availableSkillPoints + returnedPoints,
      spentSkillPoints: {
        ...state.spentSkillPoints,
        [path]: 0
      }
    };
  })
  // Полный сброс всех путей (для respec)
  .on(resetAllSkillPaths, (state) => {
    const totalReturnedPoints = Object.values(state.spentSkillPoints).reduce((sum, points) => sum + points, 0);
    
    return {
      paths: createInitialPathProgress(),
      availableSkillPoints: state.availableSkillPoints + totalReturnedPoints,
      spentSkillPoints: {
        physical: 0,
        magical: 0,
        techno: 0,
        bio: 0,
        ritual: 0
      }
    };
  })
  // Установка доступных очков навыков (от повышения уровня)
  .on(setAvailableSkillPoints, (state, points) => ({
    ...state,
    availableSkillPoints: points
  }));

// Функция определения доступности навыка для изучения
function isSkillAvailable(pathsState: Record<ClassPath, PathProgress>, skill: SkillNode): boolean {
  const pathProgress = pathsState[skill.path];
  
  // Проверяем уровень в пути развития
  if (pathProgress.level < skill.level - 1) {
    return false;
  }
  
  // Проверяем пререквизиты
  if (skill.prerequisites.length > 0) {
    const allPrerequisitesMet = skill.prerequisites.every(
      prereqId => pathProgress.activeNodes.includes(prereqId)
    );
    if (!allPrerequisitesMet) {
      return false;
    }
  }
  
  return true;
}

// Вычисление уровня пути на основе потраченных очков
function calculatePathLevel(points: number): number {
  if (points < 3) return 0;
  if (points < 8) return 1;
  if (points < 15) return 2;
  if (points < 25) return 3;
  return 4;
}

// Селекторы для получения данных о навыках
export const selectPlayerSkills = () => $playerSkills.getState();
export const selectAvailableSkillPoints = () => $playerSkills.getState().availableSkillPoints;
export const selectPathProgress = (path: ClassPath) => $playerSkills.getState().paths[path];
export const selectUnlockedSkills = () => {
  const state = $playerSkills.getState();
  const unlockedSkillIds: string[] = [];
  
  Object.values(state.paths).forEach(pathProgress => {
    unlockedSkillIds.push(...pathProgress.unlockedNodes);
  });
  
  return unlockedSkillIds;
};

// Получение эффектов активных навыков
export function getActiveSkillEffects(): SkillEffect[] {
  const state = $playerSkills.getState();
  const activeEffects: SkillEffect[] = [];
  
  Object.values(state.paths).forEach(pathProgress => {
    pathProgress.activeNodes.forEach(nodeId => {
      const skill = ALL_SKILL_NODES.find(s => s.id === nodeId);
      if (skill) {
        activeEffects.push(...skill.effects);
      }
    });
  });
  
  return activeEffects;
}

// Хук для использования в компонентах (будет реализован с effector-react)
export const usePlayerSkills = () => {
  return {
    skillsState: selectPlayerSkills(),
    availablePoints: selectAvailableSkillPoints(),
    allSkillNodes: ALL_SKILL_NODES,
    unlockSkill: (skillId: string) => unlockSkill(skillId),
    addPathXP: (path: ClassPath, amount: number) => 
      addSkillPathExperience({ path, amount }),
    resetPath: (path: ClassPath) => resetSkillPath(path),
    resetAllPaths: () => resetAllSkillPaths(),
    isSkillAvailable: (skill: SkillNode) => 
      isSkillAvailable($playerSkills.getState().paths, skill),
    getActiveEffects: getActiveSkillEffects
  };
}; 