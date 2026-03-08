import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AcceptanceFlowKind = "runtime_contract" | "player_flow";

export interface AcceptanceFlow {
  id: string;
  label: string;
  kind: AcceptanceFlowKind;
  entryPath: string;
  smokeCommand: string;
  smokeLabel: string;
  includeInSmokeAll: boolean;
  gates: {
    extract: boolean;
    manifest: boolean;
    drift: boolean;
  };
  notes?: string;
}

export const CONTENT_GATE_COMMANDS = {
  extract: "content:extract",
  manifest: "content:manifest:check",
  drift: "content:drift:check",
} as const;

export const acceptanceFlows: AcceptanceFlow[] = [
  {
    id: "vn_authority_contract",
    label: "VN authority contract",
    kind: "runtime_contract",
    entryPath:
      "Synthetic publishContent payload -> startScenario -> skill checks -> recordChoice",
    smokeCommand: "smoke:vn-authority",
    smokeLabel: "VN authority",
    includeInSmokeAll: true,
    gates: {
      extract: false,
      manifest: false,
      drift: false,
    },
    notes: "Reducer contract smoke; does not depend on extracted Obsidian content.",
  },
  {
    id: "map_authority_contract",
    label: "Map authority contract",
    kind: "runtime_contract",
    entryPath:
      "Synthetic map snapshot -> publishContent -> mapInteract -> travel/start_scenario",
    smokeCommand: "smoke:map-authority",
    smokeLabel: "Map authority",
    includeInSmokeAll: true,
    gates: {
      extract: false,
      manifest: false,
      drift: false,
    },
    notes: "Verifies snapshot-based map bindings and interaction guards.",
  },
  {
    id: "battle_authority_contract",
    label: "Battle authority contract",
    kind: "runtime_contract",
    entryPath:
      "Synthetic VN/map payload -> open_battle_mode -> play cards -> enemy turn -> outcome -> return",
    smokeCommand: "smoke:battle-authority",
    smokeLabel: "Battle authority",
    includeInSmokeAll: true,
    gates: {
      extract: false,
      manifest: false,
      drift: false,
    },
    notes:
      "Verifies battle_session authority, map/VN entry points, deterministic duel resolution, and return flow.",
  },
  {
    id: "freiburg_origin_entry",
    label: "Freiburg origin entry",
    kind: "player_flow",
    entryPath:
      "HomePage -> Freiburg 1905 -> OriginSelectionScreen -> beginFreiburgOrigin -> intro_*",
    smokeCommand: "smoke:origin-entry",
    smokeLabel: "Origin entry",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes: "Snapshot-backed player entry flow for Freiburg origins.",
  },
  {
    id: "freiburg_origin_handoff",
    label: "Freiburg intro handoff",
    kind: "player_flow",
    entryPath:
      "sandbox_intro_pilot -> language/origin choices -> intro_journalist completion route",
    smokeCommand: "smoke:origin-handoff",
    smokeLabel: "Origin handoff",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Locks the onboarding-to-origin handoff contract and completion-route blockers.",
  },
  {
    id: "freiburg_case_slice",
    label: "Freiburg case slice",
    kind: "player_flow",
    entryPath:
      "Agency/Map -> sandbox_banker_pilot + sandbox_dog_pilot + sandbox_ghost_pilot",
    smokeCommand: "smoke:mvp-routes",
    smokeLabel: "MVP routes",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Thin supported case slice before Karlsruhe: banker duel plus dog, ghost, and case bridge routing.",
  },
  {
    id: "freiburg_banker_duel",
    label: "Banker social duel slice",
    kind: "player_flow",
    entryPath:
      "sandbox_banker_pilot -> BANK_LEAD_CASINO -> sandbox_son_duel -> wrapper/fallout",
    smokeCommand: "smoke:banker-duel",
    smokeLabel: "Banker duel",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Snapshot-backed banker confrontation flow covering authoritative battle resolution and VN fallout flags.",
  },
  {
    id: "mind_palace_loop",
    label: "Mind Palace loop",
    kind: "player_flow",
    entryPath:
      "Debug tab -> Start Demo Case -> discoverFact -> validateHypothesis",
    smokeCommand: "smoke:mindpalace",
    smokeLabel: "MindPalace",
    includeInSmokeAll: true,
    gates: {
      extract: false,
      manifest: false,
      drift: false,
    },
    notes:
      "Synthetic smoke for deterministic Mind Palace contract; manual loop checklist lives in docs/GAMEPLAY_LOOP_POC_CHECKLIST.md.",
  },
  {
    id: "freiburg_dog_deduction",
    label: "Dog deduction resolution",
    kind: "player_flow",
    entryPath:
      "sandbox_dog_pilot -> case_dog_trail -> discover route facts -> validate hypotheses",
    smokeCommand: "smoke:dog-deduction",
    smokeLabel: "Dog Deduction",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Snapshot-backed deduction smoke for Freiburg evidence-to-hypothesis closure.",
  },
];

export interface SmokePipelineStep {
  label: string;
  script: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const yesNo = (value: boolean): string => (value ? "required" : "n/a");

export const getSmokeAllPipeline = (): SmokePipelineStep[] =>
  acceptanceFlows
    .filter((flow) => flow.includeInSmokeAll)
    .map((flow) => ({
      label: flow.smokeLabel,
      script: flow.smokeCommand,
    }));

const readPackageScripts = (): Record<string, string> => {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8"),
  ) as Partial<{
    scripts: Record<string, string>;
  }>;

  return packageJson.scripts ?? {};
};

export const validateAcceptanceMatrix = (
  scripts: Record<string, string> = readPackageScripts(),
): void => {
  if (acceptanceFlows.length === 0) {
    throw new Error("acceptance matrix must contain at least one supported flow");
  }

  const seenIds = new Set<string>();
  const seenSmokeCommands = new Set<string>();
  for (const flow of acceptanceFlows) {
    if (seenIds.has(flow.id)) {
      throw new Error(`duplicate acceptance flow id '${flow.id}'`);
    }
    if (seenSmokeCommands.has(flow.smokeCommand)) {
      throw new Error(`duplicate smoke command '${flow.smokeCommand}'`);
    }
    seenIds.add(flow.id);
    seenSmokeCommands.add(flow.smokeCommand);

    if (!flow.entryPath.trim()) {
      throw new Error(`acceptance flow '${flow.id}' is missing entryPath`);
    }

    if (!scripts[flow.smokeCommand]) {
      throw new Error(
        `acceptance flow '${flow.id}' references missing script '${flow.smokeCommand}'`,
      );
    }

    if (flow.gates.extract && !scripts[CONTENT_GATE_COMMANDS.extract]) {
      throw new Error(
        `acceptance flow '${flow.id}' requires missing gate '${CONTENT_GATE_COMMANDS.extract}'`,
      );
    }

    if (flow.gates.manifest && !scripts[CONTENT_GATE_COMMANDS.manifest]) {
      throw new Error(
        `acceptance flow '${flow.id}' requires missing gate '${CONTENT_GATE_COMMANDS.manifest}'`,
      );
    }

    if (flow.gates.drift && !scripts[CONTENT_GATE_COMMANDS.drift]) {
      throw new Error(
        `acceptance flow '${flow.id}' requires missing gate '${CONTENT_GATE_COMMANDS.drift}'`,
      );
    }
  }

  if (getSmokeAllPipeline().length === 0) {
    throw new Error("smoke:all pipeline resolved to zero steps");
  }
};

export const formatAcceptanceMatrixMarkdown = (
  flows: ReadonlyArray<AcceptanceFlow> = acceptanceFlows,
): string => {
  const lines = [
    "# Acceptance Matrix",
    "",
    "| Supported flow | Type | Entry path | Smoke command | Extract | Manifest | Drift |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const flow of flows) {
    lines.push(
      `| \`${flow.id}\` | ${flow.kind} | ${flow.entryPath} | \`bun run ${flow.smokeCommand}\` | ${yesNo(flow.gates.extract)} | ${yesNo(flow.gates.manifest)} | ${yesNo(flow.gates.drift)} |`,
    );
  }

  lines.push("");
  lines.push(
    "Source of truth: `scripts/acceptance-matrix.ts`. Snapshot-backed flows require content gates before smoke execution.",
  );
  return lines.join("\n");
};

if (import.meta.main) {
  validateAcceptanceMatrix();
  console.log(formatAcceptanceMatrixMarkdown());
}
