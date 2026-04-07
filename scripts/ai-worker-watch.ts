import { buildCanonicalVoicePromptBrief } from "../data/voiceBridge";
import {
  AI_GENERATE_DIALOGUE_KIND,
  isGenerateDialogueResponse,
  parseGenerateDialoguePayload,
  type GenerateDialogueEnvelope,
  type GenerateDialoguePayload,
} from "../src/features/ai/contracts";
import { buildSceneContext, type SceneContext } from "./ai-context-builder";
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
  return [
    "You write one additive inner-thought line for a detective RPG.",
    "Return exactly one JSON object and nothing else.",
    'The JSON shape is {"text":"...","canonicalVoiceId":"..."}.',
    "Do not wrap the JSON in markdown fences.",
    "Keep the line short, playable, and non-blocking.",
    "Do not invent new facts that contradict the provided scene context.",
    `Voice guide: ${canonicalVoiceBrief}`,
  ].join("\n");
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
    `Choice text: ${payload.choiceText}`,
    `Narrative text: ${payload.narrativeText}`,
    `Location: ${payload.locationName}`,
    `Character: ${payload.characterName ?? "Narrator"}`,
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

  if (!isGenerateDialogueResponse(normalized)) {
    throw new GeminiMalformedJsonError(
      "Gemini JSON payload did not match GenerateDialogueResponse",
    );
  }

  const usage = providerPayload?.usageMetadata;
  return {
    text: normalized.text,
    canonicalVoiceId: normalized.canonicalVoiceId,
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
    `${GEMINI_ENDPOINT}/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
  const createRequestId = deps.createRequestId ?? defaultCreateRequestId;
  const retryableLoggerPrefix = `[ai-worker] request ${job.id.toString()}`;

  const payload = parseGenerateDialoguePayload(job.payloadJson);
  if (!payload) {
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

  while (true) {
    const claimToken = createClaimToken();
    await conn.reducers.claimNextAiRequest({
      requestId: createRequestId("claim"),
      kind: AI_GENERATE_DIALOGUE_KIND,
      leaseMs: config.leaseMs,
      claimToken,
    });

    const job = await fetchClaimedAiRequest(claimToken, config, fetchImpl);
    if (!job) {
      return processed;
    }

    await processClaimedAiRequest(conn, job, config, deps);
    processed += 1;
  }
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
  await runAiWorker(config, args);
};

if (import.meta.main) {
  main().catch((error) => {
    console.error("[ai-worker] fatal:", error);
    process.exitCode = 1;
  });
}
