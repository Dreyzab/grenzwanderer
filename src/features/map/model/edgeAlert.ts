import type { DiscoverySignalResult } from "./discoverySignal";

/**
 * Edge alert — screen-edge vignette pulse that signals an off-HUD situation:
 *
 *  - `discovery`     — player is near a hidden POI (gold pulse)
 *  - `qr_cache`      — the nearby signal is a QR cache (cool blue pulse)
 *  - `interference`  — two overlapping signals, direction unreliable (teal flicker)
 *  - `danger`        — hostile presence (radium-red pulse); reserved for the
 *                      upcoming enemy track, already styled so wiring threats
 *                      in later is data-only.
 *
 * Kinds are resolved by priority: danger always wins over discovery, so when
 * threats land they only need to feed `resolveEdgeAlert` a `threatLevel`.
 */
export type EdgeAlertKind =
  | "discovery"
  | "qr_cache"
  | "interference"
  | "danger";

export type EdgeThreatLevel = "none" | "near" | "imminent";

export interface EdgeAlertDescriptor {
  kind: EdgeAlertKind;
  /** 0..1 — drives vignette opacity/spread. */
  intensity: number;
  /** Pulse period in seconds — closer means faster. */
  pulseSeconds: number;
}

export interface EdgeAlertInputs {
  signal: DiscoverySignalResult;
  /** Future enemy track; defaults to "none" until threats are authored. */
  threatLevel?: EdgeThreatLevel;
}

export const resolveEdgeAlert = ({
  signal,
  threatLevel = "none",
}: EdgeAlertInputs): EdgeAlertDescriptor | null => {
  if (threatLevel === "imminent") {
    return { kind: "danger", intensity: 1, pulseSeconds: 0.6 };
  }
  if (threatLevel === "near") {
    return { kind: "danger", intensity: 0.55, pulseSeconds: 1.2 };
  }

  if (signal.state === "interference") {
    return { kind: "interference", intensity: 0.7, pulseSeconds: 0.9 };
  }

  const kind: EdgeAlertKind =
    signal.channel === "qr_scan" ? "qr_cache" : "discovery";

  switch (signal.phase) {
    case "hot":
      return { kind, intensity: 1, pulseSeconds: 0.9 };
    case "warm":
      return { kind, intensity: 0.6, pulseSeconds: 1.7 };
    case "cold":
      return { kind, intensity: 0.32, pulseSeconds: 2.8 };
    default:
      return null;
  }
};
