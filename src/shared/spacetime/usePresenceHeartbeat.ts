import { useEffect } from "react";
import { useReducer } from "spacetimedb/react";
import { APP_COMMIT_SHA, APP_VERSION } from "../../config";
import { captureMonitoringException } from "../monitoring/sentry";
import { reducers } from "./bindings";
import { useIdentity } from "./useIdentity";

const HEARTBEAT_INTERVAL_MS = 30_000;

export const usePresenceHeartbeat = (currentTab: string): void => {
  const { identityHex, isConnected } = useIdentity();
  const heartbeatPresence = useReducer(reducers.heartbeatPresence);

  useEffect(() => {
    if (!isConnected || !identityHex || typeof window === "undefined") {
      return;
    }

    const sendHeartbeat = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        await heartbeatPresence({
          currentTab,
          appVersion: APP_VERSION,
          buildCommit: APP_COMMIT_SHA,
        });
      } catch (error) {
        captureMonitoringException(error, {
          reducer: "heartbeat_presence",
          current_tab: currentTab,
        });
      }
    };

    void sendHeartbeat();

    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    const handleFocus = () => {
      void sendHeartbeat();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentTab, heartbeatPresence, identityHex, isConnected]);
};
