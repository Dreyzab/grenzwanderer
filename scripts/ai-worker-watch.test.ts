import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  type GenerateDialoguePayload,
} from "../src/features/ai/contracts";
import {
  GeminiHttpError,
  GeminiMalformedJsonError,
  buildClaimedAiRequestQuery,
  computeRetryDelayMs,
  drainAiQueueOnce,
  extractJsonObject,
  parseClaimedAiRequestRow,
  processClaimedAiRequest,
  withLeaseHeartbeat,
  type AiWorkerConfig,
  type AiWorkerConnection,
  type ClaimedAiRequest,
} from "./ai-worker-watch";

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const basePayload: GenerateDialoguePayload = {
  source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
  scenarioId: "sandbox_case01_pilot",
  nodeId: "scene_case01_occult_bank_entry",
  checkId: "check_case01_occult_pressure",
  choiceId: "CHOICE_OCCULT_BANK",
  voiceId: "attr_social",
  choiceText: "Push the banker off his script.",
  passed: true,
  roll: 14,
  difficulty: 12,
  voiceLevel: 3,
  locationName: "Freiburg Bank",
  characterName: "Banker",
  narrativeText: "He keeps counting even when the room goes quiet.",
};

const baseConfig: AiWorkerConfig = {
  host: "ws://127.0.0.1:3000",
  database: "grezwandererdata",
  token: "operator-token",
  geminiApiKey: "test-api-key",
  geminiModel: "gemini-2.5-flash",
  pollMs: 100,
  leaseMs: 1_000,
  maxRetries: 3,
  retryBaseMs: 5_000,
  retryMaxMs: 60_000,
};

const makeJob = (
  overrides: Partial<ClaimedAiRequest> = {},
): ClaimedAiRequest => ({
  id: 1n,
  playerId: "player-hex",
  requestId: "req-1",
  kind: AI_GENERATE_DIALOGUE_KIND,
  payloadJson: JSON.stringify(basePayload),
  status: "processing",
  attemptCount: 1,
  claimToken: "claim-1",
  ...overrides,
});

const createStubConnection = (): AiWorkerConnection => ({
  reducers: {
    claimNextAiRequest: vi.fn(async () => undefined),
    renewAiRequestLease: vi.fn(async () => undefined),
    completeAiRequest: vi.fn(async () => undefined),
    failAiRequest: vi.fn(async () => undefined),
  },
  disconnect: vi.fn(),
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ai-worker-watch", () => {
  it("builds an explicit claimed-job SQL query without SELECT *", () => {
    const query = buildClaimedAiRequestQuery("claim-token");

    expect(query).toContain("SELECT");
    expect(query).toContain("attempt_count");
    expect(query).toContain("claim_token");
    expect(query).not.toContain("SELECT *");
    expect(query).toContain("WHERE status = 'processing'");
  });

  it("parses claimed ai_request rows from object-shaped SQL results", () => {
    const row = parseClaimedAiRequestRow({
      id: "7",
      player_id: "player-hex",
      request_id: "req-7",
      kind: AI_GENERATE_DIALOGUE_KIND,
      payload_json: JSON.stringify(basePayload),
      status: "processing",
      attempt_count: "2",
      claim_token: "claim-7",
    });

    expect(row.id).toBe(7n);
    expect(row.playerId).toBe("player-hex");
    expect(row.attemptCount).toBe(2);
  });

  it("extracts JSON from fenced or prefixed model text", () => {
    expect(
      extractJsonObject(
        '```json\n{"text":"Stay warm.","canonicalVoiceId":"charisma"}\n```',
      ),
    ).toBe('{"text":"Stay warm.","canonicalVoiceId":"charisma"}');
    expect(
      extractJsonObject(
        'Answer:\n{"text":"Stay warm.","canonicalVoiceId":"charisma"}',
      ),
    ).toBe('{"text":"Stay warm.","canonicalVoiceId":"charisma"}');
  });

  it("computes bounded exponential retry delay with jitter", () => {
    const delay = computeRetryDelayMs(3, 5_000, 60_000, () => 0.5);
    expect(delay).toBeGreaterThanOrEqual(5_000);
    expect(delay).toBeLessThanOrEqual(60_000);
  });

  it("completes a claimed job after scene-context and Gemini success", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(conn, makeJob(), baseConfig, {
      createRequestId: (scope) => `req-${scope}`,
      buildSceneContextImpl: vi.fn(async () => ({
        sceneSnapshot: "Scene snapshot",
        recentDialogue: [],
        activeQuestSummary: "",
      })),
      generateDialogueImpl: vi.fn(async () => ({
        response: {
          text: "He wants the room calm before the break.",
          canonicalVoiceId: "charisma",
          metadata: {
            modelId: "gemini-2.5-flash",
            latencyMs: 42,
          },
        },
      })),
    });

    expect(conn.reducers.completeAiRequest).toHaveBeenCalledTimes(1);
    expect(conn.reducers.failAiRequest).not.toHaveBeenCalled();
    expect(conn.reducers.completeAiRequest).toHaveBeenCalledWith({
      requestId: "req-complete",
      aiRequestId: 1n,
      responseJson: JSON.stringify({
        text: "He wants the room calm before the break.",
        canonicalVoiceId: "charisma",
        metadata: {
          modelId: "gemini-2.5-flash",
          latencyMs: 42,
        },
      }),
    });
  });

  it("fails invalid payloads without retry", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(
      conn,
      makeJob({ payloadJson: '{"bad":true}' }),
      baseConfig,
      {
        createRequestId: (scope) => `req-${scope}`,
      },
    );

    expect(conn.reducers.failAiRequest).toHaveBeenCalledWith({
      requestId: "req-invalid_payload",
      aiRequestId: 1n,
      error: "Invalid generate_dialogue payload JSON",
    });
    expect(conn.reducers.completeAiRequest).not.toHaveBeenCalled();
  });

  it("retries malformed model JSON while attempts remain", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(
      conn,
      makeJob({ attemptCount: 1 }),
      baseConfig,
      {
        createRequestId: (scope) => `req-${scope}`,
        buildSceneContextImpl: vi.fn(async () => ({
          sceneSnapshot: "Scene snapshot",
          recentDialogue: [],
          activeQuestSummary: "",
        })),
        generateDialogueImpl: vi.fn(async () => {
          throw new GeminiMalformedJsonError("bad json");
        }),
        random: () => 0,
      },
    );

    expect(conn.reducers.failAiRequest).toHaveBeenCalledTimes(1);
    expect(conn.reducers.failAiRequest).toHaveBeenCalledWith({
      requestId: "req-retry",
      aiRequestId: 1n,
      error: "bad json",
      retryDelayMs: expect.any(Number),
    });
  });

  it("stops retrying after max attempts", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(
      conn,
      makeJob({ attemptCount: 3 }),
      baseConfig,
      {
        createRequestId: (scope) => `req-${scope}`,
        buildSceneContextImpl: vi.fn(async () => ({
          sceneSnapshot: "Scene snapshot",
          recentDialogue: [],
          activeQuestSummary: "",
        })),
        generateDialogueImpl: vi.fn(async () => {
          throw new GeminiHttpError("provider unavailable", 503);
        }),
      },
    );

    expect(conn.reducers.failAiRequest).toHaveBeenCalledWith({
      requestId: "req-failed",
      aiRequestId: 1n,
      error: "provider unavailable",
      retryDelayMs: undefined,
    });
  });

  it("renews lease heartbeat while long-running work is in flight", async () => {
    vi.useFakeTimers();
    const renewLease = vi.fn(async () => undefined);

    const promise = withLeaseHeartbeat(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return "ok";
      },
      renewLease,
      100,
    );

    await vi.advanceTimersByTimeAsync(250);
    await expect(promise).resolves.toBe("ok");
    expect(renewLease).toHaveBeenCalledTimes(2);
  });

  it("drains the queue until no claimed row is returned", async () => {
    const conn = createStubConnection();
    const seenQueries: string[] = [];
    let sqlCallCount = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const query = String(init?.body ?? "");
      seenQueries.push(query);
      if (sqlCallCount === 0) {
        sqlCallCount += 1;
        return jsonResponse([
          {
            id: "1",
            player_id: "player-hex",
            request_id: "req-1",
            kind: AI_GENERATE_DIALOGUE_KIND,
            payload_json: JSON.stringify(basePayload),
            status: "processing",
            attempt_count: 1,
            claim_token: "claim-1",
          },
        ]);
      }
      sqlCallCount += 1;
      return jsonResponse([]);
    });

    const processed = await drainAiQueueOnce(conn, baseConfig, {
      fetchImpl,
      createClaimToken: vi
        .fn()
        .mockReturnValueOnce("claim-1")
        .mockReturnValueOnce("claim-2")
        .mockReturnValueOnce("claim-3"),
      createRequestId: (scope) => `req-${scope}`,
      buildSceneContextImpl: vi.fn(async () => ({
        sceneSnapshot: "Scene snapshot",
        recentDialogue: [],
        activeQuestSummary: "",
      })),
      generateDialogueImpl: vi.fn(async () => ({
        response: {
          text: "Hold the line.",
          canonicalVoiceId: "charisma",
        },
      })),
    });

    expect(processed).toBe(1);
    expect(conn.reducers.claimNextAiRequest).toHaveBeenCalledTimes(3);
    expect(conn.reducers.claimNextAiRequest).toHaveBeenNthCalledWith(1, {
      requestId: "req-claim",
      kind: AI_GENERATE_DIALOGUE_KIND,
      leaseMs: baseConfig.leaseMs,
      claimToken: "claim-1",
    });
    expect(conn.reducers.claimNextAiRequest).toHaveBeenNthCalledWith(2, {
      requestId: "req-claim",
      kind: AI_GENERATE_DIALOGUE_KIND,
      leaseMs: baseConfig.leaseMs,
      claimToken: "claim-2",
    });
    expect(conn.reducers.claimNextAiRequest).toHaveBeenNthCalledWith(3, {
      requestId: "req-claim",
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      leaseMs: baseConfig.leaseMs,
      claimToken: "claim-3",
    });
    expect(conn.reducers.completeAiRequest).toHaveBeenCalledTimes(1);
    expect(
      seenQueries.some((query) =>
        query.includes("WHERE status = 'processing'"),
      ),
    ).toBe(true);
  });
});
