import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/shared/ui';
import { 
  BattlefieldWidget, 
  PlayerCardHandWidget, 
  OpponentCardHandWidget, 
  BattleHUDWidget,
  BattleResultModalWidget
} from '@/widgets';
import { useBattleLogic } from '@/features/battle/hooks/useBattleLogic';

/**
 * Страница для проведения карточных боёв
 * Запускается при начале боя из квеста или PvP
 */
export const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    battleState, 
    playerStats,
    enemyStats,
    endTurn, 
    surrender,
    battleResult,
    rewards,
    playCard
  } = useBattleLogic();

  // Генерируем временные ID для интеграции с существующими виджетами
  const mockBattleId = "battle-123";
  const mockPlayerId = "player-1";
  const mockOpponentId = "opponent-1";

  // Обработка завершения боя и переход на предыдущую страницу
  useEffect(() => {
    if (battleResult === 'defeat') {
      // Можно добавить задержку для показа результатов битвы
      const timer = setTimeout(() => navigate(-1), 5000);
      return () => clearTimeout(timer);
    }
  }, [battleResult, navigate]);

  // Функция продолжения после битвы
  const continueBattle = () => {
    // В реальном приложении здесь может быть логика продолжения истории
    navigate(-1);
  };

  return (
    <PageLayout 
      header={<h1 className="text-2xl font-heading text-center">Битва</h1>}
      content={
        <div className="h-full flex flex-col relative">
          {/* HUD с информацией о бое вверху */}
          <div className="bg-surface-variant p-3 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              {/* Статистика игрока */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-surface-variant rounded-full flex items-center justify-center">
                  <span>И</span>
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">Игрок</div>
                  <div className="flex items-center gap-1">
                    <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-error h-full rounded-full"
                        style={{ width: `${(playerStats.currentHp / playerStats.maxHp) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs">{playerStats.currentHp}/{playerStats.maxHp}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(playerStats.currentMana / playerStats.maxMana) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs">{playerStats.currentMana}/{playerStats.maxMana}</div>
                  </div>
                </div>
              </div>
              
              {/* Информация о ходе */}
              <div className="text-center">
                <div className="text-sm text-text-secondary">Ход</div>
                <div className="text-xl font-heading">{battleState.currentTurn}</div>
              </div>
              
              {/* Статистика противника */}
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="w-10 h-10 bg-surface-variant rounded-full flex items-center justify-center">
                  <span>П</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-medium">Противник</div>
                  <div className="flex items-center gap-1">
                    <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-error h-full rounded-full"
                        style={{ width: `${(enemyStats.currentHp / enemyStats.maxHp) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs">{enemyStats.currentHp}/{enemyStats.maxHp}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(enemyStats.currentMana / enemyStats.maxMana) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs">{enemyStats.currentMana}/{enemyStats.maxMana}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Кнопки управления */}
            <div className="flex justify-center mt-3 gap-2">
              <button 
                className="bg-accent text-surface py-1.5 px-4 rounded font-medium"
                onClick={endTurn}
                disabled={!battleState.isPlayerTurn}
              >
                Закончить ход
              </button>
              <button 
                className="bg-surface text-error py-1.5 px-4 rounded font-medium border border-error"
                onClick={surrender}
              >
                Сдаться
              </button>
            </div>
          </div>
          
          {/* Основное поле боя в центре */}
          <div className="flex-1 flex flex-col justify-between py-4">
            {/* Карты противника вверху */}
            <div className="opponent-card-hand p-2 bg-surface-variant rounded-lg">
              <div className="flex justify-center items-end gap-2 h-24">
                {Array(battleState.opponentHand.length).fill(0).map((_, index) => (
                  <div 
                    key={index}
                    className="w-14 h-20 bg-primary-container rounded-md shadow-md relative transform transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                        ?
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1 text-center text-xs text-text-secondary">
                Карт в руке противника: {battleState.opponentHand.length}
              </div>
            </div>
            
            {/* Игровое поле в центре */}
            <BattlefieldWidget 
              playerField={battleState.playerField.filter(card => card !== null) as any[]}
              opponentField={battleState.opponentField.filter(card => card !== null) as any[]}
            />
            
            {/* Карты игрока внизу */}
            <div className="player-card-hand p-2 bg-surface-variant rounded-lg">
              <div className="flex justify-center items-end gap-2 h-32">
                {battleState.playerHand.length === 0 ? (
                  <div className="text-text-secondary text-center">
                    У вас нет карт в руке
                  </div>
                ) : (
                  battleState.playerHand.map((card, index) => (
                    <div 
                      key={card.id}
                      className={`
                        relative w-20 h-28 rounded-md shadow-md cursor-pointer transition-all duration-200
                        hover:-translate-y-2
                        ${card.attack ? 'bg-error-container' : 
                          card.health ? 'bg-primary-container' : 
                          'bg-secondary-container'}
                      `}
                      onClick={() => battleState.isPlayerTurn && playerStats.currentMana >= card.cost && 
                        playCard(card.id, index)}
                    >
                      {/* Стоимость карты */}
                      <div className="absolute top-1 left-1 bg-surface-variant text-on-surface-variant rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                        {card.cost}
                      </div>
                      
                      {/* Название карты */}
                      <div className="absolute bottom-1 left-1 right-1 text-center text-xs">
                        {card.name}
                      </div>
                      
                      {/* Значки атаки/защиты */}
                      {card.attack && (
                        <div className="absolute top-1 right-1 bg-error rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                          {card.attack}
                        </div>
                      )}
                      {card.health && (
                        <div className="absolute top-7 right-1 bg-primary rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                          {card.health}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Модальное окно с результатом боя */}
          {battleResult && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-surface p-6 rounded-lg shadow-lg w-96 max-w-full">
                <h2 className="text-2xl font-heading mb-4 text-center">
                  {battleResult === 'victory' ? 'Победа!' : 
                   battleResult === 'defeat' ? 'Поражение' : 'Ничья'}
                </h2>
                
                {battleResult === 'victory' && rewards && (
                  <div className="mb-6 p-4 bg-surface-variant rounded-md">
                    <h3 className="text-lg font-heading mb-2">Награды:</h3>
                    {rewards.experience && <p className="mb-1">Опыт: +{rewards.experience}</p>}
                    {rewards.gold && <p className="mb-1">Золото: +{rewards.gold}</p>}
                    
                    {rewards.items && rewards.items.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1">Предметы:</p>
                        <ul className="list-disc pl-5">
                          {rewards.items.map((item) => (
                            <li key={item.id}>
                              {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-center gap-3">
                  <button
                    className="bg-primary text-on-primary py-2 px-4 rounded-md"
                    onClick={continueBattle}
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export default BattlePage; 