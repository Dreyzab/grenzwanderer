import type { CSSProperties, ReactNode } from "react";

/**
 * Black-and-copper paper-cartouche surface for map chrome.
 *
 * Ported from `tmp/design-handoff/grenzwanderer/project/v4-fusion.jsx`
 * (`FCartouche` + `FCorner`). The component renders:
 *   - inset double-edge border (1px copper outer, 4px paper inner) — gives
 *     the "engraved plate" feel without relying on box-shadow filters;
 *   - 4 corner glyphs (right-angle line + small inner rect + dot) anchored
 *     at each corner;
 *   - optional label tab that floats just above-and-left of the panel,
 *     reading as a Plate № caption.
 *
 * Inline-style implementation keeps it self-contained (no new CSS file)
 * and avoids the `gw-map-*` legacy namespace which §6 of the map
 * inventory plans to retire.
 */

interface CornerGlyphProps {
  size?: number;
  color: string;
  rotate?: 0 | 90 | 180 | 270;
}

const CornerGlyph = ({ size = 22, color, rotate = 0 }: CornerGlyphProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ transform: `rotate(${rotate}deg)`, display: "block" }}
    aria-hidden="true"
  >
    <path
      d="M 1 1 L 1 9 M 1 1 L 9 1"
      fill="none"
      stroke={color}
      strokeWidth="1"
      opacity="0.85"
    />
    <path
      d="M 4 1 L 4 4 L 1 4"
      fill="none"
      stroke={color}
      strokeWidth="0.7"
      opacity="0.55"
    />
    <circle cx="1.5" cy="1.5" r="1.4" fill={color} />
  </svg>
);

export interface CartouchePalette {
  /** Translucent paper-toned background. */
  paper: string;
  /** Soft copper for borders + corner glyphs. */
  copperDim: string;
  /** Bright copper for label tab text. */
  copperHot: string;
}

// eslint-disable-next-line react-refresh/only-export-components -- shared palette token for map chrome
export const DEFAULT_CARTOUCHE_PALETTE: CartouchePalette = {
  paper: "rgba(20, 16, 12, 0.86)",
  copperDim: "rgba(217, 167, 67, 0.42)",
  copperHot: "#d9a743",
};

interface CartouchePanelProps {
  children: ReactNode;
  /** Optional eyebrow label rendered above-left of the panel. */
  label?: string;
  /** Inner padding (px or CSS string). */
  padding?: CSSProperties["padding"];
  /** Show 4 corner glyphs (default true). */
  ornaments?: boolean;
  /** Override palette colors. */
  palette?: CartouchePalette;
  /** Extra inline style on the outer wrapper (sizing, positioning). */
  style?: CSSProperties;
  /** Optional className for the outer wrapper. */
  className?: string;
}

export const CartouchePanel = ({
  children,
  label,
  padding = "14px 18px",
  ornaments = true,
  palette = DEFAULT_CARTOUCHE_PALETTE,
  style,
  className,
}: CartouchePanelProps) => {
  return (
    <div
      className={className}
      style={{ position: "relative", padding: 2, ...style }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: palette.paper,
          backdropFilter: "blur(10px)",
          border: `1px solid ${palette.copperDim}`,
          boxShadow: `inset 0 0 0 4px ${palette.paper}, inset 0 0 0 5px ${palette.copperDim}`,
        }}
      />
      {ornaments ? (
        <>
          <span style={{ position: "absolute", top: 4, left: 4 }}>
            <CornerGlyph color={palette.copperHot} rotate={0} />
          </span>
          <span style={{ position: "absolute", top: 4, right: 4 }}>
            <CornerGlyph color={palette.copperHot} rotate={90} />
          </span>
          <span style={{ position: "absolute", bottom: 4, right: 4 }}>
            <CornerGlyph color={palette.copperHot} rotate={180} />
          </span>
          <span style={{ position: "absolute", bottom: 4, left: 4 }}>
            <CornerGlyph color={palette.copperHot} rotate={270} />
          </span>
        </>
      ) : null}
      <div style={{ position: "relative", padding }}>
        {label ? (
          <h3
            style={{
              position: "absolute",
              top: -7,
              left: 22,
              margin: 0,
              background: palette.paper,
              padding: "0 8px",
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: "0.28em",
              color: palette.copperHot,
              textTransform: "uppercase",
            }}
          >
            {label}
          </h3>
        ) : null}
        {children}
      </div>
    </div>
  );
};
