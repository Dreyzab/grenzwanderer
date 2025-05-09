// src/entities/player/model.ts
import { createStore, createEvent } from 'effector';
import { PlayerStats } from '../../shared/types/visualNovel';
import { Id } from '../../../convex/_generated/dataModel';
import { useUnit } from 'effector-react';
import { $questState, $completedSteps, questStepCompleted, questStateChanged } from '../../features/quest/model';

// Initial player stats
export const DEFAULT_PLAYER_STATS: PlayerStats = {
  attributes: {
    strength: 5,
    intelligence: 7,
    charisma: 4,
    agility: 3,
    wisdom: 4,
    endurance: 6
  },
  resources: {
    health: 100,
    energy: 100,
    money: 0,
    reputation: 50
  },
  skills: {
    conversation: 1,
    persuasion: 1,
    hacking: 3,
    survival: 2
  },
  relationships: {}
};

// События для обновления статистики игрока
export type StatPath = `attributes.${keyof PlayerStats['attributes']}` | 
                       `resources.${keyof PlayerStats['resources']}` | 
                       `skills.${string}` | 
                       `relationships.${string}`;

export const updatePlayerStat = createEvent<{path: StatPath, value: number}>();
export const resetPlayerStats = createEvent();
export const setPlayerStats = createEvent<Partial<PlayerStats>>();

// Функция для обновления вложенных свойств объекта по пути
const updateNestedProperty = (obj: any, path: string, value: number): any => {
  const [category, property] = path.split('.');
  if (!category || !property) return obj;
  
  return {
    ...obj,
    [category]: {
      ...obj[category],
      [property]: Math.max(0, (obj[category][property] || 0) + value)
    }
  };
};

// Хранилище статистики игрока
export const $playerStats = createStore<PlayerStats>(DEFAULT_PLAYER_STATS)
  .on(updatePlayerStat, (state, {path, value}) => updateNestedProperty(state, path, value))
  .on(resetPlayerStats, () => DEFAULT_PLAYER_STATS)
  .on(setPlayerStats, (state, newStats) => ({
    ...state,
    ...newStats
  }));

// Хранилище для отслеживания полученных/потерянных статов
export const $recentStatChanges = createStore<Array<{path: StatPath, value: number}>>([])
  .on(updatePlayerStat, (state, change) => {
    // Добавляем только значимые изменения
    if (change.value !== 0) {
      // Добавляем изменение и сохраняем только 5 последних
      return [...state, change].slice(-5);
    }
    return state;
  })
  .reset(resetPlayerStats);

// Специальные навыки/перки
export interface Perk {
  id: string;
  name: string;
  description: string;
  effects: Partial<PlayerStats>;
}

export const $playerPerks = createStore<Perk[]>([]);
export const addPerk = createEvent<Perk>();
export const removePerk = createEvent<string>();

$playerPerks
  .on(addPerk, (perks, newPerk) => [...perks, newPerk])
  .on(removePerk, (perks, perkId) => perks.filter(perk => perk.id !== perkId));