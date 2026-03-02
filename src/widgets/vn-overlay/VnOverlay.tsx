import { VnScreen } from "../../features/vn/ui/VnScreen";

interface VnOverlayProps {
  onOpenDebug: () => void;
  initialScenarioId?: string;
  onScenarioChange?: (scenarioId: string) => void;
  onNavigateTab?: (
    tab: "home" | "vn" | "character" | "map" | "mind_palace" | "dev",
  ) => void;
}

export const VnOverlay = ({
  onOpenDebug,
  initialScenarioId,
  onScenarioChange,
  onNavigateTab,
}: VnOverlayProps) => (
  <VnScreen
    onOpenDebug={onOpenDebug}
    initialScenarioId={initialScenarioId}
    onScenarioChange={onScenarioChange}
    onNavigateTab={onNavigateTab}
  />
);
