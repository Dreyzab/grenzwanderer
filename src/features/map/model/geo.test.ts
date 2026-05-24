import { describe, expect, it } from "vitest";
import {
  DESKTOP_JOURNEY_SPEED_KMH,
  calculateBearingDegrees,
  durationSecondsForDistance,
  haversineDistanceMeters,
  interpolateLngLat,
  isPointWithinDiscoveryRadius,
} from "./geo";

describe("map geo utilities", () => {
  it("calculates haversine distance in meters", () => {
    const distance = haversineDistanceMeters(
      [7.8522, 47.9959],
      [7.8622, 47.9959],
    );

    expect(distance).toBeGreaterThan(740);
    expect(distance).toBeLessThan(750);
  });

  it("calculates compass bearing with north as zero degrees", () => {
    expect(calculateBearingDegrees([7.85, 47.99], [7.85, 48])).toBeCloseTo(
      0,
      1,
    );
    expect(calculateBearingDegrees([7.85, 47.99], [7.86, 47.99])).toBeCloseTo(
      90,
      0,
    );
  });

  it("interpolates coordinates with clamped progress", () => {
    expect(interpolateLngLat([7, 47], [9, 49], 0.25)).toEqual([7.5, 47.5]);
    expect(interpolateLngLat([7, 47], [9, 49], 2)).toEqual([9, 49]);
  });

  it("derives desktop duration from 18 km/h speed", () => {
    expect(durationSecondsForDistance(1_000, DESKTOP_JOURNEY_SPEED_KMH)).toBe(
      200,
    );
  });

  it("detects points inside custom discovery radius", () => {
    expect(
      isPointWithinDiscoveryRadius([7.8522, 47.9959], {
        lng: 7.8524,
        lat: 47.9959,
        discoveryRadiusMeters: 25,
      }),
    ).toBe(true);
    expect(
      isPointWithinDiscoveryRadius([7.8522, 47.9959], {
        lng: 7.8622,
        lat: 47.9959,
        discoveryRadiusMeters: 25,
      }),
    ).toBe(false);
  });
});
