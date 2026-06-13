import type { CSSProperties } from "react";
import { PLAYER_TONE } from "./mapTokens";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getMapStrings } from "../../i18n/uiStrings";

/**
 * Detective player-pin family.
 *
 * Ported from `tmp/design-handoff/grenzwanderer/project/player-pin.jsx`. The
 * prototype emitted raw HTML strings for Mapbox's HTMLMarker; here we render
 * directly as React because `react-map-gl`'s `<Marker>` accepts children.
 *
 * Four variants × five states:
 *   variants  — trace (default) | portrait | sigil | hybrid
 *   states    — idle | moving | paused | at_poi | discovering
 *
 * MapView derives the state (`derivePlayerPinState`) from journey + discovery
 * signal and feeds bearing/speed from the journey simulation.
 */

export type PlayerPinVariant = "trace" | "portrait" | "sigil" | "hybrid";
export type PlayerPinState =
  | "idle"
  | "moving"
  | "paused"
  | "at_poi"
  | "discovering";

interface PlayerPinProps {
  variant?: PlayerPinVariant;
  state?: PlayerPinState;
  /** Compass bearing in degrees (0..359), used for moving/discovering states. */
  bearing?: number;
  /** Speed normalized 0..1 (slow walk → run). Controls pulse cadence. */
  speed?: number;
  /** Pin diameter in px (default 44). */
  size?: number;
}

const detectiveSilhouette = (fill: string): string => `
  <path d="M3 11 Q3 7.5 6 7.5 L18 7.5 Q21 7.5 21 11 L21 12.5 L3 12.5 Z" fill="${fill}"/>
  <circle cx="12" cy="15.5" r="3.6" fill="${fill}"/>
  <path d="M3.5 23 Q4 18 12 18 Q20 18 20.5 23 Z" fill="${fill}"/>
`;

const pulseDuration = (speed: number, base = 1.4, range = 0.8): string =>
  `${(base - speed * range).toFixed(2)}s`;

const TraceVariant = ({
  state,
  bearing,
  speed,
  size,
}: Required<Omit<PlayerPinProps, "variant">>) => {
  const moving = state === "moving" || state === "discovering";
  const haloBg =
    state === "paused" ? PLAYER_TONE.tealFrozen : PLAYER_TONE.tealHalo;
  const coreColor = state === "discovering" ? "#9af0c8" : PLAYER_TONE.teal;
  const haloStyle: CSSProperties = moving
    ? {
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: haloBg,
        filter: "blur(3px)",
        animation: `gw-player-pulse ${state === "discovering" ? "0.7s" : pulseDuration(speed)} ease-in-out infinite`,
      }
    : {
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: haloBg,
        filter: "blur(3px)",
        transform: state === "paused" ? "scale(0.9)" : "scale(1)",
        opacity: state === "paused" ? 0.55 : 0.75,
      };

  return (
    <>
      <span aria-hidden="true" style={haloStyle} />
      {state === "discovering" ? (
        <>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: `-${size * 0.4}px`,
              borderRadius: "50%",
              border: `1.5px solid ${coreColor}`,
              opacity: 0.7,
              animation: "gw-player-bloom 1.2s ease-out infinite",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: `-${size * 0.8}px`,
              borderRadius: "50%",
              border: `1px solid ${coreColor}`,
              opacity: 0.4,
              animation: "gw-player-bloom 1.2s 0.4s ease-out infinite",
            }}
          />
        </>
      ) : null}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: `${size * 0.18}px`,
          borderRadius: "50%",
          background: PLAYER_TONE.tealDark,
          border: "2px solid rgba(255,245,214,0.45)",
          boxShadow:
            "0 10px 20px rgba(0,0,0,0.35), inset 0 0 0 3px rgba(16,13,10,0.72)",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: "50%",
          background: coreColor,
          boxShadow: `0 0 14px ${coreColor}`,
        }}
      />
      {moving ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${bearing}deg)`,
            width: size,
            height: size,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "-3px",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: `9px solid ${coreColor}`,
              filter: `drop-shadow(0 0 6px ${coreColor}aa)`,
            }}
          />
        </span>
      ) : null}
    </>
  );
};

const PortraitVariant = ({
  state,
  bearing,
  speed,
  size,
}: Required<Omit<PlayerPinProps, "variant">>) => {
  const moving = state === "moving" || state === "discovering";
  const ringColor = state === "discovering" ? "#9af0c8" : PLAYER_TONE.teal;
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2px solid ${ringColor}`,
          boxShadow: `0 0 12px ${ringColor}66`,
          animation: moving
            ? `gw-player-pulse ${pulseDuration(speed, 1.5, 0.6)} ease-in-out infinite`
            : undefined,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))",
        }}
      >
        <defs>
          <radialGradient id="gw-pp-stone" cx="0.35" cy="0.35" r="0.9">
            <stop offset="0" stopColor="#f1e6c8" />
            <stop offset="60%" stopColor="#e6dcc1" />
            <stop offset="100%" stopColor="#a89572" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#gw-pp-stone)" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="#a89572"
          strokeWidth="1.4"
        />
        <g
          transform="translate(26,26) scale(2)"
          dangerouslySetInnerHTML={{
            __html: detectiveSilhouette(PLAYER_TONE.ink),
          }}
        />
      </svg>
      {state === "paused" ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: "50%",
            background: "rgba(40,50,55,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.36,
            color: PLAYER_TONE.cream,
          }}
        >
          ⏸
        </span>
      ) : null}
      {moving ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${bearing}deg)`,
            width: size,
            height: size,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: `-${size * 0.16}px`,
              transform: "translateX(-50%)",
              width: 14,
              height: 14,
              background: ringColor,
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
              filter: `drop-shadow(0 0 6px ${ringColor}88)`,
            }}
          />
        </span>
      ) : null}
    </>
  );
};

const SigilVariant = ({
  state,
  bearing,
  speed,
  size,
}: Required<Omit<PlayerPinProps, "variant">>) => {
  const moving = state === "moving" || state === "discovering";
  const sealRed = "#822a2a";
  const sealRim = "#3a1010";
  const accent =
    state === "discovering" ? PLAYER_TONE.copperHi : PLAYER_TONE.copper;
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          background: "rgba(130, 42, 42, 0.32)",
          filter: "blur(4px)",
          animation: moving
            ? `gw-player-pulse ${pulseDuration(speed, 1.4, 0.7)} ease-in-out infinite`
            : undefined,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.7))",
        }}
      >
        <path
          d="M50,7 L60,5 L65,12 L74,11 L75,20 L84,25 L82,34 L90,40 L86,49 L93,56 L86,63 L91,72 L82,75 L80,84 L71,82 L66,90 L57,88 L50,94 L43,88 L34,90 L29,82 L20,84 L18,75 L9,72 L14,63 L7,56 L14,49 L10,40 L18,34 L16,25 L25,20 L26,11 L35,12 L40,5 Z"
          fill={sealRed}
          stroke={sealRim}
          strokeWidth="1.8"
        />
        <circle
          cx="50"
          cy="50"
          r="32"
          fill="none"
          stroke={PLAYER_TONE.cream}
          strokeWidth="0.8"
          strokeOpacity="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke={PLAYER_TONE.cream}
          strokeWidth="0.4"
          strokeOpacity="0.45"
        />
        <text
          x="50"
          y="64"
          fontFamily='"Playfair Display", serif'
          fontSize="40"
          fontWeight="500"
          fontStyle="italic"
          fill={PLAYER_TONE.cream}
          textAnchor="middle"
        >
          G
        </text>
        {state === "discovering" ? (
          <circle
            cx="50"
            cy="50"
            r="50"
            fill="none"
            stroke={accent}
            strokeWidth="1"
            opacity="0.7"
          >
            <animate
              attributeName="r"
              from="40"
              to="60"
              dur="1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.8"
              to="0"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        ) : null}
      </svg>
      {moving ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${bearing}deg)`,
            width: size,
            height: size,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "-2px",
              transform: "translateX(-50%)",
              width: 10,
              height: 10,
              background: accent,
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
              filter: `drop-shadow(0 0 4px ${accent}aa)`,
            }}
          />
        </span>
      ) : null}
    </>
  );
};

const HybridVariant = ({
  state,
  bearing,
  speed,
  size,
}: Required<Omit<PlayerPinProps, "variant">>) => {
  const moving = state === "moving" || state === "discovering";
  const coreColor = state === "discovering" ? "#9af0c8" : PLAYER_TONE.teal;
  const ringColor = PLAYER_TONE.copper;
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: size * 0.05,
          borderRadius: "50%",
          background: PLAYER_TONE.tealHalo,
          filter: "blur(3px)",
          animation: moving
            ? `gw-player-pulse ${pulseDuration(speed, 1.3, 0.6)} ease-in-out infinite`
            : undefined,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeOpacity="0.95"
        />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="#7a5f2a"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {moving ? (
          <g transform={`rotate(${bearing - 90} 50 50)`}>
            <path
              d="M 50 6 A 44 44 0 0 1 73 14"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${ringColor}cc)` }}
            />
            <circle cx="50" cy="6" r="3.5" fill={ringColor} />
          </g>
        ) : null}
        <circle
          cx="50"
          cy="50"
          r="22"
          fill={PLAYER_TONE.tealDark}
          stroke="rgba(255,245,214,0.45)"
          strokeWidth="1.5"
        />
        <circle
          cx="50"
          cy="50"
          r="7"
          fill={coreColor}
          style={{ filter: `drop-shadow(0 0 8px ${coreColor})` }}
        />
      </svg>
      {state === "paused" ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: size * 0.32,
            color: PLAYER_TONE.cream,
            background: "rgba(7,9,12,0.7)",
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⏸
        </span>
      ) : null}
    </>
  );
};

const VARIANT_RENDERERS = {
  trace: TraceVariant,
  portrait: PortraitVariant,
  sigil: SigilVariant,
  hybrid: HybridVariant,
} as const;

export const PlayerPin = ({
  variant = "trace",
  state = "idle",
  bearing = 0,
  speed = 0.5,
  size = 44,
}: PlayerPinProps) => {
  const language = useUiLanguage({});
  const mapStrings = getMapStrings(language);
  const Variant = VARIANT_RENDERERS[variant] ?? VARIANT_RENDERERS.trace;
  const stateLabel = mapStrings.player_states[state] || state;
  const ariaLabel = `${mapStrings.player_position} (${stateLabel})`;

  const wrapperStyle: CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    transform: "translate(-50%, -50%)",
    pointerEvents: "auto",
  };

  if (state === "at_poi") {
    return (
      <div
        aria-label={ariaLabel}
        data-state={state}
        data-variant={variant}
        data-testid="gw-player-pin"
        style={wrapperStyle}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: `-${size * 0.45}px`,
            borderRadius: "50%",
            border: `1.5px solid ${PLAYER_TONE.teal}`,
            opacity: 0.7,
            animation: "gw-player-bloom 1.6s ease-out infinite",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: `-${size * 0.9}px`,
            borderRadius: "50%",
            border: `1px solid ${PLAYER_TONE.teal}`,
            opacity: 0.35,
            animation: "gw-player-bloom 1.6s 0.6s ease-out infinite",
          }}
        />
        <span style={{ position: "absolute", inset: 0 }}>
          <Variant state="moving" bearing={bearing} speed={speed} size={size} />
        </span>
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      data-state={state}
      data-variant={variant}
      data-testid="gw-player-pin"
      style={wrapperStyle}
    >
      <Variant state={state} bearing={bearing} speed={speed} size={size} />
    </div>
  );
};

const STYLE_ID = "gw-player-pin-keyframes";

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const styleEl = document.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    @keyframes gw-player-pulse {
      0%, 100% { transform: scale(0.72); opacity: 0.46; }
      50%      { transform: scale(1.18); opacity: 0.82; }
    }
    @keyframes gw-player-bloom {
      0%   { transform: scale(0.4); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);
}
