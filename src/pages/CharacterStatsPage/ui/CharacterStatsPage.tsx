import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { CharacterSheet } from '@/widgets/character/CharacterSheet';
import { useCharacterStats, usePlayer } from '@/features/player/api';

// Типы вкладок статистики персонажа
type StatTab = 'attributes' | 'skills' | 'perks';

export const CharacterStatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StatTab>('attributes');
  
  // Получаем данные персонажа
  const { player, loading: playerLoading } = usePlayer();
  
  // Получаем статы персонажа и методы для их изменения
  const { 
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
  } = useCharacterStats();
  
  const handleAttributeIncrease = (attributeName: keyof typeof attributes) => {
    increaseAttribute(attributeName);
  };
  
  const handleSkillLearn = (skillId: string) => {
    learnSkill(skillId);
  };
  
  const handleTabChange = (tab: StatTab) => {
    setActiveTab(tab);
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'attributes':
        return (
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Основные атрибуты</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(attributes).map(([attrName, value]) => (
                  <div key={attrName} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{attrName}</span>
                      <p className="text-sm text-text-secondary">
                        {attrName === 'strength' && 'Физическая сила, урон оружием ближнего боя'}
                        {attrName === 'dexterity' && 'Ловкость, точность, уклонение'}
                        {attrName === 'intelligence' && 'Интеллект, хакинг, технологии'}
                        {attrName === 'willpower' && 'Стойкость к ментальным воздействиям'}
                        {attrName === 'charisma' && 'Коммуникативные навыки, торговля'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xl font-bold mx-3">{value}</span>
                      {availableAttributePoints > 0 && (
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-accent text-on-accent rounded-full"
                          onClick={() => handleAttributeIncrease(attrName as keyof typeof attributes)}
                        >
                          <span>+</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {availableAttributePoints > 0 && (
                <div className="mt-3 p-2 bg-accent/10 rounded text-center">
                  Доступно очков атрибутов: <span className="font-bold">{availableAttributePoints}</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Вторичные характеристики</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(secondaryStats).map(([statName, value]) => (
                  <div key={statName} className="flex flex-col p-3 bg-surface-variant/30 rounded-lg">
                    <span className="text-sm text-text-secondary capitalize">{statName}</span>
                    <span className="text-lg font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'skills':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Навыки</h3>
              {availableSkillPoints > 0 && (
                <div className="p-2 bg-accent/10 rounded">
                  Доступно очков навыков: <span className="font-bold">{availableSkillPoints}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {['combat', 'survival', 'social'].map(path => (
                <div key={path} className="border border-surface-variant rounded-lg overflow-hidden">
                  <div className="bg-surface-variant p-3 font-medium capitalize">
                    {path === 'combat' && 'Боевые навыки'}
                    {path === 'survival' && 'Навыки выживания'}
                    {path === 'social' && 'Социальные навыки'}
                  </div>
                  
                  <div className="p-3 grid gap-3">
                    {allSkillNodes
                      .filter(skill => skill.path === path)
                      .map(skill => {
                        const isLearned = playerSkills.includes(skill.id);
                        const canLearn = !isLearned && 
                                        calculateRequirementsMet(skill.id) && 
                                        availableSkillPoints >= skill.cost;
                        
                        return (
                          <div 
                            key={skill.id} 
                            className={`p-3 border rounded-lg ${
                              isLearned ? 'border-accent/50 bg-accent/5' : 
                              canLearn ? 'border-surface-variant cursor-pointer hover:bg-surface-variant/10' :
                              'border-surface-variant/50 opacity-70'
                            }`}
                            onClick={() => canLearn && handleSkillLearn(skill.id)}
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium">{skill.name}</h4>
                              {!isLearned && canLearn && <span className="text-xs bg-accent/20 px-2 rounded-full">Стоимость: {skill.cost}</span>}
                              {isLearned && <span className="text-xs bg-green-500/20 text-green-600 px-2 rounded-full">Изучено</span>}
                            </div>
                            <p className="text-sm text-text-secondary mt-1">{skill.description}</p>
                            
                            {skill.requires && skill.requires.length > 0 && !isLearned && (
                              <div className="mt-2 text-xs text-text-secondary">
                                Требуется: {skill.requires.map(reqId => {
                                  const reqSkill = allSkillNodes.find(s => s.id === reqId);
                                  const reqLearned = playerSkills.includes(reqId);
                                  return (
                                    <span key={reqId} className={reqLearned ? 'text-green-500' : 'text-red-400'}>
                                      {reqSkill?.name || reqId}
                                      {reqLearned ? ' ✓' : ' ✗'}
                                    </span>
                                  );
                                }).reduce((prev, curr) => [prev, ', ', curr] as any)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'perks':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Перки и специальные умения</h3>
            
            {perks.length > 0 ? (
              <div className="grid gap-3">
                {perks.map(perk => (
                  <div key={perk.id} className="border border-accent/30 rounded-lg p-3 bg-accent/5">
                    <h4 className="font-medium text-accent">{perk.name}</h4>
                    <p className="text-sm mt-1">{perk.description}</p>
                    
                    {perk.effects.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium">Эффекты:</span>
                        <ul className="text-xs text-text-secondary mt-1 space-y-1 pl-4">
                          {perk.effects.map((effect, index) => (
                            <li key={index} className="list-disc">{effect}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary italic">
                У вас пока нет перков или специальных умений
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <PageLayout
      header={<h1 className="text-2xl font-bold text-center">Характеристики персонажа</h1>}
      content={
        <div className="flex flex-col md:flex-row gap-6">
          {/* Левая колонка - инфо о персонаже */}
          <div className="md:w-1/3">
            <CharacterSheet 
              character={{
                name: player?.name || 'Персонаж',
                level: level,
                avatar: player?.avatar || '👤',
                experience: experience,
                attributes: {
                  strength: attributes.strength,
                  dexterity: attributes.dexterity,
                  intelligence: attributes.intelligence,
                  willpower: attributes.willpower,
                  charisma: attributes.charisma,
                  ...Object.fromEntries(
                    Object.entries(attributes)
                      .filter(([key]) => !['strength', 'dexterity', 'intelligence', 'willpower', 'charisma'].includes(key))
                  )
                },
                stats: {
                  здоровье: `${player?.health || 0}/${player?.maxHealth || 100}`,
                  энергия: `${player?.energy || 0}/${player?.maxEnergy || 100}`,
                  ...Object.fromEntries(
                    Object.entries(secondaryStats)
                      .filter(([key]) => !['health', 'energy'].includes(key))
                      .map(([key, value]) => [key, value])
                  )
                }
              }}
            />
            
            <div className="mt-4 bg-surface p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-text-secondary">Уровень {level}</span>
                  <div className="font-medium">{experience} / {level * 1000} опыта</div>
                </div>
                <div className="text-xs">
                  До следующего уровня: {(level * 1000) - experience}
                </div>
              </div>
              <div className="mt-2 h-2 bg-surface-variant rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent"
                  style={{ width: `${(experience / (level * 1000)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Правая колонка - характеристики и навыки */}
          <div className="md:w-2/3">
            <div className="flex border-b border-surface-variant mb-4">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'attributes' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                onClick={() => handleTabChange('attributes')}
              >
                Атрибуты
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'skills' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                onClick={() => handleTabChange('skills')}
              >
                Навыки
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'perks' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                onClick={() => handleTabChange('perks')}
              >
                Перки
              </button>
            </div>
            
            {playerLoading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-pulse text-text-secondary">Загрузка...</div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      }
    />
  );
}; 