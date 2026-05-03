import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  isAllowedFactionId,
  isCanonicalFactionId,
  isFactionDefinition,
} from "../data/factionContract";
import type {
  MindCaseContent,
  MindFactContent,
  MindHypothesisContent,
  MapAction,
  MapCondition,
  MapSnapshot,
  VnChoice,
  VnDiceMode,
  VnCondition,
  VnEffect,
  QuestCatalogEntry,
  SocialCatalogSnapshot,
  VnNode,
  VnScenario,
  VnSkillCheck,
  VnSnapshot,
} from "../src/shared/vn-contract";
import {
  createVnContractMetadata,
  CURRENT_VN_SNAPSHOT_SCHEMA_VERSION,
} from "../src/shared/vn-contract";
import {
  normalizeContentReleaseProfile,
  repoRoot,
  resolveContentSnapshotPath,
  resolvePublicContentSnapshotPath,
  storyRoot,
  validateStoryRoot,
} from "./content-authoring-contract";
import { CONTENT_IDS } from "./content-ids";
import {
  CONDITION_OPERATORS,
  EFFECT_OPERATORS,
  FLAG_KEYS,
  INNER_VOICE_IDS,
  PSYCHE_VAR_KEYS,
  SKILL_VOICE_IDS,
  SPEAKER_IDS,
  VAR_KEYS,
  suggestClosest,
} from "./content-vocabulary";
import { buildCase01MapSnapshot } from "./data/case_01_points";
import { buildKarlsruheEventMapSnapshot } from "./data/karlsruhe_event_points";
import {
  AGENCY_SERVICE_CRITERION_IDS,
  FREIBURG_SOCIAL_CATALOG,
  FREIBURG_SOCIAL_CAREER_RANK_IDS,
  FREIBURG_SOCIAL_NPC_IDS,
  FREIBURG_SOCIAL_RUMOR_IDS,
} from "./data/freiburg_social_catalog";
import {
  CASE01_CANON_NODES,
  CASE01_CANON_SCENARIOS,
} from "./data/case01_canon_runtime";
import { LEGACY_TS_NODES } from "./data/vn-packs/legacy-ts-nodes";
import { LEGACY_TS_SCENARIOS } from "./data/vn-packs/legacy-ts-scenarios";
import {
  KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
  KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
} from "./data/vn-packs/vn-pack-constants";
import { CASE01_DEFAULT_ENTRY_SCENARIO_ID } from "../src/shared/case01Canon";
import { parseCase01Onboarding } from "./vn-case01-onboarding";
import { loadObsidianScenarioBundles } from "./vn-obsidian-parser";
import { loadVnSourceShardBlueprints } from "./vn-source-shards";
import type {
  BlueprintDiagnostic,
  ChoiceBlueprint,
  NodeBlueprint,
  ScenarioBlueprint,
  ScenarioBlueprintBundle,
  ScenarioBlueprintProviderResult,
} from "./vn-blueprint-types";

const narrativeLocale = process.env.VN_NARRATIVE_LOCALE ?? "en";
const releaseProfile = normalizeContentReleaseProfile(
  (() => {
    const profileIndex = process.argv.indexOf("--profile");
    if (profileIndex >= 0 && profileIndex + 1 < process.argv.length) {
      return process.argv[profileIndex + 1];
    }
    return (
      process.env.CONTENT_RELEASE_PROFILE ?? process.env.VITE_RELEASE_PROFILE
    );
  })(),
);
const isKarlsruheEventRelease = releaseProfile === "karlsruhe_event";
const outputPath = resolveContentSnapshotPath(releaseProfile);
const publicOutputPath = resolvePublicContentSnapshotPath(releaseProfile);
const migrationReportPath = path.join(
  repoRoot,
  "tmp",
  "vn-obsidian-migration-report.json",
);
const generatedStaticMapPointsPath = path.join(
  repoRoot,
  "src",
  "features",
  "map",
  "data",
  "generated-static-points.ts",
);
const defaultSkillCheckDice: VnDiceMode = "d20";
const defaultEntryScenarioId = isKarlsruheEventRelease
  ? KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID
  : CASE01_DEFAULT_ENTRY_SCENARIO_ID;
const AUTO_CONTINUE_PREFIX = "AUTO_CONTINUE_";
const SOCIAL_VERIFICATION_KINDS = new Set([
  "evidence",
  "fact",
  "service_unlock",
  "map_unlock",
]);
const RUMOR_TEMPLATE_BY_ID = new Map(
  FREIBURG_SOCIAL_CATALOG.rumors.map((entry) => [entry.id, entry]),
);

validateStoryRoot(storyRoot);

const scenarios: ScenarioBlueprint[] = [
  ...LEGACY_TS_SCENARIOS,
  ...CASE01_CANON_SCENARIOS,
];
const nodes: NodeBlueprint[] = [...CASE01_CANON_NODES, ...LEGACY_TS_NODES];

const normalizeBundle = (
  bundle: ScenarioBlueprintBundle,
): ScenarioBlueprintBundle => ({
  ...bundle,
  nodes: bundle.nodes.map(normalizeNodeAutoContinue),
});

const buildLegacyTsProvider = (): ScenarioBlueprintProviderResult => ({
  bundles: scenarios.map((scenario) =>
    normalizeBundle({
      providerName: "legacy-ts",
      migrationMode: "legacy",
      scenario,
      nodes: nodes.filter((node) => node.scenarioId === scenario.id),
    }),
  ),
  diagnostics: [],
});

const buildCase01LegacyProvider = (): ScenarioBlueprintProviderResult => {
  const case01Onboarding = parseCase01Onboarding(storyRoot);
  return {
    bundles: [
      normalizeBundle({
        providerName: "case01-legacy",
        migrationMode: "legacy",
        scenario: case01Onboarding.scenarioBlueprint,
        nodes: case01Onboarding.nodeBlueprints,
      }),
    ],
    diagnostics: case01Onboarding.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      providerName: "case01-legacy",
      scenarioId: case01Onboarding.scenarioBlueprint.id,
    })),
  };
};

type ScenarioComparePair = {
  mode: "compare" | "authoritative";
  baseline: ScenarioBlueprintBundle;
  candidate: ScenarioBlueprintBundle;
};

const resolveScenarioOwnership = (
  providerResults: ScenarioBlueprintProviderResult[],
): {
  emittedBundles: ScenarioBlueprintBundle[];
  comparePairs: ScenarioComparePair[];
  diagnostics: BlueprintDiagnostic[];
} => {
  const diagnostics: BlueprintDiagnostic[] = providerResults.flatMap(
    (result) => result.diagnostics,
  );
  const bundlesByScenario = new Map<string, ScenarioBlueprintBundle[]>();

  for (const result of providerResults) {
    for (const bundle of result.bundles) {
      const current = bundlesByScenario.get(bundle.scenario.id) ?? [];
      current.push(bundle);
      bundlesByScenario.set(bundle.scenario.id, current);
    }
  }

  const emittedBundles: ScenarioBlueprintBundle[] = [];
  const comparePairs: ScenarioComparePair[] = [];

  for (const [scenarioId, groupedBundles] of bundlesByScenario.entries()) {
    const legacyBundles = groupedBundles.filter(
      (bundle) => bundle.migrationMode === "legacy",
    );
    const compareBundles = groupedBundles.filter(
      (bundle) => bundle.migrationMode === "compare",
    );
    const authoritativeBundles = groupedBundles.filter(
      (bundle) => bundle.migrationMode === "authoritative",
    );

    if (authoritativeBundles.length > 1) {
      diagnostics.push({
        code: "OWNERSHIP_CONFLICT",
        message: `Scenario '${scenarioId}' has multiple authoritative providers`,
        relativePath: scenarioId,
        line: 1,
        column: 1,
        severity: "error",
        providerName: "ownership",
        scenarioId,
      });
      continue;
    }

    if (authoritativeBundles.length === 1) {
      emittedBundles.push(authoritativeBundles[0]);
      if (legacyBundles.length > 0) {
        comparePairs.push({
          mode: "authoritative",
          baseline: legacyBundles[0],
          candidate: authoritativeBundles[0],
        });
      }
      if (compareBundles.length > 0) {
        diagnostics.push({
          code: "OWNERSHIP_CONFLICT",
          message: `Scenario '${scenarioId}' must not mix authoritative and compare providers`,
          relativePath: scenarioId,
          line: 1,
          column: 1,
          severity: "error",
          providerName: "ownership",
          scenarioId,
        });
      }
      continue;
    }

    if (compareBundles.length > 1) {
      diagnostics.push({
        code: "OWNERSHIP_CONFLICT",
        message: `Scenario '${scenarioId}' has multiple compare providers`,
        relativePath: scenarioId,
        line: 1,
        column: 1,
        severity: "error",
        providerName: "ownership",
        scenarioId,
      });
      continue;
    }

    if (compareBundles.length === 1) {
      if (legacyBundles.length === 0) {
        diagnostics.push({
          code: "OWNERSHIP_CONFLICT",
          message: `Compare-mode scenario '${scenarioId}' is missing its legacy baseline`,
          relativePath: scenarioId,
          line: 1,
          column: 1,
          severity: "error",
          providerName: "ownership",
          scenarioId,
        });
        continue;
      }
      emittedBundles.push(legacyBundles[0]);
      comparePairs.push({
        mode: "compare",
        baseline: legacyBundles[0],
        candidate: compareBundles[0],
      });
      continue;
    }

    if (legacyBundles.length > 1) {
      diagnostics.push({
        code: "OWNERSHIP_CONFLICT",
        message: `Scenario '${scenarioId}' has multiple legacy providers`,
        relativePath: scenarioId,
        line: 1,
        column: 1,
        severity: "error",
        providerName: "ownership",
        scenarioId,
      });
      continue;
    }

    if (legacyBundles.length === 1) {
      emittedBundles.push(legacyBundles[0]);
    }
  }

  emittedBundles.sort((left, right) =>
    left.scenario.id.localeCompare(right.scenario.id),
  );

  return { emittedBundles, comparePairs, diagnostics };
};

const providerResults: ScenarioBlueprintProviderResult[] = [
  buildLegacyTsProvider(),
  buildCase01LegacyProvider(),
  loadObsidianScenarioBundles(storyRoot),
];
const ownershipResolution = resolveScenarioOwnership(providerResults);
const providerDiagnostics = ownershipResolution.diagnostics;
let scenariosWithCase01: ScenarioBlueprint[] =
  ownershipResolution.emittedBundles.map((bundle) => bundle.scenario);
let nodesWithCase01: NodeBlueprint[] =
  ownershipResolution.emittedBundles.flatMap((bundle) => bundle.nodes);

const sourceShardBlueprints = loadVnSourceShardBlueprints({
  repoRoot,
  profile: releaseProfile,
});
const scenarioIdsForShardMerge = new Set(
  scenariosWithCase01.map((scenario) => scenario.id),
);
for (const scenario of sourceShardBlueprints.scenarios) {
  if (scenarioIdsForShardMerge.has(scenario.id)) {
    throw new Error(
      `VN source shard scenario id "${scenario.id}" collides with an existing blueprint`,
    );
  }
  scenarioIdsForShardMerge.add(scenario.id);
}
const nodeIdsForShardMerge = new Set(nodesWithCase01.map((node) => node.id));
for (const node of sourceShardBlueprints.nodes) {
  if (nodeIdsForShardMerge.has(node.id)) {
    throw new Error(
      `VN source shard node id "${node.id}" collides with an existing blueprint`,
    );
  }
  nodeIdsForShardMerge.add(node.id);
}
scenariosWithCase01 = [
  ...scenariosWithCase01,
  ...sourceShardBlueprints.scenarios,
];
nodesWithCase01 = [...nodesWithCase01, ...sourceShardBlueprints.nodes];
if (
  sourceShardBlueprints.scenarios.length > 0 ||
  sourceShardBlueprints.nodes.length > 0
) {
  console.log(
    `VN source shards merged: +${sourceShardBlueprints.scenarios.length} scenarios, +${sourceShardBlueprints.nodes.length} nodes`,
  );
}

const migrationDiagnostics: BlueprintDiagnostic[] = [...providerDiagnostics];

const writeMigrationReport = (): void => {
  mkdirSync(path.dirname(migrationReportPath), { recursive: true });
  writeFileSync(
    migrationReportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        narrativeLocale,
        diagnostics: migrationDiagnostics,
      },
      null,
      2,
    ),
    "utf8",
  );
};

for (const diagnostic of providerDiagnostics) {
  const logLine = `${diagnostic.relativePath}:${diagnostic.line}:${diagnostic.column} [${diagnostic.code}] ${diagnostic.message}`;
  if (diagnostic.severity === "warning") {
    console.warn(logLine);
  } else {
    console.error(logLine);
  }
}

const providerErrors = providerDiagnostics.filter(
  (diagnostic) => diagnostic.severity === "error",
);
if (providerErrors.length > 0) {
  writeMigrationReport();
  throw new Error(
    `Obsidian content provider reported ${providerErrors.length} error(s). See ${migrationReportPath}`,
  );
}

const mindCases: MindCaseContent[] = [
  {
    id: "case_loop_demo",
    title: "Loop Demo Case",
  },
  {
    id: "case_banker_theft",
    title: "Banker Ledger Theft",
  },
  {
    id: "case_dog_trail",
    title: "The Dog's Trail",
  },
];

const mindFacts: MindFactContent[] = [
  {
    id: "fact_loop_clue",
    caseId: "case_loop_demo",
    sourceType: "vn_choice",
    sourceId: "sandbox_loop_demo::scene_loop_demo_intro::LOOP_DEMO_CLUE",
    text: "This is a demo fact proving the loop works.",
    tags: {
      theme: "demo",
      reliability: "high",
    },
  },
  {
    id: "fact_ledger_gap",
    caseId: "case_banker_theft",
    sourceType: "vn_choice",
    sourceId: "sandbox_banker_pilot::scene_bank_intro_ch2::BANK_CH2_CONTINUE",
    text: "Client ledger has a deliberate accounting gap for one night.",
    tags: {
      theme: "finance",
      reliability: "high",
    },
  },
  {
    id: "fact_banker_nervous",
    caseId: "case_banker_theft",
    sourceType: "vn_passive_check",
    sourceId:
      "sandbox_banker_pilot::scene_bank_intro::check_bank_first_impression",
    text: "The banker's hands trembled when discussing the ledger dates.",
    tags: {
      theme: "behavior",
      reliability: "medium",
    },
  },
  {
    id: "fact_house_contact",
    caseId: "case_banker_theft",
    sourceType: "vn_choice",
    sourceId: "sandbox_banker_pilot::scene_bank_leads::BANK_LEAD_HOUSE",
    text: "House steward confirms the banker met an unknown courier.",
    tags: {
      theme: "witness",
      reliability: "medium",
    },
  },
  {
    id: "fact_tavern_alibi",
    caseId: "case_banker_theft",
    sourceType: "vn_choice",
    sourceId: "sandbox_banker_pilot::scene_bank_leads::BANK_LEAD_TAVERN",
    text: "Tavern records break the client's alibi timeline.",
    tags: {
      theme: "timeline",
      reliability: "high",
    },
  },
  {
    id: "fact_journalist_bank_seal",
    caseId: "case_banker_theft",
    sourceType: "vn_on_enter",
    sourceId: "intro_journalist::scene_journalist_show_telegram",
    text: "Telegram seal matches Provincial Bank emergency dispatch wax.",
    tags: {
      theme: "documents",
      reliability: "high",
    },
  },
  {
    id: "fact_journalist_master_key",
    caseId: "case_banker_theft",
    sourceType: "vn_on_enter",
    sourceId: "intro_journalist::scene_journalist_anna_tip",
    text: "Anna hands over a cast of the archive master key.",
    tags: {
      theme: "evidence",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_market_route",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_market_beat2",
    text: "Trader confirms someone matching Dog crossed toward the station.",
    tags: {
      theme: "witness",
      reliability: "medium",
    },
  },
  {
    id: "fact_dog_station_manifest",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_station_beat2",
    text: "Night train manifests show a passenger fitting Dog's description.",
    tags: {
      theme: "documents",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_tailor_invoice",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_tailor_beat2",
    text: "Tailor's secret log shows bespoke trench coats paid by an unknown handler.",
    tags: {
      theme: "finance",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_pub_identification",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_pub_beat2",
    text: "Barman described a handler meeting people looking exactly like Dog.",
    tags: {
      theme: "witness",
      reliability: "medium",
    },
  },
  {
    id: "fact_dog_uni_registry",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_uni",
    text: "University registry lists a researcher missing around the time Dog appeared.",
    tags: {
      theme: "documents",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_reunion_capstone",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_park_reunion",
    text: "Dog intercepted you in the park, demanding answers about their origin.",
    tags: {
      theme: "witness",
      reliability: "high",
    },
  },
];

const mindHypotheses: MindHypothesisContent[] = [
  {
    id: "hyp_loop_solved",
    caseId: "case_loop_demo",
    key: "loop_demo_solved",
    text: "The loop demo has been completed successfully.",
    requiredFactIds: ["fact_loop_clue"],
    requiredVars: [],
    rewardEffects: [
      { type: "set_var", key: "loop_demo_solved", value: 1 },
      {
        type: "track_event",
        eventName: "mind_case_loop_demo_solved",
        tags: { caseId: "case_loop_demo" },
      },
    ],
  },
  {
    id: "hyp_banker_inside_job",
    caseId: "case_banker_theft",
    key: "banker_inside_job",
    text: "The banker staged an inside theft and used a courier cover.",
    requiredFactIds: [
      "fact_ledger_gap",
      "fact_house_contact",
      "fact_tavern_alibi",
    ],
    requiredVars: [
      {
        key: "case_progress",
        op: "gte",
        value: 0.4,
      },
    ],
    rewardEffects: [
      { type: "set_flag", key: "case_banker_theft_solved", value: true },
      { type: "add_var", key: "rep_civic", value: 0.5 },
      {
        type: "track_event",
        eventName: "mind_case_banker_solved",
        tags: { caseId: "case_banker_theft" },
      },
    ],
  },
  {
    id: "hyp_dog_route_reconstruction",
    caseId: "case_dog_trail",
    key: "dog_route_proven",
    text: "The Dog traveled from the university area via the market toward the train station.",
    requiredFactIds: [
      "fact_dog_market_route",
      "fact_dog_station_manifest",
      "fact_dog_uni_registry",
    ],
    requiredVars: [],
    rewardEffects: [
      { type: "set_flag", key: "dog_route_proven", value: true },
      { type: "track_event", eventName: "mind_dog_route_proven" },
    ],
  },
  {
    id: "hyp_dog_handler_exposed",
    caseId: "case_dog_trail",
    key: "dog_handler_proven",
    text: "A proxy handler operates out of the pub, outfitting assets at the tailor. Dog confronted me looking for them.",
    requiredFactIds: [
      "fact_dog_tailor_invoice",
      "fact_dog_pub_identification",
      "fact_dog_reunion_capstone",
    ],
    requiredVars: [
      {
        key: "dog_case_confidence",
        op: "gte",
        value: 0.8,
      },
    ],
    rewardEffects: [
      { type: "set_flag", key: "dog_handler_proven", value: true },
      { type: "track_event", eventName: "mind_dog_handler_proven" },
    ],
  },
];

const questCatalog: QuestCatalogEntry[] = [
  {
    id: "quest_banker",
    title: "Banker File",
    stages: [
      {
        stage: 1,
        title: "Initial Briefing",
        objectiveHint: "Meet Kessler at the bank and open the ledger trail.",
        objectivePointIds: ["loc_freiburg_bank"],
      },
      {
        stage: 2,
        title: "Cross-Check Leads",
        objectiveHint: "Revisit the bank after checking external testimonies.",
        objectivePointIds: ["loc_freiburg_bank", "loc_hbf"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Banker case archived.",
        objectivePointIds: ["loc_freiburg_warehouse"],
      },
    ],
  },
  {
    id: "quest_dog",
    title: "Dog Trail",
    stages: [
      {
        stage: 1,
        title: "Open Dog Lead Board",
        objectiveHint: "Collect initial route intel from Rathaus.",
        objectivePointIds: ["loc_rathaus"],
      },
      {
        stage: 2,
        title: "Converge Leads",
        objectiveHint: "Convene in the park after enough witness routes.",
        objectivePointIds: ["loc_rathaus", "loc_workers_pub"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Dog trail logged and sealed.",
        objectivePointIds: ["loc_workers_pub"],
      },
    ],
  },
  {
    id: "quest_ghost",
    title: "Ghost Dossier",
    stages: [
      {
        stage: 1,
        title: "Estate Survey",
        objectiveHint: "Open the ghost investigation from the workers' tavern.",
        objectivePointIds: ["loc_workers_pub"],
      },
      {
        stage: 2,
        title: "Assemble Proof",
        objectiveHint:
          "Correlate bookshelf and floor evidence before accusation.",
        objectivePointIds: ["loc_workers_pub", "loc_freiburg_bank"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Ghost case finalized and written into records.",
        objectivePointIds: ["loc_freiburg_warehouse"],
      },
    ],
  },
];

const karlsruheEventQuestCatalog: QuestCatalogEntry[] = [
  {
    id: "quest_banker",
    title: "Bank Robbery",
    stages: [
      {
        stage: 1,
        title: "Open Bank Robbery",
        objectiveHint: "Start the banker file from the Karlsruhe bank.",
        objectivePointIds: ["loc_ka_bank"],
      },
      {
        stage: 2,
        title: "Pressure the Banker",
        objectiveHint: "Stay on the bank trail until the ledger breaks.",
        objectivePointIds: ["loc_ka_bank"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Bank robbery archived.",
        objectivePointIds: ["loc_ka_bank"],
      },
    ],
  },
  {
    id: "quest_dog",
    title: "Mayor's Dog",
    stages: [
      {
        stage: 1,
        title: "Open Dog Lead Board",
        objectiveHint: "Open the mayor's dog file from Rathaus.",
        objectivePointIds: ["loc_ka_rathaus"],
      },
      {
        stage: 2,
        title: "Follow the Route",
        objectiveHint: "Push the witness chain until the reunion.",
        objectivePointIds: ["loc_ka_rathaus"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Mayor's dog logged and sealed.",
        objectivePointIds: ["loc_ka_rathaus"],
      },
    ],
  },
  {
    id: "quest_missing_aroma",
    title: "Missing Aroma",
    stages: [
      {
        stage: 1,
        title: "Bakery Briefing",
        objectiveHint: "Open the bakery complaint from the Karlsruhe map.",
        objectivePointIds: ["loc_ka_bakery"],
      },
      {
        stage: 2,
        title: "Trace the Scent",
        objectiveHint: "Follow the missing spice trail behind the bakery.",
        objectivePointIds: ["loc_ka_bakery"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Aroma restored and the bakery file archived.",
        objectivePointIds: ["loc_ka_bakery"],
      },
    ],
  },
];

const KARLSRUHE_EVENT_SCENARIO_IDS = new Set<string>([
  KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
  KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
  "sandbox_banker_pilot",
  "sandbox_dog_pilot",
]);

const readMarkdown = (relativePath: string): string => {
  const absolutePath = path.join(storyRoot, relativePath);
  return readFileSync(absolutePath, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
};

const resolveNodeSourcePath = (node: NodeBlueprint): string => {
  if (!node.sourcePathByLocale) {
    return node.sourcePath;
  }

  const localizedPath = node.sourcePathByLocale[narrativeLocale];
  if (localizedPath) {
    return localizedPath;
  }

  if (node.defaultLocale) {
    const defaultLocalePath = node.sourcePathByLocale[node.defaultLocale];
    if (defaultLocalePath) {
      return defaultLocalePath;
    }
  }

  return node.sourcePathByLocale.en ?? node.sourcePath;
};

const assertAscii = (value: string, fieldName: string): void => {
  const isAscii = [...value].every((char) => char.charCodeAt(0) <= 0x7f);
  if (!isAscii) {
    throw new Error(`${fieldName} must be ASCII. Received: ${value}`);
  }
};

const assertAsciiTagKeys = (
  tags: Record<string, unknown>,
  fieldName: string,
): void => {
  for (const key of Object.keys(tags)) {
    assertAscii(key, `${fieldName} tag key`);
  }
};

const assertKnownId = (
  registry: Set<string>,
  value: string,
  fieldName: string,
): void => {
  if (!registry.has(value)) {
    throw new Error(`${fieldName} references unknown id: ${value}`);
  }
};

const assertKnownVocabularyKey = (
  registry: Set<string>,
  value: string,
  fieldName: string,
): void => {
  if (registry.has(value)) {
    return;
  }

  const suggestion = suggestClosest(value, registry);
  if (suggestion) {
    throw new Error(
      `${fieldName} references unknown key: ${value}. Did you mean '${suggestion}'?`,
    );
  }
  throw new Error(`${fieldName} references unknown key: ${value}`);
};

const assertKnownVarKey = (value: string, fieldName: string): void => {
  if (value.startsWith("psyche_")) {
    assertKnownVocabularyKey(PSYCHE_VAR_KEYS, value, fieldName);
  }
  assertKnownVocabularyKey(VAR_KEYS, value, fieldName);
};

const hasMixedSpeakerPool = (speakerIds: readonly string[]): boolean =>
  speakerIds.some((speakerId) => SKILL_VOICE_IDS.has(speakerId)) &&
  speakerIds.some((speakerId) => INNER_VOICE_IDS.has(speakerId));

const validateConditionOperator = (condition: VnCondition, context: string) => {
  if (!CONDITION_OPERATORS.has(condition.type)) {
    throw new Error(
      `condition.type in ${context} is unsupported: ${condition.type}`,
    );
  }
};

const validateEffectOperator = (effect: VnEffect, context: string) => {
  if (!EFFECT_OPERATORS.has(effect.type)) {
    throw new Error(`effect.type in ${context} is unsupported: ${effect.type}`);
  }
};

const validateConditionBlueprint = (
  condition: VnCondition,
  context: string,
): void => {
  validateConditionOperator(condition, context);
  if (condition.type === "logic_and" || condition.type === "logic_or") {
    if (condition.conditions.length === 0) {
      throw new Error(`${context}.${condition.type} must not be empty`);
    }
    for (const nested of condition.conditions) {
      validateConditionBlueprint(nested, `${context}.${condition.type}`);
    }
    return;
  }
  if (condition.type === "logic_not") {
    validateConditionBlueprint(condition.condition, `${context}.logic_not`);
    return;
  }
  if ("key" in condition) {
    assertAscii(condition.key, `${context}.key`);
    if (condition.type === "flag_equals") {
      assertKnownVocabularyKey(FLAG_KEYS, condition.key, `${context}.key`);
    }
    if (condition.type === "var_gte" || condition.type === "var_lte") {
      assertKnownVarKey(condition.key, `${context}.key`);
    }
  }
  if ("evidenceId" in condition) {
    assertAscii(condition.evidenceId, `${context}.evidenceId`);
    assertKnownId(CONTENT_IDS.evidenceIds, condition.evidenceId, context);
  }
  if ("questId" in condition) {
    assertAscii(condition.questId, `${context}.questId`);
    assertKnownId(CONTENT_IDS.questIds, condition.questId, context);
  }
  if ("characterId" in condition) {
    assertAscii(condition.characterId, `${context}.characterId`);
    assertKnownId(CONTENT_IDS.characterIds, condition.characterId, context);
  }
  if ("npcId" in condition) {
    assertAscii(condition.npcId, `${context}.npcId`);
    assertKnownId(FREIBURG_SOCIAL_NPC_IDS, condition.npcId, `${context}.npcId`);
  }
  if ("rumorId" in condition) {
    assertAscii(condition.rumorId, `${context}.rumorId`);
    assertKnownId(
      FREIBURG_SOCIAL_RUMOR_IDS,
      condition.rumorId,
      `${context}.rumorId`,
    );
  }
  if ("rankId" in condition) {
    assertAscii(condition.rankId, `${context}.rankId`);
    assertKnownId(
      FREIBURG_SOCIAL_CAREER_RANK_IDS,
      condition.rankId,
      `${context}.rankId`,
    );
  }
  if ("itemId" in condition) {
    assertAscii(condition.itemId, `${context}.itemId`);
  }
};

const validateEffectBlueprint = (effect: VnEffect, context: string): void => {
  validateEffectOperator(effect, context);
  if ("key" in effect) {
    assertAscii(effect.key, `effect.key in ${context}`);
    if (effect.type === "set_flag") {
      assertKnownVocabularyKey(
        FLAG_KEYS,
        effect.key,
        `effect.key in ${context}`,
      );
    }
    if (effect.type === "set_var" || effect.type === "add_var") {
      assertKnownVarKey(effect.key, `effect.key in ${context}`);
    }
  }
  if (effect.type === "change_psyche_axis") {
    if (
      effect.axis !== "x" &&
      effect.axis !== "y" &&
      effect.axis !== "approach"
    ) {
      throw new Error(
        `effect.axis in ${context} is unsupported: ${effect.axis}`,
      );
    }
  }
  if ("locationId" in effect) {
    assertAscii(effect.locationId, `effect.locationId in ${context}`);
    assertKnownId(
      CONTENT_IDS.locationIds,
      effect.locationId,
      `effect.locationId in ${context}`,
    );
  }
  if ("templateId" in effect) {
    assertAscii(effect.templateId, `effect.templateId in ${context}`);
    assertKnownId(
      CONTENT_IDS.mapEventTemplateIds,
      effect.templateId,
      `effect.templateId in ${context}`,
    );
  }
  if ("eventName" in effect) {
    assertAscii(effect.eventName, `effect.eventName in ${context}`);
    if (effect.tags) {
      assertAsciiTagKeys(effect.tags, `effect.tags in ${context}`);
    }
  }
  if ("caseId" in effect) {
    assertAscii(effect.caseId, `effect.caseId in ${context}`);
  }
  if ("factId" in effect) {
    assertAscii(effect.factId, `effect.factId in ${context}`);
  }
  if ("groupId" in effect) {
    assertAscii(effect.groupId, `effect.groupId in ${context}`);
    assertKnownId(
      CONTENT_IDS.unlockGroups,
      effect.groupId,
      `effect.groupId in ${context}`,
    );
  }
  if ("questId" in effect) {
    assertAscii(effect.questId, `effect.questId in ${context}`);
    assertKnownId(
      CONTENT_IDS.questIds,
      effect.questId,
      `effect.questId in ${context}`,
    );
  }
  if ("characterId" in effect) {
    assertAscii(effect.characterId, `effect.characterId in ${context}`);
    assertKnownId(
      CONTENT_IDS.characterIds,
      effect.characterId,
      `effect.characterId in ${context}`,
    );
  }
  if ("npcId" in effect) {
    assertAscii(effect.npcId, `effect.npcId in ${context}`);
    assertKnownId(
      FREIBURG_SOCIAL_NPC_IDS,
      effect.npcId,
      `effect.npcId in ${context}`,
    );
  }
  if ("rumorId" in effect) {
    assertAscii(effect.rumorId, `effect.rumorId in ${context}`);
    assertKnownId(
      FREIBURG_SOCIAL_RUMOR_IDS,
      effect.rumorId,
      `effect.rumorId in ${context}`,
    );
    if (effect.type === "verify_rumor") {
      if (!SOCIAL_VERIFICATION_KINDS.has(effect.verificationKind)) {
        throw new Error(
          `effect.verificationKind in ${context} is unsupported: ${effect.verificationKind}`,
        );
      }
      const rumorTemplate = RUMOR_TEMPLATE_BY_ID.get(effect.rumorId);
      if (
        rumorTemplate &&
        !rumorTemplate.verifiesOn.includes(effect.verificationKind)
      ) {
        throw new Error(
          `effect.verify_rumor in ${context} uses unsupported verification kind '${effect.verificationKind}' for rumor '${effect.rumorId}'`,
        );
      }
    }
  }
  if ("criterionId" in effect) {
    assertAscii(effect.criterionId, `effect.criterionId in ${context}`);
    assertKnownId(
      AGENCY_SERVICE_CRITERION_IDS,
      effect.criterionId,
      `effect.criterionId in ${context}`,
    );
  }
  if ("factionId" in effect) {
    assertAscii(effect.factionId, `effect.factionId in ${context}`);
    if (!isAllowedFactionId(effect.factionId)) {
      throw new Error(
        `effect.factionId in ${context} must use a canonical or compatibility faction id`,
      );
    }
  }
  if ("evidenceId" in effect) {
    assertAscii(effect.evidenceId, `effect.evidenceId in ${context}`);
    assertKnownId(
      CONTENT_IDS.evidenceIds,
      effect.evidenceId,
      `effect.evidenceId in ${context}`,
    );
  }
  if ("itemId" in effect) {
    assertAscii(effect.itemId, `effect.itemId in ${context}`);
  }
};

const validateSkillCheck = (check: VnSkillCheck, context: string): void => {
  assertAscii(check.id, `skillCheck.id in ${context}`);
  assertAscii(check.voiceId, `skillCheck.voiceId in ${context}`);
  assertKnownVocabularyKey(
    SKILL_VOICE_IDS,
    check.voiceId,
    `skillCheck.voiceId in ${context}`,
  );

  for (const [outcome, branch] of [
    ["success", check.onSuccess],
    ["fail", check.onFail],
  ] as const) {
    if (!branch) {
      continue;
    }
    if (branch.nextNodeId) {
      assertAscii(
        branch.nextNodeId,
        `skillCheck.${outcome}.nextNodeId in ${context}`,
      );
    }
    for (const effect of branch.effects ?? []) {
      validateEffectBlueprint(effect, `skillCheck.${outcome} in ${context}`);
    }
  }
};

const validateScenarioBlueprint = (scenario: ScenarioBlueprint): void => {
  assertAscii(scenario.id, "scenario.id");
  assertAscii(scenario.startNodeId, `scenario(${scenario.id}).startNodeId`);
  for (const nodeId of scenario.nodeIds) {
    assertAscii(nodeId, `scenario(${scenario.id}).nodeId`);
  }
  const completionRoutes = [
    ...(scenario.completionRoute ? [scenario.completionRoute] : []),
    ...(scenario.completionRoutes ?? []),
  ];
  for (const [index, route] of completionRoutes.entries()) {
    assertAscii(
      route.nextScenarioId,
      `scenario(${scenario.id}).completionRoutes[${index}].nextScenarioId`,
    );
    for (const flag of route.requiredFlagsAll ?? []) {
      assertAscii(
        flag,
        `scenario(${scenario.id}).completionRoutes[${index}].requiredFlagsAll`,
      );
    }
    for (const flag of route.blockedIfFlagsAny ?? []) {
      assertAscii(
        flag,
        `scenario(${scenario.id}).completionRoutes[${index}].blockedIfFlagsAny`,
      );
    }
  }
};

const validateChoiceBlueprint = (
  choice: ChoiceBlueprint,
  nodeId: string,
): void => {
  assertAscii(choice.id, `choice.id at node ${nodeId}`);
  assertAscii(choice.nextNodeId, `choice.nextNodeId at node ${nodeId}`);

  for (const condition of choice.conditions ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}`);
  }
  for (const condition of choice.visibleIfAll ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.visibleIfAll`);
  }
  for (const condition of choice.visibleIfAny ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.visibleIfAny`);
  }
  for (const condition of choice.requireAll ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.requireAll`);
  }
  for (const condition of choice.requireAny ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.requireAny`);
  }

  for (const effect of choice.effects ?? []) {
    validateEffectBlueprint(effect, `choice ${choice.id}`);
  }

  if (choice.skillCheck) {
    validateSkillCheck(choice.skillCheck, `choice ${choice.id}`);
  }
  for (const hint of choice.innerVoiceHints ?? []) {
    assertAscii(hint.voiceId, `choice.innerVoiceHints.voiceId at ${nodeId}`);
    assertKnownVocabularyKey(
      INNER_VOICE_IDS,
      hint.voiceId,
      `choice.innerVoiceHints.voiceId at ${nodeId}`,
    );
  }
};

const validateNodeBlueprint = (node: NodeBlueprint): void => {
  assertAscii(node.id, "node.id");
  assertAscii(node.scenarioId, `node(${node.id}).scenarioId`);
  if (node.backgroundUrl) {
    assertAscii(node.backgroundUrl, `node(${node.id}).backgroundUrl`);
  }
  if (node.backgroundVideoUrl) {
    assertAscii(node.backgroundVideoUrl, `node(${node.id}).backgroundVideoUrl`);
  }
  if (node.backgroundVideoPosterUrl) {
    assertAscii(
      node.backgroundVideoPosterUrl,
      `node(${node.id}).backgroundVideoPosterUrl`,
    );
  }
  if (node.backgroundVideoSoundPrompt !== undefined) {
    if (typeof node.backgroundVideoSoundPrompt !== "boolean") {
      throw new Error(
        `node(${node.id}).backgroundVideoSoundPrompt must be a boolean`,
      );
    }
    if (node.backgroundVideoSoundPrompt && !node.backgroundVideoUrl) {
      throw new Error(
        `node(${node.id}).backgroundVideoSoundPrompt requires backgroundVideoUrl`,
      );
    }
  }
  if (node.characterId) {
    assertAscii(node.characterId, `node(${node.id}).characterId`);
    assertKnownId(
      CONTENT_IDS.characterIds,
      node.characterId,
      `node(${node.id}).characterId`,
    );
  }
  if (node.sceneGroupId) {
    assertAscii(node.sceneGroupId, `node(${node.id}).sceneGroupId`);
  }
  if (node.sourcePathByLocale) {
    for (const locale of Object.keys(node.sourcePathByLocale)) {
      assertAscii(locale, `node(${node.id}).sourcePathByLocale.locale`);
    }
  }
  if (node.defaultLocale) {
    assertAscii(node.defaultLocale, `node(${node.id}).defaultLocale`);
  }
  if (node.narrativePresentation !== undefined) {
    if (node.narrativePresentation !== "letter") {
      throw new Error(
        `node(${node.id}) has unsupported narrativePresentation: ${String(node.narrativePresentation)}`,
      );
    }
  }
  if (node.narrativeLayout !== undefined) {
    const allowed = new Set([
      "split",
      "fullscreen",
      "letter_overlay",
      "log",
      "thought_log",
    ]);
    if (!allowed.has(node.narrativeLayout)) {
      throw new Error(
        `node(${node.id}) has unsupported narrativeLayout: ${String(node.narrativeLayout)}`,
      );
    }
  }
  if (node.advanceOnVideoEnd !== undefined) {
    if (typeof node.advanceOnVideoEnd !== "boolean") {
      throw new Error(`node(${node.id}).advanceOnVideoEnd must be a boolean`);
    }
    if (node.advanceOnVideoEnd && !node.backgroundVideoUrl) {
      throw new Error(
        `node(${node.id}).advanceOnVideoEnd requires backgroundVideoUrl`,
      );
    }
  }
  if (node.letterOverlayRevealDelayMs !== undefined) {
    if (
      typeof node.letterOverlayRevealDelayMs !== "number" ||
      !Number.isFinite(node.letterOverlayRevealDelayMs) ||
      node.letterOverlayRevealDelayMs < 0 ||
      node.letterOverlayRevealDelayMs > 120_000
    ) {
      throw new Error(
        `node(${node.id}).letterOverlayRevealDelayMs must be 0..120000`,
      );
    }
  }
  if (node.activeSpeakers) {
    for (const speakerId of node.activeSpeakers) {
      assertAscii(speakerId, `node(${node.id}).activeSpeakers`);
      assertKnownVocabularyKey(
        SPEAKER_IDS,
        speakerId,
        `node(${node.id}).activeSpeakers`,
      );
    }
    if (hasMixedSpeakerPool(node.activeSpeakers)) {
      throw new Error(
        `node(${node.id}).activeSpeakers must not mix skill and inner voices`,
      );
    }
  }

  const autoContinueChoices = node.choices.filter((choice) =>
    choice.id.startsWith(AUTO_CONTINUE_PREFIX),
  );
  if (autoContinueChoices.length > 1) {
    throw new Error(
      `node(${node.id}) has multiple AUTO_CONTINUE choices (${autoContinueChoices.length})`,
    );
  }
  if (autoContinueChoices.length === 1 && node.choices.length !== 1) {
    throw new Error(
      `node(${node.id}) must not mix AUTO_CONTINUE with other explicit choices`,
    );
  }

  const activeSkillCheckIds = new Set<string>();
  for (const choice of node.choices) {
    validateChoiceBlueprint(choice, node.id);
    if (choice.skillCheck) {
      if (activeSkillCheckIds.has(choice.skillCheck.id)) {
        throw new Error(
          `node(${node.id}) duplicates active skill check id '${choice.skillCheck.id}'`,
        );
      }
      activeSkillCheckIds.add(choice.skillCheck.id);
    }
  }
  for (const condition of node.preconditions ?? []) {
    validateConditionBlueprint(condition, `node(${node.id}).preconditions`);
  }
  for (const effect of node.onEnter ?? []) {
    validateEffectBlueprint(effect, `node.onEnter ${node.id}`);
  }
  const passiveCheckIds = new Set<string>();
  for (const check of node.passiveChecks ?? []) {
    if (passiveCheckIds.has(check.id)) {
      throw new Error(
        `node(${node.id}) duplicates passive check id '${check.id}'`,
      );
    }
    passiveCheckIds.add(check.id);
    validateSkillCheck(check, `node.passiveChecks ${node.id}`);
  }
};

const validateMindCase = (mindCase: MindCaseContent): void => {
  assertAscii(mindCase.id, "mindCase.id");
};

const validateMindFact = (
  fact: MindFactContent,
  knownCaseIds: Set<string>,
): void => {
  assertAscii(fact.id, "mindFact.id");
  assertAscii(fact.caseId, `mindFact(${fact.id}).caseId`);
  assertAscii(fact.sourceType, `mindFact(${fact.id}).sourceType`);
  assertAscii(fact.sourceId, `mindFact(${fact.id}).sourceId`);
  assertAsciiTagKeys(fact.tags ?? {}, `mindFact(${fact.id}).tags`);

  if (!knownCaseIds.has(fact.caseId)) {
    throw new Error(
      `mindFact(${fact.id}) references unknown caseId: ${fact.caseId}`,
    );
  }
};

const validateMindHypothesis = (
  hypothesis: MindHypothesisContent,
  knownCaseIds: Set<string>,
  knownFactIds: Set<string>,
): void => {
  assertAscii(hypothesis.id, "mindHypothesis.id");
  assertAscii(hypothesis.caseId, `mindHypothesis(${hypothesis.id}).caseId`);
  assertAscii(hypothesis.key, `mindHypothesis(${hypothesis.id}).key`);

  if (!knownCaseIds.has(hypothesis.caseId)) {
    throw new Error(
      `mindHypothesis(${hypothesis.id}) references unknown caseId: ${hypothesis.caseId}`,
    );
  }

  for (const requiredFactId of hypothesis.requiredFactIds) {
    assertAscii(
      requiredFactId,
      `mindHypothesis(${hypothesis.id}).requiredFactId`,
    );
    if (!knownFactIds.has(requiredFactId)) {
      throw new Error(
        `mindHypothesis(${hypothesis.id}) references unknown factId: ${requiredFactId}`,
      );
    }
  }

  for (const requiredVar of hypothesis.requiredVars) {
    assertAscii(
      requiredVar.key,
      `mindHypothesis(${hypothesis.id}).requiredVar`,
    );
  }

  for (const effect of hypothesis.rewardEffects) {
    validateEffectBlueprint(effect, `mindHypothesis(${hypothesis.id})`);
  }
};

const validateQuestCatalogEntry = (quest: QuestCatalogEntry): void => {
  assertAscii(quest.id, "questCatalog.id");
  assertKnownId(CONTENT_IDS.questIds, quest.id, "questCatalog.id");

  const seenStages = new Set<number>();
  for (const stage of quest.stages) {
    if (!Number.isInteger(stage.stage) || stage.stage < 1) {
      throw new Error(
        `questCatalog(${quest.id}) has invalid stage ${stage.stage}`,
      );
    }
    if (seenStages.has(stage.stage)) {
      throw new Error(
        `questCatalog(${quest.id}) duplicates stage ${stage.stage}`,
      );
    }
    seenStages.add(stage.stage);

    if (stage.title.trim().length === 0) {
      throw new Error(
        `questCatalog(${quest.id}) stage ${stage.stage} has empty title`,
      );
    }
    if (stage.objectiveHint.trim().length === 0) {
      throw new Error(
        `questCatalog(${quest.id}) stage ${stage.stage} has empty objectiveHint`,
      );
    }

    for (const pointId of stage.objectivePointIds ?? []) {
      assertAscii(pointId, `questCatalog(${quest.id}).objectivePointId`);
    }
  }
};

const validateMapCondition = (
  condition: MapCondition,
  context: string,
): void => {
  if ("key" in condition) {
    assertAscii(condition.key, `${context}.key`);
    if (condition.type === "flag_is") {
      assertKnownVocabularyKey(FLAG_KEYS, condition.key, `${context}.key`);
    }
    if (condition.type === "var_gte" || condition.type === "var_lte") {
      assertKnownVarKey(condition.key, `${context}.key`);
    }
  }
  if ("evidenceId" in condition) {
    assertKnownId(CONTENT_IDS.evidenceIds, condition.evidenceId, context);
  }
  if ("questId" in condition) {
    assertKnownId(CONTENT_IDS.questIds, condition.questId, context);
  }
  if ("characterId" in condition) {
    assertKnownId(CONTENT_IDS.characterIds, condition.characterId, context);
  }
  if ("npcId" in condition) {
    assertKnownId(FREIBURG_SOCIAL_NPC_IDS, condition.npcId, context);
  }
  if ("rumorId" in condition) {
    assertKnownId(FREIBURG_SOCIAL_RUMOR_IDS, condition.rumorId, context);
  }
  if ("rankId" in condition) {
    assertKnownId(FREIBURG_SOCIAL_CAREER_RANK_IDS, condition.rankId, context);
  }
  if ("groupId" in condition) {
    assertKnownId(CONTENT_IDS.unlockGroups, condition.groupId, context);
  }
  if ("conditions" in condition) {
    for (const nested of condition.conditions) {
      validateMapCondition(nested, `${context}.nested`);
    }
  }
  if ("condition" in condition) {
    validateMapCondition(condition.condition, `${context}.nested`);
  }
};

const validateMapAction = (action: MapAction, context: string): void => {
  if ("locationId" in action) {
    assertAscii(action.locationId, `${context}.locationId`);
    assertKnownId(
      CONTENT_IDS.locationIds,
      action.locationId,
      `${context}.locationId`,
    );
  }
  if ("key" in action) {
    assertAscii(action.key, `${context}.key`);
    if (action.type === "set_flag") {
      assertKnownVocabularyKey(FLAG_KEYS, action.key, `${context}.key`);
    }
  }
  if ("scenarioId" in action) {
    assertAscii(action.scenarioId, `${context}.scenarioId`);
  }
  if ("templateId" in action) {
    assertAscii(action.templateId, `${context}.templateId`);
    assertKnownId(
      CONTENT_IDS.mapEventTemplateIds,
      action.templateId,
      `${context}.templateId`,
    );
  }
  if ("groupId" in action) {
    assertKnownId(CONTENT_IDS.unlockGroups, action.groupId, context);
  }
  if ("questId" in action) {
    assertKnownId(CONTENT_IDS.questIds, action.questId, context);
  }
  if ("evidenceId" in action) {
    assertKnownId(CONTENT_IDS.evidenceIds, action.evidenceId, context);
  }
  if ("characterId" in action) {
    assertKnownId(CONTENT_IDS.characterIds, action.characterId, context);
  }
  if ("npcId" in action) {
    assertKnownId(FREIBURG_SOCIAL_NPC_IDS, action.npcId, context);
  }
  if ("rumorId" in action) {
    assertKnownId(FREIBURG_SOCIAL_RUMOR_IDS, action.rumorId, context);
    if (action.type === "verify_rumor") {
      const rumorTemplate = RUMOR_TEMPLATE_BY_ID.get(action.rumorId);
      if (
        rumorTemplate &&
        !rumorTemplate.verifiesOn.includes(action.verificationKind)
      ) {
        throw new Error(
          `${context} uses unsupported verification kind '${action.verificationKind}' for rumor '${action.rumorId}'`,
        );
      }
    }
  }
  if ("criterionId" in action) {
    if (typeof action.criterionId !== "string") {
      throw new Error(`${context}.criterionId must be a string`);
    }
    assertKnownId(AGENCY_SERVICE_CRITERION_IDS, action.criterionId, context);
  }
  if ("rankId" in action) {
    if (typeof action.rankId !== "string") {
      throw new Error(`${context}.rankId must be a string`);
    }
    assertKnownId(FREIBURG_SOCIAL_CAREER_RANK_IDS, action.rankId, context);
  }
  if ("factionId" in action) {
    assertAscii(action.factionId, `${context}.factionId`);
    if (!isAllowedFactionId(action.factionId)) {
      throw new Error(
        `${context}.factionId must use a canonical or compatibility faction id`,
      );
    }
  }
  if ("eventName" in action) {
    assertAscii(action.eventName, `${context}.eventName`);
  }
};

const validateScenarioGraph = (
  scenarioBlueprints: ScenarioBlueprint[],
  nodeBlueprints: NodeBlueprint[],
): void => {
  const scenarioById = new Map(
    scenarioBlueprints.map((scenario) => [scenario.id, scenario]),
  );
  const nodeById = new Map(nodeBlueprints.map((node) => [node.id, node]));
  const listedNodeIds = new Map<string, string>();

  for (const scenario of scenarioBlueprints) {
    for (const route of [
      ...(scenario.completionRoute ? [scenario.completionRoute] : []),
      ...(scenario.completionRoutes ?? []),
    ]) {
      const nextScenario = scenarioById.get(route.nextScenarioId);
      if (!nextScenario) {
        throw new Error(
          `scenario(${scenario.id}) completionRoute points to unknown scenario ${route.nextScenarioId}`,
        );
      }
    }

    const startNode = nodeById.get(scenario.startNodeId);
    if (!startNode) {
      throw new Error(
        `scenario(${scenario.id}) startNodeId is missing: ${scenario.startNodeId}`,
      );
    }
    if (startNode.scenarioId !== scenario.id) {
      throw new Error(
        `scenario(${scenario.id}) startNodeId points to node from ${startNode.scenarioId}`,
      );
    }

    for (const nodeId of scenario.nodeIds) {
      const node = nodeById.get(nodeId);
      if (!node) {
        throw new Error(
          `scenario(${scenario.id}) references missing nodeId ${nodeId}`,
        );
      }
      if (node.scenarioId !== scenario.id) {
        throw new Error(
          `scenario(${scenario.id}) nodeId ${nodeId} belongs to ${node.scenarioId}`,
        );
      }
      if (listedNodeIds.has(nodeId)) {
        throw new Error(
          `nodeId ${nodeId} is listed in multiple scenarios (${listedNodeIds.get(nodeId)} and ${scenario.id})`,
        );
      }
      listedNodeIds.set(nodeId, scenario.id);
    }
  }

  for (const node of nodeBlueprints) {
    if (!scenarioById.has(node.scenarioId)) {
      throw new Error(
        `node(${node.id}) references unknown scenarioId ${node.scenarioId}`,
      );
    }
    if (!listedNodeIds.has(node.id)) {
      throw new Error(
        `node(${node.id}) is orphaned and not listed in any scenario.nodeIds`,
      );
    }

    for (const choice of node.choices) {
      if (node.terminal && !choice.nextNodeId) {
        continue;
      }
      const next = nodeById.get(choice.nextNodeId);
      if (!next) {
        throw new Error(
          `choice(${choice.id}) at node(${node.id}) references missing nextNodeId ${choice.nextNodeId}`,
        );
      }
      if (next.scenarioId !== node.scenarioId) {
        throw new Error(
          `choice(${choice.id}) at node(${node.id}) points outside scenario ${node.scenarioId}`,
        );
      }

      for (const [outcome, branch] of [
        ["success", choice.skillCheck?.onSuccess],
        ["fail", choice.skillCheck?.onFail],
      ] as const) {
        if (!branch?.nextNodeId) {
          continue;
        }
        const outcomeNode = nodeById.get(branch.nextNodeId);
        if (!outcomeNode) {
          throw new Error(
            `skillCheck ${choice.skillCheck?.id} ${outcome} branch at node(${node.id}) points to missing node ${branch.nextNodeId}`,
          );
        }
        if (outcomeNode.scenarioId !== node.scenarioId) {
          throw new Error(
            `skillCheck ${choice.skillCheck?.id} ${outcome} branch at node(${node.id}) points outside scenario ${node.scenarioId}`,
          );
        }
      }
    }

    for (const check of node.passiveChecks ?? []) {
      for (const [outcome, branch] of [
        ["success", check.onSuccess],
        ["fail", check.onFail],
      ] as const) {
        if (!branch?.nextNodeId) {
          continue;
        }
        const outcomeNode = nodeById.get(branch.nextNodeId);
        if (!outcomeNode) {
          throw new Error(
            `passive check ${check.id} ${outcome} branch at node(${node.id}) points to missing node ${branch.nextNodeId}`,
          );
        }
        if (outcomeNode.scenarioId !== node.scenarioId) {
          throw new Error(
            `passive check ${check.id} ${outcome} branch at node(${node.id}) points outside scenario ${node.scenarioId}`,
          );
        }
      }
    }
  }
};

const collectReachableNodeIds = (
  startNodeId: string,
  nodeById: ReadonlyMap<string, NodeBlueprint>,
): Set<string> => {
  const visited = new Set<string>();
  const queue: string[] = [startNodeId];

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    if (!currentNodeId || visited.has(currentNodeId)) {
      continue;
    }
    visited.add(currentNodeId);

    const node = nodeById.get(currentNodeId);
    if (!node) {
      continue;
    }

    for (const choice of node.choices) {
      queue.push(choice.nextNodeId);
      if (choice.skillCheck?.onSuccess?.nextNodeId) {
        queue.push(choice.skillCheck.onSuccess.nextNodeId);
      }
      if (choice.skillCheck?.onFail?.nextNodeId) {
        queue.push(choice.skillCheck.onFail.nextNodeId);
      }
    }

    for (const check of node.passiveChecks ?? []) {
      if (check.onSuccess?.nextNodeId) {
        queue.push(check.onSuccess.nextNodeId);
      }
      if (check.onFail?.nextNodeId) {
        queue.push(check.onFail.nextNodeId);
      }
    }
  }

  return visited;
};

const collectContentContractWarnings = (
  scenarioBlueprints: ScenarioBlueprint[],
  nodeBlueprints: NodeBlueprint[],
): string[] => {
  const warnings: string[] = [];
  const nodeById = new Map(nodeBlueprints.map((node) => [node.id, node]));
  const nodesByScenario = new Map<string, NodeBlueprint[]>();
  for (const scenario of scenarioBlueprints) {
    nodesByScenario.set(
      scenario.id,
      nodeBlueprints.filter((node) => node.scenarioId === scenario.id),
    );
  }

  const minNodeRules = new Map<string, number>([
    ["sandbox_banker_pilot", 5],
    ["sandbox_dog_pilot", 12],
    ["sandbox_ghost_pilot", 8],
  ]);

  for (const [scenarioId, minNodes] of minNodeRules) {
    const nodesForScenario = nodesByScenario.get(scenarioId) ?? [];
    if (nodesForScenario.length < minNodes) {
      warnings.push(
        `Scenario ${scenarioId} has ${nodesForScenario.length} nodes (required >= ${minNodes})`,
      );
    }
  }

  for (const scenario of scenarioBlueprints) {
    const nodesForScenario = nodesByScenario.get(scenario.id) ?? [];
    const reachableIds = collectReachableNodeIds(
      scenario.startNodeId,
      nodeById,
    );
    const unreachable = nodesForScenario.filter(
      (node) => !reachableIds.has(node.id),
    );
    if (unreachable.length > 0) {
      warnings.push(
        `Scenario ${scenario.id} contains unreachable nodes: ${unreachable
          .map((node) => node.id)
          .join(", ")}`,
      );
    }

    const terminalCount = nodesForScenario.filter(
      (node) => node.terminal,
    ).length;
    if (terminalCount === 0) {
      warnings.push(`Scenario ${scenario.id} has no terminal nodes`);
    }
  }

  return warnings;
};

const extractTitle = (markdown: string, fallback: string): string => {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) {
    return fallback;
  }

  const candidate = match[1].trim();
  return candidate.length > 0 ? candidate : fallback;
};

const extractBody = (markdown: string, fallback: string): string => {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?---\s*/, "");
  const lines = withoutFrontMatter.split("\n");
  const scriptSectionStart = lines.findIndex((line) =>
    /^##\s+Script\s*$/i.test(line.trim()),
  );
  if (scriptSectionStart >= 0) {
    let scriptSectionEnd = lines.length;
    for (
      let lineIndex = scriptSectionStart + 1;
      lineIndex < lines.length;
      lineIndex += 1
    ) {
      if (/^##\s+/.test(lines[lineIndex].trim())) {
        scriptSectionEnd = lineIndex;
        break;
      }
    }
    const normalizedScript = lines
      .slice(scriptSectionStart + 1, scriptSectionEnd)
      .join("\n")
      .replace(/```[\s\S]*?```/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalizedScript.length > 0) {
      return normalizedScript.length > 280
        ? `${normalizedScript.slice(0, 277)}...`
        : normalizedScript;
    }
  }

  const normalizedLines = withoutFrontMatter
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("#") &&
        !line.startsWith("##") &&
        !line.startsWith("---") &&
        !line.startsWith("id:") &&
        !line.startsWith("type:") &&
        !line.startsWith("phase:") &&
        !line.startsWith("status:") &&
        !line.startsWith("tags:"),
    );

  if (normalizedLines.length === 0) {
    return fallback;
  }

  const joined = normalizedLines.slice(0, 3).join(" ");
  const normalized = joined.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return fallback;
  }

  return normalized.length > 280
    ? `${normalized.slice(0, 277)}...`
    : normalized;
};

function normalizeChoiceIdFragment(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
}

function isImplicitContinueText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("continue") ||
    normalized.startsWith("продолжить") ||
    normalized.startsWith("weiter") ||
    normalized.startsWith("далее")
  );
}

function toAutoContinueChoiceId(nodeId: string): string {
  return `${AUTO_CONTINUE_PREFIX}${normalizeChoiceIdFragment(nodeId)}`;
}

function normalizeNodeAutoContinue(node: NodeBlueprint): NodeBlueprint {
  if (node.choices.length !== 1) {
    return node;
  }

  const [choice] = node.choices;
  if (choice.id.startsWith(AUTO_CONTINUE_PREFIX)) {
    return node;
  }
  if (
    choice.conditions ||
    choice.visibleIfAll ||
    choice.visibleIfAny ||
    choice.requireAll ||
    choice.requireAny ||
    choice.effects ||
    choice.skillCheck
  ) {
    return node;
  }
  if (!isImplicitContinueText(choice.text)) {
    return node;
  }

  return {
    ...node,
    choices: [
      {
        ...choice,
        id: toAutoContinueChoiceId(node.id),
      },
    ],
  };
}

for (const scenario of scenariosWithCase01) {
  validateScenarioBlueprint(scenario);
}

if (
  !scenariosWithCase01.some(
    (scenario) => scenario.id === defaultEntryScenarioId,
  )
) {
  throw new Error(
    `Default entry scenario '${defaultEntryScenarioId}' is missing from snapshot scenarios`,
  );
}

for (const node of nodesWithCase01) {
  validateNodeBlueprint(node);
}

validateScenarioGraph(scenariosWithCase01, nodesWithCase01);
const contentContractWarnings = collectContentContractWarnings(
  scenariosWithCase01,
  nodesWithCase01,
);

for (const mindCase of mindCases) {
  validateMindCase(mindCase);
}

const knownCaseIds = new Set<string>(mindCases.map((entry) => entry.id));
const knownFactIds = new Set<string>();
for (const fact of mindFacts) {
  validateMindFact(fact, knownCaseIds);
  knownFactIds.add(fact.id);
}

for (const hypothesis of mindHypotheses) {
  validateMindHypothesis(hypothesis, knownCaseIds, knownFactIds);
}

for (const quest of isKarlsruheEventRelease
  ? karlsruheEventQuestCatalog
  : questCatalog) {
  validateQuestCatalogEntry(quest);
}

const buildRuntimeNode = (node: NodeBlueprint): VnNode => {
  const resolvedSourcePath = resolveNodeSourcePath(node);
  const markdown =
    node.titleOverride !== undefined && node.bodyOverride !== undefined
      ? ""
      : readMarkdown(resolvedSourcePath);
  const title = node.titleOverride ?? extractTitle(markdown, node.id);
  const body =
    node.bodyOverride ??
    extractBody(markdown, node.fallbackBody ?? `Source: ${resolvedSourcePath}`);

  const vnNode: VnNode = {
    id: node.id,
    scenarioId: node.scenarioId,
    title,
    body,
    terminal: node.terminal,
    choices: node.choices,
  };

  if (node.onEnter) {
    vnNode.onEnter = node.onEnter;
  }
  if (node.preconditions) {
    vnNode.preconditions = node.preconditions;
  }
  if (node.passiveChecks) {
    vnNode.passiveChecks = node.passiveChecks;
  }
  if (node.backgroundUrl !== undefined) {
    vnNode.backgroundUrl = node.backgroundUrl;
  }
  if (node.backgroundVideoUrl !== undefined) {
    vnNode.backgroundVideoUrl = node.backgroundVideoUrl;
  }
  if (node.backgroundVideoPosterUrl !== undefined) {
    vnNode.backgroundVideoPosterUrl = node.backgroundVideoPosterUrl;
  }
  if (node.backgroundVideoSoundPrompt !== undefined) {
    vnNode.backgroundVideoSoundPrompt = node.backgroundVideoSoundPrompt;
  }
  if (node.characterId !== undefined) {
    vnNode.characterId = node.characterId;
  }
  if (node.sceneGroupId !== undefined) {
    vnNode.sceneGroupId = node.sceneGroupId;
  }
  if (node.voicePresenceMode !== undefined) {
    vnNode.voicePresenceMode = node.voicePresenceMode;
  }
  if (node.activeSpeakers) {
    vnNode.activeSpeakers = [...node.activeSpeakers];
  }
  if (node.narrativePresentation !== undefined) {
    vnNode.narrativePresentation = node.narrativePresentation;
  }
  if (node.narrativeLayout !== undefined) {
    vnNode.narrativeLayout = node.narrativeLayout;
  }
  if (node.advanceOnVideoEnd !== undefined) {
    vnNode.advanceOnVideoEnd = node.advanceOnVideoEnd;
  }
  if (node.letterOverlayRevealDelayMs !== undefined) {
    vnNode.letterOverlayRevealDelayMs = node.letterOverlayRevealDelayMs;
  }

  return vnNode;
};

const buildRuntimeScenario = (scenario: ScenarioBlueprint): VnScenario => {
  const vnScenario: VnScenario = {
    id: scenario.id,
    title: scenario.title,
    startNodeId: scenario.startNodeId,
    nodeIds: scenario.nodeIds,
  };

  if (scenario.mode) {
    vnScenario.mode = scenario.mode;
  }
  if (scenario.completionRoute) {
    vnScenario.completionRoute = scenario.completionRoute;
  }
  if (scenario.completionRoutes) {
    vnScenario.completionRoutes = scenario.completionRoutes;
  }
  if (scenario.skillCheckDice) {
    vnScenario.skillCheckDice = scenario.skillCheckDice;
  }
  if (scenario.packId) {
    vnScenario.packId = scenario.packId;
  }
  if (scenario.musicUrl) {
    vnScenario.musicUrl = scenario.musicUrl;
  }
  if (scenario.defaultBackgroundUrl) {
    vnScenario.defaultBackgroundUrl = scenario.defaultBackgroundUrl;
  }

  return vnScenario;
};

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const compareScenarioBundles = (
  left: ScenarioBlueprintBundle,
  right: ScenarioBlueprintBundle,
): BlueprintDiagnostic[] => {
  const diagnostics: BlueprintDiagnostic[] = [];
  const leftScenario = buildRuntimeScenario(left.scenario);
  const rightScenario = buildRuntimeScenario(right.scenario);

  if (stableSerialize(leftScenario) !== stableSerialize(rightScenario)) {
    diagnostics.push({
      code: "DUAL_RUN_DIFF",
      message: `Scenario payload differs between ${left.providerName} and ${right.providerName}`,
      relativePath: left.scenario.id,
      line: 1,
      column: 1,
      severity: "warning",
      providerName: right.providerName,
      scenarioId: left.scenario.id,
    });
  }

  const leftNodes = new Map(
    left.nodes.map((node) => [node.id, buildRuntimeNode(node)]),
  );
  const rightNodes = new Map(
    right.nodes.map((node) => [node.id, buildRuntimeNode(node)]),
  );
  const allNodeIds = new Set([...leftNodes.keys(), ...rightNodes.keys()]);

  for (const nodeId of [...allNodeIds].sort()) {
    const leftNode = leftNodes.get(nodeId);
    const rightNode = rightNodes.get(nodeId);
    if (!leftNode || !rightNode) {
      diagnostics.push({
        code: "DUAL_RUN_DIFF",
        message: `Node '${nodeId}' exists only in ${leftNode ? left.providerName : right.providerName}`,
        relativePath: left.scenario.id,
        line: 1,
        column: 1,
        severity: "warning",
        providerName: right.providerName,
        scenarioId: left.scenario.id,
        nodeId,
      });
      continue;
    }
    if (stableSerialize(leftNode) !== stableSerialize(rightNode)) {
      diagnostics.push({
        code: "DUAL_RUN_DIFF",
        message: `Node payload differs for '${nodeId}' between ${left.providerName} and ${right.providerName}`,
        relativePath: left.scenario.id,
        line: 1,
        column: 1,
        severity: "warning",
        providerName: right.providerName,
        scenarioId: left.scenario.id,
        nodeId,
      });
    }
  }

  return diagnostics;
};

for (const pair of ownershipResolution.comparePairs) {
  migrationDiagnostics.push(
    ...compareScenarioBundles(pair.baseline, pair.candidate),
  );
}

const builtNodes: VnNode[] = nodesWithCase01.map(buildRuntimeNode);

const builtScenarios: VnScenario[] =
  scenariosWithCase01.map(buildRuntimeScenario);

const isHiddenKarlsruheShellEffect = (effect: VnEffect): boolean =>
  effect.type === "open_command_mode" || effect.type === "open_battle_mode";

const sanitizeKarlsruheSkillCheck = (
  skillCheck: VnSkillCheck,
): VnSkillCheck => {
  const sanitizeBranch = <T extends { effects?: VnEffect[] }>(
    branch?: T,
  ): T | undefined => {
    if (!branch?.effects) {
      return branch;
    }

    return {
      ...branch,
      effects: branch.effects.filter(
        (effect) => !isHiddenKarlsruheShellEffect(effect),
      ),
    };
  };

  const onSuccessWithCost = skillCheck.onSuccessWithCost
    ? {
        ...sanitizeBranch(skillCheck.onSuccessWithCost),
        costEffects: skillCheck.onSuccessWithCost.costEffects?.filter(
          (effect) => !isHiddenKarlsruheShellEffect(effect),
        ),
      }
    : undefined;

  return {
    ...skillCheck,
    onSuccess: sanitizeBranch(skillCheck.onSuccess),
    onFail: sanitizeBranch(skillCheck.onFail),
    onCritical: sanitizeBranch(skillCheck.onCritical),
    onSuccessWithCost,
  };
};

const sanitizeKarlsruheChoice = (choice: VnChoice): VnChoice => ({
  ...choice,
  effects: choice.effects?.filter(
    (effect) => !isHiddenKarlsruheShellEffect(effect),
  ),
  skillCheck: choice.skillCheck
    ? sanitizeKarlsruheSkillCheck(choice.skillCheck)
    : undefined,
});

const sanitizeKarlsruheNode = (node: VnNode): VnNode => ({
  ...node,
  onEnter: node.onEnter?.filter(
    (effect) => !isHiddenKarlsruheShellEffect(effect),
  ),
  choices: node.choices.map(sanitizeKarlsruheChoice),
  passiveChecks: node.passiveChecks?.map((check) =>
    sanitizeKarlsruheSkillCheck(check),
  ),
});

const isHiddenKarlsruheMapAction = (action: MapAction): boolean =>
  action.type === "open_command_mode" || action.type === "open_battle_mode";

const sanitizeKarlsruheMapSnapshot = (snapshot: MapSnapshot): MapSnapshot => {
  const sanitizeBindings = (
    bindings: MapSnapshot["points"][number]["bindings"],
  ) =>
    bindings
      .map((binding) => ({
        ...binding,
        actions: binding.actions.filter(
          (action) => !isHiddenKarlsruheMapAction(action),
        ),
      }))
      .filter((binding) => binding.actions.length > 0);

  return {
    ...snapshot,
    points: snapshot.points.map((point) => ({
      ...point,
      bindings: sanitizeBindings(point.bindings),
    })),
    mapEventTemplates: snapshot.mapEventTemplates?.map((template) => ({
      ...template,
      point: {
        ...template.point,
        bindings: sanitizeBindings(template.point.bindings),
      },
    })),
  };
};

const releaseScenarios = isKarlsruheEventRelease
  ? builtScenarios.filter((scenario) =>
      KARLSRUHE_EVENT_SCENARIO_IDS.has(scenario.id),
    )
  : builtScenarios;
const releaseNodes = isKarlsruheEventRelease
  ? builtNodes
      .filter((node) => KARLSRUHE_EVENT_SCENARIO_IDS.has(node.scenarioId ?? ""))
      .map(sanitizeKarlsruheNode)
  : builtNodes;
const availableScenarioIds = new Set(
  releaseScenarios.map((scenario) => scenario.id),
);
const mapSnapshot = isKarlsruheEventRelease
  ? sanitizeKarlsruheMapSnapshot(
      buildKarlsruheEventMapSnapshot(availableScenarioIds),
    )
  : buildCase01MapSnapshot(availableScenarioIds);
const releaseQuestCatalog = isKarlsruheEventRelease
  ? karlsruheEventQuestCatalog
  : questCatalog;
const releaseSocialCatalog: SocialCatalogSnapshot = isKarlsruheEventRelease
  ? {
      npcIdentities: [],
      services: [],
      rumors: [],
      careerRanks: [],
      factions: [],
    }
  : FREIBURG_SOCIAL_CATALOG;

const seenPointIds = new Set<string>();
const seenBindingIds = new Set<string>();
const knownRegionIds = new Set(mapSnapshot.regions.map((region) => region.id));
let conditionDrivenBindingCount = 0;
let pointsWithRichBindings = 0;
for (const point of mapSnapshot.points) {
  if (seenPointIds.has(point.id)) {
    throw new Error(`Map point id is duplicated: ${point.id}`);
  }
  seenPointIds.add(point.id);
  if (!knownRegionIds.has(point.regionId)) {
    throw new Error(
      `Map point ${point.id} references unknown regionId ${point.regionId}`,
    );
  }
  assertKnownId(
    CONTENT_IDS.locationIds,
    point.locationId,
    `map point ${point.id}`,
  );
  if (point.bindings.length === 0) {
    throw new Error(`Map point ${point.id} has no bindings`);
  }

  if (point.bindings.length > 2) {
    pointsWithRichBindings += 1;
  }

  for (const binding of point.bindings) {
    if (seenBindingIds.has(binding.id)) {
      throw new Error(`Map binding id is duplicated: ${binding.id}`);
    }
    seenBindingIds.add(binding.id);
    if ((binding.conditions ?? []).length > 0) {
      conditionDrivenBindingCount += 1;
    }

    for (const condition of binding.conditions ?? []) {
      validateMapCondition(condition, `map binding ${binding.id}`);
    }

    for (const action of binding.actions) {
      validateMapAction(action, `map binding ${binding.id}`);
      if (
        action.type === "start_scenario" &&
        !availableScenarioIds.has(action.scenarioId)
      ) {
        throw new Error(
          `Map binding ${binding.id} references unknown scenarioId ${action.scenarioId}`,
        );
      }
    }
  }
}

const seenShadowRouteIds = new Set<string>();
for (const route of mapSnapshot.shadowRoutes ?? []) {
  if (seenShadowRouteIds.has(route.id)) {
    throw new Error(`Map shadow route id is duplicated: ${route.id}`);
  }
  seenShadowRouteIds.add(route.id);

  if (!knownRegionIds.has(route.regionId)) {
    throw new Error(
      `Map shadow route ${route.id} references unknown regionId ${route.regionId}`,
    );
  }
  if (route.pointIds.length < 2) {
    throw new Error(
      `Map shadow route ${route.id} must contain at least two pointIds`,
    );
  }
  for (const pointId of route.pointIds) {
    if (!seenPointIds.has(pointId)) {
      throw new Error(
        `Map shadow route ${route.id} references unknown pointId ${pointId}`,
      );
    }
  }
  for (const flagKey of route.revealFlagsAll ?? []) {
    assertKnownVocabularyKey(
      FLAG_KEYS,
      flagKey,
      `map shadow route ${route.id}.revealFlagsAll`,
    );
  }
}

const seenQrCodeIds = new Set<string>();
for (const entry of mapSnapshot.qrCodeRegistry ?? []) {
  assertKnownId(
    CONTENT_IDS.mapQrCodeIds,
    entry.codeId,
    `map qr code ${entry.codeId}`,
  );
  if (seenQrCodeIds.has(entry.codeId)) {
    throw new Error(`Map qr code id is duplicated: ${entry.codeId}`);
  }
  seenQrCodeIds.add(entry.codeId);

  for (const flagKey of entry.requiresFlagsAll ?? []) {
    assertKnownVocabularyKey(
      FLAG_KEYS,
      flagKey,
      `map qr code ${entry.codeId}.requiresFlagsAll`,
    );
  }
  for (const effect of entry.effects) {
    validateEffectBlueprint(effect, `map qr code ${entry.codeId}`);
  }
}

const seenMapEventTemplateIds = new Set<string>();
const seenMapEventPointIds = new Set<string>();
for (const template of mapSnapshot.mapEventTemplates ?? []) {
  assertKnownId(
    CONTENT_IDS.mapEventTemplateIds,
    template.id,
    `map event template ${template.id}`,
  );
  if (seenMapEventTemplateIds.has(template.id)) {
    throw new Error(`Map event template id is duplicated: ${template.id}`);
  }
  if (
    seenMapEventPointIds.has(template.point.id) ||
    seenPointIds.has(template.point.id)
  ) {
    throw new Error(
      `Map event template ${template.id} reuses an existing point id: ${template.point.id}`,
    );
  }
  seenMapEventTemplateIds.add(template.id);
  seenMapEventPointIds.add(template.point.id);

  if (template.point.category !== "EPHEMERAL") {
    throw new Error(
      `Map event template ${template.id} must use EPHEMERAL point category`,
    );
  }
  if (!knownRegionIds.has(template.point.regionId)) {
    throw new Error(
      `Map event template ${template.id} references unknown regionId ${template.point.regionId}`,
    );
  }
  assertKnownId(
    CONTENT_IDS.locationIds,
    template.point.locationId,
    `map event template ${template.id}.locationId`,
  );

  for (const binding of template.point.bindings) {
    if (seenBindingIds.has(binding.id)) {
      throw new Error(`Map binding id is duplicated: ${binding.id}`);
    }
    seenBindingIds.add(binding.id);
    for (const condition of binding.conditions ?? []) {
      validateMapCondition(
        condition,
        `map event template ${template.id} binding ${binding.id}`,
      );
    }
    for (const action of binding.actions) {
      validateMapAction(
        action,
        `map event template ${template.id} binding ${binding.id}`,
      );
      if (
        action.type === "start_scenario" &&
        !availableScenarioIds.has(action.scenarioId)
      ) {
        throw new Error(
          `Map event template ${template.id} binding ${binding.id} references unknown scenarioId ${action.scenarioId}`,
        );
      }
    }
  }
}

for (const quest of releaseQuestCatalog) {
  for (const stage of quest.stages) {
    for (const pointId of stage.objectivePointIds ?? []) {
      if (!seenPointIds.has(pointId)) {
        throw new Error(
          `questCatalog(${quest.id}) stage ${stage.stage} references unknown pointId ${pointId}`,
        );
      }
    }
  }
}

if (!isKarlsruheEventRelease && conditionDrivenBindingCount < 12) {
  contentContractWarnings.push(
    `Map contract warning: expected >=12 condition-driven bindings, got ${conditionDrivenBindingCount}`,
  );
}
if (!isKarlsruheEventRelease && pointsWithRichBindings < 5) {
  contentContractWarnings.push(
    `Map contract warning: expected >=5 points with >2 bindings, got ${pointsWithRichBindings}`,
  );
}

if (
  !isKarlsruheEventRelease &&
  (!Array.isArray(FREIBURG_SOCIAL_CATALOG.factions) ||
    FREIBURG_SOCIAL_CATALOG.factions.length === 0 ||
    !FREIBURG_SOCIAL_CATALOG.factions.every(isFactionDefinition))
) {
  throw new Error(
    "FREIBURG_SOCIAL_CATALOG.factions must contain valid definitions",
  );
}

if (!isKarlsruheEventRelease) {
  for (const npcIdentity of FREIBURG_SOCIAL_CATALOG.npcIdentities) {
    if (!isCanonicalFactionId(npcIdentity.factionId)) {
      throw new Error(
        `FREIBURG_SOCIAL_CATALOG npc ${npcIdentity.id} must use a canonical faction id`,
      );
    }
  }
}

const snapshotPayload: VnSnapshot = {
  schemaVersion: CURRENT_VN_SNAPSHOT_SCHEMA_VERSION,
  contractMetadata: createVnContractMetadata(),
  scenarios: releaseScenarios,
  nodes: releaseNodes,
  vnRuntime: {
    skillCheckDice: defaultSkillCheckDice,
    defaultEntryScenarioId,
    releaseProfile,
  },
  mindPalace: isKarlsruheEventRelease
    ? {
        cases: [],
        facts: [],
        hypotheses: [],
      }
    : {
        cases: mindCases,
        facts: mindFacts,
        hypotheses: mindHypotheses,
      },
  map: mapSnapshot,
  questCatalog: releaseQuestCatalog,
  socialCatalog: releaseSocialCatalog,
};

const payloadJson = JSON.stringify(snapshotPayload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

const output = {
  ...snapshotPayload,
  checksum,
};
const generatedStaticMapPointsModule = `/* auto-generated by scripts/extract-vn-content.ts; do not edit manually */
import type { MapPoint } from "../types";

export const GENERATED_STATIC_FREIBURG_CASE01_POINTS: MapPoint[] = ${JSON.stringify(
  mapSnapshot.points.filter((point) => point.regionId === "FREIBURG_1905"),
  null,
  2,
)} as MapPoint[];
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

mkdirSync(path.dirname(publicOutputPath), { recursive: true });
copyFileSync(outputPath, publicOutputPath);

if (!isKarlsruheEventRelease) {
  mkdirSync(path.dirname(generatedStaticMapPointsPath), { recursive: true });
  writeFileSync(
    generatedStaticMapPointsPath,
    `${generatedStaticMapPointsModule.trimEnd()}\n`,
    "utf8",
  );
}

console.log(`Snapshot written to ${outputPath}`);
console.log(`Public copy written to ${publicOutputPath}`);
if (!isKarlsruheEventRelease) {
  console.log(
    `Generated static map points written to ${generatedStaticMapPointsPath}`,
  );
} else {
  console.log(
    "Generated static Freiburg map points skipped for Karlsruhe profile.",
  );
}
console.log(`Checksum: ${checksum}`);
console.log(`Release profile: ${releaseProfile}`);
console.log(`Narrative locale: ${narrativeLocale}`);
console.log(
  `Scenarios: ${releaseScenarios.length}, Nodes: ${releaseNodes.length}`,
);
console.log(
  `MindPalace -> Cases: ${snapshotPayload.mindPalace?.cases.length ?? 0}, Facts: ${snapshotPayload.mindPalace?.facts.length ?? 0}, Hypotheses: ${snapshotPayload.mindPalace?.hypotheses.length ?? 0}`,
);
console.log(
  `Map -> Points: ${mapSnapshot.points.length}, Bindings: ${mapSnapshot.points.reduce((total, point) => total + point.bindings.length, 0)}, Condition-driven: ${conditionDrivenBindingCount}`,
);

if (contentContractWarnings.length > 0) {
  console.warn("Content contract warnings:");
  for (const warning of contentContractWarnings) {
    migrationDiagnostics.push({
      code: "CONTENT_WARNING",
      message: warning,
      relativePath: "scripts/extract-vn-content.ts",
      line: 1,
      column: 1,
      severity: "warning",
      providerName: "extractor",
    });
    console.warn(`  - ${warning}`);
  }
}

writeMigrationReport();
console.log(`Migration report written to ${migrationReportPath}`);

if (process.argv.includes("--publish-translations")) {
  const [{ formatContentTarget, parseContentTargetArgs }, translationsModule] =
    await Promise.all([
      import("./content-cli"),
      import("./content-translations"),
    ]);
  const target = parseContentTargetArgs(process.argv.slice(2), () => {
    console.error(
      "Usage: bun run content:extract -- --publish-translations [--server local|maincloud] [--db <name>] [--host <uri>]",
    );
  });
  const translations = translationsModule.readLocaleTranslations();
  await translationsModule.publishTranslations(target, translations);
  console.log(
    `Content translations published (${translations.length} rows) to ${formatContentTarget(target)}`,
  );
}
