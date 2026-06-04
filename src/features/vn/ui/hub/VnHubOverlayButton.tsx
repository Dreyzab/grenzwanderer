import { Train } from "lucide-react";
import type { CSSProperties } from "react";

interface VnHubOverlayButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "train";
}

const baseStyle: CSSProperties = {
  position: "fixed",
  left: 16,
  bottom: 16,
  zIndex: 60,
  width: "clamp(48px, 6vw, 56px)",
  height: "clamp(48px, 6vw, 56px)",
  minWidth: 44,
  minHeight: 44,
  borderRadius: 999,
  border: "1px solid rgba(244, 236, 216, 0.5)",
  background: "rgba(18, 22, 30, 0.85)",
  color: "#f4ecd8",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(6px)",
  appearance: "none",
  padding: 0,
  transition:
    "transform 160ms ease, background 160ms ease, border-color 160ms ease",
};

export function VnHubOverlayButton({
  onClick,
  label = "Open train map",
  disabled = false,
  variant = "train",
}: VnHubOverlayButtonProps) {
  return (
    <button
      type="button"
      data-testid="vn-hub-overlay-button"
      data-variant={variant}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Train size={24} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
