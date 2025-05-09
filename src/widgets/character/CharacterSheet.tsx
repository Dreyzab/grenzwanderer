import React, { useState } from 'react';

// Интерфейсы для базовой версии CharacterSheet
interface PrimaryAttributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  willpower: number;
  charisma: number;
  [key: string]: number;
}

interface BaseCharacterSheetProps {
  character?: {
    name?: string;
    level?: number;
    avatar?: string;
    experience?: number;
    attributes?: PrimaryAttributes;
    stats?: Record<string, number | string>;
  };
}

// Интерфейсы для расширенной версии CharacterSheet
interface Attribute {
  id: string;
  name: string;
  value: number;
  max?: number;
}

interface Skill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  isLocked: boolean;
  requiredPoints?: number;
  dependsOn?: string[];
}

interface SkillTree {
  id: string;
  name: string;
  skills: Skill[];
}

interface AdvancedCharacterSheetProps {
  name: string;
  level: number;
  experience: number;
  nextLevelExperience: number;
  attributes: Attribute[];
  secondaryStats: Attribute[];
  skillTrees: SkillTree[];
  availableSkillPoints: number;
  onSkillUpgrade?: (skillId: string) => void;
  isAdvanced: true;
}

/**
 * Компонент для отображения информации о персонаже.
 * Поддерживает две версии: базовую и расширенную с навыками.
 */
export const CharacterSheet: React.FC<BaseCharacterSheetProps | AdvancedCharacterSheetProps> = (props) => {
  // Проверяем, какая версия компонента используется
  if ('isAdvanced' in props) {
    return <AdvancedCharacterSheet {...props as AdvancedCharacterSheetProps} />;
  } else {
    return <BaseCharacterSheet {...props as BaseCharacterSheetProps} />;
  }
};

/**
 * Базовая версия компонента CharacterSheet
 */
const BaseCharacterSheet: React.FC<BaseCharacterSheetProps> = ({ 
  character = {
    name: 'Путник',
    level: 1,
    avatar: '👤',
    experience: 0,
    attributes: {
      strength: 5,
      dexterity: 5,
      intelligence: 5,
      willpower: 5,
      charisma: 5
    },
    stats: {
      health: '100/100',
      energy: '50/50',
      resistance: 10,
      accuracy: 70
    }
  } 
}) => {
  return (
    <div className="bg-surface p-4 rounded-lg shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center text-2xl">
          {character.avatar}
        </div>
        
        <div>
          <h2 className="text-xl font-medium">{character.name}</h2>
          <div className="text-text-secondary">Уровень {character.level}</div>
        </div>
      </div>
      
      {character.attributes && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Атрибуты</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <div key={attr} className="flex justify-between items-center p-2 bg-surface-variant/50 rounded">
                <span className="capitalize">{attr}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {character.stats && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Характеристики</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(character.stats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between items-center p-2 bg-surface-variant/50 rounded">
                <span className="capitalize">{stat}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Расширенная версия компонента CharacterSheet с поддержкой навыков
 */
const AdvancedCharacterSheet: React.FC<AdvancedCharacterSheetProps> = ({
  name,
  level,
  experience,
  nextLevelExperience,
  attributes,
  secondaryStats,
  skillTrees,
  availableSkillPoints,
  onSkillUpgrade
}) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'skills'>('attributes');
  const [activeSkillTree, setActiveSkillTree] = useState<string | null>(
    skillTrees.length > 0 ? skillTrees[0].id : null
  );
  
  // Расчет процента опыта до следующего уровня
  const experiencePercent = Math.floor((experience / nextLevelExperience) * 100);
  
  // Выбранное дерево навыков
  const selectedTree = skillTrees.find(tree => tree.id === activeSkillTree);
  
  return (
    <div className="character-sheet">
      <div className="character-header">
        <h1>{name}</h1>
        <div className="character-level">Уровень {level}</div>
        
        <div className="experience-bar">
          <div 
            className="experience-fill"
            style={{ width: `${experiencePercent}%` }}
          />
          <div className="experience-text">
            {experience} / {nextLevelExperience} XP
          </div>
        </div>
      </div>
      
      <div className="character-tabs">
        <button 
          className={`tab ${activeTab === 'attributes' ? 'active' : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          Характеристики
        </button>
        <button 
          className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Навыки
        </button>
      </div>
      
      <div className="character-content">
        {activeTab === 'attributes' && (
          <div className="attributes-panel">
            <div className="primary-attributes">
              <h3>Основные характеристики</h3>
              <div className="attributes-grid">
                {attributes.map(attr => (
                  <div key={attr.id} className="attribute-item">
                    <div className="attribute-name">{attr.name}</div>
                    <div className="attribute-value">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="secondary-stats">
              <h3>Вторичные характеристики</h3>
              <div className="attributes-grid">
                {secondaryStats.map(stat => (
                  <div key={stat.id} className="attribute-item">
                    <div className="attribute-name">{stat.name}</div>
                    <div className="attribute-value">
                      {stat.value}{stat.max ? ` / ${stat.max}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className="skills-panel">
            <div className="skill-trees-tabs">
              {skillTrees.map(tree => (
                <button
                  key={tree.id}
                  className={`skill-tree-tab ${activeSkillTree === tree.id ? 'active' : ''}`}
                  onClick={() => setActiveSkillTree(tree.id)}
                >
                  {tree.name}
                </button>
              ))}
            </div>
            
            <div className="skill-points-available">
              Доступные очки навыков: <span>{availableSkillPoints}</span>
            </div>
            
            {selectedTree && (
              <div className="skill-tree">
                {selectedTree.skills.map(skill => (
                  <div 
                    key={skill.id}
                    className={`skill-node ${skill.isLocked ? 'locked' : ''}`}
                  >
                    <div className="skill-header">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-level">{skill.level}/{skill.maxLevel}</span>
                    </div>
                    
                    <div className="skill-description">{skill.description}</div>
                    
                    {!skill.isLocked && skill.level < skill.maxLevel && availableSkillPoints > 0 && (
                      <button 
                        className="upgrade-skill-button"
                        onClick={() => onSkillUpgrade && onSkillUpgrade(skill.id)}
                      >
                        Улучшить
                      </button>
                    )}
                    
                    {skill.isLocked && (
                      <div className="skill-locked-message">
                        Требуется: {skill.requiredPoints} очков
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 