import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DESKTOP_JOURNEY_SPEED_KMH,
  DEFAULT_DISCOVERY_RADIUS_METERS,
  calculateBearingDegrees,
  haversineDistanceMeters,
  interpolateLngLat,
  resolveDiscoveryRadiusMeters,
  speedKmhToMetersPerSecond,
  type LngLatTuple,
} from "../model/geo";
import type { RuntimeMapPoint } from "../types";
import type { MapDiscoveryRule } from "../../vn/types";

export interface JourneyWaypoint {
  id: string;
  label: string;
  coordinates: LngLatTuple;
  locationId?: string;
}

export interface JourneyDiscoveryEntry {
  point: RuntimeMapPoint;
  discoveredAtElapsedSec: number;
  position: LngLatTuple;
}

export type JourneyReportStatus = "loading" | "ready";

export type JourneyReportReason = "completed" | "interaction" | "cleared";

export interface JourneyReport {
  status: JourneyReportStatus;
  reason: JourneyReportReason;
  totalDistanceMeters: number;
  elapsedGameMinutes: number;
  finalWaypoint: JourneyWaypoint | null;
  discoveries: JourneyDiscoveryEntry[];
}

export interface JourneyClock {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (handle: number) => void;
}

const defaultClock: JourneyClock = {
  requestFrame: (cb) =>
    typeof window === "undefined" ? 0 : window.requestAnimationFrame(cb),
  cancelFrame: (handle) => {
    if (typeof window !== "undefined") window.cancelAnimationFrame(handle);
  },
  setTimeout: (cb, ms) =>
    typeof window === "undefined" ? 0 : window.setTimeout(cb, ms),
  clearTimeout: (handle) => {
    if (typeof window !== "undefined") window.clearTimeout(handle);
  },
};

interface UseMapJourneyOptions {
  startCoordinate: LngLatTuple | null;
  discoveryCandidates: RuntimeMapPoint[];
  speedKmH?: number;
  /** Notifies host with elapsed real-world seconds when a journey ends. */
  onCommitGameTime?: (elapsedSeconds: number) => void;
  onDiscoverPoint?: (pointId: string, position: LngLatTuple) => void;
  onJourneyComplete?: (report: JourneyReport) => void | Promise<void>;
  clock?: JourneyClock;
}

const REPORT_READY_DELAY_MS = 220;

const AUTO_DISCOVERY_CHANNELS = new Set<MapDiscoveryRule["channel"]>([
  "proximity",
  "vn_unlock",
]);

const MANUAL_DISCOVERY_CHANNELS = new Set<MapDiscoveryRule["channel"]>([
  "observation_lens",
  "qr_scan",
]);

const canAutoDiscoverJourneyPoint = (point: RuntimeMapPoint): boolean => {
  if (!point.discoveryRules || point.discoveryRules.length === 0) {
    return true;
  }

  return point.discoveryRules.some((rule) =>
    AUTO_DISCOVERY_CHANNELS.has(rule.channel),
  );
};

const hasManualDiscoveryRule = (point: RuntimeMapPoint): boolean =>
  Boolean(
    point.discoveryRules?.some((rule) =>
      MANUAL_DISCOVERY_CHANNELS.has(rule.channel),
    ),
  );

export function useMapJourney({
  startCoordinate,
  discoveryCandidates,
  speedKmH = DESKTOP_JOURNEY_SPEED_KMH,
  onCommitGameTime,
  onDiscoverPoint,
  onJourneyComplete,
  clock = defaultClock,
}: UseMapJourneyOptions) {
  const [position, setPosition] = useState<LngLatTuple | null>(startCoordinate);
  const [waypoints, setWaypoints] = useState<JourneyWaypoint[]>([]);
  const [traveledPath, setTraveledPath] = useState<LngLatTuple[]>(() =>
    startCoordinate ? [startCoordinate] : [],
  );
  const [bearing, setBearing] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [discoveredPoints, setDiscoveredPoints] = useState<
    JourneyDiscoveryEntry[]
  >([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [report, setReport] = useState<JourneyReport | null>(null);
  const [searchTargetId, setSearchTargetId] = useState<string | null>(null);

  // Latest values via refs to avoid frame closure staleness
  const positionRef = useRef<LngLatTuple | null>(startCoordinate);
  const waypointsRef = useRef<JourneyWaypoint[]>([]);
  const traveledRef = useRef<LngLatTuple[]>(
    startCoordinate ? [startCoordinate] : [],
  );
  const totalDistanceRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const speedRef = useRef<number>(speedKmH);
  const isPausedRef = useRef<boolean>(false);
  const discoveriesRef = useRef<JourneyDiscoveryEntry[]>([]);
  const discoveredIdsRef = useRef<Set<string>>(new Set());
  const lastFrameTsRef = useRef<number | null>(null);
  const frameHandleRef = useRef<number | null>(null);
  const reportTimerRef = useRef<number | null>(null);
  const candidatesRef = useRef<RuntimeMapPoint[]>(discoveryCandidates);
  const clockRef = useRef<JourneyClock>(clock);

  const recordDiscovery = useCallback(
    (
      candidate: RuntimeMapPoint,
      currentPos: LngLatTuple,
      atElapsed: number,
    ) => {
      if (discoveredIdsRef.current.has(candidate.id)) {
        return false;
      }

      discoveredIdsRef.current.add(candidate.id);
      const entry: JourneyDiscoveryEntry = {
        point: candidate,
        discoveredAtElapsedSec: atElapsed,
        position: currentPos,
      };
      discoveriesRef.current = [...discoveriesRef.current, entry];
      setDiscoveredPoints(discoveriesRef.current);
      return true;
    },
    [],
  );

  useEffect(() => {
    candidatesRef.current = discoveryCandidates;
  }, [discoveryCandidates]);

  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  useEffect(() => {
    speedRef.current = speedKmH;
  }, [speedKmH]);

  useEffect(() => {
    if (startCoordinate && !positionRef.current) {
      positionRef.current = startCoordinate;
      setPosition(startCoordinate);
      traveledRef.current = [startCoordinate];
      setTraveledPath([startCoordinate]);
    }
  }, [startCoordinate]);

  const evaluateProximity = useCallback(
    (currentPos: LngLatTuple, atElapsed: number): RuntimeMapPoint | null => {
      let searchHit: RuntimeMapPoint | null = null;
      for (const candidate of candidatesRef.current) {
        const radius = resolveDiscoveryRadiusMeters(candidate);
        const distance = haversineDistanceMeters(currentPos, [
          candidate.lng,
          candidate.lat,
        ]);
        if (distance > radius) {
          continue;
        }
        if (canAutoDiscoverJourneyPoint(candidate)) {
          if (recordDiscovery(candidate, currentPos, atElapsed)) {
            onDiscoverPoint?.(candidate.id, currentPos);
          }
        }
        if (candidate.isSearchZone || hasManualDiscoveryRule(candidate)) {
          searchHit = candidate;
        }
      }
      return searchHit;
    },
    [onDiscoverPoint, recordDiscovery],
  );

  const revealDiscoveryPoint = useCallback(
    (pointId: string): boolean => {
      const candidate =
        candidatesRef.current.find((entry) => entry.id === pointId) ?? null;
      const currentPos = positionRef.current;
      if (!candidate || !currentPos) {
        return false;
      }

      return recordDiscovery(candidate, currentPos, elapsedRef.current);
    },
    [recordDiscovery],
  );

  const emitReport = useCallback(
    (reason: JourneyReportReason, finalWaypoint: JourneyWaypoint | null) => {
      const loadingReport: JourneyReport = {
        status: "loading",
        reason,
        totalDistanceMeters: totalDistanceRef.current,
        elapsedGameMinutes: elapsedRef.current / 60,
        finalWaypoint,
        discoveries: discoveriesRef.current,
      };
      setReport(loadingReport);
      onCommitGameTime?.(elapsedRef.current);
      if (reportTimerRef.current !== null) {
        clockRef.current.clearTimeout(reportTimerRef.current);
        reportTimerRef.current = null;
      }
      reportTimerRef.current = clockRef.current.setTimeout(() => {
        const readyReport: JourneyReport = {
          ...loadingReport,
          status: "ready",
        };
        setReport(readyReport);
        reportTimerRef.current = null;
        void onJourneyComplete?.(readyReport);
      }, REPORT_READY_DELAY_MS);
    },
    [onCommitGameTime, onJourneyComplete],
  );

  const stopFrameLoop = useCallback(() => {
    if (frameHandleRef.current !== null) {
      clockRef.current.cancelFrame(frameHandleRef.current);
      frameHandleRef.current = null;
    }
    lastFrameTsRef.current = null;
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      if (isPausedRef.current) {
        stopFrameLoop();
        return;
      }
      const lastTs = lastFrameTsRef.current ?? timestamp;
      const dtMs = Math.max(0, timestamp - lastTs);
      lastFrameTsRef.current = timestamp;

      const current = positionRef.current;
      const queue = waypointsRef.current;
      if (!current || queue.length === 0) {
        setIsMoving(false);
        stopFrameLoop();
        return;
      }
      setIsMoving(true);

      const metersPerMs = speedKmhToMetersPerSecond(speedRef.current) / 1000;
      let distanceBudgetMeters = metersPerMs * dtMs;
      let newPosition: LngLatTuple = current;
      let queueChanged = false;
      let completed: JourneyWaypoint | null = null;

      while (distanceBudgetMeters > 0 && queue.length > 0) {
        const next = queue[0];
        const distToNext = haversineDistanceMeters(
          newPosition,
          next.coordinates,
        );
        if (distToNext <= distanceBudgetMeters) {
          newPosition = next.coordinates;
          totalDistanceRef.current += distToNext;
          distanceBudgetMeters -= distToNext;
          completed = next;
          queue.shift();
          queueChanged = true;
        } else {
          const ratio = distanceBudgetMeters / Math.max(distToNext, 0.0001);
          newPosition = interpolateLngLat(newPosition, next.coordinates, ratio);
          totalDistanceRef.current += distanceBudgetMeters;
          distanceBudgetMeters = 0;
        }
      }

      const dtSec = dtMs / 1000;
      elapsedRef.current += dtSec;
      setElapsedSeconds(elapsedRef.current);
      setTotalDistanceMeters(totalDistanceRef.current);

      positionRef.current = newPosition;
      setPosition(newPosition);
      traveledRef.current = [...traveledRef.current, newPosition];
      setTraveledPath(traveledRef.current);

      if (queue.length > 0) {
        setBearing(calculateBearingDegrees(newPosition, queue[0].coordinates));
      }

      // Skip proximity on the bootstrap frame (dt=0). Otherwise the very first
      // tick — before any real movement — would trigger discoveries based on
      // the static start coordinate, which is surprising for callers expecting
      // proximity reactions only as the player traverses.
      const searchHit =
        dtMs > 0 ? evaluateProximity(newPosition, elapsedRef.current) : null;
      if (searchHit) {
        setSearchTargetId(searchHit.id);
        isPausedRef.current = true;
        setIsPaused(true);
        setIsMoving(false);
        stopFrameLoop();
        return;
      }

      if (queueChanged) {
        setWaypoints([...queue]);
        if (queue.length === 0) {
          setIsMoving(false);
          stopFrameLoop();
          emitReport("completed", completed);
          return;
        }
      }

      frameHandleRef.current = clockRef.current.requestFrame(tick);
    },
    [emitReport, evaluateProximity, stopFrameLoop],
  );

  const startFrameLoop = useCallback(() => {
    if (frameHandleRef.current !== null || isPausedRef.current) return;
    frameHandleRef.current = clockRef.current.requestFrame(tick);
  }, [tick]);

  const addWaypoint = useCallback(
    (waypoint: JourneyWaypoint) => {
      waypointsRef.current = [...waypointsRef.current, waypoint];
      setWaypoints(waypointsRef.current);
      setReport(null);
      isPausedRef.current = false;
      setIsPaused(false);
      setSearchTargetId(null);
      startFrameLoop();
    },
    [startFrameLoop],
  );

  const addPointWaypoint = useCallback(
    (point: RuntimeMapPoint) => {
      addWaypoint({
        id: point.id,
        label: point.title,
        coordinates: [point.lng, point.lat],
        locationId: point.locationId,
      });
    },
    [addWaypoint],
  );

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
    setIsMoving(false);
    stopFrameLoop();
  }, [stopFrameLoop]);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
    setSearchTargetId(null);
    startFrameLoop();
  }, [startFrameLoop]);

  const stopForInteraction = useCallback(() => {
    const next = waypointsRef.current[0] ?? null;
    waypointsRef.current = [];
    setWaypoints([]);
    isPausedRef.current = false;
    setIsPaused(false);
    setIsMoving(false);
    stopFrameLoop();
    emitReport("interaction", next);
  }, [emitReport, stopFrameLoop]);

  const clear = useCallback(() => {
    waypointsRef.current = [];
    setWaypoints([]);
    isPausedRef.current = false;
    setIsPaused(false);
    setIsMoving(false);
    setSearchTargetId(null);
    stopFrameLoop();
    setReport(null);
  }, [stopFrameLoop]);

  const closeReport = useCallback(() => {
    if (reportTimerRef.current !== null) {
      clockRef.current.clearTimeout(reportTimerRef.current);
      reportTimerRef.current = null;
    }
    setReport(null);
  }, []);

  useEffect(() => {
    return () => {
      stopFrameLoop();
      if (reportTimerRef.current !== null) {
        clockRef.current.clearTimeout(reportTimerRef.current);
        reportTimerRef.current = null;
      }
    };
  }, [stopFrameLoop]);

  const activeWaypoint = waypoints[0] ?? null;
  const remainingDistanceMeters = useMemo(() => {
    if (!position || waypoints.length === 0) return 0;
    let acc = haversineDistanceMeters(position, waypoints[0].coordinates);
    for (let i = 0; i < waypoints.length - 1; i++) {
      acc += haversineDistanceMeters(
        waypoints[i].coordinates,
        waypoints[i + 1].coordinates,
      );
    }
    return acc;
  }, [position, waypoints]);

  const plannedPath = useMemo<LngLatTuple[]>(() => {
    if (!position || waypoints.length === 0) return [];
    return [position, ...waypoints.map((wp) => wp.coordinates)];
  }, [position, waypoints]);

  const bearingToTarget = useMemo<number | null>(() => {
    if (!position || waypoints.length === 0) return null;
    return calculateBearingDegrees(position, waypoints[0].coordinates);
  }, [position, waypoints]);

  const searchTarget = useMemo<RuntimeMapPoint | null>(() => {
    if (!searchTargetId) return null;
    return (
      discoveryCandidates.find(
        (candidate) => candidate.id === searchTargetId,
      ) ?? null
    );
  }, [discoveryCandidates, searchTargetId]);

  const inSearchZone = searchTarget !== null;

  // Legacy aliases retained for older callers (kept until full migration).
  const currentPosition = position;
  const elapsedGameSeconds = elapsedSeconds;
  const clearWaypoints = clear;

  return {
    position,
    currentPosition,
    waypoints,
    activeWaypoint,
    plannedPath,
    traveledPath,
    bearing,
    bearingToTarget,
    isMoving,
    isPaused,
    discoveredPoints,
    totalDistanceMeters,
    elapsedSeconds,
    elapsedGameSeconds,
    elapsedGameMinutes: elapsedSeconds / 60,
    remainingDistanceMeters,
    inSearchZone,
    searchTarget,
    speedKmH,
    report,
    addWaypoint,
    addPointWaypoint,
    pause,
    resume,
    stopForInteraction,
    clear,
    clearWaypoints,
    closeReport,
    revealDiscoveryPoint,
  };
}

export {
  DEFAULT_DISCOVERY_RADIUS_METERS,
  DESKTOP_JOURNEY_SPEED_KMH,
} from "../model/geo";
