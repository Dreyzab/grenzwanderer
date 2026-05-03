interface ShellDebugLogPayload {
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}

export const logShellDebug = (payload: ShellDebugLogPayload): void => {
  const endpoint = import.meta.env.VITE_SHELL_DEBUG_ENDPOINT;
  if (!import.meta.env.DEV || !endpoint) {
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
};
