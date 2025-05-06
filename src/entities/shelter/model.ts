import { createStore, createEvent, createEffect } from 'effector';
import { api } from '../../../convex/_generated/api';
import { Shelter, ShelterStation, CraftJob } from '../../schared/types/shelter';
import { convex } from '../../app/convex';
import { Id } from '../../../convex/_generated/dataModel';

// События
export const setShelter = createEvent<Shelter>();
export const clearShelter = createEvent();
export const addShelterResource = createEvent<{ resourceId: string, amount: number }>();
export const removeShelterResource = createEvent<{ resourceId: string, amount: number }>();
export const upgradeStation = createEvent<{ stationType: string, newLevel: number }>();
export const addCraftJob = createEvent<CraftJob>();
export const completeCraftJob = createEvent<number>();
export const cancelCraftJob = createEvent<number>();

// Тут используем хардкод для типов, так как API еще может быть не полностью сгенерировано
// В реальном проекте нужно использовать точные типы из API
type ShelterAPI = any;

// Эффекты с более общими типами
export const loadShelterFx = createEffect(async (playerId: string) => {
  try {
    return await convex.query(api.shelter.getShelter, { playerId });
  } catch (error) {
    console.error("Ошибка при загрузке убежища:", error);
    throw error;
  }
});

export const createShelterFx = createEffect(async ({ playerId, name }: { playerId: string, name?: string }) => {
  try {
    const shelterId = await convex.mutation(api.shelter.createShelter, { playerId, name });
    return await convex.query(api.shelter.getShelter, { playerId });
  } catch (error) {
    console.error("Ошибка при создании убежища:", error);
    throw error;
  }
});

export const addResourcesFx = createEffect(async ({ shelterId, resources }: { shelterId: string, resources: Record<string, number> }) => {
  try {
    const updatedResources = await convex.mutation(api.shelter.addResources, { shelterId, resources });
    return { shelterId, resources: updatedResources };
  } catch (error) {
    console.error("Ошибка при добавлении ресурсов:", error);
    throw error;
  }
});

export const upgradeStationFx = createEffect(async ({ shelterId, stationType, newLevel }: { shelterId: string, stationType: string, newLevel: number }) => {
  try {
    const stations = await convex.mutation(api.shelter.upgradeStation, { shelterId, stationType, newLevel });
    return { shelterId, stations };
  } catch (error) {
    console.error("Ошибка при улучшении станции:", error);
    throw error;
  }
});

export const startCraftingFx = createEffect(async ({ shelterId, recipeId, stationType }: { shelterId: string, recipeId: string, stationType: string }) => {
  try {
    const craftJob = await convex.mutation(api.shelter.startCrafting, { shelterId, recipeId, stationType });
    return { shelterId, craftJob };
  } catch (error) {
    console.error("Ошибка при начале крафта:", error);
    throw error;
  }
});

export const claimCraftResultFx = createEffect(async ({ shelterId, craftIndex, playerId }: { shelterId: string, craftIndex: number, playerId: string }) => {
  try {
    const result = await convex.mutation(api.shelter.claimCraftResult, { shelterId, craftIndex, playerId });
    return { shelterId, craftIndex, result };
  } catch (error) {
    console.error("Ошибка при получении результата крафта:", error);
    throw error;
  }
});

export const cancelCraftingFx = createEffect(async ({ shelterId, craftIndex }: { shelterId: string, craftIndex: number }) => {
  try {
    const success = await convex.mutation(api.shelter.cancelCrafting, { shelterId, craftIndex });
    return { shelterId, craftIndex, success };
  } catch (error) {
    console.error("Ошибка при отмене крафта:", error);
    throw error;
  }
});

// Stores
export const $shelter = createStore<Shelter | null>(null)
  .on(setShelter, (_, shelter) => shelter)
  .on(clearShelter, () => null)
  .on(addShelterResource, (state, { resourceId, amount }) => {
    if (!state) return null;
    const resources = { ...state.resources };
    resources[resourceId] = (resources[resourceId] || 0) + amount;
    return { ...state, resources };
  })
  .on(removeShelterResource, (state, { resourceId, amount }) => {
    if (!state) return null;
    const resources = { ...state.resources };
    resources[resourceId] = Math.max(0, (resources[resourceId] || 0) - amount);
    return { ...state, resources };
  })
  .on(upgradeStation, (state, { stationType, newLevel }) => {
    if (!state) return null;
    const stations = [...state.stations];
    const stationIndex = stations.findIndex(s => s.type === stationType);
    if (stationIndex >= 0) {
      stations[stationIndex] = { ...stations[stationIndex], level: newLevel };
    } else {
      stations.push({ type: stationType, level: newLevel });
    }
    return { ...state, stations };
  })
  .on(addCraftJob, (state, craftJob) => {
    if (!state) return null;
    return { ...state, activeCrafts: [...state.activeCrafts, craftJob] };
  })
  .on(completeCraftJob, (state, index) => {
    if (!state) return null;
    const activeCrafts = state.activeCrafts.filter((_, i) => i !== index);
    return { ...state, activeCrafts };
  })
  .on(cancelCraftJob, (state, index) => {
    if (!state) return null;
    const activeCrafts = state.activeCrafts.filter((_, i) => i !== index);
    return { ...state, activeCrafts };
  });

// Store для загрузки
export const $shelterLoading = createStore(false)
  .on(loadShelterFx.pending, (_, pending) => pending)
  .on(createShelterFx.pending, (_, pending) => pending);

// Store для ошибок
export const $shelterError = createStore<string | null>(null)
  .on(loadShelterFx.failData, (_, error) => error.message ?? "Ошибка при загрузке убежища")
  .on(createShelterFx.failData, (_, error) => error.message ?? "Ошибка при создании убежища")
  .on(addResourcesFx.failData, (_, error) => error.message ?? "Ошибка при добавлении ресурсов")
  .on(upgradeStationFx.failData, (_, error) => error.message ?? "Ошибка при улучшении станции")
  .on(startCraftingFx.failData, (_, error) => error.message ?? "Ошибка при начале крафта")
  .on(claimCraftResultFx.failData, (_, error) => error.message ?? "Ошибка при получении результата крафта")
  .on(cancelCraftingFx.failData, (_, error) => error.message ?? "Ошибка при отмене крафта");

// Подписки на эффекты
loadShelterFx.doneData.watch(shelter => {
  if (shelter) setShelter(shelter);
});

createShelterFx.doneData.watch(shelter => {
  if (shelter) setShelter(shelter);
}); 