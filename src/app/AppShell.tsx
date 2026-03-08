import { useEffect, useMemo, useRef, useState } from "react";
import { useTable } from "spacetimedb/react";
import { APP_BUILD_TIMESTAMP, APP_COMMIT_SHA, APP_VERSION } from "../config";
import { useFactDiscoveryToast } from "../features/mindpalace/useFactDiscoveryToast";
import { useHypothesisRewardToast } from "../features/mindpalace/useHypothesisRewardToast";
import { useMindPalaceReadiness } from "../features/mindpalace/useMindPalaceReadiness";
import { CharacterPage } from "../pages/CharacterPage";
import { BattlePage } from "../pages/BattlePage";
import { CommandPage } from "../pages/CommandPage";
import { DevPage } from "../pages/DevPage";
import { HomePage } from "../pages/HomePage";
import { MapPage } from "../pages/MapPage";
import { MindPalacePage } from "../pages/MindPalacePage";
import { VnPage } from "../pages/VnPage";
import { tables } from "../shared/spacetime/bindings";
import { ToastProvider } from "../shared/hooks/useToast";
import { useIdentity } from "../shared/spacetime/useIdentity";
import { Toaster } from "../shared/ui/Toaster";
import { Navbar } from "../widgets/navbar/Navbar";
import "./AppShell.css";

type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "dev"
  | "command"
  | "battle";
type MapPanelId = "qr";

const allTabs: TabId[] = [
  "home",
  "vn",
  "character",
  "map",
  "mind_palace",
  "dev",
  "command",
  "battle",
];

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "map", label: "Map" },
  { id: "command", label: "Ops" },
  { id: "battle", label: "Duel" },
  { id: "character", label: "Dossier" },
  { id: "mind_palace", label: "Scan" },
  { id: "dev", label: "Debug" },
];

const isTabId = (value: string | null): value is TabId =>
  value !== null && allTabs.includes(value as TabId);

const readUrlState = (): {
  tab: TabId;
  vnScenarioId?: string;
  mapPanel?: MapPanelId;
} => {
  if (typeof window === "undefined") {
    return { tab: "home" };
  }

  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  const scenarioParam = params.get("vnScenario");
  const mapPanelParam = params.get("mapPanel");

  return {
    tab: isTabId(tabParam) ? tabParam : "home",
    vnScenarioId:
      scenarioParam && scenarioParam.trim().length > 0
        ? scenarioParam
        : undefined,
    mapPanel: mapPanelParam === "qr" ? "qr" : undefined,
  };
};

const writeUrlState = (
  tab: TabId,
  vnScenarioId?: string,
  mapPanel?: MapPanelId,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  params.set("tab", tab);
  if (vnScenarioId && vnScenarioId.trim().length > 0) {
    params.set("vnScenario", vnScenarioId);
  } else {
    params.delete("vnScenario");
  }
  if (tab === "map" && mapPanel) {
    params.set("mapPanel", mapPanel);
  } else {
    params.delete("mapPanel");
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${
    window.location.hash
  }`;
  window.history.replaceState(null, "", nextUrl);
};

const identityLabel = (identityHex: string): string => {
  if (!identityHex) {
    return "unknown";
  }
  return `${identityHex.slice(0, 8)}...${identityHex.slice(-4)}`;
};

const AppShell = () => {
  const { identity, identityHex } = useIdentity();
  const [commandSessions] = useTable(tables.commandSession);
  const [battleSessions] = useTable(tables.battleSession);
  const isActive = Boolean(identity);
  const initialUrlState = useMemo(() => readUrlState(), []);
  const [activeTab, setActiveTab] = useState<TabId>(initialUrlState.tab);
  const [vnScenarioId, setVnScenarioId] = useState<string | undefined>(
    initialUrlState.vnScenarioId,
  );
  const [mapPanel, setMapPanel] = useState<MapPanelId | undefined>(
    initialUrlState.mapPanel,
  );
  const activeCommandSessionKeyRef = useRef<string | null>(null);
  const activeBattleSessionKeyRef = useRef<string | null>(null);

  const activeCommandSession = useMemo(
    () =>
      commandSessions.find(
        (row) =>
          row.playerId.toHexString() === identityHex && row.status !== "closed",
      ) ?? null,
    [commandSessions, identityHex],
  );

  const activeBattleSession = useMemo(
    () =>
      battleSessions.find(
        (row) =>
          row.playerId.toHexString() === identityHex && row.status !== "closed",
      ) ?? null,
    [battleSessions, identityHex],
  );

  useEffect(() => {
    const onPopState = () => {
      const next = readUrlState();
      setActiveTab(next.tab);
      setVnScenarioId(next.vnScenarioId);
      setMapPanel(next.mapPanel);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    writeUrlState(activeTab, vnScenarioId, mapPanel);
  }, [activeTab, mapPanel, vnScenarioId]);

  useEffect(() => {
    if (!activeCommandSession) {
      activeCommandSessionKeyRef.current = null;
      return;
    }

    if (activeCommandSessionKeyRef.current === activeCommandSession.sessionKey) {
      return;
    }

    activeCommandSessionKeyRef.current = activeCommandSession.sessionKey;
    setActiveTab("command");
  }, [activeCommandSession]);

  useEffect(() => {
    if (!activeBattleSession) {
      activeBattleSessionKeyRef.current = null;
      return;
    }

    if (activeBattleSessionKeyRef.current === activeBattleSession.sessionKey) {
      return;
    }

    activeBattleSessionKeyRef.current = activeBattleSession.sessionKey;
    setActiveTab("battle");
  }, [activeBattleSession]);

  const statusText = useMemo(() => {
    if (!isActive) {
      return "Disconnected";
    }
    return `Connected as ${identityLabel(identityHex)}`;
  }, [identityHex, isActive]);

  const openVnScenario = (scenarioId: string) => {
    setVnScenarioId(scenarioId);
    setMapPanel(undefined);
    setActiveTab("vn");
  };

  const navigateToTab = (tab: TabId, options?: { mapPanel?: MapPanelId }) => {
    setActiveTab(tab);
    setMapPanel(tab === "map" ? options?.mapPanel : undefined);
  };

  const renderTab = (tab: TabId) => {
    if (tab === "home") {
      return (
        <HomePage onNavigate={navigateToTab} onOpenVnScenario={openVnScenario} />
      );
    }

    if (tab === "vn") {
      return (
        <VnPage
          initialScenarioId={vnScenarioId}
          onScenarioChange={setVnScenarioId}
          onNavigateTab={setActiveTab}
        />
      );
    }

    if (tab === "character") {
      return <CharacterPage />;
    }

    if (tab === "map") {
      return (
        <MapPage
          onOpenVnScenario={openVnScenario}
          initialPanel={mapPanel}
        />
      );
    }

    if (tab === "command") {
      return <CommandPage onNavigateTab={setActiveTab} />;
    }

    if (tab === "battle") {
      return <BattlePage onNavigateTab={setActiveTab} />;
    }

    if (tab === "dev") {
      return <DevPage />;
    }

    return <MindPalacePage />;
  };

  if (!isActive || !identity) {
    return (
      <div className="app-shell app-shell-loading">
        <h1>Grenzwanderer</h1>
        <p>Connecting to SpacetimeDB...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Toaster />
        <AppShellInner
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          vnScenarioId={vnScenarioId}
          setVnScenarioId={setVnScenarioId}
        statusText={statusText}
        openVnScenario={openVnScenario}
        renderTab={renderTab}
      />
    </ToastProvider>
  );
};

interface AppShellInnerProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId, options?: { mapPanel?: MapPanelId }) => void;
  vnScenarioId: string | undefined;
  setVnScenarioId: (id: string | undefined) => void;
  statusText: string;
  openVnScenario: (scenarioId: string) => void;
  renderTab: (tab: TabId) => React.ReactNode;
}

const AppShellInner = ({
  activeTab,
  setActiveTab,
  statusText,
  renderTab,
}: AppShellInnerProps) => {
  useFactDiscoveryToast();
  useHypothesisRewardToast();
  const { hasReadyHypotheses } = useMindPalaceReadiness();
  const isHomeTab = activeTab === "home";
  const isMapTab = activeTab === "map";

  const badges = useMemo(
    () => ({ mind_palace: hasReadyHypotheses }),
    [hasReadyHypotheses],
  );

  return (
    <div
      className={
        isHomeTab
          ? "min-h-dvh w-full"
          : isMapTab
            ? "app-shell app-shell--map"
            : "app-shell"
      }
    >
      {!isHomeTab && !isMapTab && (
        <header className="app-header">
          <div>
            <h1>Grenzwanderer</h1>
            <p className="subtitle">Phase 2 MindPalace Vertical Slice</p>
          </div>
          <div className="meta-block">
            <span>{statusText}</span>
            <span
              title={`Commit ${APP_COMMIT_SHA} · Built ${APP_BUILD_TIMESTAMP}`}
            >
              Version: {APP_VERSION}
            </span>
          </div>
        </header>
      )}

      <main
        className={
          isHomeTab
            ? "w-full h-full"
            : isMapTab
              ? "app-main app-main--map"
              : "app-main"
        }
      >
        {renderTab(activeTab)}
      </main>

      <Navbar
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={setActiveTab}
        badges={badges}
      />
    </div>
  );
};

export default AppShell;
