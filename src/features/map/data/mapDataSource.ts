import { RELEASE_PROFILE } from "../../../config";
import { DEFAULT_REGION_ID, MAP_REGIONS } from "./regions";
import { STATIC_KARLSRUHE_EVENT_POINTS } from "./karlsruhe-event-static-points";
import { STATIC_FREIBURG_CASE01_POINTS } from "./static-points";
import type { MapDataSource, MapPoint, MapRegion, MapRegionId } from "../types";

const STATIC_POINTS_BY_REGION: Record<MapRegionId, MapPoint[]> = {
  FREIBURG_1905: STATIC_FREIBURG_CASE01_POINTS,
  KARLSRUHE_1905: STATIC_KARLSRUHE_EVENT_POINTS,
};

const DEFAULT_REGION_BY_PROFILE: Record<string, MapRegionId> = {
  default: DEFAULT_REGION_ID,
  karlsruhe_event: "KARLSRUHE_1905",
};

export const staticMapDataSource: MapDataSource = {
  getRegions(): MapRegion[] {
    return Object.values(MAP_REGIONS);
  },
  getPoints(regionId: MapRegionId): MapPoint[] {
    return STATIC_POINTS_BY_REGION[regionId] ?? [];
  },
  getDefaultRegionId(): MapRegionId {
    return DEFAULT_REGION_BY_PROFILE[RELEASE_PROFILE] ?? DEFAULT_REGION_ID;
  },
};
