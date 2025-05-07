import { useStore } from 'effector-react';
import { useCallback } from 'react';

import { 
  $primaryAttributes, 
  $secondaryStats, 
  $playerLevel,
  PrimaryAttributes,
  SecondaryStats,
  PlayerLevel,
  updatePrimaryAttribute,
  addExperience,
  levelUp,
  resetAttributes
} from '../../../entities/player/model/playerAttributes';

import {
  $availableSkillPoints,
  $pathsProgress,
  $allSkills,
  SkillNode,
  PathProgress,
  spendSkillPoint,
  resetSkills
} from '../../../entities/player/model/playerSkills';

import { ClassPath } from '../../../entities/player/model/playerAttributes';
import { createEvent } from 'effector';

// Создаем события для изменения количества доступных очков атрибутов
const decreaseAttributePoints = createEvent();
const increaseAttributePoints = createEvent();

// Обновляем модель, добавляя обработчики для этих событий
$playerLevel.on(decreaseAttributePoints, (state) => ({
  ...state,
  availableAttributePoints: state.availableAttributePoints - 1
}));

$playerLevel.on(increaseAttributePoints, (state) => ({
  ...state,
  availableAttributePoints: state.availableAttributePoints + 1
}));

export function useCharacterStats() {
  // Получаем состояние из хранилищ
  const primaryAttributes = useStore($primaryAttributes);
  const secondaryStats = useStore($secondaryStats);
  const playerLevel = useStore($playerLevel);
  const availableAttributePoints = playerLevel.availableAttributePoints;
  
  const availableSkillPoints = useStore($availableSkillPoints);
  const pathsProgress = useStore($pathsProgress);
  const allSkills = useStore($allSkills);
  
  // Обработчики для первичных атрибутов
  const increaseAttribute = useCallback((attribute: keyof PrimaryAttributes) => {
    if (availableAttributePoints > 0) {
      updatePrimaryAttribute({ attribute, value: 1 });
      // Уменьшаем количество доступных очков атрибутов
      decreaseAttributePoints();
    }
  }, [availableAttributePoints]);
  
  const decreaseAttribute = useCallback((attribute: keyof PrimaryAttributes) => {
    // Уменьшение атрибута, если позволяют правила игры
    // Обычно используется только при создании персонажа или сбросе
    updatePrimaryAttribute({ attribute, value: -1 });
    // Увеличиваем количество доступных очков атрибутов
    increaseAttributePoints();
  }, []);
  
  // Обработчик для изучения навыка
  const learnSkill = useCallback((skillId: string) => {
    if (availableSkillPoints > 0) {
      spendSkillPoint(skillId);
    }
  }, [availableSkillPoints]);
  
  // Обработчик для получения опыта
  const gainExperience = useCallback((amount: number) => {
    addExperience(amount);
  }, []);
  
  // Обработчик для принудительного повышения уровня (для тестирования)
  const forceLevel = useCallback(() => {
    levelUp();
  }, []);
  
  // Обработчик для сброса всех характеристик (для тестирования)
  const resetAll = useCallback(() => {
    resetAttributes();
    resetSkills('all');
  }, []);
  
  // Функция для получения навыка по ID
  const getSkillById = useCallback((skillId: string): SkillNode | undefined => {
    return allSkills.find(skill => skill.id === skillId);
  }, [allSkills]);
  
  // Функция для получения всех навыков определенного пути
  const getSkillsByPath = useCallback((path: ClassPath): SkillNode[] => {
    return allSkills.filter(skill => skill.path === path);
  }, [allSkills]);
  
  // Функция для проверки, доступен ли навык для изучения
  const isSkillAvailable = useCallback((skillId: string): boolean => {
    const skill = getSkillById(skillId);
    if (!skill) return false;
    
    const pathProgress = pathsProgress[skill.path];
    
    // Если навык уже разблокирован, он недоступен для повторного изучения
    if (pathProgress.unlockedNodes.includes(skillId)) return false;
    
    // Если недостаточно очков навыков, он недоступен
    if (availableSkillPoints < skill.cost) return false;
    
    // Если у навыка есть пререквизиты, проверяем, разблокированы ли они
    if (skill.prerequisites.length > 0) {
      const allPrerequisitesMet = skill.prerequisites.every(
        prereqId => pathProgress.activeNodes.includes(prereqId)
      );
      if (!allPrerequisitesMet) return false;
    }
    
    // Проверяем, достигнут ли необходимый уровень в пути для разблокировки
    if (pathProgress.level < skill.level - 1) return false;
    
    return true;
  }, [availableSkillPoints, pathsProgress, getSkillById]);
  
  return {
    // Состояние
    primaryAttributes,
    secondaryStats,
    playerLevel,
    availableAttributePoints,
    availableSkillPoints,
    pathsProgress,
    allSkills,
    
    // Методы для работы с атрибутами
    increaseAttribute,
    decreaseAttribute,
    
    // Методы для работы с навыками
    learnSkill,
    getSkillById,
    getSkillsByPath,
    isSkillAvailable,
    
    // Методы для работы с опытом и уровнем
    gainExperience,
    forceLevel,
    
    // Утилиты
    resetAll
  };
} 