import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { parseSnapshot } from "../../vn/vnContent";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { staticMapDataSource } from "../data/mapDataSource";
import { resolveScenarioForPoint } from "../data/scenario-mapping";
import { derivePointState } from "../model/derivePointState";
import type {
  MapDataSource,
  MapRegion,
  MapRegionId,
  RuntimeMapPoint,
} from "../types";

export interface UseMapRuntimeStateResult {
  region: MapRegion;
  currentLocationId: string | null;
  points: RuntimeMapPoint[];
  isReady: boolean;
}

export const useMapRuntimeState = (
  mapDataSource: MapDataSource = staticMapDataSource,
  regionId?: MapRegionId,
): UseMapRuntimeStateResult => {
  const { identityHex } = useIdentity();
  const [locations, locationsReady] = useTable(tables.playerLocation);
  const [flags, flagsReady] = useTable(tables.playerFlag);
  const [unlockGroups, unlockGroupsReady] = useTable(tables.playerUnlockGroup);
  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);

  return useMemo(() => {
    const regions = mapDataSource.getRegions();
    const fallbackRegion = regions[0];
    const selectedRegionId = regionId ?? mapDataSource.getDefaultRegionId();
    const selectedRegion =
      regions.find((entry) => entry.id === selectedRegionId) ?? fallbackRegion;

    if (!selectedRegion) {
      return {
        region: {
          id: "FREIBURG_1905",
          name: "Freiburg im Breisgau (1905)",
          geoCenterLat: 47.9959,
          geoCenterLng: 7.8522,
          zoom: 14.2,
        },
        currentLocationId: null,
        points: [],
        isReady: false,
      };
    }

    const activeVersion = versions.find((entry) => entry.isActive) ?? null;
    const snapshotRow = activeVersion
      ? (snapshots.find((entry) => entry.checksum === activeVersion.checksum) ??
        null)
      : null;
    const snapshot = snapshotRow
      ? parseSnapshot(snapshotRow.payloadJson)
      : null;
    const availableScenarioIds = new Set(
      snapshot?.scenarios.map((scenario) => scenario.id) ?? [],
    );

    const playerLocation =
      identityHex.length > 0
        ? locations.find(
            (entry) => entry.playerId.toHexString() === identityHex,
          )
        : undefined;
    const currentLocationId = playerLocation?.locationId ?? null;

    const visitedFlags = new Set<string>();
    const unlockedGroups = new Set<string>();

    if (identityHex.length > 0) {
      for (const row of flags) {
        if (row.playerId.toHexString() !== identityHex) {
          continue;
        }
        if (!row.value) {
          continue;
        }
        if (!row.key.startsWith("VISITED_")) {
          continue;
        }
        visitedFlags.add(row.key);
      }

      for (const row of unlockGroups) {
        if (row.playerId.toHexString() !== identityHex) {
          continue;
        }
        unlockedGroups.add(row.groupId);
      }
    }

    const points: RuntimeMapPoint[] = mapDataSource
      .getPoints(selectedRegion.id)
      .map((point) => {
        const state = derivePointState(
          point,
          currentLocationId,
          visitedFlags,
          unlockedGroups,
        );
        const resolvedScenarioId = resolveScenarioForPoint(
          point.legacyScenarioIds,
          availableScenarioIds,
        );

        return {
          ...point,
          state,
          canTravel: true,
          resolvedScenarioId,
          canStartScenario: resolvedScenarioId !== null,
        };
      });

    return {
      region: selectedRegion,
      currentLocationId,
      points,
      isReady:
        locationsReady &&
        flagsReady &&
        unlockGroupsReady &&
        versionsReady &&
        snapshotsReady,
    };
  }, [
    flags,
    flagsReady,
    identityHex,
    locations,
    locationsReady,
    mapDataSource,
    regionId,
    snapshots,
    snapshotsReady,
    unlockGroups,
    unlockGroupsReady,
    versions,
    versionsReady,
  ]);
};
