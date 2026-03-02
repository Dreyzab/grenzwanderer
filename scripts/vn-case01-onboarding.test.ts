import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { parseCase01Onboarding } from "./vn-case01-onboarding";

const ONBOARDING_RELATIVE_ROOT = "40_GameViewer/Case01/Plot/01_Onboarding";

const createTempStoryRoot = (): string =>
  mkdtempSync(path.join(os.tmpdir(), "case01-onboarding-"));

const writeFixtureFile = (
  storyRoot: string,
  fileName: string,
  markdown: string,
): void => {
  const onboardingDir = path.join(storyRoot, ONBOARDING_RELATIVE_ROOT);
  mkdirSync(onboardingDir, { recursive: true });
  writeFileSync(
    path.join(onboardingDir, fileName),
    markdown.trimStart(),
    "utf8",
  );
};

const withFixture = (
  files: Record<string, string>,
  run: (storyRoot: string) => void,
): void => {
  const storyRoot = createTempStoryRoot();
  try {
    for (const [fileName, markdown] of Object.entries(files)) {
      writeFixtureFile(storyRoot, fileName, markdown);
    }
    run(storyRoot);
  } finally {
    rmSync(storyRoot, { recursive: true, force: true });
  }
};

describe("parseCase01Onboarding", () => {
  it("builds deterministic graph, converts clue links, and redirects out-of-scope next", () => {
    const files: Record<string, string> = {
      "scene_intro_journey.md": `
---
id: scene_intro_journey
type: vn_scene
---
# Scene Intro
## Structure
| Beat 1 | [[scene_intro_journey_beat1]] |
## Choices
1. Continue
   - Next: [[scene_hbf_arrival]]
`,
      "scene_intro_journey_beat1.md": `
---
id: scene_intro_journey_beat1
type: vn_beat
parent: scene_intro_journey
order: 1
---
# Beat 1
## VN Script
В воздухе густой [[ev_station_steam|Пар]].
`,
      "scene_hbf_arrival.md": `
---
id: scene_hbf_arrival
type: vn_scene
---
# Scene HBF
## Narrative
You arrive at the station.
## Choices
1. Open city map
   - Next: [[map_transit]]
`,
      "map_transit.md": `
---
id: map_transit
type: map_hub
---
# Transit
## Narrative
Pick the first lead.
## Choices
1. Go forward
   - Next: [[40_GameViewer/Case01/Plot/02_Briefing/map_first_choice]]
`,
    };

    withFixture(files, (storyRoot) => {
      const first = parseCase01Onboarding(storyRoot);
      const second = parseCase01Onboarding(storyRoot);

      expect(first.scenarioBlueprint.id).toBe("sandbox_case01_pilot");
      expect(first.scenarioBlueprint.startNodeId).toBe("scene_intro_journey");
      expect(first.scenarioBlueprint.nodeIds).toContain(
        "scene_case01_onboarding_handoff",
      );
      expect(first).toEqual(second);

      const introNode = first.nodeBlueprints.find(
        (node) => node.id === "scene_intro_journey",
      );
      expect(introNode?.choices[0]?.id).toBe("CASE01_SCENE_INTRO_JOURNEY_01");
      expect(introNode?.bodyOverride).toContain("[clue:Пар:ev_station_steam]");

      const mapNode = first.nodeBlueprints.find(
        (node) => node.id === "map_transit",
      );
      expect(mapNode?.choices[0]?.nextNodeId).toBe(
        "scene_case01_onboarding_handoff",
      );
    });
  });

  it("fails fast when frontmatter type is missing", () => {
    const files: Record<string, string> = {
      "scene_intro_journey.md": `
---
id: scene_intro_journey
---
# Missing type
## Narrative
Text.
## Choices
1. Continue
   - Next: [[scene_hbf_arrival]]
`,
      "scene_hbf_arrival.md": `
---
id: scene_hbf_arrival
type: vn_scene
---
# Scene HBF
## Narrative
Text.
`,
    };

    withFixture(files, (storyRoot) => {
      expect(() => parseCase01Onboarding(storyRoot)).toThrow(
        /scene_intro_journey\.md:1 \[MISSING_TYPE\]/,
      );
    });
  });

  it("fails fast on invalid Sets syntax with file and line details", () => {
    const files: Record<string, string> = {
      "scene_intro_journey.md": `
---
id: scene_intro_journey
type: vn_scene
---
# Intro
## Narrative
Text.
## Choices
1. Continue
   - Sets flag_missing_backticks = true
   - Next: [[scene_hbf_arrival]]
`,
      "scene_hbf_arrival.md": `
---
id: scene_hbf_arrival
type: vn_scene
---
# HBF
## Narrative
Text.
`,
    };

    withFixture(files, (storyRoot) => {
      expect(() => parseCase01Onboarding(storyRoot)).toThrow(
        /scene_intro_journey\.md:\d+ \[INVALID_EFFECT_SYNTAX\]/,
      );
    });
  });
});
