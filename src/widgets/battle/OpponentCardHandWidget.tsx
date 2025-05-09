import React from 'react';
import { useConvexQuery } from '../../shared/hooks';
import { api } from '../../../convex/_generated/api';

interface Card {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'skill' | 'spell';
}

interface OpponentCardHandWidgetProps {
  battleId: string;
  opponentId: string;
}

/**
 * Виджет для отображения карт противника в бою
 * Отображает скрытые карты (рубашкой вверх) и их количество
 */
export const OpponentCardHandWidget: React.FC<OpponentCardHandWidgetProps> = ({
  battleId,
  opponentId
}) => {
  // Запрашиваем количество карт у противника
  const { data: cardCount, isLoading } = useConvexQuery(
    api.battle.getOpponentCardCount,
    { battleId, opponentId },
    {
      fallbackData: 5, // По умолчанию показываем 5 карт
      onError: (error) => console.error("Ошибка загрузки карт противника:", error)
    }
  );
  
  // Если загружается, показываем заглушки
  if (isLoading) {
    return (
      <div className="opponent-card-hand p-2 bg-surface-variant rounded-lg">
        <div className="flex justify-center items-end gap-2 h-24">
          {Array(5).fill(0).map((_, index) => (
            <div 
              key={index}
              className="w-14 h-20 bg-surface rounded-md shadow-md animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Количество карт для отображения (используем cardCount из запроса)
  const cards = Array(cardCount).fill(0);
  
  return (
    <div className="opponent-card-hand p-2 bg-surface-variant rounded-lg">
      <div className="flex justify-center items-end gap-2 h-24">
        {cards.map((_, index) => (
          <div 
            key={index}
            className="w-14 h-20 bg-primary-container rounded-md shadow-md relative transform transition-all duration-200 hover:-translate-y-1"
          >
            {/* Рубашка карты (узор или символ) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                ?
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Отображение количества карт */}
      <div className="mt-1 text-center text-xs text-text-secondary">
        Карт в руке противника: {cardCount}
      </div>
    </div>
  );
};

export default OpponentCardHandWidget; 