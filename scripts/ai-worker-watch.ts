import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalVoicePromptBrief } from "../data/voiceBridge";
import { SUPPORTED_AI_KINDS } from "../spacetimedb/src/reducers/aiQueue";
import {
  CHARACTER_REACTION_PROPOSAL_JSON_SCHEMA,
  DIRECTOR_STEP_PROPOSAL_JSON_SCHEMA,
  DM_TURN_PROPOSAL_JSON_SCHEMA,
  GENERATE_DIALOGUE_ENVELOPE_JSON_SCHEMA,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_PROPOSE_DIRECTOR_STEP_KIND,
  AI_PROPOSE_DM_TURN_KIND,
  isAllowedDirectorReturnBeatId,
  isDirectorStepProposal,
  isDmTurnProposal,
  isGenerateDialogueEnvelope,
  isCharacterReactionProposal,
  parseGenerateCharacterReactionPayload,
  parseGenerateDmTurnPayload,
  parseGenerateDialoguePayload,
  parseGenerateDirectorStepPayload,
  type CharacterReactionProposal,
  type DmTurnProposal,
  type DirectorStepProposal,
  type GenerateCharacterReactionPayload,
  type GenerateDmTurnPayload,
  type GenerateDialogueEnvelope,
  type GenerateDialoguePayload,
  type GenerateDirectorStepPayload,
} from "../src/features/ai/contracts";
import { buildSceneContext, type SceneContext } from "./ai-context-builder";
import {
  captureBackendException,
  flushBackendMonitoring,
  initializeBackendMonitoring,
} from "./backend-monitoring";
import {
  connectOperatorConnection,
  ensureWorkerAccess,
  getOperatorToken,
} from "./spacetime-operator";
import { runSpacetimeSql, type FetchLike } from "./spacetime-sql";

export interface AiWorkerLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface AiWorkerConnection {
  reducers: {
    claimNextAiRequest: (args: {
      requestId: string;
      kind: string;
      leaseMs: number;
      claimToken: string;
    }) => Promise<unknown>;
    renewAiRequestLease: (args: {
      requestId: string;
      aiRequestId: bigint;
      leaseMs: number;
    }) => Promise<unknown>;
    completeAiRequest: (args: {
      requestId: string;
      aiRequestId: bigint;
      responseJson: string;
    }) => Promise<unknown>;
    failAiRequest: (args: {
      requestId: string;
      aiRequestId: bigint;
      error: string;
      retryDelayMs?: number;
    }) => Promise<unknown>;
  };
  disconnect: () => void;
}

export interface AiWorkerConfig {
  host: string;
  database: string;
  token: string;
  geminiApiKey: string;
  geminiModel: string;
  pollMs: number;
  leaseMs: number;
  maxRetries: number;
  retryBaseMs: number;
  retryMaxMs: number;
}

export interface ClaimedAiRequest {
  id: bigint;
  playerId: string;
  requestId: string;
  kind: string;
  payloadJson: string;
  status: string;
  attemptCount: number;
  claimToken: string;
}

export interface GeminiDialogueResult {
  response: GenerateDialogueEnvelope;
}

export interface GeminiCharacterReactionResult {
  proposal: CharacterReactionProposal;
}

export interface GeminiDirectorStepResult {
  proposal: DirectorStepProposal;
}

export interface GeminiDmTurnResult {
  proposal: DmTurnProposal;
}

export interface ProcessClaimedAiRequestDeps {
  fetchImpl?: FetchLike;
  now?: () => number;
  random?: () => number;
  logger?: AiWorkerLogger;
  createRequestId?: (scope: string, aiRequestId?: bigint) => string;
  buildSceneContextImpl?: typeof buildSceneContext;
  generateDialogueImpl?: (
    payload: GenerateDialoguePayload,
    sceneContext: SceneContext,
    config: AiWorkerConfig,
    deps: ProcessClaimedAiRequestDeps,
  ) => Promise<GeminiDialogueResult>;
  generateCharacterReactionImpl?: (
    payload: GenerateCharacterReactionPayload,
    config: AiWorkerConfig,
    deps: ProcessClaimedAiRequestDeps,
  ) => Promise<GeminiCharacterReactionResult>;
  generateDirectorStepImpl?: (
    payload: GenerateDirectorStepPayload,
    config: AiWorkerConfig,
    deps: ProcessClaimedAiRequestDeps,
  ) => Promise<GeminiDirectorStepResult>;
  generateDmTurnImpl?: (
    payload: GenerateDmTurnPayload,
    config: AiWorkerConfig,
    deps: ProcessClaimedAiRequestDeps,
  ) => Promise<GeminiDmTurnResult>;
  loadDmRulesTextImpl?: () => string;
}

export interface DrainAiQueueDeps extends ProcessClaimedAiRequestDeps {
  createClaimToken?: () => string;
}

const DEFAULT_HOST = "ws://127.0.0.1:3000";
const DEFAULT_DATABASE = "grezwandererdata";
const DEFAULT_POLL_MS = 2_000;
const DEFAULT_LEASE_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_MS = 5_000;
const DEFAULT_RETRY_MAX_MS = 60_000;

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

const buildGeminiGenerateContentUrl = (model: string): string =>
  `${GEMINI_ENDPOINT}/models/${model}:generateContent`;

const buildGeminiRequestHeaders = (apiKey: string): Record<string, string> => ({
  "Content-Type": "application/json",
  "x-goog-api-key": apiKey,
});
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WITCH_TABLETOP_DM_RULES_PATH = resolve(
  REPO_ROOT,
  "docs",
  "WITCH_TABLETOP_DM_RULES.md",
);

const captureAiJobFailure = (
  error: unknown,
  job: ClaimedAiRequest,
  retryable: boolean,
): void => {
  if (retryable) {
    return;
  }

  captureBackendException(error, {
    "ai.kind": job.kind,
    "ai.request_id": job.requestId,
    "ai.request_db_id": job.id.toString(),
    "ai.retryable": "false",
  });
};

export class GeminiHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GeminiHttpError";
  }
}

export class GeminiMalformedJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiMalformedJsonError";
  }
}

const getLogger = (logger?: AiWorkerLogger): AiWorkerLogger =>
  logger ?? console;

const getNow = (now?: () => number): (() => number) => now ?? Date.now;

const getRandom = (random?: () => number): (() => number) =>
  random ?? Math.random;

const defaultCreateRequestId = (
  scope: string,
  aiRequestId?: bigint,
): string => {
  const base =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return aiRequestId === undefined
    ? `ai_worker_${scope}_${base}`
    : `ai_worker_${scope}_${aiRequestId.toString()}_${base}`;
};

const defaultCreateClaimToken = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `claim-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const parseIntegerSetting = (
  raw: string | undefined,
  fallback: number,
  fieldName: string,
): number => {
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return parsed;
};

const parseBooleanFlag = (args: readonly string[], flag: string): boolean =>
  args.includes(flag);

const readArg = (args: readonly string[], name: string): string | undefined => {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
};

export const resolveAiWorkerConfig = (
  args: readonly string[] = process.argv.slice(2),
): AiWorkerConfig => {
  const host =
    readArg(args, "--host") ??
    process.env.OPS_STDB_HOST ??
    process.env.SPACETIMEDB_HOST ??
    process.env.VITE_SPACETIMEDB_HOST ??
    DEFAULT_HOST;
  const database =
    readArg(args, "--db") ??
    process.env.OPS_STDB_DB ??
    process.env.SPACETIMEDB_DB_NAME ??
    process.env.VITE_SPACETIMEDB_DB_NAME ??
    DEFAULT_DATABASE;
  const token = getOperatorToken(host, database)?.trim();
  if (!token) {
    throw new Error(
      "Operator token is required. Set SPACETIMEDB_OPERATOR_TOKEN or bootstrap the operator token file first.",
    );
  }

  const geminiApiKey =
    process.env.GEMINI_API_KEY?.trim() ??
    process.env.GOOGLE_API_KEY?.trim() ??
    "";
  if (!geminiApiKey) {
    throw new Error("Set GEMINI_API_KEY or GOOGLE_API_KEY for the AI worker.");
  }

  return {
    host,
    database,
    token,
    geminiApiKey,
    geminiModel:
      process.env.AI_WORKER_GEMINI_MODEL?.trim() ?? "gemini-2.5-flash",
    pollMs: parseIntegerSetting(
      process.env.AI_WORKER_POLL_MS,
      DEFAULT_POLL_MS,
      "AI_WORKER_POLL_MS",
    ),
    leaseMs: parseIntegerSetting(
      process.env.AI_WORKER_LEASE_MS,
      DEFAULT_LEASE_MS,
      "AI_WORKER_LEASE_MS",
    ),
    maxRetries: parseIntegerSetting(
      process.env.AI_WORKER_MAX_RETRIES,
      DEFAULT_MAX_RETRIES,
      "AI_WORKER_MAX_RETRIES",
    ),
    retryBaseMs: parseIntegerSetting(
      process.env.AI_WORKER_RETRY_BASE_MS,
      DEFAULT_RETRY_BASE_MS,
      "AI_WORKER_RETRY_BASE_MS",
    ),
    retryMaxMs: parseIntegerSetting(
      process.env.AI_WORKER_RETRY_MAX_MS,
      DEFAULT_RETRY_MAX_MS,
      "AI_WORKER_RETRY_MAX_MS",
    ),
  };
};

const coerceString = (value: unknown, fieldName: string): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  throw new Error(`Invalid ${fieldName}`);
};

const coerceBigInt = (value: unknown, fieldName: string): bigint => {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return BigInt(value);
  }
  throw new Error(`Invalid ${fieldName}`);
};

const coerceNumber = (value: unknown, fieldName: string): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`Invalid ${fieldName}`);
};

export const buildClaimedAiRequestQuery = (claimToken: string): string => {
  void claimToken;
  return [
    "SELECT",
    "  id,",
    "  player_id,",
    "  request_id,",
    "  kind,",
    "  payload_json,",
    "  status,",
    "  attempt_count,",
    "  claim_token",
    "FROM ai_request",
    "WHERE status = 'processing'",
  ].join("\n");
};

export const parseClaimedAiRequestRow = (row: unknown): ClaimedAiRequest => {
  if (Array.isArray(row)) {
    if (row.length < 8) {
      throw new Error("Claimed ai_request SQL row is missing columns");
    }

    return {
      id: coerceBigInt(row[0], "id"),
      playerId: coerceString(row[1], "player_id"),
      requestId: coerceString(row[2], "request_id"),
      kind: coerceString(row[3], "kind"),
      payloadJson: coerceString(row[4], "payload_json"),
      status: coerceString(row[5], "status"),
      attemptCount: coerceNumber(row[6], "attempt_count"),
      claimToken: coerceString(row[7], "claim_token"),
    };
  }

  if (typeof row === "object" && row !== null) {
    const record = row as Record<string, unknown>;
    return {
      id: coerceBigInt(record.id, "id"),
      playerId: coerceString(record.player_id ?? record.playerId, "player_id"),
      requestId: coerceString(
        record.request_id ?? record.requestId,
        "request_id",
      ),
      kind: coerceString(record.kind, "kind"),
      payloadJson: coerceString(
        record.payload_json ?? record.payloadJson,
        "payload_json",
      ),
      status: coerceString(record.status, "status"),
      attemptCount: coerceNumber(
        record.attempt_count ?? record.attemptCount,
        "attempt_count",
      ),
      claimToken: coerceString(
        record.claim_token ?? record.claimToken,
        "claim_token",
      ),
    };
  }

  throw new Error("Unsupported claimed ai_request row shape");
};

export const fetchClaimedAiRequest = async (
  claimToken: string,
  config: AiWorkerConfig,
  fetchImpl: FetchLike = fetch,
): Promise<ClaimedAiRequest | null> => {
  const rows = await runSpacetimeSql({
    host: config.host,
    database: config.database,
    token: config.token,
    query: buildClaimedAiRequestQuery(claimToken),
    fetchImpl,
  });
  for (const row of rows) {
    const parsedRow = parseClaimedAiRequestRow(row);
    if (parsedRow.claimToken === claimToken) {
      return parsedRow;
    }
  }
  return null;
};

const buildSystemPrompt = (payload: GenerateDialoguePayload): string => {
  const canonicalVoiceBrief =
    buildCanonicalVoicePromptBrief(payload.voiceId) ??
    "Use the skill-check voice as a concise internal monologue.";
  const layerInstruction =
    payload.dialogueLayer === "providence"
      ? "Write a second, deeper line that expands the moment without changing facts or outcomes."
      : "Write one additive inner-thought line for the immediate result.";
  const baseInstructions = [
    "You write inner-thought lines for a detective RPG.",
    "Return exactly one JSON object and nothing else.",
    'The JSON shape is {"text":"...","canonicalVoiceId":"...","suggestedEffects?":[]}.',
    "Do not wrap the JSON in markdown fences.",
    "Keep the line short, playable, and non-blocking.",
    "Do not invent new facts that contradict the provided scene context.",
    "suggestedEffects are display-only metadata; never imply that they apply state changes.",
    layerInstruction,
    `Voice guide: ${canonicalVoiceBrief}`,
  ];

  if (payload.checkId && payload.checkId.endsWith("_custom")) {
    baseInstructions.push(
      "The player has typed a custom action in `choiceText` under a Providence choice slot.",
      "Since this is during testing and development, you MUST show high leniency: allow creative actions to unfold rather than strictly blocking.",
      "Crucially, evaluate the dangerousness of the player's custom action:",
      '- Option A (Highly dangerous stunts or extreme threats to self-preservation, e.g., jumping over a massive ravine, attempting to take a life, attacking a heavily armed squad directly): The monologue text MUST represent immediate self-preserving hesitation, returning exactly the following character thought in Russian: "Я не хочу рисковать" or "Не стоит так рисковать".',
      "- Option B (Standard custom actions, e.g., questioning, checking details, searching carefully): Create a realistic, grounded atmospheric soft-fail / reaction monologue thought in highly atmospheric Russian (e.g., about how it might not lead anywhere, or an observation on the surroundings or a sensory soft-fail details) that adds flavor and internal tension without breaking narrative consistency.",
      "Regardless of the action type, the monologue text MUST be written entirely in beautiful, atmospheric, deep Russian.",
    );
  }

  return baseInstructions.join("\n");
};

const buildUserPrompt = (
  payload: GenerateDialoguePayload,
  sceneContext: SceneContext,
): string => {
  const recentDialogue =
    sceneContext.recentDialogue.length > 0
      ? sceneContext.recentDialogue.join("\n- ")
      : "none";
  const activeQuestSummary =
    sceneContext.activeQuestSummary.trim().length > 0
      ? sceneContext.activeQuestSummary
      : "none";

  return [
    `Scenario ID: ${payload.scenarioId}`,
    `Node ID: ${payload.nodeId}`,
    `Dialogue layer: ${payload.dialogueLayer ?? "base"}`,
    `AI mode: ${payload.aiMode ?? "narrative"}`,
    `Choice text: ${payload.choiceText}`,
    `Narrative text: ${payload.narrativeText}`,
    `Location: ${payload.locationName}`,
    `Character: ${payload.characterName ?? "Narrator"}`,
    `Difficulty: ${payload.difficulty} (base ${payload.baseDifficulty ?? payload.difficulty})`,
    `Fortune spend: ${payload.fortuneSpend ?? 0}`,
    `Karma band: ${payload.karmaBand ?? "neutral"}`,
    `Scene snapshot: ${sceneContext.sceneSnapshot}`,
    `Recent dialogue:\n- ${recentDialogue}`,
    `Active quest summary: ${activeQuestSummary}`,
    "Write a single inner-thought line that sharpens the moment without resolving the scene for the player.",
  ].join("\n\n");
};

export const extractJsonObject = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  let depth = 0;
  let start = -1;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (character === "\\") {
        isEscaped = true;
        continue;
      }
      if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return trimmed.slice(start, index + 1);
      }
    }
  }

  return null;
};

const readGeminiText = (payload: unknown): string => {
  const root = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const parts = root.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text)
    .filter((entry): entry is string => typeof entry === "string")
    .join("");

  if (text.trim().length === 0) {
    throw new GeminiMalformedJsonError("Gemini response did not contain text");
  }

  return text;
};

export const normalizeGenerateDialogueEnvelope = (
  rawJson: string,
  modelId: string,
  latencyMs: number,
  providerPayload?: {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  },
): GenerateDialogueEnvelope => {
  const parsed = JSON.parse(rawJson) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new GeminiMalformedJsonError("Gemini JSON payload must be an object");
  }

  const candidate = parsed as Record<string, unknown>;
  const normalized = {
    ...candidate,
    canonicalVoiceId:
      typeof candidate.canonicalVoiceId === "string"
        ? candidate.canonicalVoiceId.trim().toLowerCase()
        : candidate.canonicalVoiceId,
  };

  if (!isGenerateDialogueEnvelope(normalized)) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload did not match GenerateDialogueEnvelope",
    );
  }

  const usage = providerPayload?.usageMetadata;
  return {
    text: normalized.text,
    canonicalVoiceId: normalized.canonicalVoiceId,
    suggestedEffects: normalized.suggestedEffects,
    metadata: {
      modelId,
      latencyMs,
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
    },
  };
};

export const generateDialogueWithGemini = async (
  payload: GenerateDialoguePayload,
  sceneContext: SceneContext,
  config: AiWorkerConfig,
  deps: ProcessClaimedAiRequestDeps = {},
): Promise<GeminiDialogueResult> => {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = getNow(deps.now);
  const startedAt = now();
  const response = await fetchImpl(
    buildGeminiGenerateContentUrl(config.geminiModel),
    {
      method: "POST",
      headers: buildGeminiRequestHeaders(config.geminiApiKey),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(payload) }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserPrompt(payload, sceneContext) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: GENERATE_DIALOGUE_ENVELOPE_JSON_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GeminiHttpError(
      `Gemini request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      response.status,
    );
  }

  const body = (await response.json()) as {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };
  const rawText = readGeminiText(body);
  const rawJson = extractJsonObject(rawText);
  if (!rawJson) {
    throw new GeminiMalformedJsonError("Gemini response did not contain JSON");
  }

  return {
    response: normalizeGenerateDialogueEnvelope(
      rawJson,
      config.geminiModel,
      now() - startedAt,
      body,
    ),
  };
};

const buildCharacterReactionSystemPrompt = (): string =>
  [
    "You propose a short NPC reaction line for a detective RPG.",
    "Return exactly one JSON object and nothing else.",
    "Do not wrap the JSON in markdown fences.",
    'Shape: {"characterId":"<id>","reactionType":"dialogue"|"lie"|"evasion"|"request"|"conflict"|"silence","text":"...","revealHintFactId?":"<optional>","suggestedEffects?":[]}',
    "reactionType must match how the NPC handles the stimulus.",
    "text must be playable dialogue or diegetic narration; stay under ~320 characters.",
    "Do not invent facts that contradict visibleFacts or the relationship snapshot.",
    "The NPC speaks ONLY from its own memory (the 'NPC memory' list — what THIS character knows). It is relative: it may differ from the objective truth and from what other characters know. Never let the NPC reference things outside its memory + visible facts; if asked about something it does not know, it can be ignorant, guess, deflect, or lie.",
    "Let the NPC's topics shape what it cares about and steers the exchange toward, in character.",
    "suggestedEffects and revealHintFactId are display-only metadata; never imply that they apply state changes.",
    "Prefer subtlety unless reactionType is conflict.",
  ].join("\n");

const buildCharacterReactionUserPrompt = (
  payload: GenerateCharacterReactionPayload,
): string => {
  const facts =
    payload.visibleFacts.length > 0
      ? payload.visibleFacts.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  const memory =
    payload.npcMemory && payload.npcMemory.length > 0
      ? payload.npcMemory.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  const topics =
    payload.topics && payload.topics.length > 0
      ? payload.topics.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  return [
    `Source: ${payload.source}`,
    `Character ID: ${payload.characterId}`,
    `Scenario ID: ${payload.scenarioId}`,
    `Node ID: ${payload.nodeId ?? "none"}`,
    `Trust: ${payload.relationshipState.trust}`,
    `Disposition: ${payload.relationshipState.disposition}`,
    `NPC memory (what THIS character knows; relative, may be incomplete or biased):\n${memory}`,
    `NPC topics (what it cares about and steers toward):\n${topics}`,
    `Event stimulus:\n${payload.eventText}`,
    payload.playerPrompt
      ? `Player prompt / pressure:\n${payload.playerPrompt}`
      : "",
    `Visible facts (present in the scene):\n${facts}`,
    `Answer strictly from NPC memory + visible facts; do not invent knowledge the NPC lacks. Set characterId in the JSON to exactly "${payload.characterId}".`,
  ]
    .filter((block) => block.length > 0)
    .join("\n\n");
};

export const normalizeCharacterReactionProposal = (
  rawJson: string,
  expectedCharacterId: string,
): CharacterReactionProposal => {
  const parsedRoot = JSON.parse(rawJson) as unknown;
  if (typeof parsedRoot !== "object" || parsedRoot === null) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload must be an object for character reactions",
    );
  }

  const merged = {
    ...(parsedRoot as Record<string, unknown>),
    characterId: expectedCharacterId,
  };

  if (!isCharacterReactionProposal(merged)) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload did not match CharacterReactionProposal",
    );
  }

  return merged;
};

export const generateCharacterReactionWithGemini = async (
  payload: GenerateCharacterReactionPayload,
  config: AiWorkerConfig,
  deps: ProcessClaimedAiRequestDeps = {},
): Promise<GeminiCharacterReactionResult> => {
  const fetchImpl = deps.fetchImpl ?? fetch;

  const response = await fetchImpl(
    buildGeminiGenerateContentUrl(config.geminiModel),
    {
      method: "POST",
      headers: buildGeminiRequestHeaders(config.geminiApiKey),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildCharacterReactionSystemPrompt() }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildCharacterReactionUserPrompt(payload) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: CHARACTER_REACTION_PROPOSAL_JSON_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GeminiHttpError(
      `Gemini request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      response.status,
    );
  }

  const rawText = readGeminiText(await response.json());
  const rawJson = extractJsonObject(rawText);
  if (!rawJson) {
    throw new GeminiMalformedJsonError("Gemini response did not contain JSON");
  }

  const proposal = normalizeCharacterReactionProposal(
    rawJson,
    payload.characterId,
  );

  return { proposal };
};

const buildDirectorStepSystemPrompt = (): string =>
  [
    "You are a presentation-only narrative director for a detective RPG.",
    "Return exactly one JSON object and nothing else.",
    "Do not wrap the JSON in markdown fences.",
    'Shape: {"stepType":"framing"|"next_beat_hint"|"soft_detour","framingText":"...","suggestedReturnBeatId":"<one of allowedBeatIds>","bridgeText?":"<short>","hintFactId?":"<id>"}.',
    "framingText is a short directorial line shown to the player when they enter a VN node. Keep it under ~280 characters.",
    "suggestedReturnBeatId MUST be one of the allowedBeatIds in the request. If unsure, pick currentBeatId.",
    "Use stepType=framing for tone/pacing color on the current beat, next_beat_hint when nudging toward the next authored beat, and soft_detour for a small inert side moment that still points back to authored canon.",
    "Never invent new world facts. Never resolve the scene. Never reference flag, quest, trust, or var mutations — the engine ignores those anyway.",
    "Do not output any other keys. bridgeText is display-only narration and must not assert outcomes.",
  ].join("\n");

const buildDirectorStepUserPrompt = (
  payload: GenerateDirectorStepPayload,
): string => {
  const facts =
    payload.visibleFacts.length > 0
      ? payload.visibleFacts.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  const flags =
    payload.activeFlags.length > 0
      ? payload.activeFlags.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  const quests =
    payload.activeQuests.length > 0
      ? payload.activeQuests
          .map((entry) => `- ${entry.questId} (stage ${entry.stage})`)
          .join("\n")
      : "- none";
  const allowed = payload.allowedBeatIds
    .map((entry) => `- ${entry}`)
    .join("\n");

  return [
    `Source: ${payload.source}`,
    `Scenario ID: ${payload.scenarioId}`,
    `Node ID: ${payload.nodeId}`,
    `Current beat: ${payload.currentBeatId}`,
    `Route context: ${payload.routeContext ?? "none"}`,
    `Allowed return beats:\n${allowed}`,
    `Visible facts:\n${facts}`,
    `Active flags:\n${flags}`,
    `Active quests:\n${quests}`,
    "Director should choose a small framing or next-beat hint that respects pacing. soft_detour is only for short inert side moments that still return to authored canon.",
    "Reply with one JSON object that conforms to the shape above. suggestedReturnBeatId must appear verbatim in the Allowed return beats list.",
  ]
    .filter((block) => block.length > 0)
    .join("\n\n");
};

export const normalizeDirectorStepProposal = (
  rawJson: string,
  allowedBeatIds: readonly string[],
): DirectorStepProposal => {
  const parsed = JSON.parse(rawJson) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload must be an object for director steps",
    );
  }

  if (!isDirectorStepProposal(parsed)) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload did not match DirectorStepProposal",
    );
  }

  if (!isAllowedDirectorReturnBeatId(parsed, allowedBeatIds)) {
    throw new GeminiMalformedJsonError(
      `DirectorStepProposal.suggestedReturnBeatId '${parsed.suggestedReturnBeatId}' is not in allowedBeatIds`,
    );
  }

  return parsed;
};

export const generateDirectorStepWithGemini = async (
  payload: GenerateDirectorStepPayload,
  config: AiWorkerConfig,
  deps: ProcessClaimedAiRequestDeps = {},
): Promise<GeminiDirectorStepResult> => {
  const fetchImpl = deps.fetchImpl ?? fetch;

  const response = await fetchImpl(
    buildGeminiGenerateContentUrl(config.geminiModel),
    {
      method: "POST",
      headers: buildGeminiRequestHeaders(config.geminiApiKey),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildDirectorStepSystemPrompt() }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildDirectorStepUserPrompt(payload) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: DIRECTOR_STEP_PROPOSAL_JSON_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GeminiHttpError(
      `Gemini request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      response.status,
    );
  }

  const rawText = readGeminiText(await response.json());
  const rawJson = extractJsonObject(rawText);
  if (!rawJson) {
    throw new GeminiMalformedJsonError("Gemini response did not contain JSON");
  }

  const proposal = normalizeDirectorStepProposal(
    rawJson,
    payload.allowedBeatIds,
  );
  return { proposal };
};

export const loadWitchTabletopDmRules = (): string => {
  if (!existsSync(WITCH_TABLETOP_DM_RULES_PATH)) {
    throw new Error(
      `Witch tabletop DM rules file not found: ${WITCH_TABLETOP_DM_RULES_PATH}`,
    );
  }

  const rulesText = readFileSync(WITCH_TABLETOP_DM_RULES_PATH, "utf8").trim();
  if (rulesText.length === 0) {
    throw new Error(
      `Witch tabletop DM rules file is empty: ${WITCH_TABLETOP_DM_RULES_PATH}`,
    );
  }
  return rulesText;
};

const buildDmTurnSystemPrompt = (rulesText: string): string =>
  [
    "You are a tabletop Dungeon Master for Grenzwanderer, serving Eleanor Vance's Witch one-shot.",
    "Return exactly one JSON object and nothing else. Do not wrap the JSON in markdown fences.",
    "All narration must be in Russian. Safe zones use lively Chekhovian social texture; investigation and threat scenes use literary Gothic/Mystery detective tone.",
    "You may propose session-canon facts only when the request spends a Fate token. Session canon is review-only until accepted by the player.",
    "Never mutate immutable snapshot, authored canon, Case01 final flags, or quest truth directly. suggestedStateDeltas are proposals for review only.",
    "The core Grand Estate truth is Both true: a real spirit is present, and people exploit or cover the haunting for a human secret.",
    "Respect the private player remark as hidden intent; do not quote it as if NPCs heard it.",
    "Use risks and canonRemarks to surface bargains, exposure, blood pressure, debt, and promotion candidates.",
    "This turn is one BEAT in a director-driven chain. The requested beat directive (see user message) decides the response shape. Every beat MUST continue consistently from the prior narration, accepted facts, and the player's action — never contradict them.",
    "Beat 'atmosphere': write only `narration` — a slow, sensory, atmospheric moment that moves the mood, not the plot. Do NOT decide anything. Leave `options` empty and `innerVoiceDialogue` empty (or at most one quiet line).",
    "Beat 'complication': write `narration` that introduces an obstacle, twist, or rising pressure. Do NOT resolve it and do NOT offer options; just raise the stakes. `options` empty.",
    "Beat 'debate_options' (the decision beat): First write `innerVoiceDialogue` — a short debate (2-4 lines) among ONLY the inner voices listed under 'Active inner voices', each using its exact voiceId and given stance, voiced in character per its worldview and tone; the 'opposes' voice (counter) MUST push back. THEN write `options`: EXACTLY 3 distinct next moves, each a short Russian action `label` (optional one-line `detail`), roughly spanning the debate (dominant/support line, counter line, a third/middle path). Keep `narration` to a brief 1-3 sentence framing that does not resolve the scene.",
    "If no beat directive is given, treat it as 'debate_options'.",
    'Shape: {"narration":"...","innerVoiceDialogue":[{"voiceId":"inner_x","stance":"supports|opposes","line":"..."}],"options":[{"id":"opt_a","label":"...","detail":"..."}],"checks":[],"sessionFacts":[],"suggestedStateDeltas":[],"risks":[],"toneMode":"safe_chekhovian"|"gothic_mystery"|"threat","canonRemarks":[],"resourceCosts?":{}}.',
    "",
    "Authoritative Witch Tabletop DM Rules Bible follows. Treat it as binding session policy:",
    rulesText,
  ].join("\n");

const buildDmTurnUserPrompt = (payload: GenerateDmTurnPayload): string => {
  const activeFacts =
    payload.activeSessionFacts.length > 0
      ? payload.activeSessionFacts
          .map((fact) => `- ${fact.id}: ${fact.text} [${fact.status}]`)
          .join("\n")
      : "- none";
  const acceptedRemarks =
    payload.acceptedRemarks.length > 0
      ? payload.acceptedRemarks.map((remark) => `- ${remark.text}`).join("\n")
      : "- none";
  const visibleFacts =
    payload.visibleFacts.length > 0
      ? payload.visibleFacts.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  const activeFlags =
    payload.activeFlags.length > 0
      ? payload.activeFlags.map((entry) => `- ${entry}`).join("\n")
      : "- none";
  const activeVoices =
    payload.innerVoices && payload.innerVoices.length > 0
      ? payload.innerVoices
          .map(
            (voice) =>
              `- ${voice.voiceId} [${voice.role}/${voice.stance}] ${voice.label}: ${voice.worldview} (tone: ${voice.toneDescriptor})`,
          )
          .join("\n")
      : "- none";

  return [
    `Source: ${payload.source}`,
    `Scenario ID: ${payload.scenarioId}`,
    `Node ID: ${payload.nodeId}`,
    `Tone mode: ${payload.toneMode}`,
    `Player action: ${payload.actionText}`,
    `Beat directive: ${payload.beatDirective?.kind ?? "debate_options"}`,
    `Prior narration (continue consistently from this; do not contradict it):\n${payload.priorNarration?.trim() || "none"}`,
    `Active inner voices (voice the debate using EXACTLY these, with their stance):\n${activeVoices}`,
    `Private remark: ${payload.remark?.text ?? "none"}`,
    `Spend Fate token: ${payload.spendFateToken}`,
    `Fortune spend: ${payload.fortuneSpend ?? 0}`,
    `Move tags: ${payload.moveTags.join(", ") || "none"}`,
    `Resources: fate=${payload.resources.fate}, fortune=${payload.resources.fortune}, fortuneMod=${payload.resources.fortuneMod}, karma=${payload.resources.karma}`,
    `Psyche: axisX=${payload.psyche.axisX}, axisY=${payload.psyche.axisY}, approach=${payload.psyche.approach}`,
    `Blood Curse: tier=${payload.bloodCurse.tier}, pressure=${payload.bloodCurse.pressure}, power=${payload.bloodCurse.power}, debt=${payload.bloodCurse.debt}, alcoholAftertaste=${payload.bloodCurse.alcoholAftertaste}`,
    `Visible facts:\n${visibleFacts}`,
    `Active flags:\n${activeFlags}`,
    `Accepted session facts:\n${activeFacts}`,
    `Accepted private notes:\n${acceptedRemarks}`,
    "If spendFateToken is false, do not introduce new sessionFacts; only narrate, ask for checks, or list risks.",
    "Produce exactly the shape required by the Beat directive above (atmosphere/complication = narration only, empty options; debate_options = innerVoiceDialogue using only the active inner voices + exactly 3 options). Reply with one JSON object conforming to the schema. Keep narration concise enough for a side panel.",
  ]
    .filter((block) => block.length > 0)
    .join("\n\n");
};

export const normalizeDmTurnProposal = (rawJson: string): DmTurnProposal => {
  const parsed = JSON.parse(rawJson) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload must be an object for DM turns",
    );
  }

  if (!isDmTurnProposal(parsed)) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload did not match DmTurnProposal",
    );
  }

  return parsed;
};

export const generateDmTurnWithGemini = async (
  payload: GenerateDmTurnPayload,
  config: AiWorkerConfig,
  deps: ProcessClaimedAiRequestDeps = {},
): Promise<GeminiDmTurnResult> => {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const rulesText = deps.loadDmRulesTextImpl?.() ?? loadWitchTabletopDmRules();

  const response = await fetchImpl(
    buildGeminiGenerateContentUrl(config.geminiModel),
    {
      method: "POST",
      headers: buildGeminiRequestHeaders(config.geminiApiKey),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildDmTurnSystemPrompt(rulesText) }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildDmTurnUserPrompt(payload) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: DM_TURN_PROPOSAL_JSON_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GeminiHttpError(
      `Gemini request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      response.status,
    );
  }

  const rawText = readGeminiText(await response.json());
  const rawJson = extractJsonObject(rawText);
  if (!rawJson) {
    throw new GeminiMalformedJsonError("Gemini response did not contain JSON");
  }

  const proposal = normalizeDmTurnProposal(rawJson);
  return { proposal };
};

export const isRetryableWorkerError = (error: unknown): boolean => {
  if (error instanceof GeminiMalformedJsonError) {
    return true;
  }
  if (error instanceof GeminiHttpError) {
    return error.status === 429 || error.status >= 500;
  }
  if (error instanceof TypeError) {
    return true;
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);
  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("fetch failed")
  );
};

export const computeRetryDelayMs = (
  attemptCount: number,
  baseMs: number,
  maxMs: number,
  random: () => number = Math.random,
): number => {
  const exponent = Math.max(0, attemptCount - 1);
  const rawDelay = Math.min(maxMs, baseMs * 2 ** exponent);
  const jitterMultiplier = 0.8 + random() * 0.4;
  return Math.max(
    baseMs,
    Math.min(maxMs, Math.round(rawDelay * jitterMultiplier)),
  );
};

export const withLeaseHeartbeat = async <T>(
  task: () => Promise<T>,
  renewLease: () => Promise<void>,
  intervalMs: number,
): Promise<T> => {
  let heartbeatError: unknown = null;
  const timer = setInterval(() => {
    void renewLease().catch((error) => {
      if (!heartbeatError) {
        heartbeatError = error;
      }
    });
  }, intervalMs);

  try {
    const result = await task();
    if (heartbeatError) {
      throw heartbeatError;
    }
    return result;
  } finally {
    clearInterval(timer);
  }
};

const describeFailure = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const processClaimedAiRequest = async (
  conn: AiWorkerConnection,
  job: ClaimedAiRequest,
  config: AiWorkerConfig,
  deps: ProcessClaimedAiRequestDeps = {},
): Promise<void> => {
  const logger = getLogger(deps.logger);
  const buildSceneContextImpl = deps.buildSceneContextImpl ?? buildSceneContext;
  const generateDialogueImpl =
    deps.generateDialogueImpl ?? generateDialogueWithGemini;
  const generateCharacterReactionImpl =
    deps.generateCharacterReactionImpl ?? generateCharacterReactionWithGemini;
  const generateDirectorStepImpl =
    deps.generateDirectorStepImpl ?? generateDirectorStepWithGemini;
  const generateDmTurnImpl =
    deps.generateDmTurnImpl ?? generateDmTurnWithGemini;
  const createRequestId = deps.createRequestId ?? defaultCreateRequestId;
  const retryableLoggerPrefix = `[ai-worker] request ${job.id.toString()}`;

  if (job.kind === AI_PROPOSE_DM_TURN_KIND) {
    const dmPayload = parseGenerateDmTurnPayload(job.payloadJson);
    if (!dmPayload) {
      captureBackendException(
        new Error("Invalid propose_dm_turn payload JSON"),
        {
          "ai.kind": job.kind,
          "ai.request_id": job.requestId,
          "ai.request_db_id": job.id.toString(),
          "ai.failure": "invalid_payload",
        },
      );
      await conn.reducers.failAiRequest({
        requestId: createRequestId("invalid_payload", job.id),
        aiRequestId: job.id,
        error: "Invalid propose_dm_turn payload JSON",
      });
      return;
    }

    try {
      const result = await withLeaseHeartbeat(
        async () => generateDmTurnImpl(dmPayload, config, deps),
        async () => {
          await conn.reducers.renewAiRequestLease({
            requestId: createRequestId("renew", job.id),
            aiRequestId: job.id,
            leaseMs: config.leaseMs,
          });
        },
        Math.max(1_000, Math.floor(config.leaseMs / 2)),
      );

      await conn.reducers.completeAiRequest({
        requestId: createRequestId("complete", job.id),
        aiRequestId: job.id,
        responseJson: JSON.stringify(result.proposal),
      });
    } catch (error) {
      const retryable =
        job.attemptCount < config.maxRetries && isRetryableWorkerError(error);
      const errorMessage = describeFailure(error);
      logger.warn(`${retryableLoggerPrefix} failed: ${errorMessage}`);
      captureAiJobFailure(error, job, retryable);

      await conn.reducers.failAiRequest({
        requestId: createRequestId(retryable ? "retry" : "failed", job.id),
        aiRequestId: job.id,
        error: errorMessage,
        retryDelayMs: retryable
          ? computeRetryDelayMs(
              job.attemptCount,
              config.retryBaseMs,
              config.retryMaxMs,
              getRandom(deps.random),
            )
          : undefined,
      });
    }
    return;
  }

  if (job.kind === AI_PROPOSE_DIRECTOR_STEP_KIND) {
    const directorPayload = parseGenerateDirectorStepPayload(job.payloadJson);
    if (!directorPayload) {
      captureBackendException(
        new Error("Invalid propose_director_step payload JSON"),
        {
          "ai.kind": job.kind,
          "ai.request_id": job.requestId,
          "ai.request_db_id": job.id.toString(),
          "ai.failure": "invalid_payload",
        },
      );
      await conn.reducers.failAiRequest({
        requestId: createRequestId("invalid_payload", job.id),
        aiRequestId: job.id,
        error: "Invalid propose_director_step payload JSON",
      });
      return;
    }

    try {
      const result = await withLeaseHeartbeat(
        async () => generateDirectorStepImpl(directorPayload, config, deps),
        async () => {
          await conn.reducers.renewAiRequestLease({
            requestId: createRequestId("renew", job.id),
            aiRequestId: job.id,
            leaseMs: config.leaseMs,
          });
        },
        Math.max(1_000, Math.floor(config.leaseMs / 2)),
      );

      await conn.reducers.completeAiRequest({
        requestId: createRequestId("complete", job.id),
        aiRequestId: job.id,
        responseJson: JSON.stringify(result.proposal),
      });
    } catch (error) {
      const retryable =
        job.attemptCount < config.maxRetries && isRetryableWorkerError(error);
      const errorMessage = describeFailure(error);
      logger.warn(`${retryableLoggerPrefix} failed: ${errorMessage}`);
      captureAiJobFailure(error, job, retryable);

      await conn.reducers.failAiRequest({
        requestId: createRequestId(retryable ? "retry" : "failed", job.id),
        aiRequestId: job.id,
        error: errorMessage,
        retryDelayMs: retryable
          ? computeRetryDelayMs(
              job.attemptCount,
              config.retryBaseMs,
              config.retryMaxMs,
              getRandom(deps.random),
            )
          : undefined,
      });
    }
    return;
  }

  if (job.kind === AI_GENERATE_CHARACTER_REACTION_KIND) {
    const reactionPayload = parseGenerateCharacterReactionPayload(
      job.payloadJson,
    );
    if (!reactionPayload) {
      captureBackendException(
        new Error("Invalid generate_character_reaction payload JSON"),
        {
          "ai.kind": job.kind,
          "ai.request_id": job.requestId,
          "ai.request_db_id": job.id.toString(),
          "ai.failure": "invalid_payload",
        },
      );
      await conn.reducers.failAiRequest({
        requestId: createRequestId("invalid_payload", job.id),
        aiRequestId: job.id,
        error: "Invalid generate_character_reaction payload JSON",
      });
      return;
    }

    try {
      const result = await withLeaseHeartbeat(
        async () =>
          generateCharacterReactionImpl(reactionPayload, config, deps),
        async () => {
          await conn.reducers.renewAiRequestLease({
            requestId: createRequestId("renew", job.id),
            aiRequestId: job.id,
            leaseMs: config.leaseMs,
          });
        },
        Math.max(1_000, Math.floor(config.leaseMs / 2)),
      );

      await conn.reducers.completeAiRequest({
        requestId: createRequestId("complete", job.id),
        aiRequestId: job.id,
        responseJson: JSON.stringify(result.proposal),
      });
    } catch (error) {
      const retryable =
        job.attemptCount < config.maxRetries && isRetryableWorkerError(error);
      const errorMessage = describeFailure(error);
      logger.warn(`${retryableLoggerPrefix} failed: ${errorMessage}`);
      captureAiJobFailure(error, job, retryable);

      await conn.reducers.failAiRequest({
        requestId: createRequestId(retryable ? "retry" : "failed", job.id),
        aiRequestId: job.id,
        error: errorMessage,
        retryDelayMs: retryable
          ? computeRetryDelayMs(
              job.attemptCount,
              config.retryBaseMs,
              config.retryMaxMs,
              getRandom(deps.random),
            )
          : undefined,
      });
    }
    return;
  }

  const payload = parseGenerateDialoguePayload(job.payloadJson);
  if (!payload) {
    captureBackendException(
      new Error("Invalid generate_dialogue payload JSON"),
      {
        "ai.kind": job.kind,
        "ai.request_id": job.requestId,
        "ai.request_db_id": job.id.toString(),
        "ai.failure": "invalid_payload",
      },
    );
    await conn.reducers.failAiRequest({
      requestId: createRequestId("invalid_payload", job.id),
      aiRequestId: job.id,
      error: "Invalid generate_dialogue payload JSON",
    });
    return;
  }

  try {
    const result = await withLeaseHeartbeat(
      async () => {
        const sceneContext = await buildSceneContextImpl(
          { playerId: job.playerId },
          payload,
          {
            host: config.host,
            database: config.database,
            token: config.token,
            fetchImpl: deps.fetchImpl,
          },
        );

        return generateDialogueImpl(payload, sceneContext, config, deps);
      },
      async () => {
        await conn.reducers.renewAiRequestLease({
          requestId: createRequestId("renew", job.id),
          aiRequestId: job.id,
          leaseMs: config.leaseMs,
        });
      },
      Math.max(1_000, Math.floor(config.leaseMs / 2)),
    );

    await conn.reducers.completeAiRequest({
      requestId: createRequestId("complete", job.id),
      aiRequestId: job.id,
      responseJson: JSON.stringify(result.response),
    });
  } catch (error) {
    const retryable =
      job.attemptCount < config.maxRetries && isRetryableWorkerError(error);
    const errorMessage = describeFailure(error);
    logger.warn(`${retryableLoggerPrefix} failed: ${errorMessage}`);
    captureAiJobFailure(error, job, retryable);

    await conn.reducers.failAiRequest({
      requestId: createRequestId(retryable ? "retry" : "failed", job.id),
      aiRequestId: job.id,
      error: errorMessage,
      retryDelayMs: retryable
        ? computeRetryDelayMs(
            job.attemptCount,
            config.retryBaseMs,
            config.retryMaxMs,
            getRandom(deps.random),
          )
        : undefined,
    });
  }
};

export const drainAiQueueOnce = async (
  conn: AiWorkerConnection,
  config: AiWorkerConfig,
  deps: DrainAiQueueDeps = {},
): Promise<number> => {
  let processed = 0;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const createClaimToken = deps.createClaimToken ?? defaultCreateClaimToken;
  const createRequestId = deps.createRequestId ?? defaultCreateRequestId;

  for (const kind of SUPPORTED_AI_KINDS) {
    while (true) {
      const claimToken = createClaimToken();
      await conn.reducers.claimNextAiRequest({
        requestId: createRequestId("claim"),
        kind,
        leaseMs: config.leaseMs,
        claimToken,
      });

      const job = await fetchClaimedAiRequest(claimToken, config, fetchImpl);
      if (!job) {
        break;
      }

      await processClaimedAiRequest(conn, job, config, deps);
      processed += 1;
    }
  }

  return processed;
};

export const runAiWorker = async (
  config: AiWorkerConfig,
  args: readonly string[] = process.argv.slice(2),
  deps: DrainAiQueueDeps = {},
): Promise<void> => {
  const once = parseBooleanFlag(args, "--once");
  const logger = getLogger(deps.logger);

  while (true) {
    let conn: AiWorkerConnection | null = null;
    try {
      conn = (await connectOperatorConnection(
        config.host,
        config.database,
        config.token,
      )) as AiWorkerConnection;
      await ensureWorkerAccess(conn as any);

      if (once) {
        const processed = await drainAiQueueOnce(conn, config, deps);
        logger.info(`[ai-worker] drained ${processed} AI request(s)`);
        return;
      }

      while (true) {
        const processed = await drainAiQueueOnce(conn, config, deps);
        if (processed === 0) {
          await sleep(config.pollMs);
          continue;
        }

        logger.info(`[ai-worker] processed ${processed} AI request(s)`);
      }
    } catch (error) {
      captureBackendException(error, {
        "ai.worker.phase": "loop",
        "spacetimedb.db": config.database,
        "spacetimedb.host": config.host,
      });
      logger.error(
        `[ai-worker] loop failure: ${describeFailure(error)}. reconnecting after ${config.pollMs}ms`,
      );
      if (once) {
        throw error;
      }
      await sleep(config.pollMs);
    } finally {
      conn?.disconnect();
    }
  }
};

const usage = (): void => {
  console.log(
    [
      "Usage: bun run scripts/ai-worker-watch.ts [--once] [--host <ws-url>] [--db <database>]",
      "",
      "Environment:",
      "  GEMINI_API_KEY or GOOGLE_API_KEY",
      "  OPS_STDB_HOST / OPS_STDB_DB / SPACETIMEDB_OPERATOR_TOKEN",
      "  AI_WORKER_GEMINI_MODEL / AI_WORKER_POLL_MS / AI_WORKER_LEASE_MS",
      "  AI_WORKER_MAX_RETRIES / AI_WORKER_RETRY_BASE_MS / AI_WORKER_RETRY_MAX_MS",
      "  SENTRY_ENABLED / SENTRY_DSN / SENTRY_ENVIRONMENT / SENTRY_TRACES_SAMPLE_RATE",
    ].join("\n"),
  );
};

export const main = async (
  args: readonly string[] = process.argv.slice(2),
): Promise<void> => {
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const config = resolveAiWorkerConfig(args);
  initializeBackendMonitoring({
    serviceName: "ai-worker",
    tags: {
      "spacetimedb.host": config.host,
      "spacetimedb.db": config.database,
      "gemini.model": config.geminiModel,
    },
  });
  await runAiWorker(config, args);
};

if (import.meta.main) {
  main().catch((error) => {
    captureBackendException(error, { "ai.worker.phase": "fatal" });
    console.error("[ai-worker] fatal:", error);
    flushBackendMonitoring().finally(() => {
      process.exitCode = 1;
    });
  });
}
