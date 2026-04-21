import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { case01OnboardingRelativeRoot } from "./content-authoring-contract";
import { parseCase01Onboarding } from "./vn-case01-onboarding";

const ONBOARDING_RELATIVE_ROOT = case01OnboardingRelativeRoot;

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
        /scene_intro_journey\.md:1:\d+ \[MISSING_TYPE\]/,
      );
    });
  });

  it("fails fast when the onboarding root contract is missing", () => {
    const storyRoot = createTempStoryRoot();
    try {
      expect(() => parseCase01Onboarding(storyRoot)).toThrow(
        /MISSING_ONBOARDING_ROOT/,
      );
    } finally {
      rmSync(storyRoot, { recursive: true, force: true });
    }
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
        /scene_intro_journey\.md:\d+:\d+ \[INVALID_EFFECT_SYNTAX\]/,
      );
    });
  });

  it("parses DSL v2 choice gates and skill-check branches", () => {
    const files: Record<string, string> = {
      "scene_intro_journey.md": `
---
id: scene_intro_journey
type: vn_scene
---
# Intro
## Narrative
Text.
## Preconditions
- if: var_gte( attr_intellect , 2 )
## OnEnter
- effect:add_var( tension , 1 )
## Choices
1. Probe witness.
   - If: flag_equals(origin_journalist,true)
   - IfAny: has_evidence(ev_a)
   - Require: var_gte(attr_social,3)
   - RequireAny: has_item(lockpick)
   - Next: [[scene_hbf_arrival]]
   - Check: id=check_probe voice=attr_social dc=8 showchance=true
   - OnSuccess: next=[[scene_hbf_arrival]]
   - OnFail: next=[[scene_hbf_arrival]]
   - OnSuccessEffect: add_var( checks_passed , 1 )
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
      const parsed = parseCase01Onboarding(storyRoot);
      const intro = parsed.nodeBlueprints.find(
        (node) => node.id === "scene_intro_journey",
      );
      expect(intro).toBeDefined();
      if (!intro) {
        return;
      }

      expect(intro.preconditions).toEqual([
        { type: "var_gte", key: "attr_intellect", value: 2 },
      ]);
      expect(intro.onEnter).toEqual([
        { type: "add_var", key: "tension", value: 1 },
      ]);

      const choice = intro.choices[0];
      expect(choice.visibleIfAll).toEqual([
        { type: "flag_equals", key: "origin_journalist", value: true },
      ]);
      expect(choice.visibleIfAny).toEqual([
        { type: "has_evidence", evidenceId: "ev_a" },
      ]);
      expect(choice.requireAll).toEqual([
        { type: "var_gte", key: "attr_social", value: 3 },
      ]);
      expect(choice.requireAny).toEqual([{ type: "has_item", itemId: "lockpick" }]);
      expect(choice.skillCheck?.id).toBe("check_probe");
      expect(choice.skillCheck?.showChancePercent).toBe(true);
      expect(choice.skillCheck?.onSuccess?.effects?.[0]).toEqual({
        type: "add_var",
        key: "checks_passed",
        value: 1,
      });
    });
  });

  it("rejects invalid showchance values", () => {
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
1. Probe witness.
   - Next: [[scene_hbf_arrival]]
   - Check: id=check_probe voice=attr_social dc=8 showchance=maybe
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
        /INVALID_BOOLEAN/,
      );
    });
  });

  it("returns did-you-mean for unknown var key", () => {
    const files: Record<string, string> = {
      "scene_intro_journey.md": `
---
id: scene_intro_journey
type: vn_scene
---
# Intro
## Narrative
Text.
## OnEnter
- Effect: add_var(tnsion,1)
## Choices
1. Continue
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
        /did you mean 'tension'/,
      );
    });
  });
});
