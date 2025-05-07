/**
 * Сервисный слой для работы с API Convex
 * Централизует запросы к бэкенду и предоставляет интерфейс для работы с данными
 * 
 * @module ApiService
 */

import { api as convex } from "../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";

/**
 * Сервис для работы с квестами
 */
export const QuestService = {
  /**
   * Активировать квест по QR-коду
   */
  useActivateQuestByQR: () => {
    return useMutation(convex.quest.activateQuestByQR);
  },

  /**
   * Получить выборы игрока
   */
  usePlayerChoices: (playerId: string, questId?: string) => {
    return useQuery(convex.quest.getPlayerChoicesHistory, { 
      playerId: playerId as Id<"players">,
      questId
    });
  },

  /**
   * Получить сцену по ключу
   */
  useSceneByKey: (sceneKey: string) => {
    return useQuery(convex.quest.getSceneByKey, { sceneKey });
  }
};

/**
 * Сервис для работы с игроками
 */
export const PlayerService = {
  /**
   * Получить или создать игрока
   */
  useGetOrCreatePlayer: () => {
    return useMutation(convex.player.getOrCreatePlayer);
  },

  /**
   * Получить профиль игрока
   */
  usePlayerProfile: (userId: string) => {
    return useQuery(convex.player.getPlayerProfile, { userId: userId as Id<"users"> });
  },

  /**
   * Обновить местоположение игрока
   */
  useUpdateLocation: () => {
    return useMutation(convex.player.updatePlayerLocation);
  }
};

/**
 * Сервис для работы с инвентарем
 */
export const InventoryService = {
  /**
   * Получить инвентарь
   */
  useInventory: (ownerId: string, ownerType: string, location?: string) => {
    return useQuery(convex.inventory.getInventory, { 
      ownerId, 
      ownerType: ownerType as "player" | "npc" | "chest" | "session",
      location: location as "equipment" | "backpack" | "stash" | undefined
    });
  },

  /**
   * Добавить предмет в инвентарь
   */
  useAddItem: () => {
    return useMutation(convex.inventory.addItemToInventory);
  },

  /**
   * Переместить предмет между инвентарями
   */
  useMoveItem: () => {
    return useMutation(convex.inventory.moveItem);
  },

  /**
   * Экипировать предмет
   */
  useEquipItem: () => {
    return useMutation(convex.inventory.equipItem);
  },

  /**
   * Снять предмет
   */
  useUnequipItem: () => {
    return useMutation(convex.inventory.unequipItem);
  }
}; 