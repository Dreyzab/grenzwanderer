import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadObsidianScenarioBundles } from "./vn-obsidian-parser";

const createStoryRoot = (): string =>
  mkdtempSync(path.join(os.tmpdir(), "obsidian-vn-runtime-"));

const writeRuntimeFile = (
  storyRoot: string,
  relativePath: string,
  content: string,
): void => {
  const absolutePath = path.join(storyRoot, ...relativePath.split("/"));
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content.trimStart(), "utf8");
};

const withStoryRoot = (
  files: Record<string, string>,
  run: (storyRoot: string) => void,
): void => {
  const storyRoot = createStoryRoot();
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      writeRuntimeFile(storyRoot, relativePath, content);
    }
    run(storyRoot);
  } finally {
    rmSync(storyRoot, { recursive: true, force: true });
  }
};

describe("loadObsidianScenarioBundles", () => {
  it("parses authoritative runtime scenarios and locale mappings", () => {
    withStoryRoot(
      {
        "40_GameViewer/Test/_runtime/_scenario.md": `
---
id: runtime_test
title: Runtime Test
start_node_id: scene_runtime_test_intro
scene_order:
  - scene_runtime_test_intro
supported_locales:
  - en
  - ru
migration_mode: authoritative
---
`,
        "40_GameViewer/Test/_runtime/scene_runtime_test_intro.md": `
---
id: scene_runtime_test_intro
type: vn_scene
status: active
character_id: npc_test
background_url: /images/test.png
active_speakers:
  - npc_test
---

# Intro

## Script

Canonical intro text.

\`\`\`vn-logic
choices:
  - id: CONTINUE
    text: Continue
    next: scene_runtime_test_intro
\`\`\`
`,
        "40_GameViewer/Test/_runtime/scene_runtime_test_intro.ru.md": `
---
id: scene_runtime_test_intro
type: vn_scene
status: active
---

# Интро

## Script

Локализованный текст.
`,
      },
      (storyRoot) => {
        const result = loadObsidianScenarioBundles(storyRoot);
        expect(result.diagnostics).toHaveLength(0);
        expect(result.bundles).toHaveLength(1);
        expect(result.bundles[0]?.scenario.id).toBe("runtime_test");
        expect(result.bundles[0]?.migrationMode).toBe("authoritative");
        expect(result.bundles[0]?.nodes[0]?.characterId).toBe("npc_test");
        expect(result.bundles[0]?.nodes[0]?.backgroundUrl).toBe(
          "/images/test.png",
        );
        expect(result.bundles[0]?.nodes[0]?.activeSpeakers).toEqual([
          "npc_test",
        ]);
        expect(result.bundles[0]?.nodes[0]?.sourcePathByLocale?.ru).toContain(
          ".ru.md",
        );
      },
    );
  });

  it("reports locale logic violations", () => {
    withStoryRoot(
      {
        "40_GameViewer/Test/_runtime/_scenario.md": `
---
id: runtime_test
title: Runtime Test
start_node_id: scene_runtime_test_intro
scene_order:
  - scene_runtime_test_intro
---
`,
        "40_GameViewer/Test/_runtime/scene_runtime_test_intro.md": `
---
id: scene_runtime_test_intro
type: vn_scene
status: active
---

# Intro

## Script

Canonical intro text.

\`\`\`vn-logic
terminal: true
choices: []
\`\`\`
`,
        "40_GameViewer/Test/_runtime/scene_runtime_test_intro.ru.md": `
---
id: scene_runtime_test_intro
type: vn_scene
status: active
---

# Интро

## Script

Локализованный текст.

\`\`\`vn-logic
terminal: true
\`\`\`
`,
      },
      (storyRoot) => {
        const result = loadObsidianScenarioBundles(storyRoot);
        expect(
          result.diagnostics.some(
            (entry) => entry.code === "LOCALE_LOGIC_FORBIDDEN",
          ),
        ).toBe(true);
      },
    );
  });
});
