export const VN_TEXT_SPEED_STORAGE_KEY = "grenzwanderer:vn-text-speed";

/** Reader-facing pacing for the word-by-word reveal. `instant` skips the animation. */
export type VnTextSpeed = "slow" | "normal" | "fast" | "instant";

const TEXT_SPEEDS: readonly VnTextSpeed[] = [
  "slow",
  "normal",
  "fast",
  "instant",
];

const DEFAULT_TEXT_SPEED: VnTextSpeed = "normal";

const isVnTextSpeed = (value: string | null): value is VnTextSpeed =>
  value !== null && (TEXT_SPEEDS as readonly string[]).includes(value);

/**
 * `speed` is the per-character base (ms) that `TypedText` scales its word cadence
 * from; lower = snappier. `instant` short-circuits the reveal entirely.
 */
export interface VnTextSpeedSettings {
  speed: number;
  instant: boolean;
}

const SETTINGS_BY_SPEED: Record<VnTextSpeed, VnTextSpeedSettings> = {
  slow: { speed: 20, instant: false },
  normal: { speed: 12, instant: false },
  fast: { speed: 6, instant: false },
  instant: { speed: 0, instant: true },
};

export const getVnTextSpeedSettings = (
  preference: VnTextSpeed,
): VnTextSpeedSettings => SETTINGS_BY_SPEED[preference];

/** Cycle order for the in-game toggle: slow → normal → fast → instant → slow. */
export const nextVnTextSpeed = (preference: VnTextSpeed): VnTextSpeed => {
  const index = TEXT_SPEEDS.indexOf(preference);
  return TEXT_SPEEDS[(index + 1) % TEXT_SPEEDS.length];
};

export const readVnTextSpeed = (): VnTextSpeed => {
  if (typeof window === "undefined") {
    return DEFAULT_TEXT_SPEED;
  }

  try {
    const raw = window.localStorage.getItem(VN_TEXT_SPEED_STORAGE_KEY);
    return isVnTextSpeed(raw) ? raw : DEFAULT_TEXT_SPEED;
  } catch (_error) {
    return DEFAULT_TEXT_SPEED;
  }
};

export const writeVnTextSpeed = (preference: VnTextSpeed): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VN_TEXT_SPEED_STORAGE_KEY, preference);
  } catch (_error) {
    // Ignore storage errors and keep the runtime responsive.
  }
};
