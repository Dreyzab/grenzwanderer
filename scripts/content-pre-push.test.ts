import { describe, expect, it } from "vitest";

import {
  listChangedPathsSinceBase,
  resolveComparisonBase,
  shouldRunContentGate,
} from "./content-pre-push";

const createExec = (responses: Record<string, string>) =>
  ((file: string, args: readonly string[]) => {
    const key = `${file} ${args.join(" ")}`;
    if (!(key in responses)) {
      throw new Error(`Unexpected exec call: ${key}`);
    }
    const response = responses[key];
    if (response === "__THROW__") {
      throw new Error(`Command failed: ${key}`);
    }
    return response;
  }) as (file: string, args: readonly string[]) => string;

describe("content-pre-push", () => {
  it("runs the content gate only for sensitive paths", () => {
    expect(
      shouldRunContentGate(["obsidian/StoryDetective/40_GameViewer/demo.md"]),
    ).toBe(true);
    expect(shouldRunContentGate(["scripts/content-vocabulary.ts"])).toBe(true);
    expect(shouldRunContentGate(["src/app/App.tsx"])).toBe(false);
  });

  it("prefers upstream merge-base when available", () => {
    const exec = createExec({
      "git rev-parse --abbrev-ref --symbolic-full-name @{upstream}":
        "origin/feature\n",
      "git merge-base HEAD origin/feature": "abc123\n",
    });

    expect(resolveComparisonBase(exec)).toBe("abc123");
  });

  it("falls back to origin/main when upstream is unavailable", () => {
    const exec = createExec({
      "git rev-parse --abbrev-ref --symbolic-full-name @{upstream}":
        "__THROW__",
      "git rev-parse --verify --quiet origin/main": "origin/main\n",
      "git merge-base HEAD origin/main": "def456\n",
    });

    expect(resolveComparisonBase(exec)).toBe("def456");
  });

  it("falls back to HEAD~1 when neither upstream nor origin/main resolve", () => {
    const exec = createExec({
      "git rev-parse --abbrev-ref --symbolic-full-name @{upstream}":
        "__THROW__",
      "git rev-parse --verify --quiet origin/main": "__THROW__",
      "git rev-parse --verify --quiet HEAD~1": "789abc\n",
    });

    expect(resolveComparisonBase(exec)).toBe("789abc");
  });

  it("normalizes changed paths from git diff output", () => {
    const exec = createExec({
      "git diff --name-only --diff-filter=ACMR abc123..HEAD":
        "obsidian\\StoryDetective\\file.md\nsrc/app/App.tsx\n",
    });

    expect(listChangedPathsSinceBase("abc123", exec)).toEqual([
      "obsidian/StoryDetective/file.md",
      "src/app/App.tsx",
    ]);
  });
});
