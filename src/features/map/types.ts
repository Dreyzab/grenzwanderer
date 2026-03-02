import type {
  MapAction,
  MapBinding,
  MapCondition,
  MapPointSnapshot,
  MapRegionSnapshot,
} from "../vn/types";

export type PinVisualState = "locked" | "discovered" | "visited" | "completed";

export type MapRegionId = string;
export type MapRegion = MapRegionSnapshot;

export interface MapPoint extends Omit<MapPointSnapshot, "bindings"> {
  bindings?: MapBinding[];
  legacyScenarioIds?: string[];
}

export interface RuntimeMapBinding extends MapBinding {
  hasStartScenario: boolean;
  hasTravelAction: boolean;
}

export interface RuntimeMapPoint extends MapPoint {
  state: PinVisualState;
  availableBindings: RuntimeMapBinding[];
  primaryBinding: RuntimeMapBinding | null;
  travelBinding: RuntimeMapBinding | null;
  isObjectiveActive: boolean;
  canTravel: boolean;
  resolvedScenarioId: string | null;
  canStartScenario: boolean;
  isVisible: boolean;
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
}

export type { MapAction, MapBinding, MapCondition };
