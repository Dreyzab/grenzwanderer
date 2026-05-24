import type { RuntimeMapPoint } from "../types";

export type LngLatTuple = [number, number];

export const EARTH_RADIUS_METERS = 6_371_000;
export const DESKTOP_JOURNEY_SPEED_KMH = 18;
export const DEFAULT_DISCOVERY_RADIUS_METERS = 50;
export const DEFAULT_SEARCH_RADIUS_METERS = 80;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export const normalizeBearingDegrees = (degrees: number): number =>
  ((degrees % 360) + 360) % 360;

export const haversineDistanceMeters = (
  from: LngLatTuple,
  to: LngLatTuple,
): number => {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

export const calculateBearingDegrees = (
  from: LngLatTuple,
  to: LngLatTuple,
): number => {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const deltaLng = toRadians(toLng - fromLng);
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return normalizeBearingDegrees(toDegrees(Math.atan2(y, x)));
};

export const interpolateLngLat = (
  from: LngLatTuple,
  to: LngLatTuple,
  progress: number,
): LngLatTuple => {
  const clamped = Math.max(0, Math.min(1, progress));
  return [
    from[0] + (to[0] - from[0]) * clamped,
    from[1] + (to[1] - from[1]) * clamped,
  ];
};

export const speedKmhToMetersPerSecond = (speedKmH: number): number =>
  Math.max(0, speedKmH) / 3.6;

export const durationSecondsForDistance = (
  distanceMeters: number,
  speedKmH: number,
): number => {
  const metersPerSecond = speedKmhToMetersPerSecond(speedKmH);
  if (metersPerSecond <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, distanceMeters) / metersPerSecond;
};

export const resolveDiscoveryRadiusMeters = (
  point: Pick<
    RuntimeMapPoint,
    "discoveryRadiusMeters" | "isSearchZone" | "searchRadiusMeters"
  >,
): number =>
  point.discoveryRadiusMeters ??
  (point.isSearchZone
    ? (point.searchRadiusMeters ?? DEFAULT_SEARCH_RADIUS_METERS)
    : DEFAULT_DISCOVERY_RADIUS_METERS);

export const isPointWithinDiscoveryRadius = (
  position: LngLatTuple,
  point: Pick<
    RuntimeMapPoint,
    | "lng"
    | "lat"
    | "discoveryRadiusMeters"
    | "isSearchZone"
    | "searchRadiusMeters"
  >,
): boolean =>
  haversineDistanceMeters(position, [point.lng, point.lat]) <=
  resolveDiscoveryRadiusMeters(point);
