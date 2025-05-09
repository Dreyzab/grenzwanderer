import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getBattleState = query({
  args: { battleId: v.string() },
  handler: async (ctx, args) => {
    // В будущем здесь будет реальная логика получения данных из базы
    // Сейчас возвращаем тестовые данные
    return {
      playerStats: {
        health: 85,
        maxHealth: 100,
        mana: 30,
        maxMana: 50,
        name: "Игрок",
        avatar: "/assets/avatars/player.jpg"
      },
      opponentStats: {
        health: 65,
        maxHealth: 120,
        mana: 45,
        maxMana: 60,
        name: "Противник",
        avatar: "/assets/avatars/enemy.jpg"
      },
      currentTurn: 3,
      battleId: args.battleId
    };
  },
});

export const endTurn = mutation({
  args: { battleId: v.string() },
  handler: async (ctx, args) => {
    // В будущем здесь будет логика завершения хода
    // Сейчас просто возвращаем статус успеха
    return { success: true };
  },
});

export const surrender = mutation({
  args: { battleId: v.string() },
  handler: async (ctx, args) => {
    // В будущем здесь будет логика сдачи
    // Сейчас просто возвращаем статус успеха
    return { success: true };
  },
});

export const playCard = mutation({
  args: { 
    battleId: v.string(),
    cardId: v.string(),
    targetId: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    // В будущем здесь будет логика разыгрывания карты
    // Сейчас просто возвращаем статус успеха
    return { success: true };
  },
});

export const getPlayerCards = query({
  args: { battleId: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    // В будущем здесь будет реальная логика получения карт из базы
    // Сейчас возвращаем тестовые данные
    return [
      {
        id: "card1",
        name: "Удар мечом",
        description: "Наносит 5 единиц урона противнику",
        type: "attack",
        cost: 2,
        damage: 5
      },
      {
        id: "card2",
        name: "Щит",
        description: "Даёт 3 единицы брони",
        type: "defense",
        cost: 1
      },
      {
        id: "card3",
        name: "Лечение",
        description: "Восстанавливает 4 единицы здоровья",
        type: "spell",
        cost: 3,
        healing: 4
      },
      {
        id: "card4",
        name: "Рывок",
        description: "Уменьшает стоимость следующей атаки на 1",
        type: "skill",
        cost: 1,
        effects: ["reduce_next_attack_cost"]
      },
      {
        id: "card5",
        name: "Огненный шар",
        description: "Наносит 7 единиц урона противнику",
        type: "spell",
        cost: 4,
        damage: 7
      }
    ];
  },
});

export const getOpponentCardCount = query({
  args: { battleId: v.string(), opponentId: v.string() },
  handler: async (ctx, args) => {
    // В будущем здесь будет реальная логика получения количества карт из базы
    // Сейчас возвращаем случайное число от 3 до 7
    return Math.floor(Math.random() * 5) + 3;
  },
});

export const getBattleResults = query({
  args: { battleId: v.string() },
  handler: async (ctx, args) => {
    // В будущем здесь будет реальная логика получения результатов из базы
    // Сейчас возвращаем тестовые данные
    return {
      winner: 'player',
      playerName: 'Игрок',
      opponentName: 'Противник',
      rewards: {
        experience: 150,
        items: [
          {
            id: 'item1',
            name: 'Целебное зелье',
            quantity: 2
          },
          {
            id: 'item2',
            name: 'Амулет защиты',
            quantity: 1
          }
        ],
        money: 75
      }
    };
  },
}); 