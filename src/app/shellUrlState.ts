import {
  KARLSRUHE_EVENT_PATHNAME,
  getKarlsruheEntryTokenFromSearch,
} from "../features/release/karlsruheEntry";
import type { ReleaseProfile } from "../features/release/types";
import {
  coerceTabForProfile,
  resolveDefaultTab,
  tabsByProfile,
} from "./shellTabs";
import type {
  MapPanelId,
  ShellUrlState,
  TabId,
} from "../shared/navigation/shellNavigationTypes";

export const normalizePathname = (
  pathname: string,
  profile: ReleaseProfile,
): string => {
  if (profile !== "karlsruhe_event") {
    return pathname || "/";
  }

  return pathname === KARLSRUHE_EVENT_PATHNAME ? KARLSRUHE_EVENT_PATHNAME : "/";
};

export const readUrlState = (profile: ReleaseProfile): ShellUrlState => {
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

export const writeUrlState = (
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
