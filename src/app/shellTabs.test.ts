import { describe, expect, it } from "vitest";
import type { TabId } from "../shared/navigation/shellNavigationTypes";
import { getLocalizedTabsForProfile } from "./shellTabs";

const labelsByTab: Record<TabId, string> = {
  home: "Home Label",
  vn: "VN Label",
  character: "Character Label",
  map: "Map Label",
  mind_palace: "Mind Label",
  command: "Command Label",
  battle: "Battle Label",
};

describe("shellTabs", () => {
  it("localizes default profile tabs from shared profile metadata", () => {
    expect(getLocalizedTabsForProfile("default", labelsByTab)).toEqual([
      { id: "home", label: "Home Label" },
      { id: "map", label: "Map Label" },
      { id: "command", label: "Command Label" },
      { id: "battle", label: "Battle Label" },
      { id: "character", label: "Character Label" },
      { id: "mind_palace", label: "Mind Label" },
    ]);
  });

  it("localizes Karlsruhe profile tabs without repeating the tab list", () => {
    expect(getLocalizedTabsForProfile("karlsruhe_event", labelsByTab)).toEqual([
      { id: "map", label: "Map Label" },
      { id: "vn", label: "VN Label" },
      { id: "character", label: "Character Label" },
    ]);
  });
});
