import type { ReleaseProfile } from "../features/release/types";
import type { TabId } from "../shared/navigation/shellNavigationTypes";

export const allTabs: TabId[] = [
  "home",
  "vn",
  "character",
  "map",
  "mind_palace",
  "command",
  "battle",
];

export const tabsByProfile: Record<
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
  freiburg_detective: [
    { id: "home", label: "Home" },
    { id: "map", label: "Map" },
    { id: "vn", label: "VN" },
    { id: "command", label: "Ops" },
    { id: "battle", label: "Duel" },
    { id: "character", label: "Dossier" },
    { id: "mind_palace", label: "Scan" },
  ],
};

export type LocalizedShellTab = { id: TabId; label: string };

export const getLocalizedTabsForProfile = (
  profile: ReleaseProfile,
  labelsByTab: Record<TabId, string>,
): LocalizedShellTab[] =>
  tabsByProfile[profile].map(({ id }) => ({
    id,
    label: labelsByTab[id],
  }));

export const isTabId = (value: string | null): value is TabId =>
  value !== null && allTabs.includes(value as TabId);

export const resolveDefaultTab = (profile: ReleaseProfile): TabId =>
  profile === "karlsruhe_event" ? "map" : "home";

export const coerceTabForProfile = (
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
