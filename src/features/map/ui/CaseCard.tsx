import { useState } from "react";
import type { RuntimeMapPoint } from "../types";

interface CaseCardProps {
  point: RuntimeMapPoint;
  currentLocationId: string | null;
  onTravel: (point: RuntimeMapPoint) => Promise<void>;
  onStartScenario: (point: RuntimeMapPoint) => Promise<void>;
  onClose: () => void;
}

export const CaseCard = ({
  point,
  currentLocationId,
  onTravel,
  onStartScenario,
  onClose,
}: CaseCardProps) => {
  const [pendingAction, setPendingAction] = useState<"travel" | "start" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleTravel = async () => {
    setPendingAction("travel");
    setError(null);
    try {
      await onTravel(point);
    } catch (_error) {
      setError("Failed to travel. Please retry.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleStartScenario = async () => {
    setPendingAction("start");
    setError(null);
    try {
      await onStartScenario(point);
    } catch (_error) {
      setError("Failed to start scenario. Please retry.");
    } finally {
      setPendingAction(null);
    }
  };

  const isTraveling = pendingAction === "travel";
  const isStartingScenario = pendingAction === "start";
  const isBusy = pendingAction !== null;
  const isCurrentLocation = currentLocationId === point.locationId;

  return (
    <aside className="card">
      <div className="panel-header">
        <div>
          <h3>{point.title}</h3>
          <p>{point.id}</p>
        </div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {point.image ? (
        <img
          src={point.image}
          alt={point.title}
          style={{
            width: "100%",
            height: "170px",
            objectFit: "cover",
            borderRadius: "0.5rem",
            marginBottom: "0.75rem",
            border: "1px solid #334155",
          }}
        />
      ) : null}

      {point.description ? <p>{point.description}</p> : null}

      <ul className="unstyled-list" style={{ marginTop: "0.65rem" }}>
        <li className="list-row">
          <span>State</span>
          <strong>{point.state}</strong>
        </li>
        <li className="list-row">
          <span>Location ID</span>
          <strong>{point.locationId}</strong>
        </li>
      </ul>

      <div className="button-row" style={{ marginTop: "0.8rem" }}>
        <button
          type="button"
          onClick={() => void handleTravel()}
          disabled={isBusy || !point.canTravel || isCurrentLocation}
        >
          {isTraveling ? "Traveling..." : isCurrentLocation ? "Here" : "Travel"}
        </button>
        <button
          type="button"
          onClick={() => void handleStartScenario()}
          disabled={isBusy || !point.canStartScenario}
        >
          {isStartingScenario ? "Starting..." : "Start Scenario"}
        </button>
      </div>

      {!point.canStartScenario ? (
        <p className="muted" style={{ marginTop: "0.65rem" }}>
          Scenario is not available in the active content snapshot yet.
        </p>
      ) : null}

      {error ? (
        <p className="status-line error" style={{ marginTop: "0.5rem" }}>
          {error}
        </p>
      ) : null}
    </aside>
  );
};
