import { useCallback, useEffect, useMemo, useState } from "react";
import { KARLSRUHE_EVENT_PATHNAME } from "../features/release/karlsruheEntry";
import type { ReleaseProfile } from "../features/release/types";
import type {
  MapPanelId,
  OpenVnScenarioOptions,
  TabId,
} from "../shared/navigation/shellNavigationTypes";
import { coerceTabForProfile } from "./shellTabs";
import { readUrlState, writeUrlState } from "./shellUrlState";

interface ShellNavigationState {
  pathname: string;
  entryToken?: string;
  activeTab: TabId;
  vnScenarioId?: string;
  mapPanel?: MapPanelId;
  setEntryToken: (entryToken: string | undefined) => void;
  setActiveTab: (tab: TabId) => void;
  setVnScenarioId: (scenarioId: string | undefined) => void;
  navigateToTab: (tab: TabId, options?: { mapPanel?: MapPanelId }) => void;
  openVnScenario: (scenarioId: string, options?: OpenVnScenarioOptions) => void;
}

export const useShellNavigation = (
  profile: ReleaseProfile,
): ShellNavigationState => {
  const initialUrlState = useMemo(() => readUrlState(profile), [profile]);
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

  useEffect(() => {
    const onPopState = () => {
      const next = readUrlState(profile);
      setPathname(next.pathname);
      setEntryToken(next.entryToken);
      setActiveTab(next.tab);
      setVnScenarioId(next.vnScenarioId);
      setMapPanel(next.mapPanel);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [profile]);

  useEffect(() => {
    writeUrlState(
      profile,
      pathname,
      activeTab,
      vnScenarioId,
      mapPanel,
      entryToken,
    );
  }, [activeTab, entryToken, mapPanel, pathname, profile, vnScenarioId]);

  const navigateToTab = useCallback(
    (tab: TabId, options?: { mapPanel?: MapPanelId }) => {
      if (profile === "karlsruhe_event") {
        setPathname(KARLSRUHE_EVENT_PATHNAME);
      }

      const safeTab = coerceTabForProfile(tab, profile, vnScenarioId);
      setActiveTab(safeTab);
      setMapPanel(safeTab === "map" ? options?.mapPanel : undefined);
    },
    [profile, vnScenarioId],
  );

  const openVnScenario = useCallback(
    (scenarioId: string) => {
      if (profile === "karlsruhe_event") {
        setPathname(KARLSRUHE_EVENT_PATHNAME);
      }
      setVnScenarioId(scenarioId);
      setMapPanel(undefined);
      setActiveTab("vn");
    },
    [profile],
  );

  return {
    pathname,
    entryToken,
    activeTab,
    vnScenarioId,
    mapPanel,
    setEntryToken,
    setActiveTab,
    setVnScenarioId,
    navigateToTab,
    openVnScenario,
  };
};
