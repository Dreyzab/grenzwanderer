import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import {
  Building2,
  Map as MapIcon,
  MapPinPlus,
  Pause,
  Play,
  Route,
  Square,
  Trash2,
} from "lucide-react";
import { useReducer, useTable } from "spacetimedb/react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./mapExperience.css";
import type { OpenVnScenarioOptions } from "../../../shared/navigation/shellNavigationTypes";
import { MAPBOX_STYLE, MAPBOX_TOKEN, RELEASE_PROFILE } from "../../../config";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { usePlayerBindings } from "../../../entities/player/hooks/usePlayerBindings";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { DESKTOP_JOURNEY_SPEED_KMH, type LngLatTuple } from "../model/geo";
import {
  resolveDiscoverySignal,
  type DiscoverySignalMemory,
} from "../model/discoverySignal";
import { useCompassFeedback } from "../hooks/useCompassFeedback";
import { useMapJourney } from "../hooks/useMapJourney";
import { useMapRuntimeState } from "../hooks/useMapRuntimeState";
import type {
  RuntimeMapBinding,
  RuntimeMapPoint,
  RuntimeMapRoute,
} from "../types";
import { CaseCard } from "./CaseCard";
import { CompassOverlay } from "./CompassOverlay";
import { DetectiveHub } from "./DetectiveHub";
import { CartouchePanel } from "./CartouchePanel";
import { CobblestoneMarker } from "./CobblestoneMarker";
import { PlayerPin } from "./PlayerPin";
import { JourneyReportModal } from "./JourneyReportModal";
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
const MAP_POINT_STATES = [
  "locked",
  "discovered",
  "visited",
  "completed",
] as const;
const MAP_GL_LAYOUT_PROPS = {
  style: {
    width: "100%",
    height: "calc(100dvh - env(safe-area-inset-bottom) - 4rem)",
  },
} as const;

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
    source,
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
  const setFlag = useReducer(reducers.setFlag);
  const setVar = useReducer(reducers.setVar);
  const commitMapDiscovery = useReducer(reducers.commitMapDiscovery);
  const startScenario = useReducer(reducers.startScenario);
  const openCommandMode = useReducer(reducers.openCommandMode);
  const openBattleMode = useReducer(reducers.openBattleMode);

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
    async (pointId: string) => {
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
      });
    },
    [commitMapDiscovery, journeyDiscoveryCandidates],
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
    onDiscoverPoint: discoverJourneyPoint,
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
      await discoverJourneyPoint(target.id);
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
    if (!isCompactHud && isLedgerOpen) {
      setIsLedgerOpen(false);
    }
  }, [isCompactHud, isLedgerOpen]);

  useEffect(() => {
    if (initialPanel === "qr") {
      setIsCodeEntryOpen(true);
    }
  }, [initialPanel]);

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

  const runLegacyBinding = useCallback(
    async (point: RuntimeMapPoint, binding: RuntimeMapBinding) => {
      let scenarioToOpen: string | null = null;

      for (const action of binding.actions) {
        if (action.type === "travel_to") {
          await travelTo({ locationId: action.locationId });
          await setFlag({ key: `VISITED_${point.id}`, value: true });
          continue;
        }
        if (action.type === "start_scenario") {
          await startScenario({
            requestId: createRequestId("map_start", point.id),
            scenarioId: action.scenarioId,
          });
          await setFlag({ key: `VISITED_${point.id}`, value: true });
          scenarioToOpen = action.scenarioId;
          continue;
        }
        if (action.type === "open_command_mode") {
          if (RELEASE_PROFILE === "karlsruhe_event") {
            continue;
          }
          await openCommandMode({
            requestId: createRequestId("map_command", point.id),
            scenarioId: action.scenarioId,
            returnTab: action.returnTab,
            sourceTab: "map",
          });
          continue;
        }
        if (action.type === "open_battle_mode") {
          if (RELEASE_PROFILE === "karlsruhe_event") {
            continue;
          }
          await openBattleMode({
            requestId: createRequestId("map_battle", point.id),
            scenarioId: action.scenarioId,
            returnTab: action.returnTab,
            sourceTab: "map",
          });
          continue;
        }
        if (action.type === "set_flag") {
          await setFlag({ key: action.key, value: action.value });
        }
      }

      if (scenarioToOpen) {
        onOpenVnScenario(scenarioToOpen);
      }
    },
    [
      onOpenVnScenario,
      openBattleMode,
      openCommandMode,
      setFlag,
      startScenario,
      travelTo,
    ],
  );

  const runBinding = useCallback(
    async (point: RuntimeMapPoint, binding: RuntimeMapBinding) => {
      if (!isNetworkConnected) {
        setNetworkNotice("Agent network disconnected");
        throw new Error("Agent network disconnected");
      }

      if (source === "snapshot_v3") {
        try {
          await mapInteract({
            requestId: createRequestId("map_interact", point.id),
            pointId: point.id,
            bindingId: binding.id,
            trigger: binding.trigger,
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
        return;
      }

      await runLegacyBinding(point, binding);
    },
    [
      isNetworkConnected,
      mapInteract,
      onOpenVnScenario,
      runLegacyBinding,
      source,
    ],
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

  const sourceLabel = source === "snapshot_v3" ? "Snapshot v3" : "Legacy v2";
  const selectionLabel = selectedPoint
    ? `${selectedPoint.title} (${STATE_LABELS[selectedPoint.state]})`
    : mapStrings.no_selection;
  const ledgerItems = [
    [mapStrings.source, sourceLabel],
    [mapStrings.current_location, currentLocationId ?? "unknown"],
    [mapStrings.visible_points, String(displayedPoints.length)],
    [mapStrings.active_objectives, String(objectiveCount)],
    [mapStrings.selection, selectionLabel],
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
        <header
          className={`gw-map-header ${
            isCompactHud ? "gw-map-header--compact" : "gw-map-header--desktop"
          }`}
        >
          {isCompactHud ? (
            <>
              <CartouchePanel
                label="Plate XII · Cartography Chamber"
                padding="1rem 1.1rem"
                className="gw-map-compact-card gw-map-cartouche-full"
              >
                <div className="gw-map-compact-card__top">
                  <div>
                    <h2 className="gw-map-compact-card__title">
                      {region.name}
                    </h2>
                  </div>
                  <div className="gw-map-compact-header-layout">
                    <button
                      type="button"
                      aria-expanded={isLedgerOpen}
                      aria-controls={compactHeaderId.current}
                      className="gw-map-compact-card__toggle"
                      onClick={toggleLedger}
                    >
                      {isLedgerOpen
                        ? mapStrings.close_ledger
                        : mapStrings.open_ledger}
                    </button>
                    <button
                      type="button"
                      className="gw-map-compact-card__toggle"
                      aria-expanded={isCodeEntryOpen}
                      onClick={toggleCodeEntry}
                    >
                      {isCodeEntryOpen
                        ? mapStrings.hide_code
                        : mapStrings.redeem_code}
                    </button>
                  </div>
                </div>

                <div className="gw-map-compact-card__summary">
                  {compactSummaryItems.map((item) => (
                    <span
                      key={item}
                      className="gw-map-compact-card__summary-pill"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="gw-map-compact-card__states">
                  {MAP_POINT_STATES.map((state) => (
                    <span
                      key={state}
                      className="gw-map-compact-card__state-pill"
                      data-state={state}
                    >
                      <span className="gw-map-status-dot gw-map-status-dot--compact" />
                      {STATE_LABELS[state]}: {pointStateSummary[state]}
                    </span>
                  ))}
                </div>
              </CartouchePanel>

              {isLedgerOpen ? (
                <CartouchePanel
                  label={mapStrings.ledger}
                  padding="1rem 1.1rem"
                  className="gw-map-ledger-drawer gw-map-cartouche-full gw-map-cartouche-ink"
                >
                  <div
                    id={compactHeaderId.current}
                    className="gw-map-ledger-drawer__frame"
                  >
                    <div className="gw-map-ledger-drawer__header">
                      <button
                        type="button"
                        aria-label="Dismiss ledger"
                        className="gw-map-ledger-drawer__toggle"
                        onClick={toggleLedger}
                      >
                        {mapStrings.close_ledger}
                      </button>
                    </div>

                    <div className="gw-map-ledger-grid">
                      {ledgerItems.map(([label, value]) => (
                        <div key={label} className="gw-map-ledger-grid__item">
                          <span className="gw-map-ledger-grid__label">
                            {label}
                          </span>
                          <strong className="gw-map-ledger-value">
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div
                      className="gw-map-ledger-status"
                      data-sync-state={isReady ? "live" : "syncing"}
                    >
                      <span className="gw-map-status-dot" />
                      {isReady ? mapStrings.live : mapStrings.syncing}
                    </div>
                  </div>
                </CartouchePanel>
              ) : null}

              {isCodeEntryOpen ? (
                <CartouchePanel
                  label="QR Ledger"
                  padding="1rem 1.1rem"
                  className="gw-map-cartouche-full gw-map-cartouche-ink"
                >
                  <div className="gw-map-ledger-drawer__frame">
                    <div className="gw-map-ledger-drawer__header">
                      <button
                        type="button"
                        className="gw-map-ledger-drawer__toggle"
                        onClick={toggleCodeEntry}
                      >
                        {mapStrings.close_ledger}
                      </button>
                    </div>
                    <div className="gw-map-code-entry-grid">
                      <input
                        value={codeValue}
                        onChange={(event) => setCodeValue(event.target.value)}
                        placeholder={mapStrings.enter_archived_code}
                        className="gw-map-input-themed"
                      />
                      <button
                        type="button"
                        onClick={submitMapCode}
                        disabled={isRedeemingCode || !isNetworkConnected}
                        className="gw-map-ledger-drawer__toggle gw-map-submit-inline"
                      >
                        {isRedeemingCode
                          ? mapStrings.archiving
                          : mapStrings.archive_lead}
                      </button>
                      {codeStatus ? (
                        <p className="gw-map-code-entry-status">{codeStatus}</p>
                      ) : null}
                    </div>
                  </div>
                </CartouchePanel>
              ) : null}
            </>
          ) : (
            <>
              <CartouchePanel
                label="Plate XII · Cartography Chamber"
                padding="1.1rem 1.25rem"
              >
                <h2 className="gw-map-desktop-title">{region.name}</h2>
                <p className="gw-map-desktop-copy">
                  A living city atlas layered over live Spacetime subscriptions.
                  Travel, scenario starts, and objective focus still run on the
                  current authoritative bindings.
                </p>
                <div className="gw-map-state-pill-row">
                  {MAP_POINT_STATES.map((state) => (
                    <span
                      key={state}
                      className="gw-map-pill"
                      data-state={state}
                    >
                      <span className="gw-map-status-dot" />
                      {STATE_LABELS[state]}
                    </span>
                  ))}
                </div>
              </CartouchePanel>

              <CartouchePanel
                label={mapStrings.ledger}
                padding="1.1rem 1.25rem"
                className="gw-map-cartouche-ink"
              >
                <div className="gw-map-ledger-grid-desktop">
                  {ledgerItems.map(([label, value]) => (
                    <div key={label} className="gw-map-ledger-item-desktop">
                      <span className="gw-map-ledger-item-desktop__label">
                        {label}
                      </span>
                      <strong className="gw-map-ledger-value">{value}</strong>
                    </div>
                  ))}
                </div>
                <div
                  className="gw-map-ledger-status"
                  data-sync-state={isReady ? "live" : "syncing"}
                >
                  <span className="gw-map-status-dot" />
                  {isReady ? mapStrings.live : mapStrings.syncing}
                </div>
                <button
                  type="button"
                  onClick={toggleCodeEntry}
                  className="gw-map-code-toggle"
                >
                  {isCodeEntryOpen
                    ? mapStrings.hide_code
                    : mapStrings.redeem_code}
                </button>
                {isCodeEntryOpen ? (
                  <div className="gw-map-code-entry-panel">
                    <input
                      value={codeValue}
                      onChange={(event) => setCodeValue(event.target.value)}
                      placeholder={mapStrings.enter_archived_code}
                      className="gw-map-input-themed"
                    />
                    <div className="gw-map-code-entry-actions">
                      <button
                        type="button"
                        onClick={submitMapCode}
                        disabled={isRedeemingCode || !isNetworkConnected}
                        className="gw-map-code-submit"
                      >
                        {isRedeemingCode
                          ? mapStrings.archiving
                          : mapStrings.archive_lead}
                      </button>
                      {codeStatus ? (
                        <span className="gw-map-code-entry-status">
                          {codeStatus}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </CartouchePanel>
            </>
          )}
        </header>

        <div className="gw-map-overlay-tint" />
        <div className="gw-map-overlay-vignette" />

        {!isReady ? (
          <div className="gw-map-inline-note gw-map-status-pill">
            <span
              className="gw-map-status-pill__dot"
              data-sync-state="syncing"
            />
            {mapStrings.syncing}
          </div>
        ) : null}

        {!isNetworkConnected || networkNotice ? (
          <div className="gw-map-network-note gw-map-status-pill">
            <span
              className="gw-map-status-pill__dot"
              data-sync-state={isNetworkConnected ? "syncing" : "offline"}
            />
            {networkNotice ?? "Agent network disconnected"}
          </div>
        ) : null}

        {selectedPoint ? (
          <div className="gw-map-selection-note gw-map-status-pill">
            <span
              className="gw-map-status-pill__dot"
              data-state={selectedPoint.state}
            />
            {mapStrings.selection}: {selectedPoint.title}
          </div>
        ) : null}

        <div className="gw-map-legend" aria-hidden="true">
          {MAP_POINT_STATES.map((state) => (
            <span key={state} className="gw-map-legend-pill">
              <span className="gw-map-status-dot" data-state={state} />
              {STATE_LABELS[state]}: {pointStateSummary[state]}
            </span>
          ))}
        </div>

        <div className="gw-map-journey-controls">
          <button
            type="button"
            className="gw-map-journey-controls__button"
            data-active={isRouteMode ? "true" : "false"}
            aria-pressed={isRouteMode}
            onClick={() => setIsRouteMode((current) => !current)}
          >
            <MapPinPlus size={16} />
            {mapStrings.journey.route_mode}
          </button>
          <button
            type="button"
            className="gw-map-journey-controls__button"
            disabled={journey.waypoints.length === 0}
            onClick={() =>
              journey.isPaused ? journey.resume() : journey.pause()
            }
          >
            {journey.isPaused ? <Play size={16} /> : <Pause size={16} />}
            {journey.isPaused
              ? mapStrings.journey.resume
              : mapStrings.journey.pause}
          </button>
          <button
            type="button"
            className="gw-map-journey-controls__button"
            disabled={!journey.isMoving && !journey.isPaused}
            onClick={journey.stopForInteraction}
          >
            <Square size={15} />
            {mapStrings.journey.stop}
          </button>
          <button
            type="button"
            className="gw-map-journey-controls__button"
            disabled={journey.waypoints.length === 0}
            onClick={journey.clear}
          >
            <Trash2 size={16} />
            {mapStrings.journey.clear}
          </button>
          <div className="gw-map-journey-controls__status">
            <Route size={16} />
            <span>
              {journey.waypoints.length} {mapStrings.journey.queued}
            </span>
          </div>
        </div>

        <CompassOverlay
          activeWaypoint={journey.activeWaypoint}
          bearingToTarget={journey.bearingToTarget}
          inSearchZone={journey.inSearchZone}
          remainingDistanceMeters={journey.remainingDistanceMeters}
          searchTarget={journey.searchTarget}
          speedKmH={journey.speedKmH}
          discoverySignal={discoverySignal}
          observationMode={isObservationMode}
          observationInspectAvailable={canInspectObservationSignal}
          networkConnected={isNetworkConnected}
          onToggleObservationMode={toggleObservationMode}
          onInspectObservationTarget={inspectObservationTarget}
        />

        <MapGL
          initialViewState={{
            longitude: region.geoCenterLng,
            latitude: region.geoCenterLat,
            zoom: region.zoom,
          }}
          mapStyle={MAPBOX_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={handleMapClick}
          onZoomEnd={(evt: ViewStateChangeEvent) =>
            setZoomLevel(evt.viewState.zoom)
          }
          reuseMaps
          {...MAP_GL_LAYOUT_PROPS}
        >
          <NavigationControl position="bottom-right" />

          {journey.plannedPath.length > 1 ? (
            <Source
              id="gw-journey-planned-route"
              type="geojson"
              data={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: journey.plannedPath,
                },
              }}
            >
              <Layer
                id="gw-journey-planned-route-line"
                type="line"
                paint={{
                  "line-color": "#f2d088",
                  "line-width": 4,
                  "line-opacity": 0.72,
                  "line-dasharray": [0.8, 1.1],
                }}
              />
            </Source>
          ) : null}

          {journey.traveledPath.length > 1 ? (
            <Source
              id="gw-journey-traveled-route"
              type="geojson"
              data={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: journey.traveledPath,
                },
              }}
            >
              <Layer
                id="gw-journey-traveled-route-line"
                type="line"
                paint={{
                  "line-color": "#69c1a3",
                  "line-width": 5,
                  "line-opacity": 0.84,
                }}
              />
            </Source>
          ) : null}

          {visibleRoutes.map((route) => (
            <Source
              key={route.id}
              id={route.id}
              type="geojson"
              data={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: route.coordinates,
                },
              }}
            >
              <Layer
                id={`${route.id}-line`}
                type="line"
                paint={{
                  "line-color": route.color ?? "#b88943",
                  "line-width": 3,
                  "line-opacity": 0.82,
                  "line-dasharray": [1.2, 1.1],
                }}
              />
            </Source>
          ))}

          {displayedPoints.map((point) => (
            <Marker
              key={point.id}
              longitude={point.lng}
              latitude={point.lat}
              anchor="center"
            >
              <div
                className="gw-map-marker-shell"
                data-rejected={
                  rejectedPointIds.has(point.id) ? "true" : "false"
                }
              >
                <CobblestoneMarker
                  point={point}
                  selected={point.id === selectedPointId}
                  size={isZoomedOut ? 40 : 56}
                  onClick={() => handlePointClick(point)}
                />
              </div>
            </Marker>
          ))}

          {journey.position ? (
            <Marker
              longitude={journey.position[0]}
              latitude={journey.position[1]}
              anchor="center"
            >
              <div aria-label="Player position">
                <PlayerPin
                  variant="trace"
                  state={journey.isMoving ? "moving" : "idle"}
                />
              </div>
            </Marker>
          ) : null}
        </MapGL>
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
