import type React from "react";

/** Do not block the sound prompt indefinitely if decoding/network fails (e.g. flaky media cache). */
export const SOUND_PROMPT_REVEAL_MAX_WAIT_MS = 2500;

/** If video is slow but the poster is decoded, let the player admire the poster instead of staring at black. */
export const VIDEO_POSTER_REVEAL_FALLBACK_MS = 500;

export const HIGH_PRIORITY_BACKGROUND_IMAGE_PROPS = {
  fetchpriority: "high",
} as unknown as React.ImgHTMLAttributes<HTMLImageElement>;
