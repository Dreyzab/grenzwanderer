import type { CSSProperties } from "react";
import "./EdgeAlertOverlay.css";
import type { EdgeAlertDescriptor } from "../model/edgeAlert";

interface EdgeAlertOverlayProps {
  alert: EdgeAlertDescriptor | null;
}

/**
 * Screen-edge vignette pulse. Purely decorative (aria-hidden) — the same
 * situation is also reported through the compass readout and audio feedback,
 * so this layer never carries information that isn't available elsewhere.
 */
export const EdgeAlertOverlay = ({ alert }: EdgeAlertOverlayProps) => {
  if (!alert) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="gw-edge-alert"
      data-kind={alert.kind}
      data-testid="gw-edge-alert"
      style={
        {
          "--edge-alert-intensity": alert.intensity,
          "--edge-alert-period": `${alert.pulseSeconds}s`,
        } as CSSProperties
      }
    />
  );
};
