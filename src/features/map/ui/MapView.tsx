import { useCallback, useEffect, useMemo, useState } from "react";
import MapGL, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { useReducer } from "spacetimedb/react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "../../../config";
import { reducers } from "../../../shared/spacetime/bindings";
import { useMapRuntimeState } from "../hooks/useMapRuntimeState";
import type { RuntimeMapPoint } from "../types";
import { CaseCard } from "./CaseCard";
import { DetectiveMapPin } from "./DetectiveMapPin";

interface MapViewProps {
  onOpenVnScenario: (scenarioId: string) => void;
}

export const MapView = ({ onOpenVnScenario }: MapViewProps) => {
  const { region, points, currentLocationId, isReady } = useMapRuntimeState();
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

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

  const markVisited = useCallback(
    async (point: RuntimeMapPoint) => {
      await setFlag({
        key: `VISITED_${point.id}`,
        value: true,
      });
    },
    [setFlag],
  );

  const handleTravel = useCallback(
    async (point: RuntimeMapPoint) => {
      await travelTo({
        locationId: point.locationId,
      });
      await markVisited(point);
    },
    [markVisited, travelTo],
  );

  const handleStartScenario = useCallback(
    async (point: RuntimeMapPoint) => {
      if (!point.resolvedScenarioId) {
        return;
      }

      await startScenario({
        requestId: `map_start_${Date.now()}_${point.id}`,
        scenarioId: point.resolvedScenarioId,
      });
      await markVisited(point);
      onOpenVnScenario(point.resolvedScenarioId);
    },
    [markVisited, onOpenVnScenario, startScenario],
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
            SpacetimeDB-backed map state. Current location:{" "}
            <strong>{currentLocationId ?? "unknown"}</strong>
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
          onTravel={handleTravel}
          onStartScenario={handleStartScenario}
          onClose={() => setSelectedPointId(null)}
        />
      ) : null}
    </section>
  );
};
