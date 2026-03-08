export const SPACETIMEDB_HOST =
  import.meta.env.VITE_SPACETIMEDB_HOST ?? "ws://localhost:3000";

export const SPACETIMEDB_DB_NAME =
  import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? "grezwandererdata";

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
