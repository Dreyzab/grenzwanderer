export const MAP_CONFIG = {
  token: (import.meta as any).env.VITE_MAPBOX_TOKEN as string,
  defaultCenter: [7.8421, 47.9959] as [number, number], // Фрайбург
  defaultZoom: 13,
  bounds: [
    [7.78, 47.96], // Southwest
    [7.90, 48.03]  // Northeast
  ] as [[number, number], [number, number]],
  maxZoom: 18,
  minZoom: 11,
  tileUrl: 'mapbox://styles/mapbox/dark-v11'
} as const;

export const COST_OPTIMIZATION = {
  useStaticMaps: true,
  cacheEnabled: true,
  maxMapLoadsPerMonth: 1000,
  preloadRadius: 500
} as const; 