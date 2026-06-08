import type { CSSProperties, ReactNode } from "react";

interface VnHubInlinePanelProps {
  title?: string;
  children: ReactNode;
}

/**
 * Compact, always-visible navigation panel anchored to the top-left corner.
 * Used by hub nodes with `hubPresentation: "inline_panel"` — the map itself is
 * the current game state, so there is no open button and no modal: the player
 * picks a destination zone directly over the neutral background.
 *
 * Width is clamped so the panel never crowds the narrative text. The inner
 * `VnHubSchema` sizes its own height from the schema aspect ratio, so this
 * layout works for both wide side-view art and tall vertical maps.
 */
const panelStyle: CSSProperties = {
  position: "fixed",
  top: "clamp(8px, 1.6vw, 16px)",
  left: "clamp(8px, 1.6vw, 16px)",
  zIndex: 60,
  width: "clamp(168px, 22vw, 280px)",
  maxWidth: "calc(100vw - 24px)",
  maxHeight: "calc(100dvh - 24px)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "10px 10px 12px",
  background: "rgba(18, 22, 30, 0.9)",
  border: "1px solid rgba(244, 236, 216, 0.32)",
  borderRadius: 10,
  boxShadow: "0 14px 40px rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(6px)",
  color: "#f4ecd8",
  overflow: "auto",
  pointerEvents: "auto",
};

export function VnHubInlinePanel({ title, children }: VnHubInlinePanelProps) {
  return (
    <aside
      data-testid="vn-hub-inline-panel"
      aria-label={title ?? "Train map"}
      style={panelStyle}
    >
      {title ? (
        <h2
          style={{
            margin: 0,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            letterSpacing: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </aside>
  );
}
