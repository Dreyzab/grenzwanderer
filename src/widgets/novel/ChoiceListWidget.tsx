import React, { useState } from 'react';
import { PlayerStats } from '../../shared/types/visualNovel';

export interface Choice {
  id: string;
  text: string;
  disabled?: boolean;
  tooltip?: string;
  requiredStats?: Record<string, number>;
}

interface ChoiceListWidgetProps {
  choices: Choice[];
  onChoiceSelected: (choiceId: string) => void;
  playerStats?: PlayerStats;
  questState?: Record<string, any>;
}

/**
 * Виджет списка выборов для визуальной новеллы
 * Отображает варианты ответа/действий для игрока
 */
export const ChoiceListWidget: React.FC<ChoiceListWidgetProps> = ({
  choices,
  onChoiceSelected,
  playerStats,
  questState
}) => {
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);
  
  // Если нет вариантов выбора, не отрисовываем компонент
  if (!choices.length) {
    return null;
  }
  
  // Проверяем доступность выбора на основе требований к статам
  const isChoiceAvailable = (choice: Choice): boolean => {
    // Если вариант уже отмечен как недоступный
    if (choice.disabled) return false;
    
    // Если нет требований или нет статов игрока, считаем доступным
    if (!choice.requiredStats || !playerStats) return true;
    
    // Проверяем все требуемые статы
    for (const [stat, requiredValue] of Object.entries(choice.requiredStats)) {
      // Получаем значение стата игрока из вложенных объектов attributes, resources или skills
      let playerValue = 0;
      
      if (playerStats.attributes && stat in playerStats.attributes) {
        playerValue = playerStats.attributes[stat as keyof typeof playerStats.attributes];
      } else if (playerStats.resources && stat in playerStats.resources) {
        playerValue = playerStats.resources[stat as keyof typeof playerStats.resources];
      } else if (playerStats.skills && stat in playerStats.skills) {
        playerValue = playerStats.skills[stat];
      }
      
      // Если стат игрока меньше требуемого, выбор недоступен
      if (playerValue < requiredValue) return false;
    }
    
    // Все требования выполнены
    return true;
  };
  
  return (
    <div className="w-full bg-surface-variant/90 backdrop-blur-sm p-4 rounded-t-lg border-t border-surface-variant shadow-lg">
      <div className="text-center text-text-secondary mb-3">Выберите вариант ответа:</div>
      
      <div className="flex flex-col gap-2 max-w-2xl mx-auto">
        {choices.map((choice) => {
          const available = isChoiceAvailable(choice);
          return (
            <div
              key={choice.id}
              className="relative"
              onMouseEnter={() => setHoveredChoice(choice.id)}
              onMouseLeave={() => setHoveredChoice(null)}
            >
              <button
                className={`
                  w-full text-left p-3 rounded-lg transition-colors 
                  ${!available 
                    ? 'bg-surface-variant/50 text-text-disabled cursor-not-allowed' 
                    : 'bg-surface hover:bg-primary/10 cursor-pointer'
                  }
                `}
                onClick={() => available && onChoiceSelected(choice.id)}
                disabled={!available}
              >
                <span className="text-lg">{choice.text}</span>
                
                {/* Отображаем требования к статам, если они есть */}
                {playerStats && choice.requiredStats && (
                  <div className="mt-1 text-sm space-x-2">
                    {Object.entries(choice.requiredStats).map(([stat, value]) => {
                      // Получаем значение стата игрока
                      let playerValue = 0;
                      if (playerStats.attributes && stat in playerStats.attributes) {
                        playerValue = playerStats.attributes[stat as keyof typeof playerStats.attributes];
                      } else if (playerStats.resources && stat in playerStats.resources) {
                        playerValue = playerStats.resources[stat as keyof typeof playerStats.resources];
                      } else if (playerStats.skills && stat in playerStats.skills) {
                        playerValue = playerStats.skills[stat];
                      }
                      
                      const isMet = playerValue >= value;
                      
                      return (
                        <span 
                          key={stat} 
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            isMet ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                          }`}
                        >
                          {stat}: {playerValue}/{value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
              
              {/* Тултип с объяснением, если есть и выбор неактивен */}
              {choice.tooltip && !available && hoveredChoice === choice.id && (
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-12 bg-surface-variant p-2 rounded shadow-lg text-sm max-w-xs z-10">
                  {choice.tooltip}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-surface-variant"></div>
                </div>
              )}
              
              {/* Выделение активного выбора при наведении */}
              {available && hoveredChoice === choice.id && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-2/3 bg-accent rounded"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChoiceListWidget; 