import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Map as MapIcon } from "lucide-react";
import { useReducer, useTable } from "spacetimedb/react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./mapExperience.css";
import type { OpenVnScenarioOptions } from "../../../shared/navigation/shellNavigationTypes";
import { MAPBOX_TOKEN } from "../../../config";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { usePlayerBindings } from "../../../entities/player/hooks/usePlayerBindings";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import {
  DESKTOP_JOURNEY_SPEED_KMH,
  calculateBearingDegrees,
  haversineDistanceMeters,
  quantizeBearingDegrees,
  resolveDiscoveryRadiusMeters,
  type LngLatTuple,
} from "../model/geo";
import {
  resolveDiscoverySignal,
  type DiscoverySignalMemory,
} from "../model/discoverySignal";
import { resolveEdgeAlert } from "../model/edgeAlert";
import { useCompassFeedback } from "../hooks/useCompassFeedback";
import { useMapJourney } from "../hooks/useMapJourney";
import { useMapRuntimeState } from "../hooks/useMapRuntimeState";
import type {
  RuntimeMapBinding,
  RuntimeMapPoint,
  RuntimeMapRoute,
} from "../types";
import { CaseCard } from "./CaseCard";
import { CompassOverlay, type CompassObjectiveGuide } from "./CompassOverlay";
import { EdgeAlertOverlay } from "./EdgeAlertOverlay";
import type { PlayerPinState } from "./PlayerPin";
import { DetectiveHub } from "./DetectiveHub";
import { JourneyControls } from "./JourneyControls";
import { JourneyReportModal } from "./JourneyReportModal";
import { MapCanvas } from "./MapCanvas";
import { MapHeader } from "./MapHeader";
import { BureauFloorExplorer } from "./BureauFloorExplorer";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getMapStrings } from "../../i18n/uiStrings";

interface MapViewProps {
  onOpenVnScenario: (
    scenarioId: string,
    options?: OpenVnScenarioOptions,
  ) => void;
  initialPanel?: "qr";
}

const COMPACT_HUD_QUERY = "(max-width: 960px)";
const SEMANTIC_ZOOM_THRESHOLD = 14.5;
const GEOLOCATION_TIMEOUT_MS = 2500;

const hasObservationLensRule = (point: RuntimeMapPoint | null): boolean =>
  Boolean(
    point?.discoveryRules?.some((rule) => rule.channel === "observation_lens"),
  );

const createRequestId = (prefix: string, scope: string): string =>
  `${prefix}_${scope}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const getStartScenarioId = (binding: RuntimeMapBinding): string | null => {
  for (const action of binding.actions) {
    if (action.type === "start_scenario") {
      return action.scenarioId;
    }
  }
  return null;
};

// Map labels and logic helper moved inside component to support i18n

// Styles moved to mapExperience.css

const getIsCompactHud = (): boolean => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(COMPACT_HUD_QUERY).matches;
};

type MapCodeAttemptCoordinates = {
  attemptedFromLat?: number;
  attemptedFromLng?: number;
};

type MapExperienceMode = "city" | "bureau";

const resolveAttemptCoordinates =
  async (): Promise<MapCodeAttemptCoordinates> => {
    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator) ||
      !navigator.geolocation
    ) {
      return {};
    }

    return new Promise<MapCodeAttemptCoordinates>((resolve) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({});
      }, GEOLOCATION_TIMEOUT_MS);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(timeoutId);
          resolve({
            attemptedFromLat: position.coords.latitude,
            attemptedFromLng: position.coords.longitude,
          });
        },
        () => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(timeoutId);
          resolve({});
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60_000,
          timeout: GEOLOCATION_TIMEOUT_MS,
        },
      );
    });
  };

export const MapView = ({ onOpenVnScenario, initialPanel }: MapViewProps) => {
  const { flags: myFlags } = usePlayerBindings();
  const language = useUiLanguage(myFlags);
  const mapStrings = getMapStrings(language);
  const { identityHex, isConnected } = useIdentity();
  const isNetworkConnected = isConnected !== false;
  const {
    isMapAvailable,
    region,
    points,
    journeyDiscoveryCandidates = [],
    resolverInputs,
    routes = [],
    currentLocationId,
    isReady,
  } = useMapRuntimeState();
  const playerVars = usePlayerVars();
  const [codeRedemptions] = useTable(tables.myRedeemedCodes);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [isCompactHud, setIsCompactHud] = useState<boolean>(() =>
    getIsCompactHud(),
  );
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isCodeEntryOpen, setIsCodeEntryOpen] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [pendingCodeRequestId, setPendingCodeRequestId] = useState<
    string | null
  >(null);
  const [codeStatus, setCodeStatus] = useState<string | null>(null);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(region.zoom);
  const [rejectedPointIds, setRejectedPointIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [networkNotice, setNetworkNotice] = useState<string | null>(null);
  const [isObservationMode, setIsObservationMode] = useState(false);
  const [experienceMode, setExperienceMode] =
    useState<MapExperienceMode>("city");
  const isZoomedOut = zoomLevel < SEMANTIC_ZOOM_THRESHOLD;
  const compactHeaderId = useRef(
    `gw-map-ledger-${Math.random().toString(36).slice(2)}`,
  );
  const gameTimeMinutesRef = useRef(playerVars.game_time_minutes ?? 0);
  const discoverySignalMemoryRef = useRef<DiscoverySignalMemory>({
    targetId: null,
    phase: "none",
  });

  const mapInteract = useReducer(reducers.mapInteract);
  const redeemMapCode = useReducer(reducers.redeemMapCode);
  const travelTo = useReducer(reducers.travelTo);
  const setVar = useReducer(reducers.setVar);
  const commitMapDiscovery = useReducer(reducers.commitMapDiscovery);

  const STATE_LABELS: Record<RuntimeMapPoint["state"], string> = useMemo(
    () => ({
      locked: mapStrings.states.locked,
      discovered: mapStrings.states.discovered,
      visited: mapStrings.states.visited,
      completed: mapStrings.states.completed,
    }),
    [mapStrings.states],
  );

  const mapCodeResultLabel = useCallback(
    (result: string): string => {
      return (
        (mapStrings.errors as Record<string, string>)[result] ??
        mapStrings.errors.generic
      );
    },
    [mapStrings.errors],
  );

  useEffect(() => {
    gameTimeMinutesRef.current = playerVars.game_time_minutes ?? 0;
  }, [playerVars.game_time_minutes]);

  const playerStartCoordinate = useMemo<LngLatTuple>(() => {
    const currentPoint =
      points.find((point) => point.locationId === currentLocationId) ??
      journeyDiscoveryCandidates.find(
        (point) => point.locationId === currentLocationId,
      ) ??
      null;

    if (currentPoint) {
      return [currentPoint.lng, currentPoint.lat];
    }

    return [region.geoCenterLng, region.geoCenterLat];
  }, [
    currentLocationId,
    journeyDiscoveryCandidates,
    points,
    region.geoCenterLat,
    region.geoCenterLng,
  ]);

  const commitJourneyGameTime = useCallback(
    async (elapsedMinutesDelta: number) => {
      const nextValue = gameTimeMinutesRef.current + elapsedMinutesDelta;
      gameTimeMinutesRef.current = nextValue;
      await setVar({
        key: "game_time_minutes",
        floatValue: nextValue,
      });
    },
    [setVar],
  );

  const discoverJourneyPoint = useCallback(
    async (
      pointId: string,
      channel: "proximity" | "observation_lens",
      position: LngLatTuple | null,
    ) => {
      const point =
        journeyDiscoveryCandidates.find(
          (candidate) => candidate.id === pointId,
        ) ?? null;
      if (!point) {
        return;
      }
      await commitMapDiscovery({
        requestId: createRequestId("journey_discovery", point.id),
        pointId: point.id,
        channel,
        attemptedFromLat: position?.[1],
        attemptedFromLng: position?.[0],
      });
    },
    [commitMapDiscovery, journeyDiscoveryCandidates],
  );

  const handleJourneyDiscovery = useCallback(
    (pointId: string, position: LngLatTuple) => {
      void discoverJourneyPoint(pointId, "proximity", position).catch(() => {
        setRejectedPointIds((current) => {
          const next = new Set(current);
          next.add(pointId);
          return next;
        });
        setNetworkNotice("Map trace rejected by server");
      });
    },
    [discoverJourneyPoint],
  );

  const completeJourney = useCallback(
    async (report: { finalWaypoint: { locationId?: string } | null }) => {
      if (report.finalWaypoint?.locationId) {
        await travelTo({ locationId: report.finalWaypoint.locationId });
      }
    },
    [travelTo],
  );

  const journey = useMapJourney({
    startCoordinate: playerStartCoordinate,
    discoveryCandidates: journeyDiscoveryCandidates,
    speedKmH: DESKTOP_JOURNEY_SPEED_KMH,
    onCommitGameTime: commitJourneyGameTime,
    onDiscoverPoint: handleJourneyDiscovery,
    onJourneyComplete: completeJourney,
  });

  const discoverySignal = useMemo(
    () =>
      resolveDiscoverySignal({
        position: journey.position,
        candidates: journeyDiscoveryCandidates,
        resolverInputs,
        previous: discoverySignalMemoryRef.current,
      }),
    [journey.position, journeyDiscoveryCandidates, resolverInputs],
  );

  useEffect(() => {
    discoverySignalMemoryRef.current = {
      targetId: discoverySignal.target?.id ?? null,
      phase: discoverySignal.phase,
    };
  }, [discoverySignal.phase, discoverySignal.target?.id]);

  const { armFeedback } = useCompassFeedback({
    enabled: isObservationMode,
    phase: discoverySignal.phase,
    state: discoverySignal.state,
  });

  const canInspectObservationSignal =
    discoverySignal.phase === "hot" &&
    hasObservationLensRule(discoverySignal.target);

  const toggleObservationMode = useCallback(() => {
    armFeedback();
    setIsObservationMode((current) => !current);
  }, [armFeedback]);

  const inspectObservationTarget = useCallback(async () => {
    const target = discoverySignal.target;
    if (!target || !canInspectObservationSignal) {
      return;
    }
    if (!isNetworkConnected) {
      setNetworkNotice("Agent network disconnected");
      return;
    }

    try {
      await discoverJourneyPoint(
        target.id,
        "observation_lens",
        journey.position,
      );
      journey.revealDiscoveryPoint(target.id);
      setRejectedPointIds((current) => {
        const next = new Set(current);
        next.delete(target.id);
        return next;
      });
      setSelectedPointId(target.id);
    } catch (error) {
      setRejectedPointIds((current) => {
        const next = new Set(current);
        next.add(target.id);
        return next;
      });
      setNetworkNotice("Map trace rejected by server");
    }
  }, [
    canInspectObservationSignal,
    discoverJourneyPoint,
    discoverySignal.target,
    isNetworkConnected,
    journey,
  ]);

  const displayedPoints = useMemo(() => {
    const visiblePointIds = new Set(points.map((point) => point.id));
    const revealedJourneyPoints = journey.discoveredPoints
      .map((entry) => entry.point)
      .filter((point) => !visiblePointIds.has(point.id))
      .map((point) => ({
        ...point,
        state: point.state === "locked" ? "discovered" : point.state,
        isVisible: true,
      }));

    return [...points, ...revealedJourneyPoints];
  }, [journey.discoveredPoints, points]);

  const effectivePlayerPosition = journey.position ?? playerStartCoordinate;

  // The active task's objective point — activation is story-driven (quest
  // stages → objectivePointIds; later also manual tracking in the journal),
  // so no proximity math: take the first active objective in catalog order.
  // Bearing is quantized to 15° sectors: the needle hints, it doesn't pinpoint.
  const objectiveGuide = useMemo<CompassObjectiveGuide | null>(() => {
    const objective =
      displayedPoints.find((point) => point.isObjectiveActive) ?? null;
    if (!objective) {
      return null;
    }
    return {
      id: objective.id,
      label: objective.title,
      bearingDegrees: quantizeBearingDegrees(
        calculateBearingDegrees(effectivePlayerPosition, [
          objective.lng,
          objective.lat,
        ]),
      ),
    };
  }, [displayedPoints, effectivePlayerPosition]);

  const nearbyPointIds = useMemo<ReadonlySet<string>>(() => {
    const nearby = new Set<string>();
    for (const point of displayedPoints) {
      const reactionRadius = resolveDiscoveryRadiusMeters(point) * 1.25;
      const distance = haversineDistanceMeters(effectivePlayerPosition, [
        point.lng,
        point.lat,
      ]);
      if (distance <= reactionRadius) {
        nearby.add(point.id);
      }
    }
    return nearby;
  }, [displayedPoints, effectivePlayerPosition]);

  const playerPinState = useMemo<PlayerPinState>(() => {
    if (discoverySignal.phase === "hot") {
      return "discovering";
    }
    if (journey.inSearchZone) {
      return "at_poi";
    }
    if (journey.isMoving) {
      return "moving";
    }
    if (journey.isPaused) {
      return "paused";
    }
    return "idle";
  }, [
    discoverySignal.phase,
    journey.inSearchZone,
    journey.isMoving,
    journey.isPaused,
  ]);

  const playerSpeedRatio = Math.max(0, Math.min(1, journey.speedKmH / 30));

  const edgeAlert = useMemo(
    () => resolveEdgeAlert({ signal: discoverySignal }),
    [discoverySignal],
  );

  const selectedPoint = useMemo(
    () => displayedPoints.find((point) => point.id === selectedPointId) ?? null,
    [displayedPoints, selectedPointId],
  );

  const pointStateSummary = useMemo(() => {
    const summary: Record<RuntimeMapPoint["state"], number> = {
      locked: 0,
      discovered: 0,
      visited: 0,
      completed: 0,
    };
    for (const point of displayedPoints) {
      summary[point.state] += 1;
    }
    return summary;
  }, [displayedPoints]);

  const objectiveCount = useMemo(
    () => displayedPoints.filter((point) => point.isObjectiveActive).length,
    [displayedPoints],
  );

  useEffect(() => {
    if (!selectedPointId) {
      return;
    }
    if (displayedPoints.some((point) => point.id === selectedPointId)) {
      return;
    }
    setSelectedPointId(null);
  }, [displayedPoints, selectedPointId]);

  useEffect(() => {
    if (!pendingCodeRequestId) {
      return;
    }

    const redemption = codeRedemptions.find(
      (row) => row.requestId === pendingCodeRequestId,
    );
    if (!redemption) {
      return;
    }

    setCodeStatus(mapCodeResultLabel(redemption.result));
    setPendingCodeRequestId(null);
    setIsRedeemingCode(false);
  }, [codeRedemptions, identityHex, mapCodeResultLabel, pendingCodeRequestId]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(COMPACT_HUD_QUERY);
    const update = (event?: MediaQueryListEvent) => {
      setIsCompactHud(event?.matches ?? mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (initialPanel === "qr") {
      setIsCodeEntryOpen(true);
      setIsLedgerOpen(true);
    }
  }, [initialPanel]);

  useEffect(() => {
    if (!isLedgerOpen && !isCodeEntryOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLedgerOpen(false);
        setIsCodeEntryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLedgerOpen, isCodeEntryOpen]);

  useEffect(() => {
    if (isNetworkConnected && networkNotice === "Agent network disconnected") {
      setNetworkNotice(null);
    }
  }, [isNetworkConnected, networkNotice]);

  const selectedRouteAnchorId = selectedPoint
    ? (selectedPoint.persistentPointId ?? selectedPoint.id)
    : null;
  const visibleRoutes = useMemo(() => {
    if (isZoomedOut) {
      return [] as RuntimeMapRoute[];
    }

    return routes.filter((route) => {
      const hasObjectivePoint = route.pointIds.some((pointId) =>
        displayedPoints.some(
          (point) =>
            (point.persistentPointId ?? point.id) === pointId &&
            point.isObjectiveActive,
        ),
      );
      if (hasObjectivePoint) {
        return true;
      }
      if (!selectedRouteAnchorId) {
        return false;
      }
      return route.pointIds.includes(selectedRouteAnchorId);
    });
  }, [displayedPoints, isZoomedOut, routes, selectedRouteAnchorId]);

  const runBinding = useCallback(
    async (point: RuntimeMapPoint, binding: RuntimeMapBinding) => {
      if (!isNetworkConnected) {
        setNetworkNotice("Agent network disconnected");
        throw new Error("Agent network disconnected");
      }

      try {
        await mapInteract({
          requestId: createRequestId("map_interact", point.id),
          pointId: point.id,
          bindingId: binding.id,
          trigger: binding.trigger,
          attemptedFromLat: journey.position?.[1],
          attemptedFromLng: journey.position?.[0],
        });
      } catch (error) {
        setRejectedPointIds((current) => {
          const next = new Set(current);
          next.add(point.id);
          return next;
        });
        setNetworkNotice("Map trace rejected by server");
        throw error;
      }

      const scenarioId = getStartScenarioId(binding);
      if (scenarioId) {
        onOpenVnScenario(scenarioId);
      }
    },
    [isNetworkConnected, journey.position, mapInteract, onOpenVnScenario],
  );

  const submitMapCode = useCallback(async () => {
    if (!isNetworkConnected) {
      const message = "Agent network disconnected";
      setNetworkNotice(message);
      setCodeStatus(message);
      return;
    }

    const trimmedCode = codeValue.trim();
    if (!trimmedCode) {
      setCodeStatus(mapStrings.errors.enter_code);
      return;
    }

    const requestId = createRequestId("map_code", "manual");
    setIsRedeemingCode(true);
    setPendingCodeRequestId(requestId);
    setCodeStatus(null);

    try {
      const attemptCoordinates = await resolveAttemptCoordinates();
      await redeemMapCode({
        requestId,
        code: trimmedCode,
        attemptedFromLat: attemptCoordinates.attemptedFromLat,
        attemptedFromLng: attemptCoordinates.attemptedFromLng,
      });
      setCodeValue("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPendingCodeRequestId(null);
      setIsRedeemingCode(false);
      if (message.includes("invalid_map_code")) {
        setCodeStatus(mapStrings.errors.invalid_code);
        return;
      }
      if (message.includes("code_already_redeemed")) {
        setCodeStatus(mapStrings.errors.already_redeemed);
        return;
      }
      if (message.includes("code_not_available")) {
        setCodeStatus(mapStrings.errors.blocked_flags);
        return;
      }
      if (message.includes("code_location_required")) {
        setCodeStatus(mapStrings.errors.location_required);
        return;
      }
      if (message.includes("code_outside_geofence")) {
        setCodeStatus(mapStrings.errors.outside_geofence);
        return;
      }
      if (message.includes("code_retry_later")) {
        setCodeStatus(mapStrings.errors.cooldown);
        return;
      }
      setCodeStatus(mapStrings.errors.failed);
    }
  }, [codeValue, isNetworkConnected, mapStrings.errors, redeemMapCode]);

  const renderModeSwitch = () => (
    <div className="gw-map-mode-switch" role="group" aria-label="Map mode">
      <button
        type="button"
        data-active={experienceMode === "city" ? "true" : "false"}
        aria-pressed={experienceMode === "city"}
        onClick={() => setExperienceMode("city")}
      >
        <MapIcon size={15} />
        City
      </button>
      <button
        type="button"
        data-active={experienceMode === "bureau" ? "true" : "false"}
        aria-pressed={experienceMode === "bureau"}
        onClick={() => setExperienceMode("bureau")}
      >
        <Building2 size={15} />
        BÜRO
      </button>
    </div>
  );

  if (experienceMode === "bureau") {
    return (
      <section className="gw-map-shell gw-map-shell--bureau">
        {renderModeSwitch()}
        <BureauFloorExplorer />
      </section>
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <section className="gw-map-shell gw-map-shell--fallback">
        {renderModeSwitch()}
        <article className="gw-map-empty-state gw-map-empty-state--token">
          <div className="gw-map-overlay-paper" />
          <p className="gw-map-label-eyebrow">{mapStrings.chamber}</p>
          <h3 className="gw-map-empty-state__title">Mapbox token is missing</h3>
          <p className="gw-map-empty-state__body">
            Add <code>VITE_MAPBOX_TOKEN</code> to <code>.env.local</code> to
            enable the interactive city atlas.
          </p>
        </article>
      </section>
    );
  }

  const sourceLabel = isMapAvailable ? "Snapshot v3" : "Snapshot unavailable";
  const objectiveLabel = objectiveGuide?.label ?? null;
  const ledgerItems = [
    [mapStrings.source, sourceLabel],
    [mapStrings.current_location, currentLocationId ?? "unknown"],
    [mapStrings.visible_points, String(displayedPoints.length)],
    [mapStrings.active_objectives, String(objectiveCount)],
    [
      mapStrings.visited_completed,
      `${pointStateSummary.visited + pointStateSummary.completed} / ${displayedPoints.length}`,
    ],
  ] as const;
  const compactSummaryItems = [
    `${mapStrings.source} ${sourceLabel}`,
    `${mapStrings.current_location} ${currentLocationId ?? "unknown"}`,
    `${objectiveCount} ${mapStrings.active_objectives}`,
  ];
  const closeMapOverlays = () => {
    setSelectedPointId(null);
    setIsLedgerOpen(false);
    setIsCodeEntryOpen(false);
  };
  const toggleLedger = () => {
    setIsLedgerOpen((current) => !current);
  };
  const toggleCodeEntry = () => {
    setIsCodeEntryOpen((current) => !current);
  };
  const handleMapClick = (event: unknown) => {
    if (isRouteMode) {
      const maybeLngLat = (event as { lngLat?: { lng: number; lat: number } })
        .lngLat;
      if (
        maybeLngLat &&
        Number.isFinite(maybeLngLat.lng) &&
        Number.isFinite(maybeLngLat.lat)
      ) {
        journey.addWaypoint({
          id: `free_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
          label: "Street waypoint",
          coordinates: [maybeLngLat.lng, maybeLngLat.lat],
        });
      }
      return;
    }

    closeMapOverlays();
  };
  const addPointToJourney = (point: RuntimeMapPoint) => {
    journey.addPointWaypoint(point);
    setIsRouteMode(true);
  };
  const handlePointClick = (point: RuntimeMapPoint) => {
    if (isRouteMode) {
      journey.addPointWaypoint(point);
    }
    setSelectedPointId(point.id);
    setIsLedgerOpen(false);
  };

  return (
    <section
      className="gw-map-shell"
      data-observation-mode={isObservationMode ? "true" : "false"}
    >
      <div className="gw-map-frame">
        {renderModeSwitch()}
        <MapHeader
          isCompactHud={isCompactHud}
          regionName={region.name}
          mapStrings={mapStrings}
          stateLabels={STATE_LABELS}
          pointStateSummary={pointStateSummary}
          ledgerItems={ledgerItems}
          compactSummaryItems={compactSummaryItems}
          objectiveLabel={objectiveLabel}
          compactHeaderId={compactHeaderId.current}
          isReady={isReady}
          isLedgerOpen={isLedgerOpen}
          isCodeEntryOpen={isCodeEntryOpen}
          onToggleLedger={toggleLedger}
          onToggleCodeEntry={toggleCodeEntry}
          codeValue={codeValue}
          onCodeValueChange={setCodeValue}
          onSubmitCode={submitMapCode}
          isRedeemingCode={isRedeemingCode}
          isNetworkConnected={isNetworkConnected}
          codeStatus={codeStatus}
        />

        <div className="gw-map-overlay-tint" />
        <div className="gw-map-overlay-vignette" />
        <EdgeAlertOverlay alert={edgeAlert} />

        {!isNetworkConnected || networkNotice ? (
          <div className="gw-map-status-line gw-map-status-pill">
            <span
              className="gw-map-status-pill__dot"
              data-sync-state={isNetworkConnected ? "syncing" : "offline"}
            />
            {networkNotice ?? "Agent network disconnected"}
          </div>
        ) : !isReady ? (
          <div className="gw-map-status-line gw-map-status-pill">
            <span
              className="gw-map-status-pill__dot"
              data-sync-state="syncing"
            />
            {mapStrings.syncing}
          </div>
        ) : null}

        <JourneyControls
          strings={mapStrings.journey}
          isRouteMode={isRouteMode}
          onToggleRouteMode={() => setIsRouteMode((current) => !current)}
          waypointCount={journey.waypoints.length}
          isPaused={journey.isPaused}
          isMoving={journey.isMoving}
          onPauseResume={() =>
            journey.isPaused ? journey.resume() : journey.pause()
          }
          onStop={journey.stopForInteraction}
          onClear={journey.clear}
        />

        <CompassOverlay
          objectiveGuide={objectiveGuide}
          inSearchZone={journey.inSearchZone}
          searchTarget={journey.searchTarget}
          speedKmH={journey.speedKmH}
          discoverySignal={discoverySignal}
          observationMode={isObservationMode}
          observationInspectAvailable={canInspectObservationSignal}
          networkConnected={isNetworkConnected}
          onToggleObservationMode={toggleObservationMode}
          onInspectObservationTarget={inspectObservationTarget}
        />

        <MapCanvas
          region={region}
          onMapClick={handleMapClick}
          onZoomEnd={setZoomLevel}
          plannedPath={journey.plannedPath}
          traveledPath={journey.traveledPath}
          routes={visibleRoutes}
          points={displayedPoints}
          rejectedPointIds={rejectedPointIds}
          nearbyPointIds={nearbyPointIds}
          selectedPointId={selectedPointId}
          isZoomedOut={isZoomedOut}
          onPointClick={handlePointClick}
          playerPosition={journey.position}
          playerState={playerPinState}
          playerBearing={journey.bearing}
          playerSpeedRatio={playerSpeedRatio}
        />
      </div>

      {selectedPoint?.category === "HUB" ? (
        <DetectiveHub
          point={selectedPoint}
          currentLocationId={currentLocationId}
          onRunBinding={runBinding}
          onClose={() => setSelectedPointId(null)}
        />
      ) : selectedPoint ? (
        <CaseCard
          point={selectedPoint}
          currentLocationId={currentLocationId}
          onAddWaypoint={addPointToJourney}
          onRunBinding={runBinding}
          onClose={() => setSelectedPointId(null)}
        />
      ) : null}
      <JourneyReportModal
        report={journey.report}
        onClose={journey.closeReport}
      />
    </section>
  );
};
