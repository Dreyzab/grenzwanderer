import type { MapRegion, MapRegionId } from "../types";

export const MAP_REGIONS: Record<MapRegionId, MapRegion> = {
  FREIBURG_1905: {
    id: "FREIBURG_1905",
    name: "Freiburg im Breisgau (1905)",
    geoCenterLat: 47.9959,
    geoCenterLng: 7.8522,
    zoom: 14.2,
  },
  KARLSRUHE_1905: {
    id: "KARLSRUHE_1905",
    name: "Karlsruhe (1905)",
    geoCenterLat: 49.0069,
    geoCenterLng: 8.4037,
    zoom: 13,
  },
};

export const DEFAULT_REGION_ID: MapRegionId = "FREIBURG_1905";
