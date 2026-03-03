import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  metricsSnapshotPath,
  readCurrentMapMetrics,
  type MapMetricsSnapshot,
} from "./content-map-metrics";

const metrics = readCurrentMapMetrics();
const snapshot: MapMetricsSnapshot = {
  ...metrics,
  updatedAt: new Date().toISOString(),
};

mkdirSync(path.dirname(metricsSnapshotPath), { recursive: true });
writeFileSync(
  metricsSnapshotPath,
  `${JSON.stringify(snapshot, null, 2)}\n`,
  "utf8",
);

console.log(`[content:map:metrics:update] wrote ${metricsSnapshotPath}`);
console.log(
  `[content:map:metrics:update] schemaVersion=${snapshot.schemaVersion}, points=${snapshot.points}, bindings=${snapshot.bindings}, conditionDriven=${snapshot.conditionDrivenBindings}, richPoints=${snapshot.richPoints}`,
);
