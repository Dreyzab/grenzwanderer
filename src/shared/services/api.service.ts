/**
 * Сервисный слой для работы с API Convex
 * Централизует запросы к бэкенду и предоставляет интерфейс для работы с данными
 * 
 * @module ApiService
 */

import { api as convex } from "../../../convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "../hooks/convex";
import { Id } from "../../../convex/_generated/dataModel";
import { createMockQuery, createMockMutation, shouldUseMockData } from "../utils/convex.ts";

// Мок-данные для режима разработки без подключения к Convex
const mockScenes = {
  "intro": {
    id: "intro",
    title: "Введение",
    background: "city_outskirts.jpg",
    dialogues: [
      { text: "Добро пожаловать в Grenzwanderer!", character: "narrator" }
    ]
  }
};

/**
 * Сервис для работы с квестами
 */
export const QuestService = {
  /**
   * Активировать квест по QR-коду
   */
  useActivateQuestByQR: (options = {}) => {
    return useConvexMutation<any, {qrCode: string}>(
      convex.quest.activateQuestByQR,
      options
    );
  },

  /**
   * Получить выборы игрока
   */
  usePlayerChoices: (playerId: string, questId?: string, options = {}) => {
    const mockQuery = createMockQuery(() => ([]));
    
    return useConvexQuery(
      shouldUseMockData() ? mockQuery : convex.quest.getPlayerChoicesHistory,
      { 
        playerId: playerId as Id<"players">,
        questId
      },
      options
    );
  },

  /**
   * Получить сцену по ключу
   */
  useSceneByKey: (sceneKey: string, options = {}) => {
    const mockQuery = createMockQuery(() => mockScenes[sceneKey as keyof typeof mockScenes] || null);
    
    return useConvexQuery(
      shouldUseMockData() ? mockQuery : convex.quest.getSceneByKey,
      { sceneKey },
      options
    );
  }
};

/**
 * Сервис для работы с игроками
 */
export const PlayerService = {
  /**
   * Получить или создать игрока
   */
  useGetOrCreatePlayer: (options = {}) => {
    const mockMutation = createMockMutation(() => ({
      id: "mock-player-id",
      userId: "mock-user-id",
      name: "Тестовый игрок",
      stats: { energy: 100, money: 500 }
    }));
    
    return useConvexMutation(
      shouldUseMockData() ? mockMutation : convex.player.getOrCreatePlayer,
      options
    );
  },

  /**
   * Получить профиль игрока
   */
  usePlayerProfile: (userId: string, options = {}) => {
    const mockQuery = createMockQuery(() => ({
      id: "mock-player-id",
      userId,
      name: "Тестовый игрок",
      stats: { energy: 100, money: 500 }
    }));
    
    return useConvexQuery(
      shouldUseMockData() ? mockQuery : convex.player.getPlayerProfile,
      { userId: userId as Id<"users"> },
      options
    );
  },

  /**
   * Обновить местоположение игрока
   */
  useUpdateLocation: (options = {}) => {
    const mockMutation = createMockMutation(({playerId, location}) => ({
      id: playerId,
      location
    }));
    
    return useConvexMutation(
      shouldUseMockData() ? mockMutation : convex.player.updatePlayerLocation,
      options
    );
  }
};

/**
 * Сервис для работы с инвентарем
 */
export const InventoryService = {
  /**
   * Получить инвентарь
   */
  useInventory: (ownerId: string, ownerType: string, location?: string, options = {}) => {
    const mockQuery = createMockQuery(() => [
      { id: "mock-item-1", name: "Тестовый предмет", type: "misc" }
    ]);
    
    return useConvexQuery(
      shouldUseMockData() ? mockQuery : convex.inventory.getInventory,
      { 
        ownerId, 
        ownerType: ownerType as "player" | "npc" | "chest" | "session",
        location: location as "equipment" | "backpack" | "stash" | undefined
      },
      options
    );
  },

  /**
   * Добавить предмет в инвентарь
   */
  useAddItem: (options = {}) => {
    const mockMutation = createMockMutation(({ownerId, item}) => ({
      id: "mock-item-id",
      ownerId,
      ...item
    }));
    
    return useConvexMutation(
      shouldUseMockData() ? mockMutation : convex.inventory.addItemToInventory,
      options
    );
  },

  /**
   * Переместить предмет между инвентарями
   */
  useMoveItem: (options = {}) => {
    return useConvexMutation(
      convex.inventory.moveItem,
      options
    );
  },

  /**
   * Экипировать предмет
   */
  useEquipItem: (options = {}) => {
    return useConvexMutation(
      convex.inventory.equipItem,
      options
    );
  },

  /**
   * Снять предмет
   */
  useUnequipItem: (options = {}) => {
    return useConvexMutation(
      convex.inventory.unequipItem,
      options
    );
  }
}; 