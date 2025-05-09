import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { useCharacterStats } from '@/features/player/api/useCharacterStats';
import { usePlayer } from '@/features/player/api/usePlayer';

// Типы вкладок статистики персонажа
type StatTab = 'attributes' | 'skills' | 'perks';

export const CharacterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StatTab>('attributes');
  
  // Получаем данные персонажа
  const { player, isLoading: playerLoading } = usePlayer();
  
  // Получаем статы персонажа и методы для их изменения
  const { 
    primaryAttributes,
    secondaryStats,
    availableAttributePoints,
    availableSkillPoints,
    playerSkills,
    allSkillNodes,
    perks,
    increaseAttribute,
    learnSkill,
    calculateRequirementsMet
  } = useCharacterStats();
  
  // Функция для рендеринга панели атрибутов
  const renderAttributesPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Основные атрибуты */}
      <div className="bg-surface p-4 rounded-lg">
        <h3 className="text-lg font-heading mb-4">Основные атрибуты</h3>
        <div className="space-y-4">
          {Object.entries(primaryAttributes).map(([attr, value]) => (
            <div key={attr} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{attr}</div>
                <div className="text-sm text-text-secondary">
                  {getAttributeDescription(attr)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-heading">{value}</div>
                {availableAttributePoints > 0 && (
                  <button
                    className="bg-accent text-surface w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    onClick={() => increaseAttribute(attr)}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {availableAttributePoints > 0 && (
          <div className="mt-4 text-sm text-accent">
            Доступно очков: {availableAttributePoints}
          </div>
        )}
      </div>
      
      {/* Вторичные характеристики */}
      <div className="bg-surface p-4 rounded-lg">
        <h3 className="text-lg font-heading mb-4">Производные характеристики</h3>
        <div className="space-y-2">
          {Object.entries(secondaryStats).map(([stat, value]) => (
            <div key={stat} className="flex justify-between items-center">
              <div>{stat}</div>
              <div>{typeof value === 'number' ? value.toFixed(1) : value}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Опыт и уровень */}
      <div className="bg-surface p-4 rounded-lg md:col-span-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-heading">Уровень {player?.level || 1}</h3>
          <div>{player?.experience || 0} / {calculateNextLevelXP(player?.level || 1)} XP</div>
        </div>
        <div className="w-full bg-surface-variant rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full" 
            style={{ 
              width: `${calculateLevelProgress(player?.level || 1, player?.experience || 0)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
  
  // Функция для рендеринга панели навыков
  const renderSkillsPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Список путей навыков */}
      <div className="bg-surface p-4 rounded-lg md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-heading">Навыки</h3>
          {availableSkillPoints > 0 && (
            <div className="text-sm text-accent">
              Доступно очков: {availableSkillPoints}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['combat', 'survival', 'social'].map((path) => (
            <div key={path} className="bg-surface-variant p-3 rounded">
              <h4 className="font-heading mb-2 capitalize">{path}</h4>
              
              <div className="space-y-2">
                {allSkillNodes
                  .filter(node => node.path === path)
                  .map(node => {
                    const isLearned = playerSkills.includes(node.id);
                    const canLearn = !isLearned && calculateRequirementsMet(node.id) && availableSkillPoints > 0;
                    
                    return (
                      <div key={node.id} className="flex items-center justify-between">
                        <div className={`${isLearned ? 'text-accent' : ''}`}>
                          <div>{node.name}</div>
                          <div className="text-xs text-text-secondary">{node.description}</div>
                        </div>
                        {isLearned ? (
                          <div className="text-xs px-2 py-1 bg-accent text-surface rounded">Изучено</div>
                        ) : canLearn ? (
                          <button
                            className="text-xs px-2 py-1 border border-accent text-accent rounded"
                            onClick={() => learnSkill(node.id)}
                          >
                            Изучить
                          </button>
                        ) : (
                          <div className="text-xs text-text-disabled">Недоступно</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Функция для рендеринга панели перков
  const renderPerksPanel = () => (
    <div className="bg-surface p-4 rounded-lg">
      <h3 className="text-lg font-heading mb-4">Перки и особенности</h3>
      
      {perks.length === 0 ? (
        <div className="text-text-secondary text-center py-6">
          У вас пока нет особых перков или способностей
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perks.map(perk => (
            <div key={perk.id} className="bg-surface-variant p-3 rounded">
              <div className="font-medium">{perk.name}</div>
              <div className="text-sm text-text-secondary">{perk.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Вспомогательные функции
  const getAttributeDescription = (attr: string): string => {
    const descriptions: Record<string, string> = {
      strength: 'Влияет на физический урон и переносимый вес',
      dexterity: 'Влияет на точность и уклонение',
      intelligence: 'Влияет на силу магии и взлом',
      willpower: 'Влияет на устойчивость к эффектам и психическим атакам',
      charisma: 'Влияет на цены и диалоговые опции'
    };
    return descriptions[attr] || '';
  };
  
  const calculateNextLevelXP = (level: number): number => {
    return 100 * Math.pow(level, 1.5);
  };
  
  const calculateLevelProgress = (level: number, experience: number): number => {
    const currentLevelXP = calculateNextLevelXP(level - 1) || 0;
    const nextLevelXP = calculateNextLevelXP(level);
    const progress = ((experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  // Если данные загружаются, показываем индикатор загрузки
  if (playerLoading) {
    return (
      <PageLayout
        header={<h1 className="text-2xl font-heading text-center">Персонаж</h1>}
        content={
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-text-secondary">Загрузка данных персонажа...</div>
          </div>
        }
      />
    );
  }
  
  return (
    <PageLayout
      header={
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-heading text-center">Персонаж</h1>
          
          {/* Информация о персонаже */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center">
              {player?.avatar || '👤'}
            </div>
            <div className="text-center">
              <div className="text-xl font-medium">{player?.name || 'Путник'}</div>
              <div className="text-sm text-text-secondary">Уровень {player?.level || 1}</div>
            </div>
          </div>
          
          {/* Вкладки */}
          <div className="flex border-b border-surface-variant justify-center">
            <button 
              className={`py-2 px-4 ${activeTab === 'attributes' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('attributes')}
            >
              Атрибуты
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'skills' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('skills')}
            >
              Навыки
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'perks' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('perks')}
            >
              Перки
            </button>
          </div>
        </div>
      }
      content={
        <div className="p-4">
          {activeTab === 'attributes' && renderAttributesPanel()}
          {activeTab === 'skills' && renderSkillsPanel()}
          {activeTab === 'perks' && renderPerksPanel()}
        </div>
      }
    />
  );
}; 