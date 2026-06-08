import {
  isValidSceneResultEnvelope,
  type SceneResultEnvelope,
} from "./sceneResultEnvelope";
import {
  RESOURCE_FATE_TOKEN_VAR,
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_KARMA_VAR,
  isDialogueLayer,
  isKarmaBand,
  isVnAiMode,
  type DialogueLayer,
  type DifficultyBreakdownEntry,
  type KarmaBand,
  type VnAiMode,
} from "../../shared/game/narrativeResources";
import {
  WITCH_ALCOHOL_AFTERTASTE_VAR,
  WITCH_BLOOD_CURSE_PRESSURE_VAR,
  WITCH_BLOOD_CURSE_TIER_VAR,
  WITCH_BLOOD_DEBT_VAR,
  WITCH_BLOOD_POWER_VAR,
} from "../../shared/game/witchRules";

export const AI_GENERATE_DIALOGUE_KIND = "generate_dialogue";
export const AI_GENERATE_CHARACTER_REACTION_KIND =
  "generate_character_reaction";
export const AI_PROPOSE_DIRECTOR_STEP_KIND = "propose_director_step";
export const AI_PROPOSE_DM_TURN_KIND = "propose_dm_turn";
export const AI_DIALOGUE_SOURCE_SKILL_CHECK = "vn_skill_check";
export const AI_CHARACTER_REACTION_SOURCE_VN_SCENE = "vn_scene";
export const AI_CHARACTER_REACTION_SOURCE_MAP_INTERACTION = "map_interaction";
export const AI_CHARACTER_REACTION_SOURCE_QUEST_EVENT = "quest_event";
export const AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY = "vn_node_entry";
export const AI_DM_TURN_SOURCE_SIDE_PANEL = "dm_side_panel";

export const DIRECTOR_STEP_TYPES = [
  "framing",
  "next_beat_hint",
  "soft_detour",
] as const;
export type DirectorStepType = (typeof DIRECTOR_STEP_TYPES)[number];

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

/**
 * Structured rewrite context attached to a generation payload when a creator
 * regenerates an existing beat/line from a low quality rating. Replaces the
 * legacy hack of appending author notes into `actionText` as freeform text.
 */
export interface RegenerationContext {
  previousOutput: string;
  authorFeedback: string;
  rating?: number;
  qualityIssues?: string[];
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
  regenerationContext?: RegenerationContext;
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
  // Topics this NPC is primed on / steers toward in the scene.
  topics?: readonly string[];
  // The NPC's relative memory — what THIS character knows/remembers (may differ
  // from the objective truth and from what other characters know).
  npcMemory?: readonly string[];
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

const suggestedEffectJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: ["mood_shift", "trust_delta", "clue_hint", "hypothesis_focus"],
      description:
        "Display-only effect suggestion. The app never auto-applies this to game state.",
    },
    target: {
      type: "string",
      description: "Optional target id for display context.",
    },
    value: {
      anyOf: [{ type: "number" }, { type: "string" }],
      description: "Display-only effect value.",
    },
  },
  required: ["type", "value"],
  propertyOrdering: ["type", "target", "value"],
} as const;

export const GENERATE_DIALOGUE_ENVELOPE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: {
      type: "string",
      description:
        "A short additive inner-thought line. It must not resolve the scene or mutate facts.",
    },
    canonicalVoiceId: {
      type: "string",
      description: "Canonical inner voice id used to render the thought.",
    },
    suggestedEffects: {
      type: "array",
      description:
        "Optional display-only suggestions. They are never auto-applied by the client or server.",
      items: suggestedEffectJsonSchema,
      maxItems: 3,
    },
  },
  required: ["text", "canonicalVoiceId"],
  propertyOrdering: ["text", "canonicalVoiceId", "suggestedEffects"],
} as const;

export type DirectorStepSource = typeof AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY;

export interface DirectorStepActiveQuest {
  questId: string;
  stage: number;
}

export interface GenerateDirectorStepPayload {
  source: DirectorStepSource;
  scenarioId: string;
  nodeId: string;
  currentBeatId: string;
  allowedBeatIds: readonly string[];
  visibleFacts: readonly string[];
  activeFlags: readonly string[];
  activeQuests: readonly DirectorStepActiveQuest[];
  routeContext?: string;
}

export interface DirectorStepProposal {
  stepType: DirectorStepType;
  framingText: string;
  suggestedReturnBeatId: string;
  bridgeText?: string;
  hintFactId?: string;
}

export const DM_TONE_MODES = [
  "safe_chekhovian",
  "gothic_mystery",
  "threat",
] as const;
export type DmToneMode = (typeof DM_TONE_MODES)[number];

export const DM_MOVE_TAGS = [
  "selfish",
  "coercive",
  "survival",
  "protective",
  "cooperative",
  "occult",
  "social",
  "investigation",
] as const;
export type DmMoveTag = (typeof DM_MOVE_TAGS)[number];

export interface PlayerRemark {
  text: string;
  visibility: "private_dm";
}

export interface SessionCanonFact {
  id: string;
  text: string;
  scope: "session";
  source: "dm";
  status: "proposed" | "accepted";
  relatedNpcIds?: string[];
  relatedLocationIds?: string[];
}

export interface DmSuggestedStateDelta {
  key: string;
  kind: "set_flag" | "set_var" | "add_var";
  value: boolean | number;
  reason: string;
}

export type InnerVoiceStance = "supports" | "opposes";
export type InnerVoiceRole = "dominant" | "support" | "counter";

// One of the player's currently-resonant inner voices, supplied to the DM so it
// can voice a short in-character debate before offering options.
export interface DmInnerVoiceInput {
  voiceId: string;
  role: InnerVoiceRole;
  stance: InnerVoiceStance;
  label: string;
  worldview: string;
  toneDescriptor: string;
}

// A single line spoken by an inner voice during the pre-decision debate.
export interface DmInnerVoiceLine {
  voiceId: string;
  stance: InnerVoiceStance;
  line: string;
}

// One of the (up to 3) concrete moves offered to the player after the debate.
// Choosing it loops back into a new DM turn as the next action.
export interface DmTurnOption {
  id: string;
  label: string;
  detail?: string;
}

// A single beat the player queues in the director console. The chain runner
// fires one DM turn per directive, in order, each continuing from the last.
// - atmosphere: slow sensory prose, no decision and no options.
// - complication: introduce an obstacle / raise stakes, no options.
// - debate_options: the inner-voice debate + exactly 3 options (decision beat).
export const BEAT_DIRECTIVE_KINDS = [
  "atmosphere",
  "complication",
  "debate_options",
] as const;
export type BeatDirectiveKind = (typeof BEAT_DIRECTIVE_KINDS)[number];

export interface BeatDirective {
  kind: BeatDirectiveKind;
}

export interface GenerateDmTurnPayload {
  source: typeof AI_DM_TURN_SOURCE_SIDE_PANEL;
  scenarioId: string;
  nodeId: string;
  actionText: string;
  remark?: PlayerRemark;
  spendFateToken: boolean;
  fortuneSpend?: number;
  moveTags: readonly DmMoveTag[];
  resources: {
    fate: number;
    fortune: number;
    fortuneMod: number;
    karma: number;
  };
  psyche: DialoguePsycheProfile;
  bloodCurse: {
    tier: number;
    pressure: number;
    power: number;
    debt: number;
    alcoholAftertaste: number;
  };
  activeSessionFacts: readonly SessionCanonFact[];
  acceptedRemarks: readonly PlayerRemark[];
  visibleFacts: readonly string[];
  activeFlags: readonly string[];
  // The player's currently-resonant inner voices (dominant/support/counter).
  innerVoices?: readonly DmInnerVoiceInput[];
  // The previous DM narration, so the continuation stays consistent with it.
  priorNarration?: string;
  // What this beat should be when the director console chains beats.
  // Absent = the default decision beat (debate + options).
  beatDirective?: BeatDirective;
  toneMode: DmToneMode;
  locale: "ru";
  // Structured rewrite context when a creator regenerates this beat.
  regenerationContext?: RegenerationContext;
}

export interface DmTurnProposal {
  narration: string;
  // Short in-character debate among the supplied inner voices, shown before the options.
  innerVoiceDialogue?: DmInnerVoiceLine[];
  // Up to 3 concrete moves the player can pick; choosing one loops a new DM turn.
  options?: DmTurnOption[];
  checks: Array<{
    id: string;
    label: string;
    voiceId: string;
    difficulty: number;
    moveTags?: DmMoveTag[];
  }>;
  sessionFacts: SessionCanonFact[];
  suggestedStateDeltas: DmSuggestedStateDelta[];
  risks: string[];
  toneMode: DmToneMode;
  canonRemarks: string[];
  resourceCosts?: {
    fate?: number;
    fortune?: number;
  };
}

export const DIRECTOR_STEP_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    stepType: {
      type: "string",
      enum: DIRECTOR_STEP_TYPES,
      description:
        "How the director shapes the moment. framing recolors the current beat, next_beat_hint nudges toward an authored beat, soft_detour adds a presentation-only side moment that still returns to authored canon.",
    },
    framingText: {
      type: "string",
      description:
        "A short directorial line shown to the player. It must not assert new world facts and must not resolve the scene.",
    },
    suggestedReturnBeatId: {
      type: "string",
      description:
        "Authored beat id the director recommends the player return to next. Must be one of the allowedBeatIds provided in the request.",
    },
    bridgeText: {
      type: "string",
      description:
        "Optional diegetic bridge for soft_detour. Display-only narration that never grants facts, flags, or transitions.",
    },
    hintFactId: {
      type: "string",
      description:
        "Optional hint id for display only. It never reveals or grants a fact by itself.",
    },
  },
  required: ["stepType", "framingText", "suggestedReturnBeatId"],
  propertyOrdering: [
    "stepType",
    "framingText",
    "suggestedReturnBeatId",
    "bridgeText",
    "hintFactId",
  ],
} as const;

const sessionCanonFactJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      description: "Stable session-scoped fact id, never an authored canon id.",
    },
    text: {
      type: "string",
      description: "Session-canon fact proposed for review.",
    },
    scope: { type: "string", enum: ["session"] },
    source: { type: "string", enum: ["dm"] },
    status: { type: "string", enum: ["proposed", "accepted"] },
    relatedNpcIds: { type: "array", items: { type: "string" } },
    relatedLocationIds: { type: "array", items: { type: "string" } },
  },
  required: ["id", "text", "scope", "source", "status"],
  propertyOrdering: [
    "id",
    "text",
    "scope",
    "source",
    "status",
    "relatedNpcIds",
    "relatedLocationIds",
  ],
} as const;

export const DM_TURN_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    narration: {
      type: "string",
      description:
        "Playable Russian narration for the player's free-form action. It proposes outcomes only.",
    },
    innerVoiceDialogue: {
      type: "array",
      description:
        "A short debate in Russian among the player's supplied inner voices, shown before the options. Each entry is one line; use the provided voiceId and stance. The counter voice must push back.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          voiceId: { type: "string" },
          stance: { type: "string", enum: ["supports", "opposes"] },
          line: { type: "string" },
        },
        required: ["voiceId", "stance", "line"],
      },
      maxItems: 4,
    },
    options: {
      type: "array",
      description:
        "Exactly 3 distinct moves the player can choose next, in Russian. Each must continue the established story consistently. label is a short action; detail is optional one-line color.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          detail: { type: "string" },
        },
        required: ["id", "label"],
      },
      maxItems: 3,
    },
    checks: {
      type: "array",
      description:
        "Optional checks the table should roll or review before accepting.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          voiceId: { type: "string" },
          difficulty: { type: "number" },
          moveTags: {
            type: "array",
            items: { type: "string", enum: DM_MOVE_TAGS },
          },
        },
        required: ["id", "label", "voiceId", "difficulty"],
      },
      maxItems: 3,
    },
    sessionFacts: {
      type: "array",
      description:
        "Session-canon facts proposed for Review then Accept. They never mutate immutable authored canon directly.",
      items: sessionCanonFactJsonSchema,
      maxItems: 5,
    },
    suggestedStateDeltas: {
      type: "array",
      description:
        "Review-only overlay/resource suggestions. No snapshot/canon mutation keys are allowed.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: { type: "string" },
          kind: {
            type: "string",
            enum: ["set_flag", "set_var", "add_var"],
          },
          value: { anyOf: [{ type: "boolean" }, { type: "number" }] },
          reason: { type: "string" },
        },
        required: ["key", "kind", "value", "reason"],
      },
      maxItems: 8,
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "Review-visible risks, debts, exposure, or bargains.",
    },
    toneMode: {
      type: "string",
      enum: DM_TONE_MODES,
    },
    canonRemarks: {
      type: "array",
      items: { type: "string" },
      description:
        "Notes about canon boundaries, contradictions, or promotion candidates.",
    },
    resourceCosts: {
      type: "object",
      additionalProperties: false,
      properties: {
        fate: { type: "number" },
        fortune: { type: "number" },
      },
    },
  },
  required: [
    "narration",
    "checks",
    "sessionFacts",
    "suggestedStateDeltas",
    "risks",
    "toneMode",
    "canonRemarks",
  ],
  propertyOrdering: [
    "narration",
    "innerVoiceDialogue",
    "options",
    "checks",
    "sessionFacts",
    "suggestedStateDeltas",
    "risks",
    "toneMode",
    "canonRemarks",
    "resourceCosts",
  ],
} as const;

export const CHARACTER_REACTION_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    characterId: {
      type: "string",
      description: "The NPC id from the request payload.",
    },
    reactionType: {
      type: "string",
      enum: ["dialogue", "lie", "evasion", "request", "conflict", "silence"],
      description: "How the NPC handles the immediate stimulus.",
    },
    text: {
      type: "string",
      description:
        "A short playable reaction line or diegetic narration. It must not apply effects.",
    },
    revealHintFactId: {
      type: "string",
      description:
        "Optional hint id for display only. It never reveals or grants a fact by itself.",
    },
    suggestedEffects: {
      type: "array",
      description:
        "Optional display-only suggestions. They are never auto-applied by the client or server.",
      items: suggestedEffectJsonSchema,
      maxItems: 3,
    },
  },
  required: ["characterId", "reactionType", "text"],
  propertyOrdering: [
    "characterId",
    "reactionType",
    "text",
    "revealHintFactId",
    "suggestedEffects",
  ],
} as const;

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

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean => Object.keys(value).every((key) => allowedKeys.includes(key));

export const isRegenerationContext = (
  value: unknown,
): value is RegenerationContext => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const context = value as Record<string, unknown>;
  return (
    hasOnlyKeys(context, [
      "previousOutput",
      "authorFeedback",
      "rating",
      "qualityIssues",
    ]) &&
    typeof context.previousOutput === "string" &&
    typeof context.authorFeedback === "string" &&
    (context.rating === undefined || isFiniteNumber(context.rating)) &&
    (context.qualityIssues === undefined ||
      (Array.isArray(context.qualityIssues) &&
        context.qualityIssues.every((entry) => typeof entry === "string")))
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
      isValidSceneResultEnvelope(payload.sceneResultEnvelope)) &&
    (payload.regenerationContext === undefined ||
      isRegenerationContext(payload.regenerationContext))
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
    isCharacterRelationshipState(payload.relationshipState) &&
    (payload.topics === undefined ||
      (Array.isArray(payload.topics) &&
        payload.topics.every((entry) => typeof entry === "string"))) &&
    (payload.npcMemory === undefined ||
      (Array.isArray(payload.npcMemory) &&
        payload.npcMemory.every((entry) => typeof entry === "string")))
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
    hasOnlyKeys(proposal, [
      "characterId",
      "reactionType",
      "text",
      "revealHintFactId",
      "suggestedEffects",
    ]) &&
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

const isDirectorStepType = (value: unknown): value is DirectorStepType =>
  typeof value === "string" &&
  (DIRECTOR_STEP_TYPES as readonly string[]).includes(value);

const isDirectorStepSource = (value: unknown): value is DirectorStepSource =>
  value === AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY;

const isDmToneMode = (value: unknown): value is DmToneMode =>
  typeof value === "string" &&
  (DM_TONE_MODES as readonly string[]).includes(value);

const isDmMoveTag = (value: unknown): value is DmMoveTag =>
  typeof value === "string" &&
  (DM_MOVE_TAGS as readonly string[]).includes(value);

const isDirectorStepActiveQuest = (
  value: unknown,
): value is DirectorStepActiveQuest => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.questId === "string" &&
    typeof entry.stage === "number" &&
    Number.isFinite(entry.stage)
  );
};

export const isGenerateDirectorStepPayload = (
  value: unknown,
): value is GenerateDirectorStepPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(payload, [
      "source",
      "scenarioId",
      "nodeId",
      "currentBeatId",
      "allowedBeatIds",
      "visibleFacts",
      "activeFlags",
      "activeQuests",
      "routeContext",
    ])
  ) {
    return false;
  }

  return (
    isDirectorStepSource(payload.source) &&
    typeof payload.scenarioId === "string" &&
    typeof payload.nodeId === "string" &&
    typeof payload.currentBeatId === "string" &&
    Array.isArray(payload.allowedBeatIds) &&
    payload.allowedBeatIds.length > 0 &&
    payload.allowedBeatIds.every((entry) => typeof entry === "string") &&
    Array.isArray(payload.visibleFacts) &&
    payload.visibleFacts.every((entry) => typeof entry === "string") &&
    Array.isArray(payload.activeFlags) &&
    payload.activeFlags.every((entry) => typeof entry === "string") &&
    Array.isArray(payload.activeQuests) &&
    payload.activeQuests.every(isDirectorStepActiveQuest) &&
    (payload.routeContext === undefined ||
      typeof payload.routeContext === "string")
  );
};

export const parseGenerateDirectorStepPayload = (
  value: string | null | undefined,
): GenerateDirectorStepPayload | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isGenerateDirectorStepPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const isDirectorStepProposal = (
  value: unknown,
): value is DirectorStepProposal => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proposal = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(proposal, [
      "stepType",
      "framingText",
      "suggestedReturnBeatId",
      "bridgeText",
      "hintFactId",
    ])
  ) {
    return false;
  }

  return (
    isDirectorStepType(proposal.stepType) &&
    typeof proposal.framingText === "string" &&
    proposal.framingText.trim().length > 0 &&
    typeof proposal.suggestedReturnBeatId === "string" &&
    proposal.suggestedReturnBeatId.trim().length > 0 &&
    (proposal.bridgeText === undefined ||
      typeof proposal.bridgeText === "string") &&
    (proposal.hintFactId === undefined ||
      typeof proposal.hintFactId === "string")
  );
};

export const parseDirectorStepProposal = (
  value: unknown,
): DirectorStepProposal | null => {
  const raw = unwrapOptionalString(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isDirectorStepProposal(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const isAllowedDirectorReturnBeatId = (
  proposal: DirectorStepProposal,
  allowedBeatIds: readonly string[],
): boolean => allowedBeatIds.includes(proposal.suggestedReturnBeatId);

const isPlayerRemark = (value: unknown): value is PlayerRemark => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const remark = value as Record<string, unknown>;
  return (
    hasOnlyKeys(remark, ["text", "visibility"]) &&
    typeof remark.text === "string" &&
    remark.text.trim().length > 0 &&
    remark.visibility === "private_dm"
  );
};

const isSessionCanonFact = (value: unknown): value is SessionCanonFact => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const fact = value as Record<string, unknown>;
  return (
    hasOnlyKeys(fact, [
      "id",
      "text",
      "scope",
      "source",
      "status",
      "relatedNpcIds",
      "relatedLocationIds",
    ]) &&
    typeof fact.id === "string" &&
    fact.id.trim().length > 0 &&
    typeof fact.text === "string" &&
    fact.text.trim().length > 0 &&
    fact.scope === "session" &&
    fact.source === "dm" &&
    (fact.status === "proposed" || fact.status === "accepted") &&
    (fact.relatedNpcIds === undefined ||
      (Array.isArray(fact.relatedNpcIds) &&
        fact.relatedNpcIds.every((entry) => typeof entry === "string"))) &&
    (fact.relatedLocationIds === undefined ||
      (Array.isArray(fact.relatedLocationIds) &&
        fact.relatedLocationIds.every((entry) => typeof entry === "string")))
  );
};

const DM_ALLOWED_DIRECT_KEYS = new Set([
  RESOURCE_FATE_TOKEN_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_KARMA_VAR,
  WITCH_BLOOD_CURSE_TIER_VAR,
  WITCH_BLOOD_CURSE_PRESSURE_VAR,
  WITCH_BLOOD_POWER_VAR,
  WITCH_BLOOD_DEBT_VAR,
  WITCH_ALCOHOL_AFTERTASTE_VAR,
]);

export const isAllowedDmStateDeltaKey = (key: string): boolean =>
  DM_ALLOWED_DIRECT_KEYS.has(key) ||
  key.startsWith("session.") ||
  key.startsWith("dm_session.") ||
  key.startsWith("overlay.session.") ||
  key.startsWith("session_") ||
  key.startsWith("witch_") ||
  key.startsWith("ghost_session_");

const isDmSuggestedStateDelta = (
  value: unknown,
): value is DmSuggestedStateDelta => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const delta = value as Record<string, unknown>;
  const kind =
    delta.kind === "set_flag" ||
    delta.kind === "set_var" ||
    delta.kind === "add_var";
  const valueMatches =
    delta.kind === "set_flag"
      ? typeof delta.value === "boolean"
      : isFiniteNumber(delta.value);
  return (
    hasOnlyKeys(delta, ["key", "kind", "value", "reason"]) &&
    typeof delta.key === "string" &&
    delta.key.trim().length > 0 &&
    kind &&
    valueMatches &&
    typeof delta.reason === "string" &&
    delta.reason.trim().length > 0 &&
    isAllowedDmStateDeltaKey(delta.key)
  );
};

const isDmResourceProfile = (
  value: unknown,
): value is GenerateDmTurnPayload["resources"] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const resources = value as Record<string, unknown>;
  return (
    hasOnlyKeys(resources, ["fate", "fortune", "fortuneMod", "karma"]) &&
    isFiniteNumber(resources.fate) &&
    isFiniteNumber(resources.fortune) &&
    isFiniteNumber(resources.fortuneMod) &&
    isFiniteNumber(resources.karma)
  );
};

const isDmBloodCurseProfile = (
  value: unknown,
): value is GenerateDmTurnPayload["bloodCurse"] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const bloodCurse = value as Record<string, unknown>;
  return (
    hasOnlyKeys(bloodCurse, [
      "tier",
      "pressure",
      "power",
      "debt",
      "alcoholAftertaste",
    ]) &&
    isFiniteNumber(bloodCurse.tier) &&
    isFiniteNumber(bloodCurse.pressure) &&
    isFiniteNumber(bloodCurse.power) &&
    isFiniteNumber(bloodCurse.debt) &&
    isFiniteNumber(bloodCurse.alcoholAftertaste)
  );
};

const isInnerVoiceStance = (value: unknown): value is InnerVoiceStance =>
  value === "supports" || value === "opposes";

const isInnerVoiceRole = (value: unknown): value is InnerVoiceRole =>
  value === "dominant" || value === "support" || value === "counter";

const isDmInnerVoiceInput = (value: unknown): value is DmInnerVoiceInput => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const voice = value as Record<string, unknown>;
  return (
    hasOnlyKeys(voice, [
      "voiceId",
      "role",
      "stance",
      "label",
      "worldview",
      "toneDescriptor",
    ]) &&
    typeof voice.voiceId === "string" &&
    voice.voiceId.trim().length > 0 &&
    isInnerVoiceRole(voice.role) &&
    isInnerVoiceStance(voice.stance) &&
    typeof voice.label === "string" &&
    typeof voice.worldview === "string" &&
    typeof voice.toneDescriptor === "string"
  );
};

const isDmInnerVoiceLine = (value: unknown): value is DmInnerVoiceLine => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const line = value as Record<string, unknown>;
  return (
    hasOnlyKeys(line, ["voiceId", "stance", "line"]) &&
    typeof line.voiceId === "string" &&
    line.voiceId.trim().length > 0 &&
    isInnerVoiceStance(line.stance) &&
    typeof line.line === "string" &&
    line.line.trim().length > 0
  );
};

const isBeatDirectiveKind = (value: unknown): value is BeatDirectiveKind =>
  typeof value === "string" &&
  (BEAT_DIRECTIVE_KINDS as readonly string[]).includes(value);

const isBeatDirective = (value: unknown): value is BeatDirective => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const directive = value as Record<string, unknown>;
  return (
    hasOnlyKeys(directive, ["kind"]) && isBeatDirectiveKind(directive.kind)
  );
};

const isDmTurnOption = (value: unknown): value is DmTurnOption => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const option = value as Record<string, unknown>;
  return (
    hasOnlyKeys(option, ["id", "label", "detail"]) &&
    typeof option.id === "string" &&
    option.id.trim().length > 0 &&
    typeof option.label === "string" &&
    option.label.trim().length > 0 &&
    (option.detail === undefined || typeof option.detail === "string")
  );
};

export const isGenerateDmTurnPayload = (
  value: unknown,
): value is GenerateDmTurnPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    hasOnlyKeys(payload, [
      "source",
      "scenarioId",
      "nodeId",
      "actionText",
      "remark",
      "spendFateToken",
      "fortuneSpend",
      "moveTags",
      "resources",
      "psyche",
      "bloodCurse",
      "activeSessionFacts",
      "acceptedRemarks",
      "visibleFacts",
      "activeFlags",
      "innerVoices",
      "priorNarration",
      "beatDirective",
      "toneMode",
      "locale",
      "regenerationContext",
    ]) &&
    payload.source === AI_DM_TURN_SOURCE_SIDE_PANEL &&
    typeof payload.scenarioId === "string" &&
    typeof payload.nodeId === "string" &&
    typeof payload.actionText === "string" &&
    payload.actionText.trim().length > 0 &&
    (payload.remark === undefined || isPlayerRemark(payload.remark)) &&
    typeof payload.spendFateToken === "boolean" &&
    (payload.fortuneSpend === undefined ||
      (isFiniteNumber(payload.fortuneSpend) && payload.fortuneSpend >= 0)) &&
    Array.isArray(payload.moveTags) &&
    payload.moveTags.every(isDmMoveTag) &&
    isDmResourceProfile(payload.resources) &&
    isDialoguePsycheProfile(payload.psyche) &&
    isDmBloodCurseProfile(payload.bloodCurse) &&
    Array.isArray(payload.activeSessionFacts) &&
    payload.activeSessionFacts.every(isSessionCanonFact) &&
    Array.isArray(payload.acceptedRemarks) &&
    payload.acceptedRemarks.every(isPlayerRemark) &&
    Array.isArray(payload.visibleFacts) &&
    payload.visibleFacts.every((entry) => typeof entry === "string") &&
    Array.isArray(payload.activeFlags) &&
    payload.activeFlags.every((entry) => typeof entry === "string") &&
    (payload.innerVoices === undefined ||
      (Array.isArray(payload.innerVoices) &&
        payload.innerVoices.every(isDmInnerVoiceInput))) &&
    (payload.priorNarration === undefined ||
      typeof payload.priorNarration === "string") &&
    (payload.beatDirective === undefined ||
      isBeatDirective(payload.beatDirective)) &&
    isDmToneMode(payload.toneMode) &&
    payload.locale === "ru" &&
    (payload.regenerationContext === undefined ||
      isRegenerationContext(payload.regenerationContext))
  );
};

export const parseGenerateDmTurnPayload = (
  value: string | null | undefined,
): GenerateDmTurnPayload | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isGenerateDmTurnPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const isDmCheckProposal = (
  value: unknown,
): value is DmTurnProposal["checks"][number] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const check = value as Record<string, unknown>;
  return (
    hasOnlyKeys(check, ["id", "label", "voiceId", "difficulty", "moveTags"]) &&
    typeof check.id === "string" &&
    check.id.trim().length > 0 &&
    typeof check.label === "string" &&
    check.label.trim().length > 0 &&
    typeof check.voiceId === "string" &&
    isFiniteNumber(check.difficulty) &&
    (check.moveTags === undefined ||
      (Array.isArray(check.moveTags) && check.moveTags.every(isDmMoveTag)))
  );
};

const isDmResourceCosts = (
  value: unknown,
): value is NonNullable<DmTurnProposal["resourceCosts"]> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const costs = value as Record<string, unknown>;
  return (
    hasOnlyKeys(costs, ["fate", "fortune"]) &&
    (costs.fate === undefined || isFiniteNumber(costs.fate)) &&
    (costs.fortune === undefined || isFiniteNumber(costs.fortune))
  );
};

export const isDmTurnProposal = (value: unknown): value is DmTurnProposal => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proposal = value as Record<string, unknown>;
  return (
    hasOnlyKeys(proposal, [
      "narration",
      "innerVoiceDialogue",
      "options",
      "checks",
      "sessionFacts",
      "suggestedStateDeltas",
      "risks",
      "toneMode",
      "canonRemarks",
      "resourceCosts",
    ]) &&
    typeof proposal.narration === "string" &&
    proposal.narration.trim().length > 0 &&
    (proposal.innerVoiceDialogue === undefined ||
      (Array.isArray(proposal.innerVoiceDialogue) &&
        proposal.innerVoiceDialogue.every(isDmInnerVoiceLine))) &&
    (proposal.options === undefined ||
      (Array.isArray(proposal.options) &&
        proposal.options.every(isDmTurnOption))) &&
    Array.isArray(proposal.checks) &&
    proposal.checks.every(isDmCheckProposal) &&
    Array.isArray(proposal.sessionFacts) &&
    proposal.sessionFacts.every(isSessionCanonFact) &&
    Array.isArray(proposal.suggestedStateDeltas) &&
    proposal.suggestedStateDeltas.every(isDmSuggestedStateDelta) &&
    Array.isArray(proposal.risks) &&
    proposal.risks.every((entry) => typeof entry === "string") &&
    isDmToneMode(proposal.toneMode) &&
    Array.isArray(proposal.canonRemarks) &&
    proposal.canonRemarks.every((entry) => typeof entry === "string") &&
    (proposal.resourceCosts === undefined ||
      isDmResourceCosts(proposal.resourceCosts))
  );
};

export const parseDmTurnProposal = (value: unknown): DmTurnProposal | null => {
  const raw = unwrapOptionalString(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isDmTurnProposal(parsed) ? parsed : null;
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
