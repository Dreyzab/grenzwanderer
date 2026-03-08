import type {
  MapAction,
  MapBinding,
  MapCondition,
  MapPointCategory,
  MapPointSnapshot,
  MapRegionSnapshot,
  MapShadowRoute,
} from "../vn/types";

export type PinVisualState = "locked" | "discovered" | "visited" | "completed";

export type MapRegionId = string;
export type MapRegion = MapRegionSnapshot;

export interface MapPoint extends Omit<MapPointSnapshot, "bindings" | "category"> {
  bindings?: MapBinding[];
  legacyScenarioIds?: string[];
  category?: MapPointCategory;
}

export interface RuntimeMapBinding extends MapBinding {
  hasStartScenario: boolean;
  hasTravelAction: boolean;
}

export interface RuntimeMapPoint extends MapPoint {
  category: MapPointCategory;
  state: PinVisualState;
  availableBindings: RuntimeMapBinding[];
  primaryBinding: RuntimeMapBinding | null;
  travelBinding: RuntimeMapBinding | null;
  isObjectiveActive: boolean;
  canTravel: boolean;
  resolvedScenarioId: string | null;
  canStartScenario: boolean;
  isVisible: boolean;
  runtimeSource?: "persistent" | "ephemeral";
  persistentPointId?: string;
  eventId?: string;
  expiresAtMs?: number;
  sourceLocationId?: string;
}

export interface RuntimeMapRoute extends Omit<MapShadowRoute, "pointIds"> {
  pointIds: string[];
  coordinates: [number, number][];
}

export interface MapDataSource {
  getRegions(): MapRegion[];
  getPoints(regionId: MapRegionId): MapPoint[];
  getDefaultRegionId(): MapRegionId;
}

export interface MapResolverContext {
  pointState: PinVisualState;
  flags: ReadonlySet<string>;
  vars: ReadonlyMap<string, number>;
  inventoryItemIds: ReadonlySet<string>;
  evidenceIds: ReadonlySet<string>;
  unlockGroupIds: ReadonlySet<string>;
  questStages: ReadonlyMap<string, number>;
  relationships: ReadonlyMap<string, number>;
  favorBalances: ReadonlyMap<string, number>;
  agencyStanding: number;
  careerRankId: string | null;
  rumorStates: ReadonlyMap<string, string>;
  careerRankOrder: ReadonlyMap<string, number>;
}

export type MapResolverInputs = Omit<MapResolverContext, "pointState">;

export type { MapAction, MapBinding, MapCondition, MapShadowRoute };
