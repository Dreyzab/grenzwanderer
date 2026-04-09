import {
  isValidSceneResultEnvelope,
  type SceneResultEnvelope,
} from "./sceneResultEnvelope";
import {
  isDialogueLayer,
  isKarmaBand,
  isVnAiMode,
  type DialogueLayer,
  type DifficultyBreakdownEntry,
  type KarmaBand,
  type VnAiMode,
} from "../../shared/game/narrativeResources";

export const AI_GENERATE_DIALOGUE_KIND = "generate_dialogue";
export const AI_GENERATE_CHARACTER_REACTION_KIND =
  "generate_character_reaction";
export const AI_DIALOGUE_SOURCE_SKILL_CHECK = "vn_skill_check";
export const AI_CHARACTER_REACTION_SOURCE_VN_SCENE = "vn_scene";
export const AI_CHARACTER_REACTION_SOURCE_MAP_INTERACTION = "map_interaction";
export const AI_CHARACTER_REACTION_SOURCE_QUEST_EVENT = "quest_event";

export interface DialogueEnsemble {
  mode: "solo" | "duet" | "chorus";
  peerVoiceIds?: string[];
}

export interface DialoguePsycheProfile {
  axisX: number;
  axisY: number;
  approach: number;
  dominantInnerVoiceId: string | null;
  activeInnerVoiceIds: string[];
}

export interface GenerateDialoguePayload {
  source: typeof AI_DIALOGUE_SOURCE_SKILL_CHECK;
  scenarioId: string;
  nodeId: string;
  checkId: string;
  choiceId: string;
  voiceId: string;
  choiceText: string;
  dialogueLayer?: DialogueLayer;
  aiMode?: VnAiMode;
  providenceCost?: number;
  karmaBand?: KarmaBand;
  passed: boolean;
  roll: number;
  difficulty: number;
  baseDifficulty?: number;
  voiceLevel: number;
  fortuneSpend?: number;
  locationName: string;
  characterName?: string;
  narrativeText: string;
  ensemble?: DialogueEnsemble;
  outcomeGrade?: "fail" | "success" | "critical" | "success_with_cost";
  breakdown?: { source: string; sourceId: string; delta: number }[];
  difficultyBreakdown?: DifficultyBreakdownEntry[];
  margin?: number;
  voicePresenceMode?: "text_variability" | "parliament" | "mechanical_voice";
  activeSpeakers?: string[];
  psycheProfile?: DialoguePsycheProfile;
  sceneResultEnvelope?: SceneResultEnvelope;
}

export interface GenerateDialogueResponse {
  text: string;
  canonicalVoiceId: string;
}

export interface DialogueMetadata {
  promptTokens?: number;
  completionTokens?: number;
  modelId?: string;
  latencyMs?: number;
}

export interface SuggestedEffect {
  type: "mood_shift" | "trust_delta" | "clue_hint" | "hypothesis_focus";
  target?: string;
  value: number | string;
}

export interface GenerateDialogueEnvelope extends GenerateDialogueResponse {
  metadata?: DialogueMetadata;
  suggestedEffects?: SuggestedEffect[];
}

export type CharacterReactionSource =
  | typeof AI_CHARACTER_REACTION_SOURCE_VN_SCENE
  | typeof AI_CHARACTER_REACTION_SOURCE_MAP_INTERACTION
  | typeof AI_CHARACTER_REACTION_SOURCE_QUEST_EVENT;

export type CharacterDisposition =
  | "hostile"
  | "guarded"
  | "neutral"
  | "warm"
  | "devoted";

export interface CharacterRelationshipState {
  trust: number;
  disposition: CharacterDisposition;
}

export const trustToDisposition = (trust: number): CharacterDisposition => {
  if (trust >= 60) {
    return "devoted";
  }
  if (trust >= 25) {
    return "warm";
  }
  if (trust >= -9) {
    return "neutral";
  }
  if (trust >= -39) {
    return "guarded";
  }
  return "hostile";
};

export interface GenerateCharacterReactionPayload {
  source: CharacterReactionSource;
  characterId: string;
  scenarioId: string;
  nodeId?: string;
  eventText: string;
  playerPrompt?: string;
  visibleFacts: string[];
  relationshipState: CharacterRelationshipState;
}

export interface CharacterReactionProposal {
  characterId: string;
  reactionType:
    | "dialogue"
    | "lie"
    | "evasion"
    | "request"
    | "conflict"
    | "silence";
  text: string;
  revealHintFactId?: string;
  suggestedEffects?: SuggestedEffect[];
}

export const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }

  return null;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isDialogueEnsemble = (value: unknown): value is DialogueEnsemble => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const ensemble = value as Record<string, unknown>;
  return (
    (ensemble.mode === "solo" ||
      ensemble.mode === "duet" ||
      ensemble.mode === "chorus") &&
    (ensemble.peerVoiceIds === undefined ||
      (Array.isArray(ensemble.peerVoiceIds) &&
        ensemble.peerVoiceIds.every((entry) => typeof entry === "string")))
  );
};

const isOutcomeGrade = (
  value: unknown,
): value is GenerateDialoguePayload["outcomeGrade"] =>
  value === "fail" ||
  value === "success" ||
  value === "critical" ||
  value === "success_with_cost";

const isBreakdownEntry = (
  value: unknown,
): value is NonNullable<GenerateDialoguePayload["breakdown"]>[number] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.source === "string" &&
    typeof entry.sourceId === "string" &&
    isFiniteNumber(entry.delta)
  );
};

const isDifficultyBreakdownEntry = (
  value: unknown,
): value is DifficultyBreakdownEntry => isBreakdownEntry(value);

const isVoicePresenceMode = (
  value: unknown,
): value is GenerateDialoguePayload["voicePresenceMode"] =>
  value === "text_variability" ||
  value === "parliament" ||
  value === "mechanical_voice";

const isSuggestedEffect = (value: unknown): value is SuggestedEffect => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const effect = value as Record<string, unknown>;
  return (
    (effect.type === "mood_shift" ||
      effect.type === "trust_delta" ||
      effect.type === "clue_hint" ||
      effect.type === "hypothesis_focus") &&
    (effect.target === undefined || typeof effect.target === "string") &&
    (typeof effect.value === "number" || typeof effect.value === "string")
  );
};

const isDialoguePsycheProfile = (
  value: unknown,
): value is DialoguePsycheProfile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    isFiniteNumber(profile.axisX) &&
    isFiniteNumber(profile.axisY) &&
    isFiniteNumber(profile.approach) &&
    (profile.dominantInnerVoiceId === null ||
      typeof profile.dominantInnerVoiceId === "string") &&
    Array.isArray(profile.activeInnerVoiceIds) &&
    profile.activeInnerVoiceIds.every((entry) => typeof entry === "string")
  );
};

const isDialogueMetadata = (value: unknown): value is DialogueMetadata => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const metadata = value as Record<string, unknown>;
  return (
    (metadata.promptTokens === undefined ||
      isFiniteNumber(metadata.promptTokens)) &&
    (metadata.completionTokens === undefined ||
      isFiniteNumber(metadata.completionTokens)) &&
    (metadata.modelId === undefined || typeof metadata.modelId === "string") &&
    (metadata.latencyMs === undefined || isFiniteNumber(metadata.latencyMs))
  );
};

const isCharacterDisposition = (
  value: unknown,
): value is CharacterDisposition =>
  value === "hostile" ||
  value === "guarded" ||
  value === "neutral" ||
  value === "warm" ||
  value === "devoted";

const isCharacterReactionSource = (
  value: unknown,
): value is CharacterReactionSource =>
  value === AI_CHARACTER_REACTION_SOURCE_VN_SCENE ||
  value === AI_CHARACTER_REACTION_SOURCE_MAP_INTERACTION ||
  value === AI_CHARACTER_REACTION_SOURCE_QUEST_EVENT;

const isCharacterRelationshipState = (
  value: unknown,
): value is CharacterRelationshipState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Record<string, unknown>;
  return (
    isFiniteNumber(state.trust) && isCharacterDisposition(state.disposition)
  );
};

export const isGenerateDialoguePayload = (
  value: unknown,
): value is GenerateDialoguePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    payload.source === AI_DIALOGUE_SOURCE_SKILL_CHECK &&
    typeof payload.scenarioId === "string" &&
    typeof payload.nodeId === "string" &&
    typeof payload.checkId === "string" &&
    typeof payload.choiceId === "string" &&
    typeof payload.voiceId === "string" &&
    typeof payload.choiceText === "string" &&
    (payload.dialogueLayer === undefined ||
      isDialogueLayer(payload.dialogueLayer)) &&
    (payload.aiMode === undefined || isVnAiMode(payload.aiMode)) &&
    (payload.providenceCost === undefined ||
      isFiniteNumber(payload.providenceCost)) &&
    (payload.karmaBand === undefined || isKarmaBand(payload.karmaBand)) &&
    typeof payload.passed === "boolean" &&
    isFiniteNumber(payload.roll) &&
    isFiniteNumber(payload.difficulty) &&
    (payload.baseDifficulty === undefined ||
      isFiniteNumber(payload.baseDifficulty)) &&
    isFiniteNumber(payload.voiceLevel) &&
    (payload.fortuneSpend === undefined ||
      isFiniteNumber(payload.fortuneSpend)) &&
    typeof payload.locationName === "string" &&
    (payload.characterName === undefined ||
      typeof payload.characterName === "string") &&
    typeof payload.narrativeText === "string" &&
    (payload.ensemble === undefined || isDialogueEnsemble(payload.ensemble)) &&
    (payload.outcomeGrade === undefined ||
      isOutcomeGrade(payload.outcomeGrade)) &&
    (payload.breakdown === undefined ||
      (Array.isArray(payload.breakdown) &&
        payload.breakdown.every(isBreakdownEntry))) &&
    (payload.difficultyBreakdown === undefined ||
      (Array.isArray(payload.difficultyBreakdown) &&
        payload.difficultyBreakdown.every(isDifficultyBreakdownEntry))) &&
    (payload.margin === undefined || isFiniteNumber(payload.margin)) &&
    (payload.voicePresenceMode === undefined ||
      isVoicePresenceMode(payload.voicePresenceMode)) &&
    (payload.activeSpeakers === undefined ||
      (Array.isArray(payload.activeSpeakers) &&
        payload.activeSpeakers.every((entry) => typeof entry === "string"))) &&
    (payload.psycheProfile === undefined ||
      isDialoguePsycheProfile(payload.psycheProfile)) &&
    (payload.sceneResultEnvelope === undefined ||
      isValidSceneResultEnvelope(payload.sceneResultEnvelope))
  );
};

export const parseGenerateDialoguePayload = (
  value: string | null | undefined,
): GenerateDialoguePayload | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isGenerateDialoguePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const isGenerateDialogueResponse = (
  value: unknown,
): value is GenerateDialogueResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.text === "string" &&
    response.text.trim().length > 0 &&
    typeof response.canonicalVoiceId === "string" &&
    response.canonicalVoiceId.trim().length > 0
  );
};

export const isGenerateDialogueEnvelope = (
  value: unknown,
): value is GenerateDialogueEnvelope => {
  if (!isGenerateDialogueResponse(value)) {
    return false;
  }

  const response = value as unknown as Record<string, unknown>;
  return (
    (response.metadata === undefined ||
      isDialogueMetadata(response.metadata)) &&
    (response.suggestedEffects === undefined ||
      (Array.isArray(response.suggestedEffects) &&
        response.suggestedEffects.every(isSuggestedEffect)))
  );
};

export const parseGenerateDialogueResponse = (
  value: unknown,
): GenerateDialogueResponse | null => {
  const raw = unwrapOptionalString(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isGenerateDialogueResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const parseGenerateDialogueEnvelope = (
  value: unknown,
): GenerateDialogueEnvelope | null => {
  const raw = unwrapOptionalString(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isGenerateDialogueEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const isGenerateCharacterReactionPayload = (
  value: unknown,
): value is GenerateCharacterReactionPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    isCharacterReactionSource(payload.source) &&
    typeof payload.characterId === "string" &&
    typeof payload.scenarioId === "string" &&
    (payload.nodeId === undefined || typeof payload.nodeId === "string") &&
    typeof payload.eventText === "string" &&
    (payload.playerPrompt === undefined ||
      typeof payload.playerPrompt === "string") &&
    Array.isArray(payload.visibleFacts) &&
    payload.visibleFacts.every((entry) => typeof entry === "string") &&
    isCharacterRelationshipState(payload.relationshipState)
  );
};

export const parseGenerateCharacterReactionPayload = (
  value: string | null | undefined,
): GenerateCharacterReactionPayload | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isGenerateCharacterReactionPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const isCharacterReactionProposal = (
  value: unknown,
): value is CharacterReactionProposal => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proposal = value as Record<string, unknown>;
  return (
    typeof proposal.characterId === "string" &&
    (proposal.reactionType === "dialogue" ||
      proposal.reactionType === "lie" ||
      proposal.reactionType === "evasion" ||
      proposal.reactionType === "request" ||
      proposal.reactionType === "conflict" ||
      proposal.reactionType === "silence") &&
    typeof proposal.text === "string" &&
    proposal.text.trim().length > 0 &&
    (proposal.revealHintFactId === undefined ||
      typeof proposal.revealHintFactId === "string") &&
    (proposal.suggestedEffects === undefined ||
      (Array.isArray(proposal.suggestedEffects) &&
        proposal.suggestedEffects.every(isSuggestedEffect)))
  );
};

export const parseCharacterReactionProposal = (
  value: unknown,
): CharacterReactionProposal | null => {
  const raw = unwrapOptionalString(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isCharacterReactionProposal(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const matchesSkillCheckThought = (
  payload: GenerateDialoguePayload | null,
  scenarioId: string,
  nodeId: string,
  checkId?: string,
  choiceId?: string,
  dialogueLayer?: DialogueLayer,
): boolean => {
  if (!payload) {
    return false;
  }

  if (payload.scenarioId !== scenarioId || payload.nodeId !== nodeId) {
    return false;
  }

  if (checkId && payload.checkId !== checkId) {
    return false;
  }

  if (choiceId && payload.choiceId !== choiceId) {
    return false;
  }

  if (dialogueLayer && payload.dialogueLayer !== dialogueLayer) {
    return false;
  }

  return true;
};
