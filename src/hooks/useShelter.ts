import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useCallback } from "react";
import { Shelter } from "../schared/types/shelter";

export function useShelter(playerId?: string) {
  const [error, setError] = useState<string | null>(null);
  const shelter = useQuery(api.shelter.getShelter, playerId ? { playerId } : "skip");
  const createShelter = useMutation(api.shelter.createShelter);
  const addResources = useMutation(api.shelter.addResources);
  const upgradeStation = useMutation(api.shelter.upgradeStation);
  const startCrafting = useMutation(api.shelter.startCrafting);
  const claimCraftResult = useMutation(api.shelter.claimCraftResult);
  const cancelCrafting = useMutation(api.shelter.cancelCrafting);
  const getAvailableRecipes = useQuery(api.shelter.getAvailableRecipes, shelter?._id ? { shelterId: shelter._id } : "skip");

  const handleCreateShelter = useCallback(async (name?: string) => {
    if (!playerId) return;
    try {
      await createShelter({ playerId, name });
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [playerId, createShelter]);

  return {
    shelter,
    error,
    createShelter: handleCreateShelter,
    addResources,
    upgradeStation,
    startCrafting,
    claimCraftResult,
    cancelCrafting,
    getAvailableRecipes
  };
} 