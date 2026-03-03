import type { PinVisualState, RuntimeMapPoint } from "../types";

interface DetectiveMapPinProps {
  point: RuntimeMapPoint;
  isSelected: boolean;
  onClick: () => void;
}

const stateStyles: Record<
  PinVisualState,
  { dotColor: string; ringColor: string; labelColor: string }
> = {
  locked: {
    dotColor: "#64748b",
    ringColor: "rgba(100, 116, 139, 0.45)",
    labelColor: "#cbd5e1",
  },
  discovered: {
    dotColor: "#f59e0b",
    ringColor: "rgba(245, 158, 11, 0.5)",
    labelColor: "#fde68a",
  },
  visited: {
    dotColor: "#22c55e",
    ringColor: "rgba(34, 197, 94, 0.55)",
    labelColor: "#bbf7d0",
  },
  completed: {
    dotColor: "#0ea5e9",
    ringColor: "rgba(14, 165, 233, 0.5)",
    labelColor: "#bae6fd",
  },
};

export const DetectiveMapPin = ({
  point,
  isSelected,
  onClick,
}: DetectiveMapPinProps) => {
  const style = stateStyles[point.state];

  return (
    <button
      type="button"
      aria-label={point.title}
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        style={{
          width: isSelected ? "18px" : "15px",
          height: isSelected ? "18px" : "15px",
          borderRadius: "9999px",
          border: `2px solid ${isSelected ? "#f8fafc" : "#0f172a"}`,
          backgroundColor: style.dotColor,
          boxShadow: `0 0 0 7px ${style.ringColor}`,
          transition: "all 120ms ease-out",
          position: "relative",
        }}
      >
        {point.isObjectiveActive ? (
          <span
            style={{
              position: "absolute",
              top: "-7px",
              right: "-7px",
              width: "9px",
              height: "9px",
              borderRadius: "9999px",
              border: "1px solid #082f49",
              backgroundColor: "#38bdf8",
              boxShadow: "0 0 0 2px rgba(14,165,233,0.25)",
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          marginTop: "8px",
          padding: "2px 6px",
          borderRadius: "9999px",
          backgroundColor: "rgba(2, 6, 23, 0.78)",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          color: style.labelColor,
          fontSize: "11px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {point.title}
      </div>
    </button>
  );
};
