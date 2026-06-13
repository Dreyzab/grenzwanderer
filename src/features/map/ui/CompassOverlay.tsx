import React, { useMemo } from "react";
import { Eye, Search } from "lucide-react";
import "./CompassOverlay.css";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getMapStrings } from "../../i18n/uiStrings";
import type { DiscoverySignalResult } from "../model/discoverySignal";

export interface CompassObjectiveGuide {
  id: string;
  label: string;
  /** Already quantized — the compass shows an approximate heading. */
  bearingDegrees: number;
}

interface CompassOverlayProps {
  /**
   * Nearest active-objective point. Pirates-of-the-Caribbean rule: the needle
   * always points at what the detective wants — no route plotting, no numbers.
   */
  objectiveGuide: CompassObjectiveGuide | null;
  inSearchZone: boolean;
  searchTarget: { id: string; label?: string; title?: string } | null;
  speedKmH: number | null;
  discoverySignal: DiscoverySignalResult;
  observationMode: boolean;
  observationInspectAvailable: boolean;
  networkConnected: boolean;
  onToggleObservationMode: () => void;
  onInspectObservationTarget: () => void;
}

// Minor tick marks every 30°
const MINOR_TICKS = [30, 60, 120, 150, 210, 240, 300, 330] as const;

export const CompassOverlay: React.FC<CompassOverlayProps> = ({
  objectiveGuide,
  inSearchZone,
  searchTarget,
  speedKmH,
  discoverySignal,
  observationMode,
  observationInspectAvailable,
  networkConnected,
  onToggleObservationMode,
  onInspectObservationTarget,
}) => {
  const language = useUiLanguage({});
  const mapStrings = getMapStrings(language);

  // Cardinal direction marks with degree positions (localized)
  const CARDINALS = useMemo(
    () => [
      { label: mapStrings.cardinals.n, deg: 0 },
      { label: mapStrings.cardinals.e, deg: 90 },
      { label: mapStrings.cardinals.s, deg: 180 },
      { label: mapStrings.cardinals.w, deg: 270 },
    ],
    [mapStrings.cardinals],
  );

  // Degree tick marks every 10° (excluding cardinals and minor ticks with labels)
  const DEGREE_TICKS = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => i * 10).filter(
        (d) =>
          !CARDINALS.some((c) => c.deg === d) &&
          !MINOR_TICKS.includes(d as (typeof MINOR_TICKS)[number]),
      ),
    [CARDINALS],
  );
  const isSearching = inSearchZone && searchTarget !== null;
  const hasSignal = discoverySignal.state !== "idle";
  const isTracking = !isSearching && !hasSignal && objectiveGuide !== null;
  const isIdle = !isSearching && !hasSignal && !isTracking;

  const stateClass = hasSignal
    ? `gw-compass--signal-${discoverySignal.state}`
    : isSearching
      ? "gw-compass--search"
      : isTracking
        ? "gw-compass--tracking"
        : "gw-compass--idle";

  const readoutLabel = hasSignal
    ? discoverySignal.target?.title
    : isSearching
      ? (searchTarget?.label ?? searchTarget?.title)
      : objectiveGuide?.label;

  const formattedSpeed = useMemo(() => {
    if (speedKmH === null) {
      return null;
    }
    return `${speedKmH.toFixed(1)} ${mapStrings.units.kmh}`;
  }, [mapStrings.units.kmh, speedKmH]);

  // Needle rotation: approximate heading toward the active objective, or 0
  // (north) when there is nothing to want.
  const needleRotation = objectiveGuide?.bearingDegrees ?? 0;

  return (
    <div
      aria-label="Journey compass"
      className={`gw-compass ${stateClass}`}
      role="navigation"
    >
      {/* === BRASS CASE (outer bezel) === */}
      <div className="gw-compass__case">
        {/* Art Nouveau decorative ring */}
        <div className="gw-compass__bezel" />

        {/* === ENAMEL DIAL === */}
        <div className="gw-compass__dial">
          {/* Degree tick marks */}
          {DEGREE_TICKS.map((deg) => (
            <div
              className="gw-compass__tick gw-compass__tick--minor"
              key={deg}
              style={{ transform: `rotate(${deg}deg)` }}
            />
          ))}

          {/* 30° interval ticks */}
          {MINOR_TICKS.map((deg) => (
            <div
              className="gw-compass__tick gw-compass__tick--major"
              key={deg}
              style={{ transform: `rotate(${deg}deg)` }}
            />
          ))}

          {/* Cardinal direction labels */}
          {CARDINALS.map(({ label, deg }) => (
            <div
              className={`gw-compass__cardinal gw-compass__cardinal--${label.toLowerCase()}`}
              key={label}
              style={
                {
                  "--cardinal-deg": `${deg}deg`,
                } as React.CSSProperties
              }
            >
              {label}
            </div>
          ))}

          {/* Crosshair lines */}
          <div className="gw-compass__crosshair gw-compass__crosshair--h" />
          <div className="gw-compass__crosshair gw-compass__crosshair--v" />

          {/* Center jewel bearing */}
          <div className="gw-compass__jewel" />

          {/* === NEEDLE === */}
          <div
            className="gw-compass__needle-assembly"
            style={
              {
                transform: `rotate(${needleRotation}deg)`,
                "--needle-deg": `${needleRotation}deg`,
              } as React.CSSProperties
            }
          >
            {/* North half — radium red */}
            <div className="gw-compass__needle gw-compass__needle--north" />
            {/* South half — gunmetal */}
            <div className="gw-compass__needle gw-compass__needle--south" />
          </div>

          {/* Glass dome reflection overlay */}
          <div className="gw-compass__glass" />
        </div>
      </div>

      {/* === READOUT PLAQUE === */}
      {!isIdle && (
        <div className="gw-compass__readout">
          {readoutLabel && (
            <span className="gw-compass__readout-label">{readoutLabel}</span>
          )}
          {formattedSpeed && (
            <div className="gw-compass__readout-data">
              <span className="gw-compass__readout-speed">
                {formattedSpeed}
              </span>
            </div>
          )}
          {isSearching && (
            <span className="gw-compass__readout-status">
              ● {mapStrings.forensic_zone}
            </span>
          )}
          {isTracking && (
            <span className="gw-compass__readout-status gw-compass__readout-status--tracking">
              ◈ {mapStrings.objective_bearing}
            </span>
          )}
          {hasSignal && (
            <span className="gw-compass__readout-status">
              {discoverySignal.state === "interference"
                ? "INTERFERENCE"
                : `${discoverySignal.channel === "qr_scan" ? "QR " : ""}SIGNAL ${discoverySignal.phase.toUpperCase()}`}
            </span>
          )}
        </div>
      )}

      <div className="gw-compass__actions">
        <button
          type="button"
          aria-label="Observation Mode"
          aria-pressed={observationMode}
          className="gw-compass__action"
          data-active={observationMode ? "true" : "false"}
          onClick={onToggleObservationMode}
        >
          <Eye size={15} />
          <span>Observe</span>
        </button>
        {observationMode && observationInspectAvailable ? (
          <button
            type="button"
            className="gw-compass__action gw-compass__inspect"
            disabled={!networkConnected}
            onClick={onInspectObservationTarget}
          >
            <Search size={15} />
            <span>{networkConnected ? "Inspect" : "Network down"}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
