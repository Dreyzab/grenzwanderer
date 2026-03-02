import { useEffect, useMemo, useState } from "react";
import { APP_VERSION } from "../config";
import { CharacterPage } from "../pages/CharacterPage";
import { DevPage } from "../pages/DevPage";
import { HomePage } from "../pages/HomePage";
import { MapPage } from "../pages/MapPage";
import { MindPalacePage } from "../pages/MindPalacePage";
import { VnPage } from "../pages/VnPage";
import { useIdentity } from "../shared/spacetime/useIdentity";
import { Navbar } from "../widgets/navbar/Navbar";
import "./AppShell.css";

type TabId = "home" | "vn" | "character" | "map" | "mind_palace" | "dev";

const allTabs: TabId[] = [
  "home",
  "vn",
  "character",
  "map",
  "mind_palace",
  "dev",
];

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "map", label: "Map" },
  { id: "character", label: "Dossier" },
  { id: "mind_palace", label: "Scan" },
  { id: "dev", label: "Debug" },
];

const isTabId = (value: string | null): value is TabId =>
  value !== null && allTabs.includes(value as TabId);

const readUrlState = (): { tab: TabId; vnScenarioId?: string } => {
  if (typeof window === "undefined") {
    return { tab: "home" };
  }

  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  const scenarioParam = params.get("vnScenario");

  return {
    tab: isTabId(tabParam) ? tabParam : "home",
    vnScenarioId:
      scenarioParam && scenarioParam.trim().length > 0
        ? scenarioParam
        : undefined,
  };
};

const writeUrlState = (tab: TabId, vnScenarioId?: string): void => {
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
  const isActive = Boolean(identity);
  const initialUrlState = useMemo(() => readUrlState(), []);
  const [activeTab, setActiveTab] = useState<TabId>(initialUrlState.tab);
  const [vnScenarioId, setVnScenarioId] = useState<string | undefined>(
    initialUrlState.vnScenarioId,
  );

  useEffect(() => {
    const onPopState = () => {
      const next = readUrlState();
      setActiveTab(next.tab);
      setVnScenarioId(next.vnScenarioId);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    writeUrlState(activeTab, vnScenarioId);
  }, [activeTab, vnScenarioId]);

  const statusText = useMemo(() => {
    if (!isActive) {
      return "Disconnected";
    }
    return `Connected as ${identityLabel(identityHex)}`;
  }, [identityHex, isActive]);

  const openVnScenario = (scenarioId: string) => {
    setVnScenarioId(scenarioId);
    setActiveTab("vn");
  };

  const renderTab = (tab: TabId) => {
    if (tab === "home") {
      return (
        <HomePage onNavigate={setActiveTab} onOpenVnScenario={openVnScenario} />
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
      return <MapPage onOpenVnScenario={openVnScenario} />;
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
    <div
      className={activeTab === "home" ? "min-h-[100dvh] w-full" : "app-shell"}
    >
      {activeTab !== "home" && (
        <header className="app-header">
          <div>
            <h1>Grenzwanderer</h1>
            <p className="subtitle">Phase 2 MindPalace Vertical Slice</p>
          </div>
          <div className="meta-block">
            <span>{statusText}</span>
            <span>Version: {APP_VERSION}</span>
          </div>
        </header>
      )}

      <main className={activeTab === "home" ? "w-full h-full" : "app-main"}>
        {renderTab(activeTab)}
      </main>

      <Navbar activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab} />
    </div>
  );
};

export default AppShell;
