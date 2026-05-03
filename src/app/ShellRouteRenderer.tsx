import { Suspense, lazy, type ReactNode } from "react";
import { HomePage } from "../pages/HomePage";
import type {
  MapPanelId,
  OpenVnScenarioOptions,
  TabId,
} from "../shared/navigation/shellNavigationTypes";

const LazyBattlePage = lazy(async () => {
  const module = await import("../pages/BattlePage");
  return { default: module.BattlePage };
});

const LazyCharacterPage = lazy(async () => {
  const module = await import("../pages/CharacterPage");
  return { default: module.CharacterPage };
});

const LazyCommandPage = lazy(async () => {
  const module = await import("../pages/CommandPage");
  return { default: module.CommandPage };
});

const LazyMapPage = lazy(async () => {
  const module = await import("../pages/MapPage");
  return { default: module.MapPage };
});

const LazyMindPalacePage = lazy(async () => {
  const module = await import("../pages/MindPalacePage");
  return { default: module.MindPalacePage };
});

const LazyVnPage = lazy(async () => {
  const module = await import("../pages/VnPage");
  return { default: module.VnPage };
});

const renderLazyPage = (children: ReactNode) => (
  <Suspense
    fallback={
      <div className="app-page-loading" role="status">
        Loading...
      </div>
    }
  >
    {children}
  </Suspense>
);

interface ShellRouteRendererProps {
  activeTab: TabId;
  mapPanel?: MapPanelId;
  navigateToTab: (tab: TabId, options?: { mapPanel?: MapPanelId }) => void;
  openVnScenario: (scenarioId: string, options?: OpenVnScenarioOptions) => void;
  setVnScenarioId: (scenarioId: string | undefined) => void;
  vnScenarioId?: string;
}

export const ShellRouteRenderer = ({
  activeTab,
  mapPanel,
  navigateToTab,
  openVnScenario,
  setVnScenarioId,
  vnScenarioId,
}: ShellRouteRendererProps) => {
  if (activeTab === "home") {
    return (
      <HomePage onNavigate={navigateToTab} onOpenVnScenario={openVnScenario} />
    );
  }

  if (activeTab === "vn") {
    return renderLazyPage(
      <LazyVnPage
        initialScenarioId={vnScenarioId}
        onScenarioChange={setVnScenarioId}
        onNavigateTab={(nextTab) => navigateToTab(nextTab as TabId)}
      />,
    );
  }

  if (activeTab === "character") {
    return renderLazyPage(<LazyCharacterPage />);
  }

  if (activeTab === "map") {
    return renderLazyPage(
      <LazyMapPage onOpenVnScenario={openVnScenario} initialPanel={mapPanel} />,
    );
  }

  if (activeTab === "command") {
    return renderLazyPage(
      <LazyCommandPage
        onNavigateTab={(nextTab) => navigateToTab(nextTab as TabId)}
      />,
    );
  }

  if (activeTab === "battle") {
    return renderLazyPage(
      <LazyBattlePage
        onNavigateTab={(nextTab) => navigateToTab(nextTab as TabId)}
      />,
    );
  }

  return renderLazyPage(<LazyMindPalacePage />);
};
