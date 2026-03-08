import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export interface AppBuildMetadata {
  appVersion: string;
  commitSha: string;
  buildTimestamp: string;
}

const resolveGitCommitSha = (cwd: string): string => {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
};

export const loadAppBuildMetadata = (repoRoot: string): AppBuildMetadata => {
  const packageJsonPath = path.resolve(repoRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version: string;
  };

  return {
    appVersion: packageJson.version,
    commitSha: resolveGitCommitSha(repoRoot),
    buildTimestamp: new Date().toISOString(),
  };
};
