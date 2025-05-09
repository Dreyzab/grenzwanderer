import React, { useState, useCallback } from 'react';
import { useConvexQuery, useConvexMutation } from '../../shared/hooks';
import { api } from '../../../convex/_generated/api';
import { 
  ConvexQueryResultGeneric, 
  ConvexMutationResultGeneric 
} from '../../shared/types/tanstack-query';

interface Card {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'skill' | 'spell';
  cost: number;
  damage?: number;
  healing?: number;
  effects?: string[];
  image?: string;
}

interface PlayerCardHandWidgetProps {
  battleId: string;
  playerId: string;
}

/**
 * Виджет для отображения и использования карт игрока в бою
 */
export const PlayerCardHandWidget: React.FC<PlayerCardHandWidgetProps> = ({
  battleId,
  playerId
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Запрашиваем карты игрока с использованием TanStack Query
  const cardsResult: ConvexQueryResultGeneric<Card[], Error> = useConvexQuery<Card[], { battleId: string; playerId: string }>(
    api.battle.getPlayerCards,
    { battleId, playerId },
    {
      fallbackData: [],
      // Используем TanStack Query
      useTanStack: true,
      // Кэшируем данные на 3 секунды
      staleTime: 3000,
      // Обновляем при повторном монтировании
      refetchOnMount: true,
      onError: (error) => console.error("Ошибка загрузки карт:", error)
    }
  );
  
  const { data, isLoading: isLoadingCards } = cardsResult;
  // Гарантированно приводим данные к типу Card[]
  const cards: Card[] = Array.isArray(data) ? data : [];
  
  // Функция обновления карт
  const refetchCards = useCallback(() => {
    if ('refetch' in cardsResult && typeof cardsResult.refetch === 'function') {
      cardsResult.refetch();
    }
  }, [cardsResult]);
  
  // Мутация для разыгрывания карты с использованием TanStack Query
  const playCardResult: ConvexMutationResultGeneric<any, Error, { battleId: string; cardId: string }> = 
    useConvexMutation<any, { battleId: string; cardId: string }>(
      api.battle.playCard,
      {
        // Используем TanStack Query
        useTanStack: true,
        onSuccess: () => {
          setSelectedCardId(null);
          // Обновляем карты после успешного разыгрывания
          setTimeout(() => refetchCards(), 300);
        },
        onError: (error) => {
          console.error("Ошибка при разыгрывании карты:", error);
        }
      }
    );
  
  // Безопасно извлекаем свойства из результата мутации
  const isPlayingCard = 'isPending' in playCardResult ? playCardResult.isPending : 
                        'isLoading' in playCardResult ? playCardResult.isLoading : false;
  const hasPlayError = 'isError' in playCardResult ? playCardResult.isError : false;
  const playError = 'error' in playCardResult ? playCardResult.error : null;
  
  // Получаем функцию мутации
  const playCard = playCardResult.mutate;
  
  // Обработчик выбора карты
  const handleCardSelect = (cardId: string) => {
    if (isPlayingCard) return;
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  };
  
  // Обработчик разыгрывания карты
  const handlePlayCard = () => {
    if (!selectedCardId || isPlayingCard) return;
    
    playCard({
      battleId,
      cardId: selectedCardId,
      // Для целевых карт можно добавить дополнительную логику выбора цели
    });
  };
  
  // Если загружаются карты, показываем заглушки
  if (isLoadingCards) {
    return (
      <div className="player-card-hand p-2 bg-surface-variant rounded-lg">
        <div className="flex justify-center items-end gap-2 h-32">
          {Array(5).fill(0).map((_, index) => (
            <div 
              key={index}
              className="w-20 h-28 bg-surface rounded-md shadow-md animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="player-card-hand p-2 bg-surface-variant rounded-lg">
      {hasPlayError && (
        <div className="mb-2 p-1 bg-error-container text-on-error-container text-sm rounded text-center">
          {playError?.message || 'Не удалось разыграть карту'}
        </div>
      )}
      
      <div className="flex justify-center items-end gap-2 h-32">
        {cards.length === 0 ? (
          <div className="text-text-secondary text-center">
            У вас нет карт в руке
          </div>
        ) : (
          cards.map((card: Card) => (
            <div 
              key={card.id}
              className={`
                relative w-20 h-28 rounded-md shadow-md cursor-pointer transition-all duration-200
                ${selectedCardId === card.id ? 'transform -translate-y-4' : 'hover:-translate-y-2'}
                ${card.type === 'attack' ? 'bg-error-container' : 
                  card.type === 'defense' ? 'bg-primary-container' : 
                  card.type === 'skill' ? 'bg-secondary-container' : 
                  'bg-tertiary-container'}
              `}
              onClick={() => handleCardSelect(card.id)}
            >
              {/* Стоимость карты */}
              <div className="absolute top-1 left-1 bg-surface-variant text-on-surface-variant rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                {card.cost}
              </div>
              
              {/* Название карты */}
              <div className="absolute bottom-1 left-1 right-1 text-center text-xs">
                {card.name}
              </div>
              
              {/* Значок типа карты */}
              <div className="absolute top-1 right-1">
                {card.type === 'attack' && '⚔️'}
                {card.type === 'defense' && '🛡️'}
                {card.type === 'skill' && '⚡'}
                {card.type === 'spell' && '✨'}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Кнопка разыгрывания карты */}
      {selectedCardId && (
        <div className="mt-2 flex justify-center">
          <button 
            className="bg-primary text-on-primary py-1 px-3 rounded text-sm disabled:opacity-50"
            onClick={handlePlayCard}
            disabled={isPlayingCard}
          >
            {isPlayingCard ? 'Разыгрывание...' : 'Разыграть карту'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerCardHandWidget; 