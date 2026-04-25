/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELEASE_PROFILE?: string;
  readonly VITE_KARLSRUHE_ENTRY_TOKEN?: string;
  readonly VITE_SCENE_GEN_BASE_URL?: string;
  readonly VITE_SPACETIMEDB_HOST?: string;
  readonly VITE_SPACETIMEDB_DB_NAME?: string;
  readonly VITE_ENABLE_AI?: string;
  readonly VITE_ENABLE_DEBUG_CONTENT_SEED?: string;
  readonly VITE_ENABLE_RUNTIME_DEBUG_INGEST?: string;
  readonly VITE_RUNTIME_DEBUG_INGEST_URL?: string;
  readonly VITE_RUNTIME_DEBUG_SESSION_ID?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_MAPBOX_STYLE?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_ENABLED?: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __APP_COMMIT_SHA__: string;
declare const __APP_BUILD_TIMESTAMP__: string;
