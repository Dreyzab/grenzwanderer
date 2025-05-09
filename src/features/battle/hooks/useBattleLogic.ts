import { useState, useEffect } from 'react';

// Типы данных для карточного боя
export interface Card {
  id: string;
  name: string;
  cost: number;
  image: string;
  description: string;
  attack?: number;
  health?: number;
  // Другие возможные свойства карт
  effects?: Array<{
    type: string;
    value: number;
  }>;
}

export interface PlayerStats {
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
}

export interface BattleRewards {
  experience?: number;
  gold?: number;
  items?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export type BattleResult = 'victory' | 'defeat' | 'draw' | null;

interface BattleState {
  playerDeck: Card[];
  opponentDeck: Card[];
  playerHand: Card[];
  opponentHand: Card[];
  playerField: (Card | null)[];
  opponentField: (Card | null)[];
  currentTurn: number;
  isPlayerTurn: boolean;
}

/**
 * Хук, управляющий логикой карточного боя
 */
export const useBattleLogic = () => {
  // Состояние боя
  const [battleState, setBattleState] = useState<BattleState>({
    playerDeck: [],
    opponentDeck: [],
    playerHand: [],
    opponentHand: [],
    playerField: Array(5).fill(null),
    opponentField: Array(5).fill(null),
    currentTurn: 1,
    isPlayerTurn: true
  });

  // Статы игрока и противника
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    currentHp: 30,
    maxHp: 30,
    currentMana: 1,
    maxMana: 1
  });

  const [enemyStats, setEnemyStats] = useState<PlayerStats>({
    currentHp: 30,
    maxHp: 30,
    currentMana: 1,
    maxMana: 1
  });

  // Таймер хода
  const [turnTimer, setTurnTimer] = useState<number>(60);

  // Результат боя и награды
  const [battleResult, setBattleResult] = useState<BattleResult>(null);
  const [rewards, setRewards] = useState<BattleRewards | null>(null);

  // Количество карт в руке противника
  const opponentHandCount = battleState.opponentHand.length;

  // Флаг окончания боя
  const isBattleOver = battleResult !== null;

  // Инициализация боя
  useEffect(() => {
    // Здесь будет загрузка данных боя с сервера или из локального состояния
    // Для примера используем моковые данные
    
    const mockPlayerDeck = generateMockDeck('player');
    const mockOpponentDeck = generateMockDeck('opponent');
    
    // Начальные руки
    const initialPlayerHand = mockPlayerDeck.slice(0, 4);
    const initialOpponentHand = mockOpponentDeck.slice(0, 4);
    
    setBattleState({
      playerDeck: mockPlayerDeck.slice(4),
      opponentDeck: mockOpponentDeck.slice(4),
      playerHand: initialPlayerHand,
      opponentHand: initialOpponentHand,
      playerField: Array(5).fill(null),
      opponentField: Array(5).fill(null),
      currentTurn: 1,
      isPlayerTurn: true
    });
    
    // Симуляция получения награды при победе
    setRewards({
      experience: 150,
      gold: 75,
      items: [
        { id: 'rare_card_1', name: 'Редкая карта', icon: '/images/cards/rare_card.png' }
      ]
    });
  }, []);

  // Таймер хода
  useEffect(() => {
    if (isBattleOver) return;

    const timer = setInterval(() => {
      if (turnTimer <= 0) {
        // Автоматически заканчиваем ход по истечении времени
        endTurn();
      } else {
        setTurnTimer(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [turnTimer, isBattleOver]);

  // Функция для разыгрывания карты
  const playCard = (cardId: string, handIndex: number) => {
    if (isBattleOver || !battleState.isPlayerTurn) return;

    const selectedCard = battleState.playerHand[handIndex];
    
    // Проверка на достаточность маны
    if (selectedCard.cost > playerStats.currentMana) {
      return; // Недостаточно маны
    }

    // Находим свободную ячейку на поле
    const emptyFieldIndex = battleState.playerField.findIndex(card => card === null);
    if (emptyFieldIndex === -1) return; // Нет места на поле

    // Обновляем состояние
    const newPlayerHand = [...battleState.playerHand];
    newPlayerHand.splice(handIndex, 1);

    const newPlayerField = [...battleState.playerField];
    newPlayerField[emptyFieldIndex] = selectedCard;

    // Тратим ману
    setPlayerStats(prev => ({
      ...prev,
      currentMana: prev.currentMana - selectedCard.cost
    }));

    setBattleState(prev => ({
      ...prev,
      playerHand: newPlayerHand,
      playerField: newPlayerField
    }));
  };

  // Завершение хода
  const endTurn = () => {
    if (isBattleOver) return;

    // Реализация ИИ-хода при переходе к противнику
    if (battleState.isPlayerTurn) {
      simulateOpponentTurn();
    } else {
      // Переход к новому ходу игрока
      const newTurn = battleState.currentTurn + 1;
      const newMaxMana = Math.min(10, playerStats.maxMana + 1);

      // Берем карту из колоды
      const newPlayerHand = [...battleState.playerHand];
      if (battleState.playerDeck.length > 0) {
        const drawnCard = battleState.playerDeck[0];
        newPlayerHand.push(drawnCard);
      }

      setBattleState(prev => ({
        ...prev,
        currentTurn: newTurn,
        isPlayerTurn: true,
        playerHand: newPlayerHand,
        playerDeck: prev.playerDeck.slice(1)
      }));

      // Обновляем ману игрока для нового хода
      setPlayerStats(prev => ({
        ...prev,
        currentMana: newMaxMana,
        maxMana: newMaxMana
      }));

      // Сбрасываем таймер
      setTurnTimer(60);
    }
  };

  // Симуляция хода противника
  const simulateOpponentTurn = () => {
    // Простая ИИ-логика: разыгрываем случайную карту, если есть место и мана
    setTimeout(() => {
      // Обработка логики хода ИИ
      
      // Возвращаем ход игроку
      setBattleState(prev => ({
        ...prev,
        isPlayerTurn: false
      }));
      
      // Запускаем окончание хода ИИ через небольшую задержку
      setTimeout(endTurn, 1500);
    }, 1000);
  };

  // Сдаться
  const surrender = () => {
    setBattleResult('defeat');
  };

  // Генерация тестовой колоды
  const generateMockDeck = (owner: 'player' | 'opponent'): Card[] => {
    const deck: Card[] = [];
    const prefix = owner === 'player' ? 'p' : 'o';
    
    for (let i = 0; i < 30; i++) {
      const cost = Math.floor(Math.random() * 10) + 1;
      deck.push({
        id: `${prefix}_card_${i}`,
        name: `Карта ${i+1}`,
        cost,
        image: `/images/cards/card_${i % 10}.png`,
        description: `Описание карты ${i+1}`,
        attack: Math.floor(Math.random() * 8) + 1,
        health: Math.floor(Math.random() * 8) + 1
      });
    }
    
    return deck;
  };

  return {
    battleState,
    playerStats,
    enemyStats,
    playerHand: battleState.playerHand,
    playerField: battleState.playerField,
    opponentField: battleState.opponentField,
    opponentHandCount,
    currentTurn: battleState.currentTurn,
    turnTimer,
    battleResult,
    rewards,
    isBattleOver,
    playCard,
    endTurn,
    surrender
  };
};

export default useBattleLogic; 