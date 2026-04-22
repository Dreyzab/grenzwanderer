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

type SnapshotEffect = {
  type: string;
  key?: string;
  value?: boolean | number;
  groupId?: string;
};

type SnapshotChoice = {
  id: string;
  nextNodeId: string;
};

type SnapshotNode = {
  id: string;
  choices: SnapshotChoice[];
  onEnter?: SnapshotEffect[];
  terminal?: boolean;
};

type SnapshotPayload = {
  vnRuntime?: { defaultEntryScenarioId?: string };
  scenarios: Array<{ id: string }>;
  nodes: SnapshotNode[];
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
  (effects ?? []).some((effect) =>
    Object.entries(expected).every(
      ([key, value]) => effect[key as keyof SnapshotEffect] === value,
    ),
  );

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

  const beat1Node = findNode(snapshot, "scene_case01_beat1_atmosphere");
  const newsboyNode = findNode(snapshot, "scene_case01_hbf_newsboy");
  const luggageNode = findNode(snapshot, "scene_case01_hbf_luggage");
  const policeNode = findNode(snapshot, "scene_case01_hbf_police");

  assert(
    beat1Node.choices.some(
      (choice) =>
        choice.id === "CASE01_BEAT1_NEWSBOY" &&
        choice.nextNodeId === "scene_case01_hbf_newsboy",
    ),
    "scene_case01_beat1_atmosphere must still route to the newsboy branch",
  );
  assert(
    beat1Node.choices.some(
      (choice) =>
        choice.id === "CASE01_BEAT1_LUGGAGE" &&
        choice.nextNodeId === "scene_case01_hbf_luggage",
    ),
    "scene_case01_beat1_atmosphere must still route to the luggage branch",
  );
  assert(
    beat1Node.choices.some(
      (choice) =>
        choice.id === "CASE01_BEAT1_POLICE" &&
        choice.nextNodeId === "scene_case01_hbf_police",
    ),
    "scene_case01_beat1_atmosphere must still route to the police branch",
  );

  for (const [branchLabel, node] of [
    ["newsboy", newsboyNode],
    ["luggage", luggageNode],
    ["police", policeNode],
  ] as const) {
    assert(node.terminal === true, `${branchLabel} branch must end on the map`);
    assert(
      hasEffect(node.onEnter, {
        type: "set_flag",
        key: "case01_onboarding_complete",
        value: true,
      }),
      `${branchLabel} branch must complete onboarding`,
    );
    assert(
      hasEffect(node.onEnter, {
        type: "unlock_group",
        groupId: "loc_freiburg_bank",
      }),
      `${branchLabel} branch must unlock loc_freiburg_bank for map travel`,
    );
    assert(
      hasEffect(node.onEnter, {
        type: "unlock_group",
        groupId: "loc_rathaus",
      }),
      `${branchLabel} branch must unlock loc_rathaus for map travel`,
    );
  }

  assert(
    hasEffect(newsboyNode.onEnter, {
      type: "set_flag",
      key: "priority_bank_first",
      value: true,
    }),
    "newsboy branch must prioritize the bank route",
  );
  assert(
    hasEffect(luggageNode.onEnter, {
      type: "set_flag",
      key: "priority_bank_first",
      value: true,
    }),
    "luggage branch must prioritize the bank route",
  );
  assert(
    hasEffect(policeNode.onEnter, {
      type: "set_flag",
      key: "priority_mayor_first",
      value: true,
    }),
    "police branch must prioritize the Rathaus route",
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
