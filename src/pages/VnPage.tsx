import { VnOverlay } from "../widgets/vn-overlay/VnOverlay";

type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
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
  return (
    <section className="panel-section">
      <VnOverlay
        initialScenarioId={initialScenarioId}
        onScenarioChange={onScenarioChange}
        onNavigateTab={onNavigateTab}
      />
    </section>
  );
};
