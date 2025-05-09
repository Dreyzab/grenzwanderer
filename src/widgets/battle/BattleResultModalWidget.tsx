import React from 'react';
import { useConvexQuery } from '../../shared/hooks';
import { api } from '../../../convex/_generated/api';

interface BattleResultData {
  winner: 'player' | 'opponent' | 'draw';
  playerName: string;
  opponentName: string;
  rewards?: {
    experience: number;
    items?: Array<{
      id: string;
      name: string;
      quantity: number;
    }>;
    money?: number;
  };
}

interface BattleResultModalWidgetProps {
  battleId: string;
  onClose: () => void;
  onContinue: () => void;
}

/**
 * Виджет для отображения результатов сражения
 * Показывает победителя, полученные награды и предоставляет кнопки для продолжения
 */
export const BattleResultModalWidget: React.FC<BattleResultModalWidgetProps> = ({
  battleId,
  onClose,
  onContinue
}) => {
  // Запрашиваем данные о результатах сражения
  const { data: resultData, isLoading, error } = useConvexQuery(
    api.battle.getBattleResults,
    { battleId },
    {
      // Показываем заглушку пока данные загружаются
      fallbackData: {
        winner: 'player',
        playerName: 'Игрок',
        opponentName: 'Противник',
        rewards: {
          experience: 0,
          items: [],
          money: 0
        }
      } as BattleResultData
    }
  );
  
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-overlay z-50">
        <div className="bg-error-container p-6 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-xl font-heading mb-4 text-error">Ошибка</h2>
          <p className="mb-4">Не удалось загрузить результаты боя: {error.message}</p>
          <button
            className="bg-primary text-on-primary py-2 px-4 rounded-md"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }
  
  const { winner, playerName, opponentName, rewards } = resultData as BattleResultData;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-overlay z-50">
      <div className="bg-surface p-6 rounded-lg shadow-lg w-96 max-w-full">
        <h2 className="text-2xl font-heading mb-4 text-center">
          {isLoading ? (
            <div className="h-8 bg-surface-variant animate-pulse rounded"></div>
          ) : (
            winner === 'player' 
              ? 'Победа!' 
              : winner === 'opponent' 
              ? 'Поражение' 
              : 'Ничья'
          )}
        </h2>
        
        <div className="mb-6 text-center">
          {isLoading ? (
            <div className="h-6 bg-surface-variant animate-pulse rounded my-2"></div>
          ) : (
            <p>
              {winner === 'player' 
                ? `${playerName} побеждает ${opponentName}` 
                : winner === 'opponent' 
                ? `${opponentName} побеждает ${playerName}` 
                : `${playerName} и ${opponentName} сражались вничью`}
            </p>
          )}
        </div>
        
        {winner === 'player' && rewards && (
          <div className="mb-6 p-4 bg-surface-variant rounded-md">
            <h3 className="text-lg font-heading mb-2">Награды:</h3>
            
            {isLoading ? (
              <>
                <div className="h-5 bg-surface animate-pulse rounded my-2"></div>
                <div className="h-5 bg-surface animate-pulse rounded my-2"></div>
                <div className="h-5 bg-surface animate-pulse rounded my-2"></div>
              </>
            ) : (
              <>
                <p className="mb-1">Опыт: +{rewards.experience}</p>
                
                {rewards.money && rewards.money > 0 && (
                  <p className="mb-1">Деньги: +{rewards.money}</p>
                )}
                
                {rewards.items && rewards.items.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1">Предметы:</p>
                    <ul className="list-disc pl-5">
                      {rewards.items.map((item) => (
                        <li key={item.id}>
                          {item.name} {item.quantity > 1 ? `(${item.quantity})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <div className="flex justify-center gap-3">
          <button
            className="bg-surface-variant text-text-primary py-2 px-4 rounded-md"
            onClick={onClose}
          >
            Закрыть
          </button>
          <button
            className="bg-primary text-on-primary py-2 px-4 rounded-md"
            onClick={onContinue}
            disabled={isLoading}
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultModalWidget; 