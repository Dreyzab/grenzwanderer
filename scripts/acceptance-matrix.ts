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
  drift: "content:drift:verify",
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
    notes:
      "Reducer contract smoke; does not depend on extracted Obsidian content.",
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
      "HomePage -> Freiburg 1905 -> OriginSelectionScreen -> beginFreiburgOrigin -> origin-specific intro -> default Case01 runtime entry",
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
    id: "freiburg_case01_entry",
    label: "Freiburg Case01 canonical entry",
    kind: "player_flow",
    entryPath:
      "case01_hbf_arrival -> Fritz priority choice -> loc_freiburg_bank or loc_rathaus",
    smokeCommand: "smoke:case01-entry",
    smokeLabel: "Case01 entry",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Locks the Case01-first supported runtime path and prevents legacy route ids from collapsing back into sandbox_case01_pilot.",
  },
  {
    id: "freiburg_case01_mainline",
    label: "Freiburg Case01 mainline",
    kind: "player_flow",
    entryPath:
      "Bank investigation -> lead phase -> Lotte interlude -> convergence -> archive/rail -> warehouse finale",
    smokeCommand: "smoke:case01-mainline",
    smokeLabel: "Case01 mainline",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Snapshot-backed Case01 canon for Freiburg. Pilot banker/dog/ghost routes remain side or dev content and no longer define the supported mainline.",
  },
  {
    id: "freiburg_case01_branches",
    label: "Freiburg Case01 branch outcomes",
    kind: "player_flow",
    entryPath:
      "Mayor/lead/estate authored runtime scenes -> Lotte interlude -> convergence_route -> warehouse outcome",
    smokeCommand: "smoke:case01-branches",
    smokeLabel: "Case01 branches",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Locks authored Obsidian ownership for Case01 branch scenes and preserves the canonical bureau_trace_found, convergence_route, and case01_final_outcome contracts.",
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
    id: "freiburg_social_access",
    label: "Freiburg social access",
    kind: "player_flow",
    entryPath:
      "Map -> Workers' Pub rumor route -> Hbf verification -> Agency service unlock -> Student House access",
    smokeCommand: "smoke:social-access",
    smokeLabel: "Social access",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Locks the Freiburg student-house route behind verified rumor plus favor-or-standing gating, then confirms the matching VN access path.",
  },
  {
    id: "freiburg_rumor_verification",
    label: "Freiburg rumor verification",
    kind: "player_flow",
    entryPath:
      "Workers' Pub map event -> sandbox_workers_pub_rumor -> Hbf verify rail yard whisper -> agency binding unlock",
    smokeCommand: "smoke:rumor-verification",
    smokeLabel: "Rumor verification",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Confirms rumor registration, verification, and the downstream agency service binding that only appears after verification.",
  },
  {
    id: "freiburg_agency_career_progression",
    label: "Freiburg agency career progression",
    kind: "player_flow",
    entryPath:
      "Verified rumor chain + preserved source network + banker closure -> junior_detective -> agency promotion review",
    smokeCommand: "smoke:agency-career",
    smokeLabel: "Agency career",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Keeps rank promotion tied to authoritative standing, criteria completion, and quest closure before a career_rank_gte-gated agency action unlocks.",
  },
  {
    id: "freiburg_service_unlock",
    label: "Freiburg service unlock",
    kind: "player_flow",
    entryPath:
      "Anna service definition -> sandbox_agency_service_unlock -> unlock_group(loc_student_house) -> new map route",
    smokeCommand: "smoke:service-unlock",
    smokeLabel: "Service unlock",
    includeInSmokeAll: true,
    gates: {
      extract: true,
      manifest: true,
      drift: true,
    },
    notes:
      "Verifies that a service defined in socialCatalog is not decorative and writes real runtime effects into map state.",
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
    throw new Error(
      "acceptance matrix must contain at least one supported flow",
    );
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
