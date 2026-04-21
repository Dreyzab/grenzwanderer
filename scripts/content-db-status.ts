import type {
  ContentReleaseEntry,
  ContentReleaseManifest,
  ContentTarget,
} from "./content-manifest";
import { loadManifest, readSnapshot } from "./content-manifest";
import {
  formatContentTarget,
  parseContentTargetArgs,
  readArg,
} from "./content-cli";
import { getOperatorToken } from "./spacetime-operator";
import { runSpacetimeSql } from "./spacetime-sql";

type CompareMode = "manifest" | "local";

interface CliOptions extends ContentTarget {
  compare: CompareMode;
}

export interface ActiveContentVersion {
  version: string;
  checksum: string;
  schemaVersion: number;
  publishedAt: string;
}

export interface StatusBaseline {
  source: CompareMode;
  version: string | null;
  checksum: string;
  schemaVersion: number | null;
  publishedAt: string | null;
}

export interface StatusEvaluation {
  ok: boolean;
  warning: string | null;
}

const usage = () => {
  console.error(
    "Usage: bun run content:db:status -- [--server local|maincloud] [--db <name>] [--host <uri>] [--compare manifest|local]",
  );
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const buildActiveVersionQuery = (): string =>
  [
    "SELECT",
    "  version,",
    "  checksum,",
    "  schema_version,",
    "  published_at",
    "FROM content_version",
    "WHERE is_active = true",
  ].join("\n");

export const findLatestReleaseForTarget = (
  manifest: ContentReleaseManifest,
  target: ContentTarget,
): ContentReleaseEntry | null => {
  const matches = manifest.releases.filter(
    (entry) =>
      entry.target.server === target.server &&
      entry.target.host === target.host &&
      entry.target.database === target.database,
  );
  return matches.at(-1) ?? null;
};

export const evaluateContentDbStatus = ({
  activeVersion,
  baseline,
}: {
  activeVersion: ActiveContentVersion;
  baseline: StatusBaseline;
}): StatusEvaluation => {
  if (activeVersion.checksum === baseline.checksum) {
    return { ok: true, warning: null };
  }

  const baselineLabel =
    baseline.source === "manifest"
      ? `manifest release${baseline.version ? ` ${baseline.version}` : ""}`
      : "local snapshot";

  return {
    ok: false,
    warning:
      `Active DB checksum ${activeVersion.checksum} does not match ${baselineLabel} checksum ${baseline.checksum}. ` +
      "Run 'bun run content:release -- --version X.Y.Z ...' if the local baseline should become active.",
  };
};

const parseCompareMode = (args: string[]): CompareMode => {
  const compare = readArg(args, "--compare") ?? "manifest";
  if (compare !== "manifest" && compare !== "local") {
    usage();
    throw new Error("--compare must be either manifest or local");
  }
  return compare;
};

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  return {
    ...parseContentTargetArgs(args, usage),
    compare: parseCompareMode(args),
  };
};

const parseActiveVersions = (rows: unknown[]): ActiveContentVersion[] =>
  rows.map((row, index) => {
    const record = asRecord(row);
    if (!record) {
      throw new Error(
        `content_version row ${index} is not an object; unable to inspect content status`,
      );
    }

    const version = asString(record.version);
    const checksum = asString(record.checksum);
    const schemaVersion = asNumber(
      record.schema_version ?? record.schemaVersion,
    );
    const publishedAt = asString(record.published_at ?? record.publishedAt);

    if (!version || !checksum || schemaVersion === null || !publishedAt) {
      throw new Error(
        `content_version row ${index} has invalid shape; unable to inspect content status`,
      );
    }

    return { version, checksum, schemaVersion, publishedAt };
  });

const readActiveContentVersions = async (
  target: ContentTarget,
): Promise<ActiveContentVersion[]> =>
  parseActiveVersions(
    await runSpacetimeSql({
      host: target.host,
      database: target.database,
      query: buildActiveVersionQuery(),
      token: getOperatorToken(target.host, target.database),
    }),
  );

export const selectSingleActiveContentVersion = (
  activeVersions: readonly ActiveContentVersion[],
): ActiveContentVersion => {
  if (activeVersions.length === 0) {
    throw new Error(
      "No active content version found in the target database. Publish content before relying on runtime state.",
    );
  }
  if (activeVersions.length > 1) {
    throw new Error(
      `Expected exactly one active content version, found ${activeVersions.length}.`,
    );
  }
  return activeVersions[0];
};

const resolveBaseline = (
  compare: CompareMode,
  target: ContentTarget,
): StatusBaseline => {
  const snapshot = readSnapshot();
  if (compare === "local") {
    return {
      source: "local",
      version: null,
      checksum: snapshot.checksum,
      schemaVersion: snapshot.schemaVersion,
      publishedAt: null,
    };
  }

  const manifest = loadManifest();
  const latest = findLatestReleaseForTarget(manifest, target);
  if (!latest) {
    throw new Error(
      `No manifest release entry found for ${formatContentTarget(target)}. Use '--compare local' or publish content for this target first.`,
    );
  }

  return {
    source: "manifest",
    version: latest.version,
    checksum: latest.checksum,
    schemaVersion: latest.schemaVersion,
    publishedAt: latest.publishedAt,
  };
};

const main = async (): Promise<void> => {
  const cli = parseCli();
  const baseline = resolveBaseline(cli.compare, cli);
  const localSnapshot = readSnapshot();
  const activeVersions = await readActiveContentVersions(cli);

  console.log(`Target: ${formatContentTarget(cli)}`);
  console.log(`Baseline: ${baseline.source}`);
  console.log(`Local snapshot checksum: ${localSnapshot.checksum}`);

  if (baseline.version) {
    console.log(`Baseline version: ${baseline.version}`);
  }
  console.log(`Baseline checksum: ${baseline.checksum}`);

  const activeVersion = selectSingleActiveContentVersion(activeVersions);
  console.log(`DB active version: ${activeVersion.version}`);
  console.log(`DB active checksum: ${activeVersion.checksum}`);

  const evaluation = evaluateContentDbStatus({ activeVersion, baseline });
  if (evaluation.warning) {
    console.warn(`[content:db:status] WARNING: ${evaluation.warning}`);
    return;
  }

  console.log(
    "[content:db:status] Active DB content matches the selected baseline.",
  );
};

if (import.meta.main) {
  main().catch((error) => {
    console.error("content:db:status failed:", error);
    process.exitCode = 1;
  });
}
