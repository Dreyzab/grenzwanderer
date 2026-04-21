import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import {
  APP_BUILD_TIMESTAMP,
  APP_COMMIT_SHA,
  APP_VERSION,
  RELEASE_PROFILE,
  SPACETIMEDB_DB_NAME,
} from "../config";
import {
  KARLSRUHE_EVENT_ARRIVAL_COMPLETE_FLAG,
  KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
  KARLSRUHE_EVENT_PATHNAME,
  clearKarlsruheGrant,
  getKarlsruheEntryTokenFromSearch,
  getKarlsruheGrantStorageKey,
  isKarlsruheEventProfile,
  matchesKarlsruheEntryToken,
  readKarlsruheGrant,
  writeKarlsruheGrant,
} from "../features/release/karlsruheEntry";
import type { EntryGateState, ReleaseProfile } from "../features/release/types";
import { KarlsruheQrGate } from "../features/release/ui/KarlsruheQrGate";
import { useFactDiscoveryToast } from "../features/mindpalace/useFactDiscoveryToast";
import { useHypothesisRewardToast } from "../features/mindpalace/useHypothesisRewardToast";
import { useMindPalaceReadiness } from "../features/mindpalace/useMindPalaceReadiness";
import { BattlePage } from "../pages/BattlePage";
import { CharacterPage } from "../pages/CharacterPage";
import { CommandPage } from "../pages/CommandPage";
import { HomePage } from "../pages/HomePage";
import { MapPage } from "../pages/MapPage";
import { MindPalacePage } from "../pages/MindPalacePage";
import { VnPage } from "../pages/VnPage";
import { ToastProvider } from "../shared/hooks/useToast";
import { reducers, tables } from "../shared/spacetime/bindings";
import { useIdentity } from "../shared/spacetime/useIdentity";
import { usePresenceHeartbeat } from "../shared/spacetime/usePresenceHeartbeat";
import { Toaster } from "../shared/ui/Toaster";
import { Navbar } from "../widgets/navbar/Navbar";
import "./AppShell.css";

type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "command"
  | "battle";

type MapPanelId = "qr";

interface ShellUrlState {
  pathname: string;
  tab: TabId;
  vnScenarioId?: string;
  mapPanel?: MapPanelId;
  entryToken?: string;
}

const allTabs: TabId[] = [
  "home",
  "vn",
  "character",
  "map",
  "mind_palace",
  "command",
  "battle",
];

const tabsByProfile: Record<
  ReleaseProfile,
  Array<{ id: TabId; label: string }>
> = {
  default: [
    { id: "home", label: "Home" },
    { id: "map", label: "Map" },
    { id: "command", label: "Ops" },
    { id: "battle", label: "Duel" },
    { id: "character", label: "Dossier" },
    { id: "mind_palace", label: "Scan" },
  ],
  karlsruhe_event: [
    { id: "map", label: "Map" },
    { id: "vn", label: "VN" },
    { id: "character", label: "Dossier" },
  ],
};

const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }

  return true;
};

const isTabId = (value: string | null): value is TabId =>
  value !== null && allTabs.includes(value as TabId);

const resolveDefaultTab = (profile: ReleaseProfile): TabId =>
  profile === "karlsruhe_event" ? "map" : "home";

const coerceTabForProfile = (
  value: string | null,
  profile: ReleaseProfile,
  vnScenarioId?: string,
): TabId => {
  const allowedTabs = new Set(tabsByProfile[profile].map((entry) => entry.id));
  if (value && isTabId(value) && allowedTabs.has(value)) {
    return value;
  }
  if (profile === "karlsruhe_event") {
    return vnScenarioId ? "vn" : "map";
  }
  return "home";
};

const normalizePathname = (
  pathname: string,
  profile: ReleaseProfile,
): string => {
  if (profile !== "karlsruhe_event") {
    return pathname || "/";
  }

  return pathname === KARLSRUHE_EVENT_PATHNAME ? KARLSRUHE_EVENT_PATHNAME : "/";
};

const readUrlState = (profile: ReleaseProfile): ShellUrlState => {
  if (typeof window === "undefined") {
    return {
      pathname: profile === "karlsruhe_event" ? "/" : "/",
      tab: resolveDefaultTab(profile),
    };
  }

  const pathname = normalizePathname(window.location.pathname, profile);
  const params = new URLSearchParams(window.location.search);
  const scenarioParam = params.get("vnScenario");
  const mapPanelParam = params.get("mapPanel");

  return {
    pathname,
    tab: coerceTabForProfile(
      params.get("tab"),
      profile,
      scenarioParam ?? undefined,
    ),
    vnScenarioId:
      scenarioParam && scenarioParam.trim().length > 0
        ? scenarioParam
        : undefined,
    mapPanel: mapPanelParam === "qr" ? "qr" : undefined,
    entryToken:
      profile === "karlsruhe_event" && pathname === KARLSRUHE_EVENT_PATHNAME
        ? getKarlsruheEntryTokenFromSearch(window.location.search)
        : undefined,
  };
};

const writeUrlState = (
  profile: ReleaseProfile,
  pathname: string,
  tab: TabId,
  vnScenarioId?: string,
  mapPanel?: MapPanelId,
  entryToken?: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPathname = normalizePathname(pathname, profile);
  const params = new URLSearchParams();
  const allowedTabs = new Set(tabsByProfile[profile].map((entry) => entry.id));

  if (profile === "karlsruhe_event") {
    if (normalizedPathname === KARLSRUHE_EVENT_PATHNAME) {
      const safeTab = allowedTabs.has(tab)
        ? tab
        : coerceTabForProfile(null, profile, vnScenarioId);
      params.set("tab", safeTab);
      if (vnScenarioId && vnScenarioId.trim().length > 0) {
        params.set("vnScenario", vnScenarioId);
      }
      if (safeTab === "map" && mapPanel) {
        params.set("mapPanel", mapPanel);
      }
      if (entryToken && entryToken.trim().length > 0) {
        params.set("entry", entryToken);
      }
    }
  } else {
    const safeTab = allowedTabs.has(tab)
      ? tab
      : coerceTabForProfile(null, profile, vnScenarioId);
    params.set("tab", safeTab);
    if (vnScenarioId && vnScenarioId.trim().length > 0) {
      params.set("vnScenario", vnScenarioId);
    }
    if (safeTab === "map" && mapPanel) {
      params.set("mapPanel", mapPanel);
    }
  }

  const query = params.toString();
  const nextUrl = `${normalizedPathname}${query ? `?${query}` : ""}${
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
  const [commandSessions] = useTable(tables.myCommandSessions);
  const [battleSessions] = useTable(tables.myBattleSessions);
  const [vnSessions] = useTable(tables.myVnSessions);
  const [flagsRows] = useTable(tables.myPlayerFlags);
  const beginKarlsruheEventEntry = useReducer(
    reducers.beginKarlsruheEventEntry,
  );
  const isActive = Boolean(identity);
  const isKarlsruheProfile = isKarlsruheEventProfile(RELEASE_PROFILE);
  const initialUrlState = useMemo(() => readUrlState(RELEASE_PROFILE), []);
  const [pathname, setPathname] = useState(initialUrlState.pathname);
  const [entryToken, setEntryToken] = useState<string | undefined>(
    initialUrlState.entryToken,
  );
  const [activeTab, setActiveTab] = useState<TabId>(initialUrlState.tab);
  const [vnScenarioId, setVnScenarioId] = useState<string | undefined>(
    initialUrlState.vnScenarioId,
  );
  const [mapPanel, setMapPanel] = useState<MapPanelId | undefined>(
    initialUrlState.mapPanel,
  );
  const grantStorageKey = useMemo(
    () => getKarlsruheGrantStorageKey(RELEASE_PROFILE, SPACETIMEDB_DB_NAME),
    [],
  );
  const [hasKarlsruheGrant, setHasKarlsruheGrant] = useState(() =>
    Boolean(readKarlsruheGrant(grantStorageKey)),
  );
  const [entryGateState, setEntryGateState] =
    useState<EntryGateState>("scan_required");
  const [entryGateError, setEntryGateError] = useState<string | null>(null);
  const activeCommandSessionKeyRef = useRef<string | null>(null);
  const activeBattleSessionKeyRef = useRef<string | null>(null);
  const validatedEntryTokenRef = useRef<string | null>(null);

  const activeCommandSession = useMemo(
    () => commandSessions.find((row) => row.status !== "closed") ?? null,
    [commandSessions],
  );

  const activeBattleSession = useMemo(
    () => battleSessions.find((row) => row.status !== "closed") ?? null,
    [battleSessions],
  );

  const activeVnSession = useMemo(
    () => vnSessions.find((row) => !hasOptionalValue(row.completedAt)) ?? null,
    [vnSessions],
  );

  const playerFlags = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const row of flagsRows) {
      result[row.key] = row.value;
    }
    return result;
  }, [flagsRows]);

  const karlsruheArrivalComplete = Boolean(
    playerFlags[KARLSRUHE_EVENT_ARRIVAL_COMPLETE_FLAG],
  );

  useEffect(() => {
    const onPopState = () => {
      const next = readUrlState(RELEASE_PROFILE);
      setPathname(next.pathname);
      setEntryToken(next.entryToken);
      setActiveTab(next.tab);
      setVnScenarioId(next.vnScenarioId);
      setMapPanel(next.mapPanel);
      setHasKarlsruheGrant(Boolean(readKarlsruheGrant(grantStorageKey)));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [grantStorageKey]);

  useEffect(() => {
    writeUrlState(
      RELEASE_PROFILE,
      pathname,
      activeTab,
      vnScenarioId,
      mapPanel,
      entryToken,
    );
  }, [activeTab, entryToken, mapPanel, pathname, vnScenarioId]);

  useEffect(() => {
    if (isKarlsruheProfile) {
      return;
    }

    if (!activeCommandSession) {
      activeCommandSessionKeyRef.current = null;
      return;
    }

    if (
      activeCommandSessionKeyRef.current === activeCommandSession.sessionKey
    ) {
      return;
    }

    activeCommandSessionKeyRef.current = activeCommandSession.sessionKey;
    setActiveTab("command");
  }, [activeCommandSession, isKarlsruheProfile]);

  useEffect(() => {
    if (isKarlsruheProfile) {
      return;
    }

    if (!activeBattleSession) {
      activeBattleSessionKeyRef.current = null;
      return;
    }

    if (activeBattleSessionKeyRef.current === activeBattleSession.sessionKey) {
      return;
    }

    activeBattleSessionKeyRef.current = activeBattleSession.sessionKey;
    setActiveTab("battle");
  }, [activeBattleSession, isKarlsruheProfile]);

  useEffect(() => {
    if (!isKarlsruheProfile) {
      return;
    }

    if (pathname !== KARLSRUHE_EVENT_PATHNAME) {
      setEntryGateError(null);
      setEntryGateState("scan_required");
      validatedEntryTokenRef.current = null;
      return;
    }

    if (entryToken) {
      if (!matchesKarlsruheEntryToken(entryToken)) {
        clearKarlsruheGrant(grantStorageKey);
        setHasKarlsruheGrant(false);
        setEntryGateState("denied");
        setEntryGateError("The supplied Karlsruhe event token is not valid.");
        validatedEntryTokenRef.current = null;
        return;
      }

      if (!identityHex) {
        setEntryGateState("validating");
        setEntryGateError(null);
        return;
      }

      if (validatedEntryTokenRef.current === entryToken) {
        return;
      }

      validatedEntryTokenRef.current = entryToken;
      setEntryGateState("validating");
      setEntryGateError(null);

      void beginKarlsruheEventEntry({
        requestId: `karlsruhe_entry_${Date.now()}_${Math.floor(
          Math.random() * 1_000_000,
        )}`,
        entryToken,
      })
        .then(() => {
          writeKarlsruheGrant(grantStorageKey);
          setHasKarlsruheGrant(true);
          setEntryGateState("granted");
          setEntryToken(undefined);
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to validate Karlsruhe event access.";
          clearKarlsruheGrant(grantStorageKey);
          setHasKarlsruheGrant(false);
          setEntryGateState("denied");
          setEntryGateError(message);
          validatedEntryTokenRef.current = null;
        });
      return;
    }

    if (hasKarlsruheGrant) {
      setEntryGateError(null);
      setEntryGateState("granted");
      return;
    }

    setEntryGateError(null);
    setEntryGateState("scan_required");
  }, [
    beginKarlsruheEventEntry,
    grantStorageKey,
    hasKarlsruheGrant,
    identityHex,
    isKarlsruheProfile,
    entryToken,
    pathname,
  ]);

  useEffect(() => {
    if (
      !isKarlsruheProfile ||
      pathname !== KARLSRUHE_EVENT_PATHNAME ||
      entryGateState !== "granted"
    ) {
      return;
    }

    if (activeVnSession) {
      if (vnScenarioId !== activeVnSession.scenarioId) {
        setVnScenarioId(activeVnSession.scenarioId);
      }
      if (activeTab !== "vn") {
        setActiveTab("vn");
      }
      return;
    }

    if (!karlsruheArrivalComplete) {
      if (vnScenarioId !== KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID) {
        setVnScenarioId(KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID);
      }
      if (activeTab !== "vn") {
        setActiveTab("vn");
      }
      return;
    }

    const safeTab = coerceTabForProfile(
      activeTab,
      RELEASE_PROFILE,
      vnScenarioId,
    );
    if (safeTab !== activeTab) {
      setActiveTab(safeTab);
    }
  }, [
    activeTab,
    activeVnSession,
    entryGateState,
    isKarlsruheProfile,
    karlsruheArrivalComplete,
    pathname,
    vnScenarioId,
  ]);

  const statusText = useMemo(() => {
    if (!isActive) {
      return "Disconnected";
    }
    return `Connected as ${identityLabel(identityHex)}`;
  }, [identityHex, isActive]);

  const openVnScenario = (scenarioId: string) => {
    if (isKarlsruheProfile) {
      setPathname(KARLSRUHE_EVENT_PATHNAME);
    }
    setVnScenarioId(scenarioId);
    setMapPanel(undefined);
    setActiveTab("vn");
  };

  const navigateToTab = (tab: TabId, options?: { mapPanel?: MapPanelId }) => {
    if (isKarlsruheProfile) {
      setPathname(KARLSRUHE_EVENT_PATHNAME);
    }

    const safeTab = coerceTabForProfile(tab, RELEASE_PROFILE, vnScenarioId);
    setActiveTab(safeTab);
    setMapPanel(safeTab === "map" ? options?.mapPanel : undefined);
  };

  const renderTab = (tab: TabId) => {
    if (tab === "home") {
      return (
        <HomePage
          onNavigate={navigateToTab}
          onOpenVnScenario={openVnScenario}
        />
      );
    }

    if (tab === "vn") {
      return (
        <VnPage
          initialScenarioId={vnScenarioId}
          onScenarioChange={setVnScenarioId}
          onNavigateTab={(nextTab) => navigateToTab(nextTab as TabId)}
        />
      );
    }

    if (tab === "character") {
      return <CharacterPage />;
    }

    if (tab === "map") {
      return (
        <MapPage onOpenVnScenario={openVnScenario} initialPanel={mapPanel} />
      );
    }

    if (tab === "command") {
      return (
        <CommandPage
          onNavigateTab={(nextTab) => navigateToTab(nextTab as TabId)}
        />
      );
    }

    if (tab === "battle") {
      return (
        <BattlePage
          onNavigateTab={(nextTab) => navigateToTab(nextTab as TabId)}
        />
      );
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

  if (
    isKarlsruheProfile &&
    (pathname !== KARLSRUHE_EVENT_PATHNAME || entryGateState !== "granted")
  ) {
    return (
      <KarlsruheQrGate
        state={entryGateState}
        errorMessage={entryGateError}
        hasGrant={hasKarlsruheGrant}
      />
    );
  }

  return (
    <ToastProvider>
      <Toaster />
      <AppShellInner
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        statusText={statusText}
        renderTab={renderTab}
        tabs={tabsByProfile[RELEASE_PROFILE]}
        subtitle={
          isKarlsruheProfile
            ? "Karlsruhe QR Event Release v1"
            : "Phase 2 MindPalace Vertical Slice"
        }
      />
    </ToastProvider>
  );
};

interface AppShellInnerProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId, options?: { mapPanel?: MapPanelId }) => void;
  statusText: string;
  renderTab: (tab: TabId) => ReactNode;
  tabs: Array<{ id: TabId; label: string }>;
  subtitle: string;
}

const AppShellInner = ({
  activeTab,
  setActiveTab,
  statusText,
  renderTab,
  tabs,
  subtitle,
}: AppShellInnerProps) => {
  useFactDiscoveryToast();
  useHypothesisRewardToast();
  usePresenceHeartbeat(activeTab);
  const { hasReadyHypotheses } = useMindPalaceReadiness();
  const isHomeTab = activeTab === "home";
  const isMapTab = activeTab === "map";

  const badges = useMemo(() => {
    const nextBadges: Partial<Record<TabId, boolean>> = {};
    if (tabs.some((tab) => tab.id === "mind_palace")) {
      nextBadges.mind_palace = hasReadyHypotheses;
    }
    return nextBadges;
  }, [hasReadyHypotheses, tabs]);

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
            <p className="subtitle">{subtitle}</p>
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
