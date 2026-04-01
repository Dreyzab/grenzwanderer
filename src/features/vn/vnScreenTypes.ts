import type {
  InnerVoiceRole,
  InnerVoiceStance,
} from "../../../data/innerVoiceContract";
import type { SkillCheckVoicePalette } from "./skillCheckPalette";
import type { VnChoice } from "./types";
import type { FrozenSkillCheckPresentation } from "./ui/VnSkillCheckResolveOverlay";

export interface AwaitingSkillChoice {
  scenarioId: string;
  nodeId: string;
  choiceId: string;
  checkId: string;
  choiceText: string;
  voiceId: string;
  voiceLabel: string;
  diceMode: "d20" | "d10";
  chancePercent?: number;
  frozen: FrozenSkillCheckPresentation;
}

export interface ActiveAiThoughtContext {
  scenarioId: string;
  nodeId: string;
  checkId: string;
  choiceId: string;
  voiceId: string;
  choiceText: string;
  resultCreatedAtMicros: bigint;
}

export interface ActiveReactionContext {
  scenarioId: string;
  nodeId: string;
  characterId: string;
  sessionPointer: string;
  sessionUpdatedAtMicros: bigint;
  reactionKey: string;
}

export type SkillCheckResultLike = {
  resultKey: string;
  playerId: unknown;
  scenarioId: string;
  nodeId: string;
  checkId: string;
  roll: number;
  voiceLevel: number;
  difficulty: number;
  passed: boolean;
  nextNodeId: unknown;
  breakdownJson?: unknown;
  outcomeGrade?: unknown;
  createdAt: unknown;
};

export type SkillCheckAiStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type TransitionState =
  | "idle"
  | "autostarting"
  | "choice_pending"
  | "handoff_in_flight"
  | "handoff_failed";

export type ChoiceSkillCheckState =
  | "idle"
  | "arming"
  | "rolling"
  | "impact_success"
  | "impact_fail"
  | "result_success"
  | "result_fail";

export interface ChoiceDisplayItem {
  choice: VnChoice;
  index: number;
  chancePercent?: number;
  skillCheckState: ChoiceSkillCheckState;
  isVisited: boolean;
  isLocked: boolean;
  isPending: boolean;
  hasFailedCheck: boolean;
  innerVoiceHints: ChoiceInnerVoiceHintDisplay[];
}

export interface InlineStatusCard {
  title: string;
  eyebrow: string;
  body: string;
  tone: "reaction" | "thought";
}

export interface InnerVoiceCardDisplay {
  voiceId: string;
  label: string;
  text: string;
  role: InnerVoiceRole;
  stance: InnerVoiceStance;
  resonance: number;
  palette: SkillCheckVoicePalette;
}

export interface ChoiceInnerVoiceHintDisplay {
  voiceId: string;
  label: string;
  text: string;
  stance: InnerVoiceStance;
  palette: SkillCheckVoicePalette;
}
