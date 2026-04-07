import { useEffect } from "react";

/**
 * Periodic presence updates were backed by a `heartbeat_presence` reducer that is not
 * present in the current SpacetimeDB module schema. Keep the hook as a no-op so callers
 * (e.g. AppShell) stay stable until the server exposes a replacement.
 */
export const usePresenceHeartbeat = (_currentTab: string): void => {
  useEffect(() => {
    // intentionally empty
  }, [_currentTab]);
};
