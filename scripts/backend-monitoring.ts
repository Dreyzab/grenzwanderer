import * as Sentry from "@sentry/node";

export interface BackendMonitoringConfig {
  serviceName: string;
  dsn?: string;
  enabled?: boolean;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  tags?: Record<string, string>;
}

let monitoringEnabled = false;

const parseBooleanEnv = (value: string | undefined): boolean =>
  String(value ?? "false").toLowerCase() === "true";

const parseSampleRate = (value: string | undefined): number => {
  if (!value || value.trim().length === 0) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown backend monitoring error");
};

export const initializeBackendMonitoring = (
  config: BackendMonitoringConfig,
): boolean => {
  const dsn = config.dsn ?? process.env.SENTRY_DSN ?? "";
  const enabled =
    config.enabled ?? (parseBooleanEnv(process.env.SENTRY_ENABLED) && !!dsn);

  monitoringEnabled = enabled;
  if (!enabled) {
    return false;
  }

  Sentry.init({
    dsn,
    enabled: true,
    environment:
      config.environment ??
      process.env.SENTRY_ENVIRONMENT ??
      process.env.NODE_ENV ??
      "development",
    release:
      config.release ??
      process.env.SENTRY_RELEASE ??
      process.env.APP_VERSION ??
      process.env.npm_package_version,
    tracesSampleRate:
      config.tracesSampleRate ??
      parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  });

  Sentry.setTag("service", config.serviceName);
  for (const [key, value] of Object.entries(config.tags ?? {})) {
    Sentry.setTag(key, value);
  }

  return true;
};

export const captureBackendException = (
  error: unknown,
  tags?: Record<string, string>,
): void => {
  if (!monitoringEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(tags ?? {})) {
      scope.setTag(key, value);
    }

    Sentry.captureException(normalizeError(error));
  });
};

export const flushBackendMonitoring = async (
  timeoutMs = 2_000,
): Promise<void> => {
  if (!monitoringEnabled) {
    return;
  }

  await Sentry.flush(timeoutMs);
};
