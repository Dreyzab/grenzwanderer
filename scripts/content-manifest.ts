import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ContentServer = "local" | "maincloud";

export interface ContentTarget {
  server: ContentServer;
  host: string;
  database: string;
}

export interface ContentReleaseEntry {
  version: string;
  checksum: string;
  schemaVersion: number;
  generatedAt: string;
  publishedAt: string;
  target: ContentTarget;
}

export interface ContentRollbackEntry {
  checksum: string;
  rolledBackAt: string;
  target: ContentTarget;
}

export interface ContentReleaseManifest {
  schemaVersion: 1;
  updatedAt: string;
  releases: ContentReleaseEntry[];
  rollbacks: ContentRollbackEntry[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

export const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);
export const manifestPath = path.join(
  repoRoot,
  "content",
  "vn",
  "releases.manifest.json",
);

const defaultManifest = (): ContentReleaseManifest => ({
  schemaVersion: 1,
  updatedAt: new Date(0).toISOString(),
  releases: [],
  rollbacks: [],
});

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const asRecord = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  assert(isRecord(value), `${fieldName} must be an object`);
  return value as Record<string, unknown>;
};

const asString = (value: unknown, fieldName: string): string => {
  assert(typeof value === "string", `${fieldName} must be a string`);
  return value as string;
};

const asNonEmptyString = (value: unknown, fieldName: string): string => {
  const stringValue = asString(value, fieldName);
  assert(stringValue.trim().length > 0, `${fieldName} must not be empty`);
  return stringValue;
};

const asPositiveInteger = (value: unknown, fieldName: string): number => {
  assert(
    typeof value === "number" && Number.isInteger(value) && value > 0,
    `${fieldName} must be a positive integer`,
  );
  return value as number;
};

const asArray = (value: unknown, fieldName: string): unknown[] => {
  assert(Array.isArray(value), `${fieldName} must be an array`);
  return value as unknown[];
};

const asServer = (value: unknown, fieldName: string): ContentServer => {
  assert(
    value === "local" || value === "maincloud",
    `${fieldName} must be local or maincloud`,
  );
  return value as ContentServer;
};

export const assertSha256 = (value: string, fieldName: string): void => {
  assert(
    /^[a-f0-9]{64}$/.test(value),
    `${fieldName} must be a lowercase sha256 hex string`,
  );
};

export const assertIsoDate = (value: string, fieldName: string): void => {
  assert(
    ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value)),
    `${fieldName} must be an ISO-8601 timestamp`,
  );
};

const parseTarget = (value: unknown, fieldName: string): ContentTarget => {
  const record = asRecord(value, fieldName);
  return {
    server: asServer(record.server, `${fieldName}.server`),
    host: asNonEmptyString(record.host, `${fieldName}.host`),
    database: asNonEmptyString(record.database, `${fieldName}.database`),
  };
};

const parseReleaseEntry = (
  value: unknown,
  index: number,
): ContentReleaseEntry => {
  const fieldName = `releases[${index}]`;
  const record = asRecord(value, fieldName);

  const version = asNonEmptyString(record.version, `${fieldName}.version`);
  const checksum = asString(record.checksum, `${fieldName}.checksum`);
  assertSha256(checksum, `${fieldName}.checksum`);
  const schemaVersion = asPositiveInteger(
    record.schemaVersion,
    `${fieldName}.schemaVersion`,
  );
  const generatedAt = asString(record.generatedAt, `${fieldName}.generatedAt`);
  const publishedAt = asString(record.publishedAt, `${fieldName}.publishedAt`);
  assertIsoDate(generatedAt, `${fieldName}.generatedAt`);
  assertIsoDate(publishedAt, `${fieldName}.publishedAt`);

  return {
    version,
    checksum,
    schemaVersion,
    generatedAt,
    publishedAt,
    target: parseTarget(record.target, `${fieldName}.target`),
  };
};

const parseRollbackEntry = (
  value: unknown,
  index: number,
): ContentRollbackEntry => {
  const fieldName = `rollbacks[${index}]`;
  const record = asRecord(value, fieldName);

  const checksum = asString(record.checksum, `${fieldName}.checksum`);
  assertSha256(checksum, `${fieldName}.checksum`);
  const rolledBackAt = asString(
    record.rolledBackAt,
    `${fieldName}.rolledBackAt`,
  );
  assertIsoDate(rolledBackAt, `${fieldName}.rolledBackAt`);

  return {
    checksum,
    rolledBackAt,
    target: parseTarget(record.target, `${fieldName}.target`),
  };
};

export const computeSnapshotChecksum = (payloadJson: string): string =>
  createHash("sha256").update(payloadJson, "utf8").digest("hex");

export const readSnapshot = (): {
  checksum: string;
  schemaVersion: number;
  generatedAt: string;
  payload: Record<string, unknown>;
  payloadJson: string;
} => {
  assert(
    existsSync(snapshotPath),
    `Snapshot file is missing: ${snapshotPath}. Run 'bun run content:extract' first.`,
  );

  const parsed = JSON.parse(readFileSync(snapshotPath, "utf8")) as unknown;
  const raw = asRecord(parsed, "pilot.snapshot.json");

  const schemaVersion = asPositiveInteger(
    raw.schemaVersion,
    "pilot.snapshot.json schemaVersion",
  );
  const generatedAt = asString(
    raw.generatedAt,
    "pilot.snapshot.json generatedAt",
  );
  assertIsoDate(generatedAt, "pilot.snapshot.json generatedAt");

  const payload: Record<string, unknown> = {
    schemaVersion,
    scenarios: raw.scenarios,
    nodes: raw.nodes,
  };
  if (raw.vnRuntime !== undefined) {
    payload.vnRuntime = raw.vnRuntime;
  }
  if (raw.mindPalace !== undefined) {
    payload.mindPalace = raw.mindPalace;
  }

  const payloadJson = JSON.stringify(payload);
  const computedChecksum = computeSnapshotChecksum(payloadJson);

  if (typeof raw.checksum === "string") {
    assertSha256(raw.checksum, "pilot.snapshot.json checksum");
    assert(
      raw.checksum === computedChecksum,
      "pilot.snapshot.json checksum does not match payload content. Re-run 'bun run content:extract'.",
    );
  }

  return {
    checksum: computedChecksum,
    schemaVersion,
    generatedAt,
    payload,
    payloadJson,
  };
};

export const loadManifest = (): ContentReleaseManifest => {
  if (!existsSync(manifestPath)) {
    return {
      ...defaultManifest(),
      updatedAt: new Date().toISOString(),
    };
  }

  const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  const record = asRecord(parsed, "releases.manifest.json");

  const schemaVersion = asPositiveInteger(
    record.schemaVersion,
    "releases.manifest.json schemaVersion",
  );
  assert(schemaVersion === 1, "releases.manifest.json schemaVersion must be 1");

  const updatedAt = asString(
    record.updatedAt,
    "releases.manifest.json updatedAt",
  );
  assertIsoDate(updatedAt, "releases.manifest.json updatedAt");

  const releases = asArray(
    record.releases,
    "releases.manifest.json releases",
  ).map((entry, index) => parseReleaseEntry(entry, index));
  const rollbacks = asArray(
    record.rollbacks,
    "releases.manifest.json rollbacks",
  ).map((entry, index) => parseRollbackEntry(entry, index));

  return {
    schemaVersion: 1,
    updatedAt,
    releases,
    rollbacks,
  };
};

export const saveManifest = (manifest: ContentReleaseManifest): void => {
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
};

export const upsertRelease = (
  manifest: ContentReleaseManifest,
  entry: ContentReleaseEntry,
): ContentReleaseManifest => {
  const releases = [
    ...manifest.releases.filter((current) => current.version !== entry.version),
    entry,
  ].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  return {
    ...manifest,
    releases,
    updatedAt: new Date().toISOString(),
  };
};

export const appendRollback = (
  manifest: ContentReleaseManifest,
  entry: ContentRollbackEntry,
): ContentReleaseManifest => ({
  ...manifest,
  rollbacks: [...manifest.rollbacks, entry].sort((a, b) =>
    a.rolledBackAt.localeCompare(b.rolledBackAt),
  ),
  updatedAt: new Date().toISOString(),
});
