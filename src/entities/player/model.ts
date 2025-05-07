// src/entities/player/model.ts
import { createStore, createEvent } from 'effector';
import { PlayerStats } from '../../shared/types/visualNovel';
import { Id } from '../../../convex/_generated/dataModel';
import { useStore } from 'effector-react';
import { $questState, $completedSteps, questStepCompleted, questStateChanged } from '../../features/quest/model';

// Initial player stats
export const DEFAULT_PLAYER_STATS: PlayerStats = {
  energy: 100,
  money: 0,
  attractiveness: 1,
  willpower: 1,
  fitness: 4,
  intelligence: 7,
  corruption: 0
};

// Events for updating player stats
export const updatePlayerStat = createEvent<{stat: keyof PlayerStats, value: number}>();
export const resetPlayerStats = createEvent();
export const setPlayerStats = createEvent<Partial<PlayerStats>>();

// Player stats store
export const $playerStats = createStore<PlayerStats>(DEFAULT_PLAYER_STATS)
  .on(updatePlayerStat, (state, {stat, value}) => ({
    ...state,
    [stat]: Math.max(0, state[stat] + value) // Ensure stats don't go below 0
  }))
  .on(resetPlayerStats, () => DEFAULT_PLAYER_STATS)
  .on(setPlayerStats, (state, newStats) => ({
    ...state,
    ...newStats
  }));

// Store for tracking gained/lost stats
export const $recentStatChanges = createStore<Array<{stat: keyof PlayerStats, value: number}>>([])
  .on(updatePlayerStat, (state, change) => {
    // Only add significant changes
    if (change.value !== 0) {
      // Add the new change and keep only the 5 most recent changes
      return [...state, change].slice(-5);
    }
    return state;
  })
  .reset(resetPlayerStats);

// Special skills/perks
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