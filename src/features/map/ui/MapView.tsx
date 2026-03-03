import { useCallback, useEffect, useMemo, useState } from "react";
import MapGL, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { useReducer } from "spacetimedb/react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "../../../config";
import { reducers } from "../../../shared/spacetime/bindings";
import { useMapRuntimeState } from "../hooks/useMapRuntimeState";
import type { RuntimeMapBinding, RuntimeMapPoint } from "../types";
import { CaseCard } from "./CaseCard";
import { DetectiveMapPin } from "./DetectiveMapPin";

interface MapViewProps {
  onOpenVnScenario: (scenarioId: string) => void;
}

const createRequestId = (prefix: string, pointId: string): string =>
  `${prefix}_${pointId}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const getStartScenarioId = (binding: RuntimeMapBinding): string | null => {
  for (const action of binding.actions) {
    if (action.type === "start_scenario") {
      return action.scenarioId;
    }
  }
  return null;
};

export const MapView = ({ onOpenVnScenario }: MapViewProps) => {
  const { source, region, points, currentLocationId, isReady } =
    useMapRuntimeState();
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const mapInteract = useReducer(reducers.mapInteract);
  const travelTo = useReducer(reducers.travelTo);
  const setFlag = useReducer(reducers.setFlag);
  const startScenario = useReducer(reducers.startScenario);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId],
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
        if (action.type === "set_flag") {
          await setFlag({ key: action.key, value: action.value });
          continue;
        }
      }

      if (scenarioToOpen) {
        onOpenVnScenario(scenarioToOpen);
      }
    },
    [onOpenVnScenario, setFlag, startScenario, travelTo],
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

  if (!MAPBOX_TOKEN) {
    return (
      <section className="panel-section">
        <article className="card warning">
          <h3>Mapbox token is missing</h3>
          <p>
            Add <code>VITE_MAPBOX_TOKEN</code> to <code>.env.local</code> to
            enable the interactive map.
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="panel-section">
      <header className="panel-header">
        <div>
          <h2>{region.name}</h2>
          <p>
            Source:{" "}
            <strong>
              {source === "snapshot_v3" ? "snapshot v3" : "legacy v2 fallback"}
            </strong>{" "}
            | Current location:{" "}
            <strong>{currentLocationId ?? "unknown"}</strong>
          </p>
          <p className="muted">
            Pin legend: gray=locked, amber=discovered, green=visited,
            blue=completed, ring=active objective.
          </p>
        </div>
      </header>

      {!isReady ? (
        <article className="card">
          <p className="muted">Syncing map state from SpacetimeDB...</p>
        </article>
      ) : null}

      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          minHeight: "62dvh",
          position: "relative",
        }}
      >
        <MapGL
          initialViewState={{
            longitude: region.geoCenterLng,
            latitude: region.geoCenterLat,
            zoom: region.zoom,
          }}
          mapStyle={MAPBOX_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "62dvh" }}
        >
          <NavigationControl position="bottom-right" />

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
                onClick={() => setSelectedPointId(point.id)}
              />
            </Marker>
          ))}
        </MapGL>
      </div>

      {selectedPoint ? (
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
