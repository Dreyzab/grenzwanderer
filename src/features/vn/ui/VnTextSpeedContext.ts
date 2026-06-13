import { createContext } from "react";
import type { VnTextSpeedSettings } from "./vnTextSpeedPreference";

/**
 * Reader's text-pacing preference, consumed by `TypedText` as the default when a
 * call site doesn't pass `speed`/`instant` explicitly. Provided around the VN
 * narrative tree so every reveal (log, classic, letter) honours one setting
 * without threading props through every renderer.
 */
export const DEFAULT_VN_TEXT_SPEED_SETTINGS: VnTextSpeedSettings = {
  speed: 12,
  instant: false,
};

export const VnTextSpeedContext = createContext<VnTextSpeedSettings>(
  DEFAULT_VN_TEXT_SPEED_SETTINGS,
);
