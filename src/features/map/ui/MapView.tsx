import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MapGL, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { useReducer, useTable } from "spacetimedb/react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./mapExperience.css";
import type { OpenVnScenarioOptions } from "../../../app/AppShell";
import { MAPBOX_STYLE, MAPBOX_TOKEN, RELEASE_PROFILE } from "../../../config";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { useMapRuntimeState } from "../hooks/useMapRuntimeState";
import type {
  RuntimeMapBinding,
  RuntimeMapPoint,
  RuntimeMapRoute,
} from "../types";
import { CaseCard } from "./CaseCard";
import { DetectiveHub } from "./DetectiveHub";
import { DetectiveMapPin } from "./DetectiveMapPin";

interface MapViewProps {
  onOpenVnScenario: (
    scenarioId: string,
    options?: OpenVnScenarioOptions,
  ) => void;
  initialPanel?: "qr";
}

const MAP_VIEWPORT_HEIGHT = "calc(100dvh - env(safe-area-inset-bottom) - 4rem)";
const COMPACT_HUD_QUERY = "(max-width: 960px)";
const SEMANTIC_ZOOM_THRESHOLD = 14.5;
const GEOLOCATION_TIMEOUT_MS = 2500;

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

const STATE_LABELS: Record<RuntimeMapPoint["state"], string> = {
  locked: "Locked",
  discovered: "Discovered",
  visited: "Visited",
  completed: "Completed",
};

const STATE_COLORS: Record<RuntimeMapPoint["state"], string> = {
  locked: "#8a97aa",
  discovered: "#d9a743",
  visited: "#6cc36b",
  completed: "#59b4de",
};

const mapCodeResultLabel = (result: string): string => {
  if (result === "applied") {
    return "Lead archived to your map ledger.";
  }
  if (result === "queued_after_briefing") {
    return "Lead archived; available after briefing.";
  }
  if (result === "already_redeemed") {
    return "This code has already been used on this profile.";
  }
  if (result === "blocked_flags") {
    return "This lead cannot be used yet.";
  }
  if (result === "location_required") {
    return "Location required to validate this lead.";
  }
  if (result === "outside_geofence") {
    return "You are too far away from this lead.";
  }
  if (result === "cooldown") {
    return "Try again shortly.";
  }
  return "Code processed.";
};

const frameOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

const panelStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  padding: "1.1rem 1.25rem",
  borderRadius: "1rem",
  border: "1px solid rgba(214, 196, 144, 0.18)",
  background:
    "linear-gradient(160deg, rgba(44, 31, 19, 0.9), rgba(16, 13, 10, 0.84))",
  boxShadow:
    "0 24px 60px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 248, 220, 0.04)",
  backdropFilter: "blur(14px)",
};

const textureOverlayStyle: CSSProperties = {
  ...frameOverlayStyle,
  background:
    'radial-gradient(circle at top left, rgba(223, 193, 126, 0.2), transparent 48%), url("/images/paper-texture.png")',
  backgroundSize: "auto, 240px",
  opacity: 0.24,
};

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
  const { identityHex } = useIdentity();
  const {
    source,
    region,
    points,
    routes = [],
    currentLocationId,
    isReady,
  } = useMapRuntimeState();
  const [codeRedemptions] = useTable(tables.myRedeemedCodes);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
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
  const isZoomedOut = zoomLevel < SEMANTIC_ZOOM_THRESHOLD;
  const compactHeaderId = useRef(
    `gw-map-ledger-${Math.random().toString(36).slice(2)}`,
  );

  const mapInteract = useReducer(reducers.mapInteract);
  const redeemMapCode = useReducer(reducers.redeemMapCode);
  const travelTo = useReducer(reducers.travelTo);
  const setFlag = useReducer(reducers.setFlag);
  const startScenario = useReducer(reducers.startScenario);
  const openCommandMode = useReducer(reducers.openCommandMode);
  const openBattleMode = useReducer(reducers.openBattleMode);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId],
  );

  const pointStateSummary = useMemo(() => {
    const summary: Record<RuntimeMapPoint["state"], number> = {
      locked: 0,
      discovered: 0,
      visited: 0,
      completed: 0,
    };
    for (const point of points) {
      summary[point.state] += 1;
    }
    return summary;
  }, [points]);

  const objectiveCount = useMemo(
    () => points.filter((point) => point.isObjectiveActive).length,
    [points],
  );

  useEffect(() => {
    if (!selectedPointId) {
      return;
    }
    if (points.some((point) => point.id === selectedPointId)) {
      return;
    }
    setSelectedPointId(null);
  }, [points, selectedPointId]);

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
  }, [codeRedemptions, identityHex, pendingCodeRequestId]);

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

  const selectedRouteAnchorId = selectedPoint
    ? (selectedPoint.persistentPointId ?? selectedPoint.id)
    : null;
  const visibleRoutes = useMemo(() => {
    if (isZoomedOut) {
      return [] as RuntimeMapRoute[];
    }

    return routes.filter((route) => {
      const hasObjectivePoint = route.pointIds.some((pointId) =>
        points.some(
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
  }, [isZoomedOut, points, routes, selectedRouteAnchorId]);

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
      if (source === "snapshot_v3") {
        await mapInteract({
          requestId: createRequestId("map_interact", point.id),
          pointId: point.id,
          bindingId: binding.id,
          trigger: binding.trigger,
        });

        const scenarioId = getStartScenarioId(binding);
        if (scenarioId) {
          onOpenVnScenario(scenarioId);
        }
        return;
      }

      await runLegacyBinding(point, binding);
    },
    [mapInteract, onOpenVnScenario, runLegacyBinding, source],
  );

  const submitMapCode = useCallback(async () => {
    const trimmedCode = codeValue.trim();
    if (!trimmedCode) {
      setCodeStatus("Enter a code first.");
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
        setCodeStatus("Code not recognized.");
        return;
      }
      if (message.includes("code_already_redeemed")) {
        setCodeStatus("This code has already been used on this profile.");
        return;
      }
      if (message.includes("code_not_available")) {
        setCodeStatus("This lead cannot be used yet.");
        return;
      }
      if (message.includes("code_location_required")) {
        setCodeStatus("Location required to validate this lead.");
        return;
      }
      if (message.includes("code_outside_geofence")) {
        setCodeStatus("You are too far away from this lead.");
        return;
      }
      if (message.includes("code_retry_later")) {
        setCodeStatus("Try again shortly.");
        return;
      }
      setCodeStatus("Code submission failed.");
    }
  }, [codeValue, redeemMapCode]);

  if (!MAPBOX_TOKEN) {
    return (
      <section className="gw-map-shell gw-map-shell--fallback">
        <article
          className="gw-map-empty-state"
          style={{
            ...panelStyle,
            width: "min(100%, 34rem)",
            padding: "1.4rem 1.5rem",
          }}
        >
          <div style={textureOverlayStyle} />
          <p
            style={{
              position: "relative",
              margin: 0,
              color: "#d3b27a",
              fontFamily: "var(--font-mono)",
              fontSize: "0.74rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Cartography Chamber
          </p>
          <h3
            style={{
              position: "relative",
              margin: "0.45rem 0 0",
              color: "#f5e9ca",
              fontFamily: "var(--font-serif)",
              fontSize: "1.65rem",
            }}
          >
            Mapbox token is missing
          </h3>
          <p
            style={{
              position: "relative",
              margin: "0.8rem 0 0",
              color: "#d2c4a4",
              lineHeight: 1.6,
            }}
          >
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
    : "No point selected";
  const ledgerItems = [
    ["Source", sourceLabel],
    ["Current location", currentLocationId ?? "unknown"],
    ["Visible points", String(points.length)],
    ["Active objectives", String(objectiveCount)],
    ["Selection", selectionLabel],
    [
      "Visited / completed",
      `${pointStateSummary.visited + pointStateSummary.completed} / ${points.length}`,
    ],
  ] as const;
  const compactSummaryItems = [
    `Source ${sourceLabel}`,
    `Location ${currentLocationId ?? "unknown"}`,
    `${objectiveCount} objectives`,
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

  return (
    <section className="gw-map-shell">
      <div
        className="gw-map-frame"
        style={{ minHeight: MAP_VIEWPORT_HEIGHT, background: "#15100d" }}
      >
        <header
          className={`gw-map-header ${
            isCompactHud ? "gw-map-header--compact" : "gw-map-header--desktop"
          }`}
        >
          {isCompactHud ? (
            <>
              <article
                className="gw-map-compact-card"
                style={{ ...panelStyle, width: "100%" }}
              >
                <div style={textureOverlayStyle} />
                <div className="gw-map-compact-card__top">
                  <div>
                    <p
                      style={{
                        position: "relative",
                        margin: 0,
                        color: "#d3b27a",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                      }}
                    >
                      Cartography Chamber
                    </p>
                    <h2
                      style={{
                        position: "relative",
                        margin: "0.35rem 0 0",
                        color: "#f5e9ca",
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(1.2rem, 4.2vw, 1.7rem)",
                        lineHeight: 1.08,
                      }}
                    >
                      {region.name}
                    </h2>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={isLedgerOpen}
                      aria-controls={compactHeaderId.current}
                      className="gw-map-compact-card__toggle"
                      onClick={toggleLedger}
                    >
                      {isLedgerOpen ? "Close ledger" : "Open ledger"}
                    </button>
                    <button
                      type="button"
                      className="gw-map-compact-card__toggle"
                      aria-expanded={isCodeEntryOpen}
                      onClick={toggleCodeEntry}
                    >
                      {isCodeEntryOpen ? "Hide code" : "Redeem code"}
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
                  {(
                    ["locked", "discovered", "visited", "completed"] as const
                  ).map((state) => (
                    <span
                      key={state}
                      className="gw-map-compact-card__state-pill"
                      style={{ color: STATE_COLORS[state] }}
                    >
                      <span
                        style={{
                          width: "0.48rem",
                          height: "0.48rem",
                          borderRadius: "999px",
                          background: "currentColor",
                          boxShadow: "0 0 12px currentColor",
                        }}
                      />
                      {STATE_LABELS[state]}: {pointStateSummary[state]}
                    </span>
                  ))}
                </div>
              </article>

              {isLedgerOpen ? (
                <article
                  id={compactHeaderId.current}
                  className="gw-map-ledger-drawer"
                  style={{ ...panelStyle, width: "100%", color: "#efe1c0" }}
                >
                  <div style={textureOverlayStyle} />
                  <div className="gw-map-ledger-drawer__frame">
                    <div className="gw-map-ledger-drawer__header">
                      <h3
                        style={{
                          margin: 0,
                          color: "#f8f0dc",
                          fontFamily: "var(--font-serif)",
                          fontSize: "1.05rem",
                        }}
                      >
                        Field Ledger
                      </h3>
                      <button
                        type="button"
                        className="gw-map-ledger-drawer__toggle"
                        onClick={toggleLedger}
                      >
                        Close
                      </button>
                    </div>

                    <div className="gw-map-ledger-grid">
                      {ledgerItems.map(([label, value]) => (
                        <div key={label} className="gw-map-ledger-grid__item">
                          <span className="gw-map-ledger-grid__label">
                            {label}
                          </span>
                          <strong
                            style={{ color: "#fcf4df", lineHeight: 1.35 }}
                          >
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="gw-map-ledger-status">
                      <span
                        style={{
                          width: "0.6rem",
                          height: "0.6rem",
                          borderRadius: "999px",
                          background: isReady ? "#6cc36b" : "#d9a743",
                          boxShadow: `0 0 14px ${isReady ? "#6cc36b" : "#d9a743"}`,
                        }}
                      />
                      {isReady
                        ? "Live subscriptions active"
                        : "Syncing map state from SpacetimeDB..."}
                    </div>
                  </div>
                </article>
              ) : null}

              {isCodeEntryOpen ? (
                <article
                  style={{ ...panelStyle, width: "100%", color: "#efe1c0" }}
                >
                  <div style={textureOverlayStyle} />
                  <div className="gw-map-ledger-drawer__frame">
                    <div className="gw-map-ledger-drawer__header">
                      <h3
                        style={{
                          margin: 0,
                          color: "#f8f0dc",
                          fontFamily: "var(--font-serif)",
                          fontSize: "1.05rem",
                        }}
                      >
                        QR Ledger
                      </h3>
                      <button
                        type="button"
                        className="gw-map-ledger-drawer__toggle"
                        onClick={toggleCodeEntry}
                      >
                        Close
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gap: "0.75rem",
                        position: "relative",
                      }}
                    >
                      <input
                        value={codeValue}
                        onChange={(event) => setCodeValue(event.target.value)}
                        placeholder="Enter archived code"
                        style={{
                          width: "100%",
                          padding: "0.8rem 0.95rem",
                          borderRadius: "0.85rem",
                          border: "1px solid rgba(255, 239, 206, 0.12)",
                          background: "rgba(8, 8, 8, 0.2)",
                          color: "#fcf4df",
                        }}
                      />
                      <button
                        type="button"
                        onClick={submitMapCode}
                        disabled={isRedeemingCode}
                        className="gw-map-ledger-drawer__toggle"
                        style={{ justifySelf: "start" }}
                      >
                        {isRedeemingCode ? "Archiving..." : "Archive lead"}
                      </button>
                      {codeStatus ? (
                        <p
                          style={{
                            margin: 0,
                            color: "#d9c49d",
                            lineHeight: 1.5,
                          }}
                        >
                          {codeStatus}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ) : null}
            </>
          ) : (
            <>
              <article style={panelStyle}>
                <div style={textureOverlayStyle} />
                <p
                  style={{
                    position: "relative",
                    margin: 0,
                    color: "#d3b27a",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.74rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  Cartography Chamber
                </p>
                <h2
                  style={{
                    position: "relative",
                    margin: "0.45rem 0 0",
                    color: "#f5e9ca",
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(1.6rem, 2.6vw, 2.35rem)",
                    lineHeight: 1.05,
                  }}
                >
                  {region.name}
                </h2>
                <p
                  style={{
                    position: "relative",
                    margin: "0.8rem 0 0",
                    color: "rgba(245, 236, 217, 0.82)",
                    lineHeight: 1.6,
                    maxWidth: "62ch",
                  }}
                >
                  A living city atlas layered over live Spacetime subscriptions.
                  Travel, scenario starts, and objective focus still run on the
                  current authoritative bindings.
                </p>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.45rem",
                    marginTop: "1rem",
                  }}
                >
                  {(
                    ["locked", "discovered", "visited", "completed"] as const
                  ).map((state) => (
                    <span
                      key={state}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.42rem 0.7rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(255, 245, 214, 0.12)",
                        background: "rgba(7, 7, 7, 0.2)",
                        color: STATE_COLORS[state],
                        fontSize: "0.74rem",
                      }}
                    >
                      <span
                        style={{
                          width: "0.6rem",
                          height: "0.6rem",
                          borderRadius: "999px",
                          background: "currentColor",
                          boxShadow: "0 0 14px currentColor",
                        }}
                      />
                      {STATE_LABELS[state]}
                    </span>
                  ))}
                </div>
              </article>

              <article style={{ ...panelStyle, color: "#efe1c0" }}>
                <div style={textureOverlayStyle} />
                <h3
                  style={{
                    position: "relative",
                    margin: 0,
                    color: "#f8f0dc",
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.1rem",
                  }}
                >
                  Field Ledger
                </h3>
                <div
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.75rem",
                    marginTop: "0.8rem",
                  }}
                >
                  {ledgerItems.map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "0.85rem",
                        border: "1px solid rgba(255, 239, 206, 0.08)",
                        background: "rgba(8, 8, 8, 0.16)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          marginBottom: "0.35rem",
                          color: "rgba(239, 225, 192, 0.62)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        {label}
                      </span>
                      <strong style={{ color: "#fcf4df", lineHeight: 1.35 }}>
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    marginTop: "0.9rem",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "999px",
                    background: "rgba(7, 7, 7, 0.22)",
                    color: "rgba(246, 236, 214, 0.86)",
                    fontSize: "0.76rem",
                  }}
                >
                  <span
                    style={{
                      width: "0.6rem",
                      height: "0.6rem",
                      borderRadius: "999px",
                      background: isReady ? "#6cc36b" : "#d9a743",
                      boxShadow: `0 0 14px ${isReady ? "#6cc36b" : "#d9a743"}`,
                    }}
                  />
                  {isReady
                    ? "Live subscriptions active"
                    : "Syncing map state from SpacetimeDB..."}
                </div>
                <button
                  type="button"
                  onClick={toggleCodeEntry}
                  style={{
                    position: "relative",
                    marginTop: "0.85rem",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 239, 206, 0.14)",
                    background: "rgba(7, 7, 7, 0.22)",
                    color: "#f3e7c7",
                    cursor: "pointer",
                  }}
                >
                  {isCodeEntryOpen ? "Hide QR ledger" : "Redeem QR code"}
                </button>
                {isCodeEntryOpen ? (
                  <div
                    style={{
                      position: "relative",
                      display: "grid",
                      gap: "0.75rem",
                      marginTop: "0.9rem",
                      padding: "0.9rem",
                      borderRadius: "0.95rem",
                      border: "1px solid rgba(255, 239, 206, 0.08)",
                      background: "rgba(8, 8, 8, 0.16)",
                    }}
                  >
                    <input
                      value={codeValue}
                      onChange={(event) => setCodeValue(event.target.value)}
                      placeholder="Enter archived code"
                      style={{
                        width: "100%",
                        padding: "0.8rem 0.95rem",
                        borderRadius: "0.85rem",
                        border: "1px solid rgba(255, 239, 206, 0.12)",
                        background: "rgba(12, 10, 9, 0.72)",
                        color: "#fcf4df",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.7rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={submitMapCode}
                        disabled={isRedeemingCode}
                        style={{
                          padding: "0.65rem 0.85rem",
                          borderRadius: "999px",
                          border: "1px solid rgba(255, 239, 206, 0.14)",
                          background: "rgba(44, 31, 19, 0.88)",
                          color: "#f3e7c7",
                          cursor: "pointer",
                        }}
                      >
                        {isRedeemingCode ? "Archiving..." : "Archive lead"}
                      </button>
                      {codeStatus ? (
                        <span style={{ color: "#d9c49d", lineHeight: 1.5 }}>
                          {codeStatus}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            </>
          )}
        </header>

        <div
          style={{
            ...frameOverlayStyle,
            zIndex: 1,
            background:
              'linear-gradient(135deg, rgba(120, 90, 52, 0.16), transparent 42%), url("/images/paper-texture.png")',
            backgroundSize: "auto, 240px",
            mixBlendMode: "soft-light",
            opacity: 0.28,
          }}
        />
        <div
          style={{
            ...frameOverlayStyle,
            zIndex: 3,
            background:
              "radial-gradient(circle at center, transparent 48%, rgba(10, 8, 7, 0.3) 100%), linear-gradient(180deg, rgba(15, 13, 11, 0.06), rgba(15, 13, 11, 0.25))",
          }}
        />

        {!isReady ? (
          <div
            className="gw-map-inline-note"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "999px",
              border: "1px solid rgba(229, 210, 170, 0.16)",
              background: "rgba(23, 17, 12, 0.82)",
              color: "#f2e6c6",
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)",
              fontSize: "0.76rem",
            }}
          >
            <span
              style={{
                width: "0.6rem",
                height: "0.6rem",
                borderRadius: "999px",
                background: "#d9a743",
                boxShadow: "0 0 14px #d9a743",
              }}
            />
            Syncing map state from SpacetimeDB...
          </div>
        ) : null}

        {selectedPoint ? (
          <div
            className="gw-map-selection-note"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "999px",
              border: "1px solid rgba(229, 210, 170, 0.16)",
              background: "rgba(23, 17, 12, 0.82)",
              color: "#f2e6c6",
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)",
              fontSize: "0.76rem",
            }}
          >
            <span
              style={{
                width: "0.6rem",
                height: "0.6rem",
                borderRadius: "999px",
                background:
                  selectedPoint.state === "locked"
                    ? "#8a97aa"
                    : selectedPoint.state === "discovered"
                      ? "#d9a743"
                      : selectedPoint.state === "visited"
                        ? "#6cc36b"
                        : "#59b4de",
                boxShadow: "0 0 14px currentColor",
                color:
                  selectedPoint.state === "locked"
                    ? "#8a97aa"
                    : selectedPoint.state === "discovered"
                      ? "#d9a743"
                      : selectedPoint.state === "visited"
                        ? "#6cc36b"
                        : "#59b4de",
              }}
            />
            Selected: {selectedPoint.title}
          </div>
        ) : null}

        <div className="gw-map-legend" aria-hidden="true">
          {(["locked", "discovered", "visited", "completed"] as const).map(
            (state) => (
              <span
                key={state}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.42rem 0.68rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(255, 245, 214, 0.12)",
                  background: "rgba(23, 17, 12, 0.8)",
                  color: "#fbf3df",
                  backdropFilter: "blur(8px)",
                  fontSize: "0.72rem",
                }}
              >
                <span
                  style={{
                    width: "0.6rem",
                    height: "0.6rem",
                    borderRadius: "999px",
                    background:
                      state === "locked"
                        ? "#8a97aa"
                        : state === "discovered"
                          ? "#d9a743"
                          : state === "visited"
                            ? "#6cc36b"
                            : "#59b4de",
                    boxShadow: `0 0 14px ${
                      state === "locked"
                        ? "#8a97aa"
                        : state === "discovered"
                          ? "#d9a743"
                          : state === "visited"
                            ? "#6cc36b"
                            : "#59b4de"
                    }`,
                  }}
                />
                {STATE_LABELS[state]}: {pointStateSummary[state]}
              </span>
            ),
          )}
        </div>

        <MapGL
          initialViewState={{
            longitude: region.geoCenterLng,
            latitude: region.geoCenterLat,
            zoom: region.zoom,
          }}
          mapStyle={MAPBOX_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={closeMapOverlays}
          onZoomEnd={(evt: ViewStateChangeEvent) =>
            setZoomLevel(evt.viewState.zoom)
          }
          reuseMaps
          style={{ width: "100%", height: MAP_VIEWPORT_HEIGHT }}
        >
          <NavigationControl position="bottom-right" />

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

          {points.map((point) => (
            <Marker
              key={point.id}
              longitude={point.lng}
              latitude={point.lat}
              anchor="center"
            >
              <DetectiveMapPin
                point={point}
                isSelected={point.id === selectedPointId}
                isZoomedOut={isZoomedOut}
                onClick={() => {
                  setSelectedPointId(point.id);
                  setIsLedgerOpen(false);
                }}
              />
            </Marker>
          ))}
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
          onRunBinding={runBinding}
          onClose={() => setSelectedPointId(null)}
        />
      ) : null}
    </section>
  );
};
