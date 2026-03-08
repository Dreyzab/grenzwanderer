import { useState } from "react";
import { VnPilotPanel } from "../features/vn/VnPilotPanel";
import { VnOverlay } from "../widgets/vn-overlay/VnOverlay";

type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "dev"
  | "command"
  | "battle";

interface VnPageProps {
  initialScenarioId?: string;
  onScenarioChange?: (scenarioId: string) => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const VnPage = ({
  initialScenarioId,
  onScenarioChange,
  onNavigateTab,
}: VnPageProps) => {
  const [vnDebugMode, setVnDebugMode] = useState(false);

  return (
    <section className="panel-section">
      <article className="card compact vn-mode-card">
        <div>
          <strong>{vnDebugMode ? "VN Debug Mode" : "VN Story Mode"}</strong>
          <p>
            {vnDebugMode
              ? "Use pilot tools for content seeding and diagnostics."
              : "Production VN UI powered by Figma Phase 3 layout."}
          </p>
        </div>
        <div className="button-row">
          <button
            type="button"
            onClick={() => setVnDebugMode((previous) => !previous)}
          >
            {vnDebugMode ? "Switch to VN Screen" : "Switch to Debug Panel"}
          </button>
        </div>
      </article>

      {vnDebugMode ? (
        <VnPilotPanel />
      ) : (
        <VnOverlay
          onOpenDebug={() => setVnDebugMode(true)}
          initialScenarioId={initialScenarioId}
          onScenarioChange={onScenarioChange}
          onNavigateTab={onNavigateTab}
        />
      )}
    </section>
  );
};
