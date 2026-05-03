export type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "command"
  | "battle";

export type MapPanelId = "qr";

export type OpenVnScenarioOptions = Readonly<{ launchCurtain?: boolean }>;

export type VnLaunchCoverPhase = "off" | "solid" | "out";

export interface ShellUrlState {
  pathname: string;
  tab: TabId;
  vnScenarioId?: string;
  mapPanel?: MapPanelId;
  entryToken?: string;
}
