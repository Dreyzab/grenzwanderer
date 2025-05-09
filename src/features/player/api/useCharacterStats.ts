import { useState, useEffect } from 'react';
import { usePlayer } from './usePlayer';

interface PrimaryAttributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  willpower: number;
  charisma: number;
}

interface SecondaryStats {
  health: number;
  energy: number;
  evasion: number;
  criticalChance: number;
  poisonResistance: number;
  hackingSkill: number;
  persuasion: number;
}

interface SkillNode {
  id: string;
  name: string;
  description: string;
  path: 'combat' | 'survival' | 'social';
  requires?: string[];
  cost: number;
}

interface Perk {
  id: string;
  name: string;
  description: string;
  effects: string[];
}

export const useCharacterStats = () => {
  const { player, loading: playerLoading } = usePlayer();
  const [attributes, setAttributes] = useState<PrimaryAttributes>({
    strength: 5,
    dexterity: 5,
    intelligence: 5,
    willpower: 5,
    charisma: 5
  });
  
  const [secondaryStats, setSecondaryStats] = useState<SecondaryStats>({
    health: 100,
    energy: 70,
    evasion: 15,
    criticalChance: 5,
    poisonResistance: 10,
    hackingSkill: 25,
    persuasion: 20
  });
  
  const [perks, setPerks] = useState<Perk[]>([
    {
      id: 'perk-1',
      name: 'Цифровой след',
      description: 'Обнаруживает скрытую информацию в цифровом пространстве.',
      effects: ['+10% к обнаружению скрытых данных', '+5 к навыку хакинга']
    }
  ]);
  
  const [availableAttributePoints, setAvailableAttributePoints] = useState(3);
  const [availableSkillPoints, setAvailableSkillPoints] = useState(2);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  
  // Демо набор навыков
  const allSkillNodes: SkillNode[] = [
    {
      id: 'combat-1',
      name: 'Меткий стрелок',
      description: 'Повышает точность при стрельбе',
      path: 'combat',
      cost: 1
    },
    {
      id: 'combat-2',
      name: 'Мастер ближнего боя',
      description: 'Улучшает урон в ближнем бою',
      path: 'combat',
      requires: ['combat-1'],
      cost: 2
    },
    {
      id: 'survival-1',
      name: 'Травник',
      description: 'Позволяет создавать лечебные зелья',
      path: 'survival',
      cost: 1
    },
    {
      id: 'social-1',
      name: 'Харизматичная речь',
      description: 'Улучшает убедительность в диалогах',
      path: 'social',
      cost: 1
    }
  ];
  
  // Список изученных навыков (для демо)
  const [playerSkills, setPlayerSkills] = useState<string[]>(['combat-1']);
  
  // Загрузка данных из профиля игрока
  useEffect(() => {
    if (player) {
      // Обновляем первичные атрибуты из данных игрока
      const playerStats = player.stats || {};
      
      setAttributes({
        strength: playerStats.strength || 5,
        dexterity: playerStats.dexterity || 5,
        intelligence: playerStats.intelligence || 5,
        willpower: playerStats.willpower || 5,
        charisma: playerStats.charisma || 5
      });
      
      // Обновляем уровень и опыт
      setLevel(player.level || 1);
      setExperience(player.experience || 0);
      
      // Обновляем вторичные характеристики на основе атрибутов
      updateSecondaryStats({
        strength: playerStats.strength || 5,
        dexterity: playerStats.dexterity || 5,
        intelligence: playerStats.intelligence || 5,
        willpower: playerStats.willpower || 5,
        charisma: playerStats.charisma || 5
      });
    }
  }, [player]);
  
  // Обновление вторичных характеристик на основе атрибутов
  const updateSecondaryStats = (attrs: PrimaryAttributes) => {
    setSecondaryStats({
      health: 80 + (attrs.strength * 4) + (attrs.willpower * 2),
      energy: 50 + (attrs.willpower * 5),
      evasion: 10 + (attrs.dexterity * 1),
      criticalChance: 5 + Math.floor(attrs.dexterity / 2),
      poisonResistance: 5 + Math.floor(attrs.willpower / 2),
      hackingSkill: 15 + (attrs.intelligence * 2),
      persuasion: 10 + (attrs.charisma * 2)
    });
  };
  
  // Увеличение атрибута
  const increaseAttribute = (attributeName: keyof PrimaryAttributes) => {
    if (availableAttributePoints > 0) {
      const newAttributes = {
        ...attributes,
        [attributeName]: attributes[attributeName] + 1
      };
      
      setAttributes(newAttributes);
      setAvailableAttributePoints(availableAttributePoints - 1);
      updateSecondaryStats(newAttributes);
    }
  };
  
  // Изучение навыка
  const learnSkill = (skillId: string) => {
    const skill = allSkillNodes.find(node => node.id === skillId);
    
    if (!skill) return;
    
    // Проверка требований
    if (skill.requires && !skill.requires.every(reqId => playerSkills.includes(reqId))) {
      return;
    }
    
    // Проверка доступности очков навыков
    if (availableSkillPoints < skill.cost) {
      return;
    }
    
    // Изучаем навык
    setPlayerSkills([...playerSkills, skillId]);
    setAvailableSkillPoints(availableSkillPoints - skill.cost);
  };
  
  // Проверяет, удовлетворены ли требования для навыка
  const calculateRequirementsMet = (skillId: string) => {
    const skill = allSkillNodes.find(node => node.id === skillId);
    
    if (!skill) return false;
    
    // Если нет требований, то требования выполнены
    if (!skill.requires) return true;
    
    // Проверяем, изучены ли все требуемые навыки
    return skill.requires.every(reqId => playerSkills.includes(reqId));
  };
  
  // Добавление опыта
  const addExperience = (amount: number) => {
    const newExperience = experience + amount;
    setExperience(newExperience);
    
    // Простая система уровней: каждые 1000 опыта = 1 уровень
    const newLevel = Math.floor(newExperience / 1000) + 1;
    if (newLevel > level) {
      const levelDifference = newLevel - level;
      setLevel(newLevel);
      
      // За каждый новый уровень даем 2 очка атрибутов и 1 очко навыков
      setAvailableAttributePoints(availableAttributePoints + (levelDifference * 2));
      setAvailableSkillPoints(availableSkillPoints + levelDifference);
    }
  };
  
  return {
    attributes,
    secondaryStats,
    availableAttributePoints,
    availableSkillPoints,
    level,
    experience,
    playerSkills,
    allSkillNodes,
    perks,
    increaseAttribute,
    learnSkill,
    calculateRequirementsMet,
    addExperience
  };
}; 