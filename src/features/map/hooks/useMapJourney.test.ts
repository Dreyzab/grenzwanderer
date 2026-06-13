import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RuntimeMapPoint } from "../types";
import { useMapJourney, type JourneyWaypoint } from "./useMapJourney";

const makePoint = (overrides: Partial<RuntimeMapPoint>): RuntimeMapPoint => ({
  id: "loc_hidden",
  regionId: "FREIBURG_1905",
  title: "Hidden Courtyard",
  lat: 47.9959,
  lng: 7.8524,
  locationId: "loc_hidden",
  category: "SHADOW",
  state: "locked",
  availableBindings: [],
  primaryBinding: null,
  travelBinding: null,
  isObjectiveActive: false,
  canTravel: false,
  resolvedScenarioId: null,
  canStartScenario: false,
  isVisible: false,
  runtimeSource: "persistent",
  ...overrides,
});

const makeClock = () => {
  const frames: FrameRequestCallback[] = [];
  const timers: Array<() => void> = [];
  return {
    frames,
    timers,
    clock: {
      requestFrame: vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      }),
      cancelFrame: vi.fn(),
      setTimeout: vi.fn((callback: () => void) => {
        timers.push(callback);
        return timers.length;
      }),
      clearTimeout: vi.fn(),
    },
  };
};

const runNextFrame = (frames: FrameRequestCallback[], timestamp: number) => {
  const frame = frames.shift();
  expect(frame).toBeTypeOf("function");
  act(() => {
    frame?.(timestamp);
  });
};

describe("useMapJourney", () => {
  it("moves through waypoints at 18 km/h and opens a completion report", () => {
    const { clock, frames, timers } = makeClock();
    const onCommitGameTime = vi.fn();
    const waypoint: JourneyWaypoint = {
      id: "target",
      label: "Target",
      coordinates: [7.8622, 47.9959],
      locationId: "loc_target",
    };

    const { result } = renderHook(() =>
      useMapJourney({
        startCoordinate: [7.8522, 47.9959],
        discoveryCandidates: [],
        onCommitGameTime,
        clock,
      }),
    );

    act(() => result.current.addWaypoint(waypoint));
    runNextFrame(frames, 0);
    runNextFrame(frames, 200_000);

    expect(result.current.isMoving).toBe(false);
    expect(result.current.report?.status).toBe("loading");
    expect(result.current.totalDistanceMeters).toBeGreaterThan(740);
    expect(result.current.elapsedGameMinutes).toBeGreaterThan(2.4);
    expect(onCommitGameTime).toHaveBeenCalledTimes(1);

    act(() => timers[0]?.());
    expect(result.current.report?.status).toBe("ready");
  });

  it("discovers hidden points once when walking through their radius", () => {
    const { clock, frames } = makeClock();
    const onDiscoverPoint = vi.fn();
    const point = makePoint({ discoveryRadiusMeters: 40 });

    const { result } = renderHook(() =>
      useMapJourney({
        startCoordinate: [7.8522, 47.9959],
        discoveryCandidates: [point],
        onDiscoverPoint,
        clock,
      }),
    );

    act(() =>
      result.current.addWaypoint({
        id: "east",
        label: "East",
        coordinates: [7.854, 47.9959],
      }),
    );
    runNextFrame(frames, 0);
    runNextFrame(frames, 10_000);
    runNextFrame(frames, 20_000);

    expect(onDiscoverPoint).toHaveBeenCalledTimes(1);
    expect(onDiscoverPoint).toHaveBeenCalledWith("loc_hidden", [
      expect.any(Number),
      expect.any(Number),
    ]);
    expect(result.current.discoveredPoints[0]?.point.id).toBe("loc_hidden");
  });

  it("auto-discovers explicit proximity-rule points", () => {
    const { clock, frames } = makeClock();
    const onDiscoverPoint = vi.fn();
    const point = makePoint({
      discoveryRadiusMeters: 40,
      discoveryRules: [
        {
          channel: "proximity",
          signal: { enabled: true },
        },
      ],
    });

    const { result } = renderHook(() =>
      useMapJourney({
        startCoordinate: [7.8522, 47.9959],
        discoveryCandidates: [point],
        onDiscoverPoint,
        clock,
      }),
    );

    act(() =>
      result.current.addWaypoint({
        id: "east",
        label: "East",
        coordinates: [7.854, 47.9959],
      }),
    );
    runNextFrame(frames, 0);
    runNextFrame(frames, 10_000);

    expect(onDiscoverPoint).toHaveBeenCalledTimes(1);
    expect(result.current.discoveredPoints[0]?.point.id).toBe("loc_hidden");
  });

  it("does not auto-discover observation lens points inside radius", () => {
    const { clock, frames } = makeClock();
    const onDiscoverPoint = vi.fn();
    const point = makePoint({
      discoveryRadiusMeters: 40,
      discoveryRules: [
        {
          channel: "observation_lens",
          signal: { enabled: true },
        },
      ],
    });

    const { result } = renderHook(() =>
      useMapJourney({
        startCoordinate: [7.8522, 47.9959],
        discoveryCandidates: [point],
        onDiscoverPoint,
        clock,
      }),
    );

    act(() =>
      result.current.addWaypoint({
        id: "east",
        label: "East",
        coordinates: [7.854, 47.9959],
      }),
    );
    runNextFrame(frames, 0);
    runNextFrame(frames, 10_000);

    expect(onDiscoverPoint).not.toHaveBeenCalled();
    expect(result.current.discoveredPoints).toHaveLength(0);
    expect(result.current.isPaused).toBe(true);
    expect(result.current.searchTarget?.id).toBe("loc_hidden");
  });

  it("does not auto-discover QR scan points inside radius", () => {
    const { clock, frames } = makeClock();
    const onDiscoverPoint = vi.fn();
    const point = makePoint({
      discoveryRadiusMeters: 40,
      discoveryRules: [
        {
          channel: "qr_scan",
          signal: { enabled: true, requiresServerConfirmation: true },
          requiresServerConfirmation: true,
        },
      ],
    });

    const { result } = renderHook(() =>
      useMapJourney({
        startCoordinate: [7.8522, 47.9959],
        discoveryCandidates: [point],
        onDiscoverPoint,
        clock,
      }),
    );

    act(() =>
      result.current.addWaypoint({
        id: "east",
        label: "East",
        coordinates: [7.854, 47.9959],
      }),
    );
    runNextFrame(frames, 0);
    runNextFrame(frames, 10_000);

    expect(onDiscoverPoint).not.toHaveBeenCalled();
    expect(result.current.discoveredPoints).toHaveLength(0);
    expect(result.current.inSearchZone).toBe(true);
  });

  it("pauses and pulses compass state inside search zones", () => {
    const { clock, frames } = makeClock();
    const point = makePoint({
      isSearchZone: true,
      searchRadiusMeters: 40,
    });

    const { result } = renderHook(() =>
      useMapJourney({
        startCoordinate: [7.8522, 47.9959],
        discoveryCandidates: [point],
        clock,
      }),
    );

    act(() =>
      result.current.addWaypoint({
        id: "east",
        label: "East",
        coordinates: [7.854, 47.9959],
      }),
    );
    runNextFrame(frames, 0);
    runNextFrame(frames, 10_000);

    expect(result.current.isPaused).toBe(true);
    expect(result.current.inSearchZone).toBe(true);
    expect(result.current.searchTarget?.id).toBe("loc_hidden");
  });
});
