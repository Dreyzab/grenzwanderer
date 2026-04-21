import { readFileSync } from "node:fs";
import { resolveContentSnapshotPath } from "./content-authoring-contract";

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const loadKarlsruheSnapshot = () => {
  const snapshotPath = resolveContentSnapshotPath("karlsruhe_event");
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Record<
    string,
    any
  >;

  assert(
    typeof snapshot.schemaVersion === "number",
    "Karlsruhe snapshot is missing schemaVersion",
  );
  assert(
    Array.isArray(snapshot.scenarios),
    "Karlsruhe snapshot is missing scenarios",
  );
  assert(Array.isArray(snapshot.nodes), "Karlsruhe snapshot is missing nodes");
  assert(
    snapshot.map && Array.isArray(snapshot.map.points),
    "Karlsruhe snapshot is missing map",
  );

  return snapshot;
};

export const assertSetEquals = (
  actual: Iterable<string>,
  expected: Iterable<string>,
  label: string,
): void => {
  const actualValues = [...actual].sort();
  const expectedValues = [...expected].sort();
  assert(
    actualValues.length === expectedValues.length &&
      actualValues.every((value, index) => value === expectedValues[index]),
    `${label} mismatch.\nactual=${actualValues.join(",")}\nexpected=${expectedValues.join(",")}`,
  );
};
