import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface MapMetrics {
  schemaVersion: number;
  points: number;
  bindings: number;
  conditionDrivenBindings: number;
  richPoints: number;
}

export interface MapMetricsSnapshot extends MapMetrics {
  updatedAt: string;
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

export const metricsSnapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "map-metrics.snapshot.json",
);

export const computeMapMetrics = (payload: {
  schemaVersion?: unknown;
  map?: {
    points?: Array<{
      bindings?: Array<{ conditions?: unknown[] }>;
    }>;
  };
}): MapMetrics => {
  if (typeof payload.schemaVersion !== "number") {
    throw new Error("pilot.snapshot.json schemaVersion must be a number");
  }

  const points = payload.map?.points ?? [];
  const bindings = points.reduce(
    (total, point) => total + (point.bindings?.length ?? 0),
    0,
  );
  const conditionDrivenBindings = points.reduce(
    (total, point) =>
      total +
      (point.bindings ?? []).filter(
        (binding) =>
          Array.isArray(binding.conditions) && binding.conditions.length > 0,
      ).length,
    0,
  );
  const richPoints = points.filter(
    (point) => (point.bindings?.length ?? 0) > 2,
  ).length;

  return {
    schemaVersion: payload.schemaVersion,
    points: points.length,
    bindings,
    conditionDrivenBindings,
    richPoints,
  };
};

export const readCurrentMapMetrics = (): MapMetrics => {
  const raw = readFileSync(snapshotPath, "utf8");
  const parsed = JSON.parse(raw) as {
    schemaVersion?: unknown;
    map?: {
      points?: Array<{
        bindings?: Array<{ conditions?: unknown[] }>;
      }>;
    };
  };
  return computeMapMetrics(parsed);
};

export const readMapMetricsSnapshot = (): MapMetricsSnapshot => {
  const raw = readFileSync(metricsSnapshotPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<MapMetricsSnapshot>;

  if (
    typeof parsed.schemaVersion !== "number" ||
    typeof parsed.points !== "number" ||
    typeof parsed.bindings !== "number" ||
    typeof parsed.conditionDrivenBindings !== "number" ||
    typeof parsed.richPoints !== "number" ||
    typeof parsed.updatedAt !== "string"
  ) {
    throw new Error(
      "map-metrics.snapshot.json has invalid shape. Run 'bun run content:map:metrics:update'.",
    );
  }

  return {
    schemaVersion: parsed.schemaVersion,
    points: parsed.points,
    bindings: parsed.bindings,
    conditionDrivenBindings: parsed.conditionDrivenBindings,
    richPoints: parsed.richPoints,
    updatedAt: parsed.updatedAt,
  };
};
