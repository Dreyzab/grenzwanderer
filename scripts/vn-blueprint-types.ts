import type {
  VnChoice,
  VnCondition,
  VnDiceMode,
  VnEffect,
  VnNode,
  VnScenarioCompletionRoute,
  VnSkillCheck,
} from "../src/features/vn/types";

export type ChoiceBlueprint = VnChoice;

export type NodeBlueprint = {
  id: string;
  scenarioId: string;
  sourcePath: string;
  defaultLocale?: string;
  sourcePathByLocale?: Record<string, string>;
  terminal?: boolean;
  choices: ChoiceBlueprint[];
  fallbackBody?: string;
  onEnter?: VnEffect[];
  preconditions?: VnCondition[];
  passiveChecks?: VnSkillCheck[];
  backgroundUrl?: string;
  characterId?: string;
  voicePresenceMode?: VnNode["voicePresenceMode"];
  activeSpeakers?: string[];
  titleOverride?: string;
  bodyOverride?: string;
};

export type ScenarioBlueprint = {
  id: string;
  title: string;
  startNodeId: string;
  nodeIds: string[];
  completionRoute?: VnScenarioCompletionRoute;
  completionRoutes?: VnScenarioCompletionRoute[];
  skillCheckDice?: VnDiceMode;
  mode?: "overlay" | "fullscreen";
  packId?: string;
  musicUrl?: string;
  defaultBackgroundUrl?: string;
};

export type BlueprintDiagnosticSeverity = "error" | "warning";

export interface BlueprintDiagnostic {
  code: string;
  message: string;
  relativePath: string;
  line: number;
  column: number;
  severity: BlueprintDiagnosticSeverity;
  providerName?: string;
  scenarioId?: string;
  nodeId?: string;
}

export type ScenarioMigrationMode = "legacy" | "compare" | "authoritative";

export interface ScenarioBlueprintBundle {
  providerName: string;
  migrationMode: ScenarioMigrationMode;
  scenario: ScenarioBlueprint;
  nodes: NodeBlueprint[];
}

export interface ScenarioBlueprintProviderResult {
  bundles: ScenarioBlueprintBundle[];
  diagnostics: BlueprintDiagnostic[];
}
