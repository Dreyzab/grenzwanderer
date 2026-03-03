import {
  type MapMetrics,
  readCurrentMapMetrics,
  readMapMetricsSnapshot,
} from "./content-map-metrics";

const compareMetrics = (
  current: MapMetrics,
  expected: MapMetrics,
): string[] => {
  const errors: string[] = [];
  if (current.schemaVersion !== expected.schemaVersion) {
    errors.push(
      `schemaVersion mismatch: expected ${expected.schemaVersion}, got ${current.schemaVersion}`,
    );
  }
  if (current.points !== expected.points) {
    errors.push(
      `points mismatch: expected ${expected.points}, got ${current.points}`,
    );
  }
  if (current.bindings !== expected.bindings) {
    errors.push(
      `bindings mismatch: expected ${expected.bindings}, got ${current.bindings}`,
    );
  }
  if (current.conditionDrivenBindings !== expected.conditionDrivenBindings) {
    errors.push(
      `conditionDrivenBindings mismatch: expected ${expected.conditionDrivenBindings}, got ${current.conditionDrivenBindings}`,
    );
  }
  if (current.richPoints !== expected.richPoints) {
    errors.push(
      `richPoints mismatch: expected ${expected.richPoints}, got ${current.richPoints}`,
    );
  }
  return errors;
};

const current = readCurrentMapMetrics();
const expected = readMapMetricsSnapshot();
const errors = compareMetrics(current, expected);

console.log(
  `[content:map:metrics] current schemaVersion=${current.schemaVersion}, points=${current.points}, bindings=${current.bindings}, conditionDriven=${current.conditionDrivenBindings}, richPoints=${current.richPoints}`,
);

if (errors.length > 0) {
  console.error("[content:map:metrics] metric snapshot mismatch:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error(
    "Run 'bun run content:map:metrics:update' and commit map-metrics.snapshot.json if changes are intentional.",
  );
  process.exitCode = 1;
}
