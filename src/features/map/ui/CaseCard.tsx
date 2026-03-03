import { useState } from "react";
import type { RuntimeMapBinding, RuntimeMapPoint } from "../types";

interface CaseCardProps {
  point: RuntimeMapPoint;
  currentLocationId: string | null;
  onRunBinding: (
    point: RuntimeMapPoint,
    binding: RuntimeMapBinding,
  ) => Promise<void>;
  onClose: () => void;
}

const toErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("conditions_failed")) {
    return "Action is currently locked by conditions.";
  }
  if (message.includes("binding_not_found")) {
    return "Action is no longer available.";
  }
  if (message.includes("scenario_missing")) {
    return "Scenario is missing in the active snapshot.";
  }
  if (message.includes("start_blocked_by_route")) {
    return "Scenario start is blocked by route rules.";
  }
  if (message.includes("map_not_available")) {
    return "Map data is unavailable in this snapshot.";
  }
  return "Action failed. Please retry.";
};

export const CaseCard = ({
  point,
  currentLocationId,
  onRunBinding,
  onClose,
}: CaseCardProps) => {
  const [pendingBindingId, setPendingBindingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const primaryBinding = point.primaryBinding;
  const travelBinding =
    point.travelBinding && point.travelBinding.id !== primaryBinding?.id
      ? point.travelBinding
      : null;
  const isBusy = pendingBindingId !== null;
  const isCurrentLocation = currentLocationId === point.locationId;

  const runBinding = async (binding: RuntimeMapBinding) => {
    setPendingBindingId(binding.id);
    setError(null);
    try {
      await onRunBinding(point, binding);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setPendingBindingId(null);
    }
  };

  return (
    <aside className="card">
      <div className="panel-header">
        <div>
          <h3>{point.title}</h3>
          <p>{point.id}</p>
        </div>
        <button type="button" onClick={onClose} disabled={isBusy}>
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
          disabled={!primaryBinding || isBusy}
          onClick={() => {
            if (!primaryBinding) {
              return;
            }
            void runBinding(primaryBinding);
          }}
        >
          {primaryBinding
            ? pendingBindingId === primaryBinding.id
              ? `${primaryBinding.label}...`
              : primaryBinding.label
            : "No actions"}
        </button>

        {travelBinding ? (
          <button
            type="button"
            disabled={
              isBusy ||
              !point.canTravel ||
              (travelBinding.hasTravelAction && isCurrentLocation)
            }
            onClick={() => void runBinding(travelBinding)}
          >
            {pendingBindingId === travelBinding.id
              ? `${travelBinding.label}...`
              : travelBinding.hasTravelAction && isCurrentLocation
                ? "Here"
                : travelBinding.label}
          </button>
        ) : null}
      </div>

      {!point.canStartScenario ? (
        <p className="muted" style={{ marginTop: "0.65rem" }}>
          Scenario action is not available for this point.
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
