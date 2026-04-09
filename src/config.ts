import {
  GENERATED_KARLSRUHE_ENTRY_TOKEN,
  GENERATED_RELEASE_PROFILE,
} from "./generated/release-config";
import type { ReleaseProfile } from "./features/release/types";

const RELEASE_PROFILES = new Set<ReleaseProfile>([
  "default",
  "karlsruhe_event",
]);

const parseReleaseProfile = (
  value: string | undefined,
  fallback: ReleaseProfile,
): ReleaseProfile =>
  value && RELEASE_PROFILES.has(value as ReleaseProfile)
    ? (value as ReleaseProfile)
    : fallback;

export const SPACETIMEDB_HOST =
  import.meta.env.VITE_SPACETIMEDB_HOST ?? "ws://localhost:3000";

export const SPACETIMEDB_DB_NAME =
  import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? "grezwandererdata";

export const RELEASE_PROFILE: ReleaseProfile = parseReleaseProfile(
  import.meta.env.VITE_RELEASE_PROFILE,
  parseReleaseProfile(GENERATED_RELEASE_PROFILE, "default"),
);

export const KARLSRUHE_ENTRY_TOKEN =
  import.meta.env.VITE_KARLSRUHE_ENTRY_TOKEN ?? GENERATED_KARLSRUHE_ENTRY_TOKEN;

export const SCENE_GEN_BASE_URL =
  import.meta.env.VITE_SCENE_GEN_BASE_URL ??
  (RELEASE_PROFILE === "karlsruhe_event" ? "/api" : "");

export const ENABLE_AI =
  String(import.meta.env.VITE_ENABLE_AI ?? "false").toLowerCase() === "true";

export const ENABLE_DEBUG_CONTENT_SEED =
  import.meta.env.DEV &&
  String(
    import.meta.env.VITE_ENABLE_DEBUG_CONTENT_SEED ?? "false",
  ).toLowerCase() === "true";

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

export const MAPBOX_STYLE =
  import.meta.env.VITE_MAPBOX_STYLE ??
  "mapbox://styles/inoti/cmktqmmks002s01pa3f3gfpll";

export const APP_VERSION = __APP_VERSION__;

export const APP_COMMIT_SHA = __APP_COMMIT_SHA__;

export const APP_BUILD_TIMESTAMP = __APP_BUILD_TIMESTAMP__;

export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? "";

export const SENTRY_ENABLED =
  String(import.meta.env.VITE_SENTRY_ENABLED ?? "false").toLowerCase() ===
  "true";

export const SENTRY_ENVIRONMENT =
  import.meta.env.VITE_SENTRY_ENVIRONMENT ??
  (import.meta.env.PROD ? "production" : "development");

export const SENTRY_TRACES_SAMPLE_RATE = Number(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0",
);
