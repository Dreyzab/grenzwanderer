import { isChoiceVisible, type VnChoiceEvaluationContext } from "./vnContent";
import type {
  VnChoice,
  VnDiceMode,
  VnNode,
  VnScenario,
  VnSnapshot,
} from "./types";
import { resolveBackgroundUrl } from "./ui/VnBackgroundResolver";
import type {
  FrozenSkillCheckPresentation,
  VnSkillCheckResolvePhase,
  VnSkillCheckResolveState,
} from "./ui/VnSkillCheckResolveOverlay";
import {
  formatSpeaker,
  formatVoiceLabel,
  hasOptionalValue,
  isAutoContinueChoice,
  normalizeBody,
  unwrapOptionalString,
} from "./vnScreenUtils";
import type {
  AwaitingSkillChoice,
  SkillCheckResultLike,
} from "./vnScreenTypes";

export const ACTIVE_SKILL_ARMING_MS = 300;
export const ACTIVE_SKILL_ROLLING_MS = 1200;
export const ACTIVE_SKILL_IMPACT_MS = 500;

type FrozenNodeLike = Pick<
  VnNode,
  "id" | "body" | "backgroundUrl" | "characterId" | "terminal" | "choices"
> | null;

interface CreateFrozenSkillCheckPresentationParams {
  selectedScenarioId: string;
  selectedScenario: VnScenario | null;
  snapshot: VnSnapshot | null;
  currentNode: FrozenNodeLike;
  mySession: { completedAt?: unknown } | null;
  sessionReady: boolean;
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  choiceEvaluationContext: VnChoiceEvaluationContext;
  tSessionHydrating: string;
  tUnknownScenario: string;
}

interface CreateAwaitingSkillChoiceParams {
  scenarioId: string;
  nodeId: string;
  choice: Pick<VnChoice, "id" | "text" | "skillCheck">;
  diceMode: VnDiceMode;
  chancePercent?: number;
  effectiveDifficulty: number;
  fortuneSpend: number;
  fortuneBalance: number;
  effectiveFortune: number;
  aiMode?: AwaitingSkillChoice["aiMode"];
  providenceCost: number;
  karmaBand: AwaitingSkillChoice["karmaBand"];
  difficultyBreakdown: NonNullable<AwaitingSkillChoice["difficultyBreakdown"]>;
  frozen: FrozenSkillCheckPresentation;
}

export type ExistingSkillResultKind = "passed" | "failed" | "branched";

export const createFrozenSkillCheckPresentation = ({
  selectedScenarioId,
  selectedScenario,
  snapshot,
  currentNode,
  mySession,
  sessionReady,
  myFlags,
  myVars,
  choiceEvaluationContext,
  tSessionHydrating,
  tUnknownScenario,
}: CreateFrozenSkillCheckPresentationParams): FrozenSkillCheckPresentation => {
  const fallbackSpeakerLabel = formatSpeaker(
    currentNode?.characterId,
    snapshot,
  );

  return {
    locationName: selectedScenario?.title ?? tUnknownScenario,
    characterName:
      fallbackSpeakerLabel === "Narrator" ? undefined : fallbackSpeakerLabel,
    narrativeText: currentNode
      ? normalizeBody(currentNode.body)
      : sessionReady
        ? ""
        : tSessionHydrating,
    backgroundImageUrl:
      resolveBackgroundUrl(
        currentNode?.backgroundUrl,
        selectedScenario?.defaultBackgroundUrl,
      ) ?? undefined,
    visibleChoices:
      currentNode?.choices.filter(
        (choice) =>
          !isAutoContinueChoice(choice) &&
          isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
      ) ?? [],
    autoContinueChoice:
      currentNode?.choices.find(
        (choice) =>
          isAutoContinueChoice(choice) &&
          isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
      ) ?? null,
    showOriginCards:
      selectedScenarioId === "sandbox_intro_pilot" &&
      currentNode?.id === "scene_backstory_select",
    isScenarioCompleted: Boolean(
      mySession &&
      currentNode &&
      currentNode.terminal &&
      hasOptionalValue(mySession.completedAt),
    ),
  };
};

export const createAwaitingSkillChoice = ({
  scenarioId,
  nodeId,
  choice,
  diceMode,
  chancePercent,
  effectiveDifficulty,
  fortuneSpend,
  fortuneBalance,
  effectiveFortune,
  aiMode,
  providenceCost,
  karmaBand,
  difficultyBreakdown,
  frozen,
}: CreateAwaitingSkillChoiceParams): AwaitingSkillChoice => ({
  scenarioId,
  nodeId,
  choiceId: choice.id,
  checkId: choice.skillCheck!.id,
  choiceText: choice.text,
  voiceId: choice.skillCheck!.voiceId,
  voiceLabel: formatVoiceLabel(choice.skillCheck!.voiceId),
  diceMode,
  chancePercent,
  baseDifficulty: choice.skillCheck!.difficulty,
  effectiveDifficulty,
  fortuneSpend,
  fortuneBalance,
  effectiveFortune,
  aiMode,
  providenceCost,
  karmaBand,
  difficultyBreakdown,
  frozen,
});

export const buildActiveSkillResolveState = (
  pending: AwaitingSkillChoice,
  phase: VnSkillCheckResolvePhase,
  matchedResult?: SkillCheckResultLike | null,
): VnSkillCheckResolveState => ({
  scenarioId: pending.scenarioId,
  nodeId: pending.nodeId,
  checkId: pending.checkId,
  choiceId: pending.choiceId,
  choiceText: pending.choiceText,
  voiceId: pending.voiceId,
  voiceLabel: pending.voiceLabel,
  diceMode: pending.diceMode,
  chancePercent: pending.chancePercent,
  baseDifficulty: pending.baseDifficulty,
  difficulty: matchedResult?.difficulty ?? pending.effectiveDifficulty,
  fortuneSpend: pending.fortuneSpend,
  fortuneBalance: pending.fortuneBalance,
  effectiveFortune: pending.effectiveFortune,
  difficultyBreakdown: pending.difficultyBreakdown,
  phase,
  passed: matchedResult?.passed,
  roll: matchedResult?.roll,
  voiceLevel: matchedResult?.voiceLevel,
  nextNodeId: matchedResult
    ? unwrapOptionalString(matchedResult.nextNodeId)
    : undefined,
  frozen: pending.frozen,
});

export const hydrateResolvedSkillState = (
  base: VnSkillCheckResolveState,
  matchedResult: SkillCheckResultLike,
  phase: VnSkillCheckResolvePhase,
): VnSkillCheckResolveState => ({
  ...base,
  phase,
  passed: matchedResult.passed,
  roll: matchedResult.roll,
  voiceLevel: matchedResult.voiceLevel,
  difficulty: matchedResult.difficulty,
  baseDifficulty: matchedResult.baseDifficulty ?? base.baseDifficulty,
  fortuneSpend: matchedResult.fortuneSpent ?? base.fortuneSpend,
  nextNodeId: unwrapOptionalString(matchedResult.nextNodeId),
});

export const classifyExistingSkillResult = (
  matchedResult: SkillCheckResultLike,
): ExistingSkillResultKind => {
  if (unwrapOptionalString(matchedResult.nextNodeId)) {
    return "branched";
  }

  return matchedResult.passed ? "passed" : "failed";
};
