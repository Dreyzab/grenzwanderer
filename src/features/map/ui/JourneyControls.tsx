import { MapPinPlus, Pause, Play, Route, Square, Trash2 } from "lucide-react";
import type { getMapStrings } from "../../i18n/uiStrings";

type JourneyStrings = ReturnType<typeof getMapStrings>["journey"];

export interface JourneyControlsProps {
  strings: JourneyStrings;
  isRouteMode: boolean;
  onToggleRouteMode: () => void;
  waypointCount: number;
  isPaused: boolean;
  isMoving: boolean;
  onPauseResume: () => void;
  onStop: () => void;
  onClear: () => void;
}

export const JourneyControls = ({
  strings,
  isRouteMode,
  onToggleRouteMode,
  waypointCount,
  isPaused,
  isMoving,
  onPauseResume,
  onStop,
  onClear,
}: JourneyControlsProps) => (
  <div className="gw-map-journey-controls">
    <button
      type="button"
      className="gw-map-journey-controls__button"
      data-active={isRouteMode ? "true" : "false"}
      aria-pressed={isRouteMode}
      onClick={onToggleRouteMode}
    >
      <MapPinPlus size={16} />
      {strings.route_mode}
    </button>
    <button
      type="button"
      className="gw-map-journey-controls__button"
      disabled={waypointCount === 0}
      onClick={onPauseResume}
    >
      {isPaused ? <Play size={16} /> : <Pause size={16} />}
      {isPaused ? strings.resume : strings.pause}
    </button>
    <button
      type="button"
      className="gw-map-journey-controls__button"
      disabled={!isMoving && !isPaused}
      onClick={onStop}
    >
      <Square size={15} />
      {strings.stop}
    </button>
    <button
      type="button"
      className="gw-map-journey-controls__button"
      disabled={waypointCount === 0}
      onClick={onClear}
    >
      <Trash2 size={16} />
      {strings.clear}
    </button>
    <div className="gw-map-journey-controls__status">
      <Route size={16} />
      <span>
        {waypointCount} {strings.queued}
      </span>
    </div>
  </div>
);
