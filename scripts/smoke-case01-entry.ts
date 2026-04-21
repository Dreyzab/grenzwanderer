import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_SCENARIO_IDS,
} from "../src/shared/case01Canon";
import { resolveLegacyScenarioId } from "../src/features/map/data/scenario-mapping";

type SnapshotPoint = {
  id: string;
  bindings?: Array<{
    actions?: Array<{ type: string; scenarioId?: string }>;
  }>;
};

type SnapshotPayload = {
  vnRuntime?: { defaultEntryScenarioId?: string };
  scenarios: Array<{ id: string }>;
  map?: { points: SnapshotPoint[]; regions: Array<{ id: string }> };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const readSnapshot = (): SnapshotPayload =>
  JSON.parse(readFileSync(snapshotPath, "utf8")) as SnapshotPayload;

const findPoint = (
  snapshot: SnapshotPayload,
  pointId: string,
): SnapshotPoint => {
  const point = snapshot.map?.points.find((entry) => entry.id === pointId);
  if (!point) {
    throw new Error(`Missing map point '${pointId}' in extracted snapshot`);
  }
  return point;
};

const hasScenarioBinding = (
  point: SnapshotPoint,
  scenarioId: string,
): boolean =>
  (point.bindings ?? []).some((binding) =>
    (binding.actions ?? []).some(
      (action) =>
        action.type === "start_scenario" && action.scenarioId === scenarioId,
    ),
  );

try {
  const snapshot = readSnapshot();
  const scenarioIds = new Set(
    snapshot.scenarios.map((scenario) => scenario.id),
  );

  assert(
    snapshot.vnRuntime?.defaultEntryScenarioId ===
      CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    `Expected defaultEntryScenarioId=${CASE01_DEFAULT_ENTRY_SCENARIO_ID}, got ${snapshot.vnRuntime?.defaultEntryScenarioId ?? "missing"}`,
  );

  for (const scenarioId of [
    CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    CASE01_SCENARIO_IDS.mayorBriefing,
    CASE01_SCENARIO_IDS.bankInvestigation,
    CASE01_SCENARIO_IDS.convergence,
  ]) {
    assert(scenarioIds.has(scenarioId), `Missing scenario '${scenarioId}'`);
  }

  assert(
    snapshot.map?.regions.every((region) => region.id === "FREIBURG_1905") ??
      false,
    "Case01 entry smoke expects Freiburg-only supported runtime regions",
  );

  const hbfPoint = findPoint(snapshot, "loc_hbf");
  const bankPoint = findPoint(snapshot, "loc_freiburg_bank");
  const rathausPoint = findPoint(snapshot, "loc_rathaus");

  assert(
    hasScenarioBinding(hbfPoint, CASE01_DEFAULT_ENTRY_SCENARIO_ID),
    "loc_hbf must start the canonical Case01 entry scenario",
  );
  assert(
    hasScenarioBinding(bankPoint, CASE01_SCENARIO_IDS.bankInvestigation),
    "loc_freiburg_bank must start the canonical bank investigation scenario",
  );
  assert(
    hasScenarioBinding(rathausPoint, CASE01_SCENARIO_IDS.mayorBriefing),
    "loc_rathaus must start the mayor briefing scenario",
  );

  for (const legacyId of [
    "detective_case1_hbf_arrival",
    "detective_case1_bank_scene",
    "detective_case1_alt_briefing",
    "lead_tailor",
    "lead_apothecary",
    "lead_pub",
    "case1_finale",
  ]) {
    const mapped = resolveLegacyScenarioId(legacyId);
    assert(
      mapped !== "sandbox_case01_pilot",
      `Legacy scenario '${legacyId}' still resolves to sandbox_case01_pilot`,
    );
  }

  console.log("Case01 entry smoke script passed.");
} catch (error) {
  console.error("Case01 entry smoke script failed:", error);
  process.exitCode = 1;
}
