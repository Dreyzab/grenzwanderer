import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASE01_DINING_FLAGS,
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
  amount?: number;
};

type SnapshotCondition = {
  type: string;
  key?: string;
  value?: boolean | number;
  condition?: SnapshotCondition;
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
const snapshotPath = path.join(
  repoRoot,
  "content",
  "vn",
  "pilot.snapshot.json",
);
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
): SnapshotNode[] =>
  snapshot.nodes.filter((node) => node.scenarioId === scenarioId);

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

  const authoritativeRuntimeScenarios = [
    CASE01_SCENARIO_IDS.mayorBriefing,
    CASE01_SCENARIO_IDS.leadTailor,
    CASE01_SCENARIO_IDS.leadApothecary,
    CASE01_SCENARIO_IDS.leadPub,
    CASE01_SCENARIO_IDS.estateBranch,
    CASE01_SCENARIO_IDS.lotteInterlude,
    CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    CASE01_SCENARIO_IDS.convergence,
    CASE01_SCENARIO_IDS.warehouseFinale,
  ];
  const authoritativeRuntimeScenarioSet = new Set<string>(
    authoritativeRuntimeScenarios,
  );
  const newFalseTrailScenarios = [
    CASE01_SCENARIO_IDS.falseTrailWorkers,
    CASE01_SCENARIO_IDS.falseTrailPostRoute,
    CASE01_SCENARIO_IDS.falseTrailGrimoire,
    CASE01_SCENARIO_IDS.falseTrailConvergence,
  ];

  for (const scenarioId of [
    ...authoritativeRuntimeScenarios,
    ...newFalseTrailScenarios,
  ]) {
    assert(
      snapshot.scenarios.some((scenario) => scenario.id === scenarioId),
      `Missing scenario '${scenarioId}'`,
    );
    const nodes = getScenarioNodes(snapshot, scenarioId);
    assert(nodes.length > 0, `Scenario '${scenarioId}' emitted zero nodes`);
    if (authoritativeRuntimeScenarioSet.has(scenarioId)) {
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
  }

  assert(
    findNode(snapshot, "scene_case01_mayor_entry").choices.some(
      (choice) =>
        choice.id === "CASE01_MAYOR_INDEPENDENT_FOOTING" &&
        choice.nextNodeId === "scene_case01_mayor_independent_footing" &&
        (choice.visibleIfAll ?? []).some(
          (condition) =>
            condition.type === "flag_equals" &&
            condition.key === CASE01_DINING_FLAGS.declinedEleonoraHospitality &&
            condition.value === true,
        ),
    ),
    "Mayor entry must expose an official-footing callback for declined Eleonora hospitality",
  );
  assert(
    findNode(snapshot, "scene_case01_mayor_independent_footing").choices.some(
      (choice) => choice.nextNodeId === "scene_case01_mayor_dossier",
    ),
    "Mayor declined-hospitality callback must route back to the normal dossier branch",
  );
  assert(
    findNode(snapshot, "scene_case01_mayor_dossier").choices.some(
      (choice) =>
        choice.id === "CASE01_MAYOR_FELIX_ASIDE" &&
        choice.nextNodeId === "scene_case01_mayor_felix_aside" &&
        (choice.visibleIfAll ?? []).some(
          (condition) =>
            condition.type === "flag_equals" &&
            condition.key === CASE01_DINING_FLAGS.defendedFelix &&
            condition.value === true,
        ),
    ),
    "Mayor dossier must expose a Felix official-cover aside after defending Felix",
  );
  assert(
    findNode(snapshot, "scene_case01_mayor_felix_aside").choices.some(
      (choice) =>
        choice.nextNodeId === "scene_case01_mayor_exit" &&
        hasEffect(choice.effects, {
          type: "set_flag",
          key: "met_mayor_first",
          value: true,
        }) &&
        hasEffect(choice.effects, {
          type: "change_relationship",
          characterId: "victoria_sterling",
          delta: 1,
        }),
    ),
    "Felix official-cover aside must preserve the normal mayor exit effects",
  );
  const mayorDossierChoices = findNode(
    snapshot,
    "scene_case01_mayor_dossier",
  ).choices;
  assert(
    mayorDossierChoices.some(
      (choice) =>
        choice.id === "CASE01_MAYOR_RESPECT_VICTORIA" &&
        choice.nextNodeId === "scene_case01_mayor_exit" &&
        hasEffect(choice.effects, {
          type: "set_flag",
          key: "victoria_respected",
          value: true,
        }) &&
        hasEffect(choice.effects, {
          type: "set_var",
          key: "official_writ_strength",
          value: 2,
        }) &&
        hasEffect(choice.effects, {
          type: "change_relationship",
          characterId: "victoria_sterling",
          delta: 1,
        }),
    ),
    "Mayor dossier must reward respecting Victoria's forensic authority",
  );
  assert(
    mayorDossierChoices.some(
      (choice) =>
        choice.id === "CASE01_MAYOR_PATRONIZE_VICTORIA" &&
        choice.nextNodeId === "scene_case01_mayor_exit" &&
        hasEffect(choice.effects, {
          type: "set_var",
          key: "official_writ_strength",
          value: 1,
        }) &&
        hasEffect(choice.effects, {
          type: "change_relationship",
          characterId: "victoria_sterling",
          delta: -1,
        }),
    ),
    "Mayor dossier must penalize patronizing Victoria",
  );
  assert(
    mayorDossierChoices.some(
      (choice) =>
        choice.id === "CASE01_MAYOR_PRESS_WITH_VICTORIA" &&
        choice.nextNodeId === "scene_case01_mayor_exit" &&
        hasEffect(choice.effects, {
          type: "set_var",
          key: "official_writ_strength",
          value: 2,
        }) &&
        hasEffect(choice.effects, {
          type: "add_tension",
          amount: 1,
        }),
    ),
    "Mayor dossier must let Victoria's evidence strengthen the writ at a political cost",
  );
  assert(
    findNode(snapshot, "scene_case01_bank_arrival").choices.some(
      (choice) =>
        choice.id === "CASE01_BANK_WITH_VICTORIA" &&
        choice.nextNodeId === "scene_case01_bank_manager" &&
        hasEffect(choice.effects, {
          type: "set_flag",
          key: "victoria_seen_in_bank",
          value: true,
        }) &&
        hasEffect(choice.effects, {
          type: "change_relationship",
          characterId: "victoria_sterling",
          delta: 1,
        }),
    ),
    "Bank arrival must preserve a with-Victoria branch distinct from solo entry",
  );
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
    hasEffect(findNode(snapshot, "scene_case01_workers_exit").onEnter, {
      type: "set_flag",
      key: "false_trail_workers_complete",
      value: true,
    }),
    "Workers false trail must mark the worker branch complete",
  );
  assert(
    findNode(snapshot, "scene_case01_workers_rudi").choices.some((choice) =>
      hasEffect(choice.effects, {
        type: "set_flag",
        key: "false_trail_workers_refuted",
        value: true,
      }),
    ),
    "Workers false trail must let the player refute worker culpability",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_post_route_exit").onEnter, {
      type: "set_flag",
      key: "false_trail_post_route_complete",
      value: true,
    }),
    "Postal false trail must mark the route branch complete",
  );
  assert(
    findNode(snapshot, "scene_case01_post_route_weber").choices.some((choice) =>
      hasEffect(choice.effects, {
        type: "set_flag",
        key: "false_trail_post_route_refuted",
        value: true,
      }),
    ),
    "Postal false trail must let the player refute Weber as the mastermind",
  );
  assert(
    hasEffect(findNode(snapshot, "scene_case01_grimoire_exit").onEnter, {
      type: "set_flag",
      key: "false_trail_grimoire_complete",
      value: true,
    }),
    "Grimoire false trail must mark the restorer branch complete",
  );
  assert(
    findNode(snapshot, "scene_case01_grimoire_roth").choices.some((choice) =>
      hasEffect(choice.effects, {
        type: "set_flag",
        key: "false_trail_grimoire_refuted",
        value: true,
      }),
    ),
    "Grimoire false trail must let the player refute Roth as the mastermind",
  );
  assert(
    hasEffect(
      findNode(snapshot, "scene_case01_false_trail_convergence_exit").onEnter,
      {
        type: "unlock_group",
        groupId: "loc_freiburg_warehouse",
      },
    ),
    "False-trail convergence must unlock the warehouse route",
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
    findNode(snapshot, "scene_case01_lotte_warning").choices.some(
      (choice) =>
        choice.id === "CASE01_LOTTE_CONFRONT_SCHEDULE" &&
        choice.nextNodeId === "scene_case01_lotte_schedule_opening" &&
        (choice.visibleIfAll ?? []).some(
          (condition) =>
            condition.type === "flag_equals" &&
            condition.key === CASE01_DINING_FLAGS.noticedLotteSchedule &&
            condition.value === true,
        ),
    ),
    "Lotte warning must expose a noticed-schedule confrontation without bypassing the interlude",
  );
  assert(
    findNode(snapshot, "scene_case01_lotte_warning").choices.some(
      (choice) =>
        choice.id === "CASE01_LOTTE_LISTENER_OPENING" &&
        choice.nextNodeId === "scene_case01_lotte_listener_opening" &&
        (choice.visibleIfAll ?? []).some(
          (condition) =>
            condition.type === "flag_equals" &&
            condition.key === CASE01_DINING_FLAGS.silentObservation &&
            condition.value === true,
        ) &&
        (choice.visibleIfAll ?? []).some(
          (condition) =>
            condition.type === "logic_not" &&
            condition.condition?.type === "flag_equals" &&
            condition.condition.key ===
              CASE01_DINING_FLAGS.noticedLotteSchedule &&
            condition.condition.value === true,
        ),
    ),
    "Lotte warning must expose a listener callback for silent observation while yielding to schedule confrontation",
  );
  const lotteListenerOpening = findNode(
    snapshot,
    "scene_case01_lotte_listener_opening",
  );
  assert(
    lotteListenerOpening.choices.some(
      (choice) => choice.nextNodeId === "scene_case01_lotte_trust",
    ) &&
      lotteListenerOpening.choices.some(
        (choice) => choice.nextNodeId === "scene_case01_lotte_distance",
      ),
    "Lotte listener callback must still route into trust and distance outcomes",
  );
  const lotteScheduleOpening = findNode(
    snapshot,
    "scene_case01_lotte_schedule_opening",
  );
  assert(
    lotteScheduleOpening.choices.some(
      (choice) => choice.nextNodeId === "scene_case01_lotte_trust",
    ) &&
      lotteScheduleOpening.choices.some(
        (choice) => choice.nextNodeId === "scene_case01_lotte_distance",
      ),
    "Lotte schedule callback must still route into trust and distance outcomes",
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
    findNode(snapshot, "scene_case01_zum_goldenen_adler_entry").choices.some(
      (choice) =>
        choice.id === "CASE01_zum_goldenen_adler_LOTTE_ROUTE" &&
        choice.nextNodeId === "scene_case01_zum_goldenen_adler_lotte_route" &&
        (choice.visibleIfAll ?? []).some(
          (condition) =>
            condition.type === "flag_equals" &&
            condition.key === CASE01_DINING_FLAGS.askedLodgingRoute &&
            condition.value === true,
        ),
    ),
    "Zum Eber must spend the lodging-route flag on a visible Lotte-informed callback",
  );
  assert(
    findNode(
      snapshot,
      "scene_case01_zum_goldenen_adler_lotte_route",
    ).choices.some(
      (choice) =>
        choice.id === "CASE01_zum_goldenen_adler_ROUTE_SETTLE" &&
        choice.nextNodeId === "scene_case01_zum_goldenen_adler_settle",
    ),
    "Zum Eber lodging callback must route back to the normal settle node",
  );
  assert(
    findNode(snapshot, "scene_case01_zum_goldenen_adler_settle").choices
      .length === 0,
    "Zum Eber settle node must stay terminal and avoid adding inventory systems",
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
  const officialTraceChoice = warehouseEntry.choices.find(
    (choice) => choice.id === "CASE01_WAREHOUSE_TRACE_SAPPER_OFFICIAL",
  );
  const covertTraceChoice = warehouseEntry.choices.find(
    (choice) => choice.id === "CASE01_WAREHOUSE_TRACE_SAPPER_COVERT",
  );

  assert(
    hasVisibleRoute(officialTraceChoice, CASE01_ROUTE_VALUE_OFFICIAL),
    "Warehouse official trace choice must be gated by the official route value",
  );
  assert(
    hasVisibleRoute(covertTraceChoice, CASE01_ROUTE_VALUE_COVERT),
    "Warehouse covert trace choice must be gated by the covert route value",
  );
  assert(
    officialTraceChoice?.nextNodeId === "scene_case01_sapper_flashback",
    "Official warehouse trace must lead into the sapper flashback",
  );
  assert(
    covertTraceChoice?.nextNodeId === "scene_case01_sapper_flashback",
    "Covert warehouse trace must lead into the sapper flashback",
  );

  const warehouseSapper = findNode(snapshot, "scene_case01_warehouse_sapper");
  const lawfulChoice = warehouseSapper.choices.find(
    (choice) => choice.id === "CASE01_WAREHOUSE_SAPPER_LAWFUL",
  );
  const compromisedChoice = warehouseSapper.choices.find(
    (choice) => choice.id === "CASE01_WAREHOUSE_SAPPER_NEGOTIATE",
  );

  assert(
    hasVisibleRoute(lawfulChoice, CASE01_ROUTE_VALUE_OFFICIAL),
    "Warehouse sapper lawful choice must be gated by the official route value",
  );
  assert(
    hasVisibleRoute(compromisedChoice, CASE01_ROUTE_VALUE_COVERT),
    "Warehouse sapper compromised choice must be gated by the covert route value",
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
    hasEffect(
      findNode(snapshot, "scene_case01_warehouse_compromised").onEnter,
      {
        type: "set_var",
        key: "case01_final_outcome",
        value: CASE01_FINAL_OUTCOME_COMPROMISED,
      },
    ),
    "Compromised finale must set case01_final_outcome=2",
  );

  console.log("Case01 branch smoke script passed.");
} catch (error) {
  console.error("Case01 branch smoke script failed:", error);
  process.exitCode = 1;
}
