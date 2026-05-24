/**
 * Map sub-system design tokens, ported from the Claude design handoff bundle.
 *
 * Three layers:
 *  - `GW_AMBER` — paper/copper accent shades used across cartouche chrome.
 *  - `STATUS_TONE` — pin/POI status palette (`locked / discovered / visited / completed`).
 *    Replaces the local `stateStyles` object that previously lived inside
 *    `DetectiveMapPin.tsx`.
 *  - `PLAYER_TONE` — detective/player pin palette (teal/copper accents).
 *
 * The tokens are intentionally a flat object rather than CSS variables; the new
 * map components inline these via `style={{ … }}` to keep the surface small
 * before the larger design-system extraction (see
 * `docs/MAP_UI_INVENTORY.md §6`).
 */

import type { PinVisualState } from "../types";

/** Cartouche / paper accents (warm amber–cream gradient). */
export const GW_AMBER = {
  100: "#fff4d9",
  200: "#f5e9ca",
  300: "#f8eed7",
  400: "#f2d088",
  500: "#d9a743",
  600: "#d3b27a",
} as const;

export interface StatusTone {
  readonly color: string;
  readonly dot: string;
  readonly glow: string;
}

/** PinVisualState → tone. Lifted from prototype `STATUS` (poi-data.jsx) and
 *  legacy `DetectiveMapPin.stateStyles`. */
export const STATUS_TONE: Readonly<Record<PinVisualState, StatusTone>> = {
  locked: {
    color: "#8a97aa",
    dot: "#8a97aa",
    glow: "rgba(92, 104, 120, 0.42)",
  },
  discovered: {
    color: "#d9a743",
    dot: "#d9a743",
    glow: "rgba(217, 167, 67, 0.42)",
  },
  visited: {
    color: "#6cc36b",
    dot: "#6cc36b",
    glow: "rgba(108, 195, 107, 0.40)",
  },
  completed: {
    color: "#59b4de",
    dot: "#59b4de",
    glow: "rgba(89, 180, 222, 0.42)",
  },
};

/** Detective / player-pin palette. */
export const PLAYER_TONE = {
  teal: "#69c1a3",
  tealDark: "#102a2d",
  tealHalo: "rgba(105, 193, 163, 0.30)",
  tealFrozen: "rgba(120, 150, 160, 0.32)",
  cream: "#f5e9ca",
  ink: "#0a0805",
  copper: GW_AMBER[500],
  copperHi: GW_AMBER[400],
  copperWarm: GW_AMBER[600],
} as const;

/** Cobblestone disc materials. */
export const COBBLE_THEME = {
  limestone: {
    stoneFill: "#e6dcc1",
    stoneEdge: "#a89572",
    stoneInner: "#1a1612",
    chipFill: "#c9b487",
    gradStart: "#f1e6c8",
    gradEnd: "#b6a37c",
  },
  basalt: {
    stoneFill: "#1d1a14",
    stoneEdge: "#3a342a",
    stoneInner: "#f5e9ca",
    chipFill: "#27221a",
    gradStart: "#2a251c",
    gradEnd: "#0e0b07",
  },
} as const;

export type CobbleTheme = keyof typeof COBBLE_THEME;
