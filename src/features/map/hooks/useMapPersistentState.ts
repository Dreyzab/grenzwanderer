import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { parseSnapshot } from "../../vn/vnContent";
import { staticMapDataSource } from "../data/mapDataSource";
import { resolveScenarioForPoint } from "../data/scenario-mapping";
import { derivePointState } from "../model/derivePointState";
import {
  evaluateMapCondition,
  pickPrimaryBinding,
  pickTravelBinding,
  resolveAvailableBindings,
  resolveScenarioIdFromBindings,
} from "../model/mapResolver";
import {
  buildMysticStateSummary,
  isSightModeAllowed,
} from "../../mysticism/model/mysticism";
import type {
  MapDataSource,
  MapPoint,
  MapRegion,
  MapRegionId,
  MapResolverInputs,
  MapShadowRoute,
  RuntimeMapBinding,
  RuntimeMapPoint,
} from "../types";

const FALLBACK_REGION: MapRegion = {
  id: "FREIBURG_1905",
  name: "Freiburg im Breisgau (1905)",
  geoCenterLat: 47.9959,
  geoCenterLng: 7.8522,
  zoom: 14.2,
};

export interface UseMapPersistentStateResult {
  source: "legacy_v2" | "snapshot_v3";
  region: MapRegion;
  currentLocationId: string | null;
  points: RuntimeMapPoint[];
  activeFlags: ReadonlySet<string>;
  shadowRoutes: MapShadowRoute[];
  resolverInputs: MapResolverInputs;
  isReady: boolean;
}

const normalizeNumber = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

const makeLegacyBindings = (
  point: MapPoint,
  resolvedScenarioId: string | null,
): RuntimeMapBinding[] => {
  const bindings: RuntimeMapBinding[] = [
    {
      id: `sys_travel_${point.id}`,
      trigger: "card_secondary",
      label: "Travel",
      priority: 10,
      intent: "travel",
      actions: [{ type: "travel_to", locationId: point.locationId }],
      hasStartScenario: false,
      hasTravelAction: true,
    },
  ];

  if (resolvedScenarioId) {
    bindings.unshift({
      id: `legacy_start_${point.id}`,
      trigger: "card_primary",
      label: "Start Scenario",
      priority: 100,
      intent: "interaction",
      actions: [{ type: "start_scenario", scenarioId: resolvedScenarioId }],
      hasStartScenario: true,
      hasTravelAction: false,
    });
  }

  return bindings;
};

const appendAgencyCommandBinding = (
  point: { id: string },
  bindings: readonly RuntimeMapBinding[],
): RuntimeMapBinding[] => {
  if (point.id !== "loc_agency") {
    return [...bindings];
  }

  if (bindings.some((binding) => binding.id === "agency_command_desk")) {
    return [...bindings];
  }

  return [
    ...bindings,
    {
      id: "agency_command_desk",
      trigger: "card_secondary",
      label: "Open command desk",
      priority: 80,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "agency_briefing_complete", value: true },
      ],
      actions: [
        {
          type: "open_command_mode",
          scenarioId: "agency_evening_briefing",
          returnTab: "map",
        },
      ],
      hasStartScenario: false,
      hasTravelAction: false,
    },
  ];
};

const resolveQuestObjectivePointIds = (
  questCatalog:
    | ReadonlyArray<{
        id: string;
        stages: ReadonlyArray<{
          stage: number;
          objectivePointIds?: string[];
        }>;
      }>
    | null
    | undefined,
  questStages: ReadonlyMap<string, number>,
): ReadonlySet<string> => {
  if (!questCatalog || questCatalog.length === 0) {
    return new Set<string>();
  }

  const pointIds = new Set<string>();
  for (const quest of questCatalog) {
    const currentStage = questStages.get(quest.id) ?? 1;
    const stage =
      quest.stages.find((entry) => entry.stage === currentStage) ??
      quest.stages.find((entry) => entry.stage > currentStage) ??
      null;
    if (!stage?.objectivePointIds) {
      continue;
    }
    for (const pointId of stage.objectivePointIds) {
      pointIds.add(pointId);
    }
  }

  return pointIds;
};

const resolvePersistentVisibility = (
  point: RuntimeMapPoint,
  agencyBriefingComplete: boolean,
  resolverInputs: MapResolverInputs,
  mysticState: ReturnType<typeof buildMysticStateSummary>,
): boolean => {
  const hasMysticVisibilityRules = Boolean(
    point.visibilityModes || point.distortionWindow || point.revealConditions,
  );

  const baseVisibility = (() => {
    if (point.category === "HUB") {
      return true;
    }
    if (!agencyBriefingComplete) {
      return false;
    }
    if (point.category === "PUBLIC") {
      return true;
    }
    return point.state !== "locked" || hasMysticVisibilityRules;
  })();

  if (!baseVisibility) {
    return false;
  }

  if (!hasMysticVisibilityRules) {
    return true;
  }

  if (!isSightModeAllowed(point.visibilityModes, mysticState.activeSightMode)) {
    return false;
  }

  const minAwakening = point.distortionWindow?.minAwakening ?? 0;
  const maxAwakening = point.distortionWindow?.maxAwakening ?? 100;
  if (
    mysticState.awakeningLevel < minAwakening ||
    mysticState.awakeningLevel > maxAwakening
  ) {
    return false;
  }

  if (
    point.revealConditions &&
    !point.revealConditions.every((condition) =>
      evaluateMapCondition(
        {
          ...resolverInputs,
          pointState: point.state,
        },
        condition,
      ),
    )
  ) {
    return false;
  }

  return true;
};

export const useMapPersistentState = (
  mapDataSource: MapDataSource = staticMapDataSource,
  regionId?: MapRegionId,
): UseMapPersistentStateResult => {
  const { identityHex } = useIdentity();
  const [locations, locationsReady] = useTable(tables.playerLocation);
  const [flags, flagsReady] = useTable(tables.playerFlag);
  const [unlockGroups, unlockGroupsReady] = useTable(tables.playerUnlockGroup);
  const [vars, varsReady] = useTable(tables.playerVar);
  const [inventory, inventoryReady] = useTable(tables.playerInventory);
  const [evidence, evidenceReady] = useTable(tables.playerEvidence);
  const [quests, questsReady] = useTable(tables.playerQuest);
  const [relationships, relationshipsReady] = useTable(
    tables.playerRelationship,
  );
  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);

  return useMemo(() => {
    const playerIdFilter = (playerId: { toHexString(): string }): boolean =>
      identityHex.length > 0 && playerId.toHexString() === identityHex;

    const activeVersion = versions.find((entry) => entry.isActive) ?? null;
    const snapshotRow = activeVersion
      ? (snapshots.find((entry) => entry.checksum === activeVersion.checksum) ??
        null)
      : null;
    const snapshot = snapshotRow
      ? parseSnapshot(snapshotRow.payloadJson)
      : null;
    const contentReady =
      (versionsReady && snapshotsReady) || Boolean(activeVersion && snapshot);
    const source =
      snapshot?.schemaVersion && snapshot.schemaVersion >= 3 && snapshot.map
        ? "snapshot_v3"
        : "legacy_v2";

    const regions =
      source === "snapshot_v3" && snapshot?.map
        ? snapshot.map.regions
        : mapDataSource.getRegions();
    const selectedRegionId =
      regionId ??
      (source === "snapshot_v3" && snapshot?.map
        ? snapshot.map.defaultRegionId
        : mapDataSource.getDefaultRegionId());
    const selectedRegion =
      regions.find((entry) => entry.id === selectedRegionId) ??
      regions[0] ??
      FALLBACK_REGION;

    const currentLocationId =
      identityHex.length > 0
        ? (locations.find((entry) => playerIdFilter(entry.playerId))
            ?.locationId ?? null)
        : null;

    const activeFlags = new Set<string>();
    const visitedFlags = new Set<string>();
    const completedFlags = new Set<string>();
    for (const row of flags) {
      if (!playerIdFilter(row.playerId) || !row.value) {
        continue;
      }
      activeFlags.add(row.key);
      if (row.key.startsWith("VISITED_")) {
        visitedFlags.add(row.key);
      }
      if (row.key.startsWith("COMPLETED_")) {
        completedFlags.add(row.key);
      }
    }

    const unlockedGroups = new Set<string>();
    for (const row of unlockGroups) {
      if (!playerIdFilter(row.playerId)) {
        continue;
      }
      unlockedGroups.add(row.groupId);
    }

    const varsByKey = new Map<string, number>();
    for (const row of vars) {
      if (!playerIdFilter(row.playerId)) {
        continue;
      }
      varsByKey.set(row.key, row.floatValue);
    }

    const inventoryItemIds = new Set<string>();
    for (const row of inventory) {
      if (!playerIdFilter(row.playerId)) {
        continue;
      }
      if (normalizeNumber(row.quantity) > 0) {
        inventoryItemIds.add(row.itemId);
      }
    }

    const evidenceIds = new Set<string>();
    for (const row of evidence) {
      if (!playerIdFilter(row.playerId)) {
        continue;
      }
      evidenceIds.add(row.evidenceId);
    }

    const questStages = new Map<string, number>();
    for (const row of quests) {
      if (!playerIdFilter(row.playerId)) {
        continue;
      }
      questStages.set(row.questId, normalizeNumber(row.stage));
    }

    const relationshipValues = new Map<string, number>();
    for (const row of relationships) {
      if (!playerIdFilter(row.playerId)) {
        continue;
      }
      relationshipValues.set(row.characterId, row.value);
    }

    const resolverInputs: MapResolverInputs = {
      flags: activeFlags,
      vars: varsByKey,
      inventoryItemIds,
      evidenceIds,
      unlockGroupIds: unlockedGroups,
      questStages,
      relationships: relationshipValues,
    };
    const mysticState = buildMysticStateSummary(
      Object.fromEntries(varsByKey.entries()),
    );

    const availableScenarioIds = new Set(
      snapshot?.scenarios.map((scenario) => scenario.id) ?? [],
    );
    const objectivePointIds = resolveQuestObjectivePointIds(
      snapshot?.questCatalog,
      questStages,
    );
    const agencyBriefingComplete = activeFlags.has("agency_briefing_complete");

    const sourcePoints =
      source === "snapshot_v3" && snapshot?.map
        ? snapshot.map.points.filter(
            (point) => point.regionId === selectedRegion.id,
          )
        : mapDataSource.getPoints(selectedRegion.id);

    const points: RuntimeMapPoint[] = sourcePoints
      .map((point) => {
        const normalizedCategory =
          point.category ?? (point.id === "loc_agency" ? "HUB" : "PUBLIC");
        const state = derivePointState(
          point,
          currentLocationId,
          visitedFlags,
          unlockedGroups,
          completedFlags,
        );

        if (source === "snapshot_v3") {
          const availableBindings = appendAgencyCommandBinding(
            point,
            resolveAvailableBindings(point.bindings, {
              ...resolverInputs,
              pointState: state,
            }),
          );

          const primaryBinding = pickPrimaryBinding(availableBindings);
          const travelBinding = pickTravelBinding(availableBindings);
          const resolvedScenarioId =
            resolveScenarioIdFromBindings(availableBindings);
          const canStartScenario = resolvedScenarioId !== null;

          const runtimePoint: RuntimeMapPoint = {
            ...point,
            category: normalizedCategory,
            state,
            availableBindings,
            primaryBinding,
            travelBinding,
            isObjectiveActive:
              objectivePointIds.has(point.id) ||
              availableBindings.some(
                (binding) => binding.intent === "objective",
              ),
            canTravel: travelBinding !== null,
            resolvedScenarioId,
            canStartScenario,
            isVisible: false,
            runtimeSource: "persistent",
          };

          return {
            ...runtimePoint,
            isVisible: resolvePersistentVisibility(
              runtimePoint,
              agencyBriefingComplete,
              resolverInputs,
              mysticState,
            ),
          };
        }

        const legacyPoint = point as MapPoint;
        const resolvedScenarioId = resolveScenarioForPoint(
          legacyPoint.legacyScenarioIds,
          availableScenarioIds,
        );
        const availableBindings = appendAgencyCommandBinding(
          legacyPoint,
          makeLegacyBindings(legacyPoint, resolvedScenarioId),
        );
        const primaryBinding = pickPrimaryBinding(availableBindings);
        const travelBinding = pickTravelBinding(availableBindings);

        const runtimePoint: RuntimeMapPoint = {
          ...legacyPoint,
          category: normalizedCategory,
          state,
          availableBindings,
          primaryBinding,
          travelBinding,
          isObjectiveActive: false,
          canTravel: travelBinding !== null,
          resolvedScenarioId,
          canStartScenario: resolvedScenarioId !== null,
          isVisible: true,
          runtimeSource: "persistent",
        };

        return runtimePoint;
      })
      .filter((point) => point.isVisible);

    return {
      source,
      region: selectedRegion,
      currentLocationId,
      points,
      activeFlags,
      shadowRoutes:
        source === "snapshot_v3" && snapshot?.map
          ? (snapshot.map.shadowRoutes?.filter(
              (route) => route.regionId === selectedRegion.id,
            ) ?? [])
          : [],
      resolverInputs,
      isReady:
        locationsReady &&
        flagsReady &&
        unlockGroupsReady &&
        varsReady &&
        inventoryReady &&
        evidenceReady &&
        questsReady &&
        relationshipsReady &&
        contentReady,
    };
  }, [
    evidence,
    evidenceReady,
    flags,
    flagsReady,
    identityHex,
    inventory,
    inventoryReady,
    locations,
    locationsReady,
    mapDataSource,
    quests,
    questsReady,
    regionId,
    relationships,
    relationshipsReady,
    snapshots,
    snapshotsReady,
    unlockGroups,
    unlockGroupsReady,
    vars,
    varsReady,
    versions,
    versionsReady,
  ]);
};
