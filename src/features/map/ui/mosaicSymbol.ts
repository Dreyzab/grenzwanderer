import type { MapPointCategory } from "../../vn/types";
import type { RuntimeMapPoint } from "../types";

/**
 * Available Freiburg Pflastermosaik motifs for cobblestone POI markers.
 * Source set is fixed (the prototype's symbol library). New motifs require
 * adding both an SVG renderer in `CobblestoneMarker.tsx` and a key here.
 */
export const MOSAIC_SYMBOLS = [
  "cross-saint-george",
  "masks",
  "sacred-heart",
  "mountain",
  "partner-arms",
  "gate",
  "pretzel",
  "dove",
  "rail",
  "boot",
  "seal",
] as const;

export type MosaicSymbol = (typeof MOSAIC_SYMBOLS)[number];

const MOSAIC_SYMBOL_SET: ReadonlySet<string> = new Set(MOSAIC_SYMBOLS);

const CATEGORY_FALLBACK: Record<MapPointCategory, MosaicSymbol> = {
  HUB: "partner-arms",
  PUBLIC: "pretzel",
  EPHEMERAL: "seal",
  SHADOW: "gate",
  OCCULT: "sacred-heart",
};

/**
 * Resolve which mosaic motif to draw for a given runtime point.
 *
 * Priority: explicit `point.mosaicSymbol` → category fallback → `seal` default.
 */
export const resolveMosaicSymbol = (point: RuntimeMapPoint): MosaicSymbol => {
  if (point.mosaicSymbol && MOSAIC_SYMBOL_SET.has(point.mosaicSymbol)) {
    return point.mosaicSymbol as MosaicSymbol;
  }
  return CATEGORY_FALLBACK[point.category] ?? "seal";
};
