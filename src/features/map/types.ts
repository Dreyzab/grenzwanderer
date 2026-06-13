import type {
  MapAction,
  MapBinding,
  MapCondition,
  MapDiscoveryRule,
  MapPointCategory,
  MapPointSnapshot,
  MapRegionSnapshot,
  MapShadowRoute,
} from "../vn/types";

export type PinVisualState = "locked" | "discovered" | "visited" | "completed";

export const MAP_POINT_STATES = [
  "locked",
  "discovered",
  "visited",
  "completed",
] as const satisfies readonly PinVisualState[];

export type MapRegionId = string;
export type MapRegion = MapRegionSnapshot;

export interface MapPoint extends Omit<
  MapPointSnapshot,
  "bindings" | "category"
> {
  bindings?: MapBinding[];
  category?: MapPointCategory;
  isSearchZone?: boolean;
  radius?: number;
  isHidden?: boolean;
  /**
   * Optional Freiburg Pflastermosaik motif for the cobblestone POI marker.
   * Valid values: 'cross-saint-george' | 'masks' | 'sacred-heart' | 'mountain'
   * | 'partner-arms' | 'gate' | 'pretzel' | 'dove' | 'rail' | 'boot' | 'seal'.
   * When omitted, the renderer falls back to a category default.
   */
  mosaicSymbol?: string;
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
  isSearchZone?: boolean;
  radius?: number;
  isHidden?: boolean;
  runtimeSource?: "persistent" | "ephemeral";
  persistentPointId?: string;
  eventId?: string;
  expiresAtMs?: number;
  sourceLocationId?: string;
}

export type JourneyDiscoveryCandidate = RuntimeMapPoint;

export interface RuntimeMapRoute extends Omit<MapShadowRoute, "pointIds"> {
  pointIds: string[];
  coordinates: [number, number][];
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

export type {
  MapAction,
  MapBinding,
  MapCondition,
  MapDiscoveryRule,
  MapShadowRoute,
};
