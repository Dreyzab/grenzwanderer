import type { CSSProperties, MouseEvent } from "react";
import type { RuntimeMapPoint } from "../types";
import { COBBLE_THEME, STATUS_TONE, type CobbleTheme } from "./mapTokens";
import { resolveMosaicSymbol, type MosaicSymbol } from "./mosaicSymbol";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getMapStrings } from "../../i18n/uiStrings";

/**
 * Cobblestone-mosaic POI marker — Freiburg pavement Pflastermosaik style.
 *
 * Ported from `tmp/design-handoff/grenzwanderer/project/cobblestone-marker.jsx`.
 * Renders inline SVG for crisp scaling at every zoom level. Symbol selection is
 * data-driven via `point.mosaicSymbol` with a category fallback for points that
 * don't carry an explicit motif.
 */

const SYMBOL_RENDERERS: Record<MosaicSymbol, (color: string) => string> = {
  "cross-saint-george": () => `
    <rect x="11" y="3" width="2" height="18" fill="#b22222"/>
    <rect x="3" y="11" width="18" height="2" fill="#b22222"/>
  `,
  masks: (c) => `
    <circle cx="9.5"  cy="13" r="6.5" fill="${c}"/>
    <circle cx="15.5" cy="13" r="6.5" fill="${c}"/>
    <ellipse cx="8" cy="11.5" rx="1" ry="1.6" fill="#fff4d9"/>
    <ellipse cx="11" cy="11.5" rx="1" ry="1.6" fill="#fff4d9"/>
    <ellipse cx="14" cy="11.5" rx="1" ry="1.6" fill="#fff4d9"/>
    <ellipse cx="17" cy="11.5" rx="1" ry="1.6" fill="#fff4d9"/>
    <path d="M6 16 Q9.5 18 13 16" stroke="#fff4d9" stroke-width="1" fill="none"/>
    <path d="M11 16 Q14.5 18 18 16" stroke="#fff4d9" stroke-width="1" fill="none"/>
  `,
  "sacred-heart": () => `
    <path d="M12 21 C 4 15, 4 8, 8 6 C 10 5, 11.5 6, 12 8 C 12.5 6, 14 5, 16 6 C 20 8, 20 15, 12 21 Z" fill="#b22222"/>
    <rect x="11.4" y="9" width="1.2" height="6" fill="#fff4d9"/>
    <rect x="9.5" y="11" width="5" height="1.2" fill="#fff4d9"/>
  `,
  mountain: (c) => `
    <path d="M3 19 L9 9 L13 14 L17 7 L21 19 Z" fill="${c}"/>
    <path d="M11 15 L13 12 L15 14 Z" fill="#fff4d9"/>
  `,
  "partner-arms": (c) => `
    <path d="M4 5 L20 5 L20 13 Q20 19 12 22 Q4 19 4 13 Z" fill="${c}"/>
    <path d="M4 5 L20 5 L20 13 Q20 19 12 22 Q4 19 4 13 Z" fill="none" stroke="#fff4d9" stroke-width="0.6"/>
    <line x1="12" y1="5" x2="12" y2="22" stroke="#fff4d9" stroke-width="0.6"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="#fff4d9" stroke-width="0.6"/>
    <circle cx="8" cy="9" r="1.4" fill="#fff4d9"/>
    <rect x="14.5" y="7.5" width="3" height="3" fill="#fff4d9"/>
    <path d="M6 14 L10 16 L8 18 Z" fill="#fff4d9"/>
    <path d="M14 14 L18 14 L16 18 Z" fill="#fff4d9"/>
  `,
  gate: (c) => `
    <rect x="3" y="9" width="4" height="12" fill="${c}"/>
    <rect x="17" y="9" width="4" height="12" fill="${c}"/>
    <path d="M3 7 V9 H4 V7 H5 V9 H6 V7 H7 V9" fill="${c}"/>
    <path d="M17 7 V9 H18 V7 H19 V9 H20 V7 H21 V9" fill="${c}"/>
    <path d="M7 21 V13 Q12 8 17 13 V21 Z" fill="${c}"/>
    <path d="M9 21 V14 Q12 11 15 14 V21 Z" fill="#fff4d9"/>
  `,
  pretzel: (c) => `
    <path d="M12 5 C 6 5, 4 12, 8 16 C 11 19, 14 17, 12 13 C 10 9, 14 9, 13 13
             M12 5 C 18 5, 20 12, 16 16 C 13 19, 10 17, 12 13"
      fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  dove: (c) => `
    <path d="M3 14 Q5 11 9 11 L13 9 Q16 5 19 6 Q21 8 19 11 L21 13 L18 14 L17 17 Q14 19 11 17 Q7 18 4 16 Z" fill="${c}"/>
    <circle cx="18" cy="9" r="0.7" fill="#fff4d9"/>
  `,
  rail: (c) => `
    <rect x="6" y="4" width="2" height="16" fill="${c}"/>
    <rect x="16" y="4" width="2" height="16" fill="${c}"/>
    <rect x="4" y="7" width="16" height="1.4" fill="${c}"/>
    <rect x="4" y="11.5" width="16" height="1.4" fill="${c}"/>
    <rect x="4" y="16" width="16" height="1.4" fill="${c}"/>
  `,
  boot: (c) => `
    <path d="M7 4 L11 4 L11 13 L18 13 Q21 13 21 16 L21 19 L4 19 L4 16 Q4 13 7 13 Z" fill="${c}"/>
    <rect x="11" y="13" width="6" height="2" fill="#fff4d9" opacity="0.45"/>
    <circle cx="6.5" cy="16.5" r="0.5" fill="#fff4d9" opacity="0.4"/>
    <circle cx="9.5" cy="16.5" r="0.5" fill="#fff4d9" opacity="0.4"/>
  `,
  seal: (c) => `
    <circle cx="12" cy="12" r="9" fill="${c}"/>
    <path d="M12 4 L13.6 10 L20 10 L14.8 13.8 L16.6 20 L12 16.2 L7.4 20 L9.2 13.8 L4 10 L10.4 10 Z" fill="#fff4d9"/>
  `,
};

interface CobblestoneMarkerProps {
  point: RuntimeMapPoint;
  selected: boolean;
  nearby?: boolean;
  /** Disc diameter in px (default 56). */
  size?: number;
  /** `limestone` (default, cream stone) or `basalt` (dark stone for HUD modes). */
  theme?: CobbleTheme;
  onClick: () => void;
}

const CHIP_RING_COUNT = 8;
const RING_RADIUS = 42;

const buildChipRing = (chipFill: string): string => {
  const chips: string[] = [];
  for (let i = 0; i < CHIP_RING_COUNT; i++) {
    const angle = (i / CHIP_RING_COUNT) * Math.PI * 2;
    const cx = 50 + Math.cos(angle) * RING_RADIUS;
    const cy = 50 + Math.sin(angle) * RING_RADIUS;
    const r = 5 + ((i * 7) % 3);
    const rot = (i * 23) % 60;
    chips.push(
      `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="1.4"
        transform="rotate(${rot} ${cx} ${cy})"
        fill="${chipFill}" fill-opacity="0.55"/>`,
    );
  }
  return chips.join("");
};

const statusBadgeContent = (
  status: RuntimeMapPoint["state"],
  innerColor: string,
): string => {
  if (status === "completed") {
    return `<path d="M-4 0 L-1.5 3 L4 -3" stroke="${innerColor}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }
  if (status === "locked") {
    return `
      <rect x="-2.4" y="-1" width="4.8" height="4" rx="0.6" fill="${innerColor}"/>
      <path d="M-1.8 -1 V-2.4 Q0 -4 1.8 -2.4 V-1" stroke="${innerColor}" stroke-width="1" fill="none"/>
    `;
  }
  if (status === "visited") {
    return `<circle r="2.4" fill="${innerColor}" fill-opacity="0.55"/>`;
  }
  return `<circle r="2.6" fill="${innerColor}"/>`;
};

export const CobblestoneMarker = ({
  point,
  selected,
  nearby = false,
  size = 56,
  theme = "limestone",
  onClick,
}: CobblestoneMarkerProps) => {
  const language = useUiLanguage({});
  const mapStrings = getMapStrings(language);
  const tone = STATUS_TONE[point.state];
  const material = COBBLE_THEME[theme];
  const ringSize = selected ? size + 16 : size;
  const symbolColor = material.stoneInner;
  const symbolInner = SYMBOL_RENDERERS[resolveMosaicSymbol(point)](symbolColor);
  const chipRing = buildChipRing(material.chipFill);
  const innerStrokeColor = theme === "basalt" ? "#0a0805" : "#fff4d9";
  const badgeStrokeColor = theme === "basalt" ? "#0a0805" : "#1a1612";
  const statusInnerSymbol = statusBadgeContent(point.state, badgeStrokeColor);
  const gradId = `cs-grad-${point.id}-${selected ? "s" : "n"}`;
  const patternId = `cs-pat-${point.id}-${selected ? "s" : "n"}`;

  const containerStyle: CSSProperties = {
    position: "relative",
    width: ringSize,
    height: ringSize,
    transform: "translate(-50%, -50%)",
    pointerEvents: "auto",
    cursor: "pointer",
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick();
  };

  const stateLabel = mapStrings.states[point.state] || point.state;

  return (
    <button
      type="button"
      aria-label={`${point.title} (${stateLabel})`}
      data-state={point.state}
      data-selected={selected ? "true" : "false"}
      data-mosaic-symbol={resolveMosaicSymbol(point)}
      data-testid="gw-cobblestone-marker"
      onClick={handleClick}
      style={{
        ...containerStyle,
        background: "transparent",
        border: 0,
        padding: 0,
      }}
      title={point.title}
    >
      {selected ? (
        <>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              border: `1px dashed ${tone.color}`,
              animation: "gw-cob-rot 18s linear infinite",
              opacity: 0.7,
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -14,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${tone.glow} 0%, transparent 65%)`,
              pointerEvents: "none",
            }}
          />
        </>
      ) : nearby ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tone.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
            animation: "gw-cob-near 2.6s ease-in-out infinite",
          }}
        />
      ) : null}
      <svg
        viewBox="0 0 100 100"
        width={ringSize}
        height={ringSize}
        style={{
          display: "block",
          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.55))",
        }}
      >
        <defs>
          <radialGradient id={gradId} cx="0.35" cy="0.35" r="0.9">
            <stop offset="0%" stopColor={material.gradStart} />
            <stop offset="60%" stopColor={material.stoneFill} />
            <stop offset="100%" stopColor={material.gradEnd} />
          </radialGradient>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="3"
              cy="3"
              r="0.7"
              fill={material.stoneEdge}
              fillOpacity="0.35"
            />
          </pattern>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: chipRing }} />
        <circle cx="50" cy="50" r="34" fill={`url(#${gradId})`} />
        <circle cx="50" cy="50" r="34" fill={`url(#${patternId})`} />
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke={material.stoneEdge}
          strokeWidth="1.4"
          strokeOpacity="0.8"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke={innerStrokeColor}
          strokeWidth="0.6"
          strokeOpacity="0.4"
        />
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke={tone.color}
          strokeWidth={selected ? 2.4 : 1.8}
          strokeOpacity={selected ? 1 : 0.85}
        />
        <g transform="translate(72,72)">
          <circle
            r="9"
            fill={tone.color}
            stroke={badgeStrokeColor}
            strokeWidth="1.6"
          />
          <g dangerouslySetInnerHTML={{ __html: statusInnerSymbol }} />
        </g>
        <g
          transform="translate(26,26) scale(2)"
          dangerouslySetInnerHTML={{ __html: symbolInner }}
        />
      </svg>
    </button>
  );
};

const STYLE_ID = "gw-cobblestone-keyframes";

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const styleEl = document.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    @keyframes gw-cob-rot {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes gw-cob-near {
      0%, 100% { opacity: 0.45; transform: scale(0.95); }
      50%      { opacity: 0.95; transform: scale(1.08); }
    }
  `;
  document.head.appendChild(styleEl);
}
