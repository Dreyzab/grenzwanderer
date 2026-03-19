import { CANONICAL_FACTION_REGISTRY } from "../../../data/factionContract";
import {
  CURRENT_VN_SNAPSHOT_SCHEMA_VERSION,
  MIN_VN_SCHEMA_WITH_MAP,
} from "./snapshotSchema";
import type { VnSnapshot } from "./types";

const mergeSnapshot = (
  base: VnSnapshot,
  overrides: Partial<VnSnapshot>,
): VnSnapshot => ({
  ...base,
  ...overrides,
  vnRuntime:
    "vnRuntime" in overrides
      ? overrides.vnRuntime
      : base.vnRuntime
        ? { ...base.vnRuntime }
        : undefined,
  mindPalace: overrides.mindPalace ?? base.mindPalace,
  socialCatalog:
    "socialCatalog" in overrides
      ? overrides.socialCatalog === undefined
        ? undefined
        : {
            ...base.socialCatalog,
            ...overrides.socialCatalog,
            factions:
              overrides.socialCatalog.factions ?? base.socialCatalog?.factions,
            npcIdentities:
              overrides.socialCatalog.npcIdentities ??
              base.socialCatalog?.npcIdentities ??
              [],
            services:
              overrides.socialCatalog.services ??
              base.socialCatalog?.services ??
              [],
            rumors:
              overrides.socialCatalog.rumors ??
              base.socialCatalog?.rumors ??
              [],
            careerRanks:
              overrides.socialCatalog.careerRanks ??
              base.socialCatalog?.careerRanks ??
              [],
          }
      : base.socialCatalog,
  mysticism:
    "mysticism" in overrides
      ? overrides.mysticism
      : base.mysticism
        ? {
            entityArchetypes: [...base.mysticism.entityArchetypes],
            observations: [...base.mysticism.observations],
          }
        : undefined,
  map:
    "map" in overrides
      ? overrides.map === undefined
        ? undefined
        : {
            ...base.map,
            ...overrides.map,
            regions: overrides.map.regions ?? base.map?.regions ?? [],
            points: overrides.map.points ?? base.map?.points ?? [],
            shadowRoutes:
              overrides.map.shadowRoutes ?? base.map?.shadowRoutes ?? [],
            qrCodeRegistry:
              overrides.map.qrCodeRegistry ?? base.map?.qrCodeRegistry ?? [],
            mapEventTemplates:
              overrides.map.mapEventTemplates ??
              base.map?.mapEventTemplates ??
              [],
            testDefaults: overrides.map.testDefaults ?? base.map?.testDefaults,
          }
      : base.map === undefined
        ? undefined
        : {
            ...base.map,
            regions: [...base.map.regions],
            points: [...base.map.points],
            shadowRoutes: base.map.shadowRoutes
              ? [...base.map.shadowRoutes]
              : undefined,
            qrCodeRegistry: base.map.qrCodeRegistry
              ? [...base.map.qrCodeRegistry]
              : undefined,
            mapEventTemplates: base.map.mapEventTemplates
              ? [...base.map.mapEventTemplates]
              : undefined,
          },
  questCatalog:
    "questCatalog" in overrides ? overrides.questCatalog : base.questCatalog,
});

export const createTestSnapshot = (
  overrides: Partial<VnSnapshot> = {},
): VnSnapshot =>
  mergeSnapshot(
    {
      schemaVersion: CURRENT_VN_SNAPSHOT_SCHEMA_VERSION,
      scenarios: [],
      nodes: [],
      vnRuntime: {
        defaultEntryScenarioId: "sandbox_case01_pilot",
      },
      mindPalace: {
        cases: [],
        facts: [],
        hypotheses: [],
      },
      mysticism: {
        entityArchetypes: [],
        observations: [],
      },
      map: {
        defaultRegionId: "FREIBURG_1905",
        regions: [
          {
            id: "FREIBURG_1905",
            name: "Freiburg",
            geoCenterLat: 47.9959,
            geoCenterLng: 7.8522,
            zoom: 14.2,
          },
        ],
        points: [],
        shadowRoutes: [],
        qrCodeRegistry: [],
        mapEventTemplates: [],
      },
      questCatalog: [],
      socialCatalog: {
        factions: CANONICAL_FACTION_REGISTRY,
        npcIdentities: [],
        services: [],
        rumors: [],
        careerRanks: [],
      },
    },
    overrides,
  );

export const createLegacyMaplessSnapshot = (
  overrides: Partial<VnSnapshot> = {},
): VnSnapshot =>
  mergeSnapshot(
    {
      schemaVersion: MIN_VN_SCHEMA_WITH_MAP - 1,
      scenarios: [],
      nodes: [],
      mindPalace: {
        cases: [],
        facts: [],
        hypotheses: [],
      },
      vnRuntime: {},
    },
    overrides,
  );
