import React, { useCallback } from 'react';
import { useConvexQuery } from '../../shared/hooks';
import { api } from '../../../convex/_generated/api';
import { ConvexQueryResultGeneric } from '../../shared/types/tanstack-query';

interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  name: string;
  avatar?: string;
}

interface BattleState {
  playerStats: PlayerStats;
  opponentStats: PlayerStats;
  currentTurn: number;
  battleId: string;
}

interface BattleHUDWidgetProps {
  battleId: string;
  onEndTurn: () => void;
  onSurrender: () => void;
}

/**
 * Виджет HUD (Heads-Up Display) для боя
 * Отображает информацию о текущем состоянии боя и предоставляет кнопки управления
 */
export const BattleHUDWidget: React.FC<BattleHUDWidgetProps> = ({
  battleId,
  onEndTurn,
  onSurrender
}) => {
  // Используем обновленный хук с поддержкой TanStack Query
  const result: ConvexQueryResultGeneric<BattleState, Error> = useConvexQuery<BattleState, { battleId: string }>(
    api.battle.getBattleState,
    { battleId },
    {
      // Показываем заглушки пока данные загружаются
      fallbackData: {
        playerStats: {
          health: 100,
          maxHealth: 100,
          mana: 50,
          maxMana: 50,
          name: "Загрузка..."
        },
        opponentStats: {
          health: 100,
          maxHealth: 100,
          mana: 50,
          maxMana: 50,
          name: "Загрузка..."
        },
        currentTurn: 1,
        battleId
      },
      // Используем TanStack Query для улучшенной работы с кэшем и обновлениями
      useTanStack: true,
      // Обновляем данные каждые 5 секунд
      staleTime: 5000,
      // Обновляем при фокусе окна
      refetchOnWindowFocus: true,
      // Обрабатываем ошибки
      onError: (err) => console.error("Ошибка загрузки данных боя:", err)
    }
  );
  
  const { data: battleState, isLoading, error, isError } = result;
  
  // Функция обновления данных (безопасная к типам)
  const refetchData = useCallback(() => {
    // Проверяем, есть ли метод refetch в результате (только если используется TanStack Query)
    if ('refetch' in result && typeof result.refetch === 'function') {
      result.refetch();
    }
  }, [result]);

  // Обработчик окончания хода с автоматическим обновлением данных
  const handleEndTurn = () => {
    onEndTurn();
    // Обновляем данные после окончания хода
    setTimeout(() => refetchData(), 500);
  };

  // Если произошла ошибка при загрузке данных
  if (isError) {
    return (
      <div className="bg-surface-variant p-3 rounded-lg shadow-md text-error">
        <div className="mb-2 font-bold">Ошибка загрузки данных боя</div>
        <div className="text-sm">{error?.message}</div>
        <button 
          className="mt-2 bg-primary text-on-primary py-1 px-3 rounded text-sm"
          onClick={refetchData}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Деструктурируем данные из состояния боя
  const { playerStats, opponentStats, currentTurn } = battleState as BattleState;
  
  // Отображение статистики персонажа (игрока или противника)
  const renderCharacterStats = (stats: PlayerStats, isOpponent: boolean) => (
    <div className={`flex items-center gap-2 ${isOpponent ? 'flex-row-reverse' : ''}`}>
      {/* Аватар */}
      <div className={`w-10 h-10 bg-surface-variant rounded-full flex items-center justify-center ${isLoading ? 'animate-pulse' : ''}`}>
        {stats.avatar ? (
          <img src={stats.avatar} alt={stats.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span>{stats.name[0]}</span>
        )}
      </div>
      
      {/* Информация */}
      <div className={`flex flex-col ${isOpponent ? 'items-end' : ''}`}>
        <div className="font-medium">{stats.name}</div>
        
        {/* Полоска здоровья */}
        <div className="flex items-center gap-1">
          <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
            <div 
              className={`bg-error h-full rounded-full ${isLoading ? 'animate-pulse' : ''}`}
              style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
            />
          </div>
          <div className="text-xs">{stats.health}/{stats.maxHealth}</div>
        </div>
        
        {/* Полоска маны */}
        <div className="flex items-center gap-1">
          <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
            <div 
              className={`bg-primary h-full rounded-full ${isLoading ? 'animate-pulse' : ''}`}
              style={{ width: `${(stats.mana / stats.maxMana) * 100}%` }}
            />
          </div>
          <div className="text-xs">{stats.mana}/{stats.maxMana}</div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-surface-variant p-3 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        {/* Статистика игрока */}
        {renderCharacterStats(playerStats, false)}
        
        {/* Информация о ходе */}
        <div className="text-center">
          <div className="text-sm text-text-secondary">Ход</div>
          <div className={`text-xl font-heading ${isLoading ? 'animate-pulse' : ''}`}>{currentTurn}</div>
        </div>
        
        {/* Статистика противника */}
        {renderCharacterStats(opponentStats, true)}
      </div>
      
      {/* Кнопки управления */}
      <div className="flex justify-center mt-3 gap-2">
        <button 
          className="bg-accent text-surface py-1.5 px-4 rounded font-medium"
          onClick={handleEndTurn}
          disabled={isLoading}
        >
          Закончить ход
        </button>
        <button 
          className="bg-surface text-error py-1.5 px-4 rounded font-medium border border-error"
          onClick={onSurrender}
          disabled={isLoading}
        >
          Сдаться
        </button>
      </div>
    </div>
  );
};

export default BattleHUDWidget; 