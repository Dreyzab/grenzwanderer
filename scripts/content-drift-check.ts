import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import {
  contentSnapshotRelativePath,
  publicContentSnapshotRelativePath,
} from "./content-authoring-contract";

export const contentDriftFiles = [
  contentSnapshotRelativePath,
  publicContentSnapshotRelativePath,
] as const;

interface GitHeadReadSuccess {
  ok: true;
  content: string;
}

interface GitHeadReadFailure {
  ok: false;
  kind: "missing_in_head" | "head_unavailable" | "read_failed";
  detail: string;
}

type GitHeadReadResult = GitHeadReadSuccess | GitHeadReadFailure;

export interface ContentDriftFinding {
  file: string;
  message: string;
}

export type ContentDriftMode = "artifacts" | "head";

export interface VerifyContentDriftDeps {
  mode?: ContentDriftMode;
  existsSyncImpl?: typeof existsSync;
  readFileSyncImpl?: (file: string, encoding: BufferEncoding) => string;
  readHeadContentImpl?: (file: string) => GitHeadReadResult;
}

const normalizeSnapshotJson = (content: string): string => {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  delete parsed.generatedAt;
  delete parsed.checksum;
  return JSON.stringify(parsed);
};

export const readHeadContent = (file: string): GitHeadReadResult => {
  const result = spawnSync("git", ["show", `HEAD:${file}`], {
    encoding: "utf8",
  });

  if (!result.error && result.status === 0) {
    return { ok: true, content: result.stdout };
  }

  const detail = String(result.stderr || result.error || "").trim();
  if (
    detail.includes("exists on disk, but not in") ||
    detail.includes("does not exist in 'HEAD'")
  ) {
    return {
      ok: false,
      kind: "missing_in_head",
      detail: "file exists locally but not in git HEAD",
    };
  }

  if (
    detail.includes("invalid object name 'HEAD'") ||
    detail.includes("unknown revision or path not in the working tree")
  ) {
    return {
      ok: false,
      kind: "head_unavailable",
      detail:
        "git HEAD is unavailable. Use content:drift:against-head only when repository history is available.",
    };
  }

  return {
    ok: false,
    kind: "read_failed",
    detail: detail || "unknown git error while reading HEAD artifact",
  };
};

export const verifyContentDrift = (
  deps: VerifyContentDriftDeps = {},
): ContentDriftFinding[] => {
  const mode = deps.mode ?? "artifacts";
  const fileExists = deps.existsSyncImpl ?? existsSync;
  const readText = deps.readFileSyncImpl ?? readFileSync;
  const readHead = deps.readHeadContentImpl ?? readHeadContent;
  const findings: ContentDriftFinding[] = [];
  const normalizedLocalByFile = new Map<string, string>();

  for (const file of contentDriftFiles) {
    if (!fileExists(file)) {
      findings.push({ file, message: "file missing locally" });
      continue;
    }

    const localContent = String(readText(file, "utf8"));
    try {
      normalizedLocalByFile.set(file, normalizeSnapshotJson(localContent));
    } catch {
      findings.push({ file, message: "JSON parsing error" });
      continue;
    }

    if (mode !== "head") {
      continue;
    }

    const head = readHead(file);
    if (!head.ok) {
      findings.push({ file, message: head.detail });
      continue;
    }

    if (localContent === head.content) {
      continue;
    }

    try {
      if (
        normalizeSnapshotJson(localContent) !==
        normalizeSnapshotJson(head.content)
      ) {
        findings.push({
          file,
          message: "snapshot content differs from git HEAD",
        });
      }
    } catch {
      findings.push({ file, message: "JSON parsing error" });
    }
  }

  if (mode !== "head") {
    const canonicalFile = contentDriftFiles[0];
    const canonical = normalizedLocalByFile.get(canonicalFile);
    if (canonical) {
      for (const file of contentDriftFiles.slice(1)) {
        const current = normalizedLocalByFile.get(file);
        if (current && current !== canonical) {
          findings.push({
            file,
            message: `snapshot content differs from canonical local artifact (${canonicalFile})`,
          });
        }
      }
    }
  }

  return findings;
};

if (import.meta.main) {
  const againstHead = process.argv.includes("--against-head");
  const findings = verifyContentDrift({
    mode: againstHead ? "head" : "artifacts",
  });
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`- ${finding.file} (${finding.message})`);
    }
    console.error(
      againstHead
        ? "\nContent drift detected against git HEAD. Regenerate, stage, or review snapshot changes."
        : "\nContent drift detected across local snapshot artifacts. Re-run content extraction and review the generated files.",
    );
    process.exitCode = 1;
  } else {
    console.log(
      againstHead
        ? "No content drift detected against git HEAD for snapshot artifacts."
        : "No local content drift detected for snapshot artifacts.",
    );
  }
}
