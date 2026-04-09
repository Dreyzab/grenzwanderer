import { execFileSync } from "node:child_process";

import {
  hasContentSensitiveChanges,
  normalizeRepoRelativePath,
} from "./content-authoring-contract";

type ExecFileSyncLike = (
  file: string,
  args: readonly string[],
  options?: { encoding?: BufferEncoding | "buffer"; stdio?: "inherit" | "pipe" },
) => string | Buffer;

const readGitText = (
  args: readonly string[],
  execImpl: ExecFileSyncLike = execFileSync as ExecFileSyncLike,
): string | null => {
  try {
    const output = execImpl("git", args, {
      encoding: "utf8",
      stdio: "pipe",
    });
    return String(output).trim() || null;
  } catch {
    return null;
  }
};

export const resolveComparisonBase = (
  execImpl: ExecFileSyncLike = execFileSync as ExecFileSyncLike,
): string | null => {
  const upstream = readGitText(
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
    execImpl,
  );
  if (upstream) {
    const mergeBase = readGitText(["merge-base", "HEAD", upstream], execImpl);
    if (mergeBase) {
      return mergeBase;
    }
  }

  const originMain = readGitText(
    ["rev-parse", "--verify", "--quiet", "origin/main"],
    execImpl,
  );
  if (originMain) {
    const mergeBase = readGitText(
      ["merge-base", "HEAD", "origin/main"],
      execImpl,
    );
    if (mergeBase) {
      return mergeBase;
    }
  }

  return readGitText(["rev-parse", "--verify", "--quiet", "HEAD~1"], execImpl);
};

export const listChangedPathsSinceBase = (
  base: string,
  execImpl: ExecFileSyncLike = execFileSync as ExecFileSyncLike,
): string[] => {
  const output = readGitText(
    ["diff", "--name-only", "--diff-filter=ACMR", `${base}..HEAD`],
    execImpl,
  );
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((entry) => normalizeRepoRelativePath(entry))
    .filter((entry) => entry.length > 0);
};

export const shouldRunContentGate = (changedPaths: readonly string[]): boolean =>
  hasContentSensitiveChanges(changedPaths);

const runLocalContentGate = (): void => {
  execFileSync("bun", ["run", "content:gate:local"], { stdio: "inherit" });
};

if (import.meta.main) {
  if (process.env.SKIP_CONTENT_GATE === "1") {
    console.log("[content:pre-push] SKIP_CONTENT_GATE=1, skipping content gate.");
    process.exit(0);
  }

  const base = resolveComparisonBase();
  if (!base) {
    console.log(
      "[content:pre-push] Could not resolve comparison base; running content gate conservatively.",
    );
    runLocalContentGate();
    process.exit(0);
  }

  const changedPaths = listChangedPathsSinceBase(base);
  if (!shouldRunContentGate(changedPaths)) {
    console.log(
      `[content:pre-push] No content-sensitive changes detected since ${base}; skipping content gate.`,
    );
    process.exit(0);
  }

  console.log(
    `[content:pre-push] Detected content-sensitive changes since ${base}; running content gate.`,
  );
  runLocalContentGate();
}
