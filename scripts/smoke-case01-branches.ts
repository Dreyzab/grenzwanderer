import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASE01_FINAL_OUTCOME_COMPROMISED,
  CASE01_FINAL_OUTCOME_LAWFUL,
  CASE01_ROUTE_VALUE_COVERT,
  CASE01_ROUTE_VALUE_OFFICIAL,
  CASE01_SCENARIO_IDS,
} from "../src/shared/case01Canon";

type SnapshotEffect = {
  type: string;
  key?: string;
  value?: boolean | number;
  characterId?: string;
  delta?: number;
  groupId?: string;
};

type SnapshotCondition = {
  type: string;
  key?: string;
  value?: number;
};

type SnapshotChoice = {
  id: string;
  nextNodeId: string;
  effects?: SnapshotEffect[];
  visibleIfAll?: SnapshotCondition[];
};

type SnapshotNode = {
  id: string;
  scenarioId: string;
  sourcePath?: string;
  choices: SnapshotChoice[];
  onEnter?: SnapshotEffect[];
};

type SnapshotPayload = {
  scenarios: Array<{ id: string }>;
  nodes: SnapshotNode[];
};

type MigrationDiagnostic = {
  providerName?: string;
  scenarioId?: string;
  nodeId?: string;
};

type MigrationReport = {
  diagnostics?: MigrationDiagnostic[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(repoRoot, "content", "vn", "pilot.snapshot.json");
const migrationReportPath = path.join(
  repoRoot,
  "tmp",
  "vn-obsidian-migration-report.json",
);
const authoredRuntimePrefix = "40_GameViewer/Case01/_runtime/";

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const readSnapshot = (): SnapshotPayload =>
  JSON.parse(readFileSync(snapshotPath, "utf8")) as SnapshotPayload;

const readMigrationReport = (): MigrationReport =>
  JSON.parse(readFileSync(migrationReportPath, "utf8")) as MigrationReport;

const getScenarioNodes = (
  snapshot: SnapshotPayload,
  scenarioId: string,
): SnapshotNode[] => snapshot.nodes.filter((node) => node.scenarioId === scenarioId);

const findNode = (snapshot: SnapshotPayload, nodeId: string): SnapshotNode => {
  const node = snapshot.nodes.find((entry) => entry.id === nodeId);
  if (!node) {
    throw new Error(`Missing node '${nodeId}' in extracted snapshot`);
  }
  return node;
};

const hasEffect = (
  effects: SnapshotEffect[] | undefined,
  expected: Partial<SnapshotEffect>,
): boolean =>
  (effects ?? []).some(
    (effect) =>
      Object.entries(expected).every(
        ([key, value]) =>
          effect[key as keyof SnapshotEffect] === value,
      ),
  );

const hasVisibleRoute = (
  choice: SnapshotChoice | undefined,
  routeValue: number,
): boolean =>
  (choice?.visibleIfAll ?? []).some(
    (condition) =>
      condition.type === "var_gte" &&
      condition.key === "convergence_route" &&
      condition.value === routeValue,
  ) &&
  (choice?.visibleIfAll ?? []).some(
    (condition) =>
      condition.type === "var_lte" &&
      condition.key === "convergence_route" &&
      condition.value === routeValue,
  );

try {
  const snapshot = readSnapshot();
  const migrationReport = readMigrationReport();
  const obsidianRuntimeNodeIds = new Set(
    (migrationReport.diagnostics ?? [])
      .filter((diagnostic) => diagnostic.providerName === "obsidian-runtime")
      .map((diagnostic) => diagnostic.nodeId)
      .filter((nodeId): nodeId is string => typeof nodeId === "string"),
  );

  for (const scenarioId of [
    CASE01_SCENARIO_IDS.mayorBriefing,
    CASE01_SCENARIO_IDS.leadTailor,
    CASE01_SCENARIO_IDS.leadApothecary,
    CASE01_SCENARIO_IDS.leadPub,
    CASE01_SCENARIO_IDS.estateBranch,
    CASE01_SCENARIO_IDS.lotteInterlude,
    CASE01_SCENARIO_IDS.convergence,
    CASE01_SCENARIO_IDS.warehouseFinale,
  ]) {
    assert(
      snapshot.scenarios.some((scenario) => scenario.id === scenarioId),
      `Missing scenario '${scenarioId}'`,
    );
    const nodes = getScenarioNodes(snapshot, scenarioId);
    assert(nodes.length > 0, `Scenario '${scenarioId}' emitted zero nodes`);
    assert(
      nodes.every(
        (node) =>
          (typeof node.sourcePath === "string" &&
            node.sourcePath.startsWith(authoredRuntimePrefix)) ||
          obsidianRuntimeNodeIds.has(node.id),
      ),
      `Scenario '${scenarioId}' must be emitted from authoritative Obsidian runtime files`,
    );
  }

  assert(
    hasEffect(findNode(snapshot, "scene_case01_mayor_exit").onEnter, {
      type: "set_flag",
      key: "mayor_briefing_complete",
      value: true,
    }),
    "Mayor branch must set mayor_briefing_complete",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_tailor_exit").onEnter, {
      type: "set_flag",
      key: "tailor_lead_complete",
      value: true,
    }),
    "Tailor branch must set tailor_lead_complete",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_apothecary_exit").onEnter, {
      type: "set_flag",
      key: "apothecary_lead_complete",
      value: true,
    }),
    "Apothecary branch must set apothecary_lead_complete",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_pub_exit").onEnter, {
      type: "set_flag",
      key: "pub_lead_complete",
      value: true,
    }),
    "Pub branch must set pub_lead_complete",
  );
  assert(
    hasEffect(
      findNode(snapshot, "scene_case01_estate_entry").choices[0]?.effects,
      {
        type: "set_flag",
        key: "bureau_trace_found",
        value: true,
      },
    ),
    "Estate branch must reveal bureau_trace_found before the finale",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_estate_exit").onEnter, {
      type: "set_flag",
      key: "estate_branch_complete",
      value: true,
    }),
    "Estate branch must set estate_branch_complete",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_lotte_trust").onEnter, {
      type: "change_relationship",
      characterId: "npc_weber_dispatcher",
      delta: 1,
    }),
    "Lotte trust branch must reward the dispatcher relationship",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_lotte_distance").onEnter, {
      type: "change_relationship",
      characterId: "npc_weber_dispatcher",
      delta: -1,
    }),
    "Lotte distance branch must penalize the dispatcher relationship",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_convergence_official").onEnter, {
      type: "set_var",
      key: "convergence_route",
      value: CASE01_ROUTE_VALUE_OFFICIAL,
    }),
    "Official convergence branch must set convergence_route=1",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_convergence_covert").onEnter, {
      type: "set_var",
      key: "convergence_route",
      value: CASE01_ROUTE_VALUE_COVERT,
    }),
    "Covert convergence branch must set convergence_route=2",
  );

  const warehouseEntry = findNode(snapshot, "scene_case01_warehouse_entry");
  const lawfulChoice = warehouseEntry.choices.find(
    (choice) => choice.id === "CASE01_WAREHOUSE_LAWFUL",
  );
  const compromisedChoice = warehouseEntry.choices.find(
    (choice) => choice.id === "CASE01_WAREHOUSE_COMPROMISE",
  );

  assert(
    hasVisibleRoute(lawfulChoice, CASE01_ROUTE_VALUE_OFFICIAL),
    "Warehouse lawful choice must be gated by the official route value",
  );
  assert(
    hasVisibleRoute(compromisedChoice, CASE01_ROUTE_VALUE_COVERT),
    "Warehouse compromised choice must be gated by the covert route value",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_warehouse_lawful").onEnter, {
      type: "set_var",
      key: "case01_final_outcome",
      value: CASE01_FINAL_OUTCOME_LAWFUL,
    }),
    "Lawful finale must set case01_final_outcome=1",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_warehouse_compromised").onEnter, {
      type: "set_var",
      key: "case01_final_outcome",
      value: CASE01_FINAL_OUTCOME_COMPROMISED,
    }),
    "Compromised finale must set case01_final_outcome=2",
  );

  console.log("Case01 branch smoke script passed.");
} catch (error) {
  console.error("Case01 branch smoke script failed:", error);
  process.exitCode = 1;
}
