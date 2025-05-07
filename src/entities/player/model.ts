// src/entities/player/model.ts
import { createStore, createEvent } from 'effector';
import { PlayerStats } from '../../shared/types/visualNovel';
import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useStore } from 'effector-react';
import { $questState, $completedSteps, questStepCompleted, questStateChanged } from './model';

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

export interface PlayerData {
  _id: Id<"players">;
  name: string;
  locationHistory: any[];
  equipment: Record<string, any>;
}

export function usePlayer() {
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setPlayer({
            _id: "temporary-player-id" as unknown as Id<"players">,
            name: "Test Player",
            equipment: {},
            locationHistory: []
          });
        } else {
          const playerData = await getOrCreatePlayer({ userId: userId as any });
          setPlayer(playerData as PlayerData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [getOrCreatePlayer]);

  return { player, loading, error };
}

export function useQuest() {
  const questState = useStore($questState);
  const completedSteps = useStore($completedSteps);

  const completeStep = (stepId: string) => questStepCompleted(stepId);
  const setQuestState = (state: any) => questStateChanged(state);

  return { questState, completedSteps, completeStep, setQuestState };
}