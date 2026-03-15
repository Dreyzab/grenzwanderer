import * as Sentry from "@sentry/react";
import {
  APP_COMMIT_SHA,
  APP_VERSION,
  SENTRY_DSN,
  SENTRY_ENABLED,
  SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE,
  SPACETIMEDB_DB_NAME,
  SPACETIMEDB_HOST,
} from "../../config";

const release =
  APP_COMMIT_SHA.length > 0
    ? `${APP_VERSION}+${APP_COMMIT_SHA.slice(0, 12)}`
    : APP_VERSION;

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown monitoring error");
};

export const initializeMonitoring = (): void => {
  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: true,
    environment: SENTRY_ENVIRONMENT,
    release,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  });

  Sentry.setTag("app.version", APP_VERSION);
  Sentry.setTag("app.commit", APP_COMMIT_SHA || "unknown");
  Sentry.setTag("spacetimedb.db", SPACETIMEDB_DB_NAME);
  Sentry.setContext("spacetimedb", {
    host: SPACETIMEDB_HOST,
    database: SPACETIMEDB_DB_NAME,
  });
};

export const setMonitoringIdentity = (identityHex: string): void => {
  if (!identityHex) {
    return;
  }

  Sentry.setUser({ id: identityHex });
  Sentry.setTag("identity.prefix", identityHex.slice(0, 8));
};

export const clearMonitoringIdentity = (): void => {
  Sentry.setUser(null);
};

export const captureMonitoringException = (
  error: unknown,
  tags?: Record<string, string>,
): void => {
  if (!SENTRY_ENABLED) {
    return;
  }

  const normalizedError = normalizeError(error);

  Sentry.withScope((scope) => {
    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        scope.setTag(key, value);
      }
    }

    Sentry.captureException(normalizedError);
  });
};
