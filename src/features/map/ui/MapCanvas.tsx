import MapGL, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "../../../config";
import type { LngLatTuple } from "../model/geo";
import type { MapRegion, RuntimeMapPoint, RuntimeMapRoute } from "../types";
import { CobblestoneMarker } from "./CobblestoneMarker";
import { PlayerPin, type PlayerPinState } from "./PlayerPin";

const MAP_GL_LAYOUT_PROPS = {
  style: {
    width: "100%",
    height: "calc(100dvh - env(safe-area-inset-bottom) - 4rem)",
  },
} as const;

export interface MapCanvasProps {
  region: MapRegion;
  onMapClick: (event: unknown) => void;
  onZoomEnd: (zoom: number) => void;
  plannedPath: LngLatTuple[];
  traveledPath: LngLatTuple[];
  routes: RuntimeMapRoute[];
  points: RuntimeMapPoint[];
  rejectedPointIds: ReadonlySet<string>;
  /** Points within reaction distance of the player — soft proximity glow. */
  nearbyPointIds: ReadonlySet<string>;
  selectedPointId: string | null;
  isZoomedOut: boolean;
  onPointClick: (point: RuntimeMapPoint) => void;
  playerPosition: LngLatTuple | null;
  playerState: PlayerPinState;
  /** Compass bearing of travel in degrees (0..359). */
  playerBearing: number;
  /** Speed normalized 0..1 — drives the pin pulse cadence. */
  playerSpeedRatio: number;
}

export const MapCanvas = ({
  region,
  onMapClick,
  onZoomEnd,
  plannedPath,
  traveledPath,
  routes,
  points,
  rejectedPointIds,
  nearbyPointIds,
  selectedPointId,
  isZoomedOut,
  onPointClick,
  playerPosition,
  playerState,
  playerBearing,
  playerSpeedRatio,
}: MapCanvasProps) => (
  <MapGL
    initialViewState={{
      longitude: region.geoCenterLng,
      latitude: region.geoCenterLat,
      zoom: region.zoom,
    }}
    mapStyle={MAPBOX_STYLE}
    mapboxAccessToken={MAPBOX_TOKEN}
    onClick={onMapClick}
    onZoomEnd={(evt: ViewStateChangeEvent) => onZoomEnd(evt.viewState.zoom)}
    reuseMaps
    {...MAP_GL_LAYOUT_PROPS}
  >
    <NavigationControl position="bottom-right" />

    {plannedPath.length > 1 ? (
      <Source
        id="gw-journey-planned-route"
        type="geojson"
        data={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: plannedPath,
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

    {traveledPath.length > 1 ? (
      <Source
        id="gw-journey-traveled-route"
        type="geojson"
        data={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: traveledPath,
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

    {routes.map((route) => (
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
        <div
          className="gw-map-marker-shell"
          data-rejected={rejectedPointIds.has(point.id) ? "true" : "false"}
        >
          <CobblestoneMarker
            point={point}
            selected={point.id === selectedPointId}
            nearby={nearbyPointIds.has(point.id)}
            objective={point.isObjectiveActive}
            size={isZoomedOut ? 40 : 56}
            onClick={() => onPointClick(point)}
          />
        </div>
      </Marker>
    ))}

    {playerPosition ? (
      <Marker
        longitude={playerPosition[0]}
        latitude={playerPosition[1]}
        anchor="center"
      >
        <div aria-label="Player position">
          <PlayerPin
            variant="trace"
            state={playerState}
            bearing={playerBearing}
            speed={playerSpeedRatio}
          />
        </div>
      </Marker>
    ) : null}
  </MapGL>
);
