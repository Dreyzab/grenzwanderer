const RUNTIME_DEBUG_INGEST_ENABLED =
  import.meta.env.DEV &&
  import.meta.env.VITE_ENABLE_RUNTIME_DEBUG_INGEST === "true";

const RUNTIME_DEBUG_INGEST_URL =
  import.meta.env.VITE_RUNTIME_DEBUG_INGEST_URL ?? "/debug-ingest";

const RUNTIME_DEBUG_SESSION_ID =
  import.meta.env.VITE_RUNTIME_DEBUG_SESSION_ID ?? "local-runtime-debug";

export const postRuntimeDebug = (
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "run1",
): void => {
  if (!RUNTIME_DEBUG_INGEST_ENABLED) {
    return;
  }

  void fetch(RUNTIME_DEBUG_INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": RUNTIME_DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: RUNTIME_DEBUG_SESSION_ID,
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
};
