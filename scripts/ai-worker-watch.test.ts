import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_DM_TURN_SOURCE_SIDE_PANEL,
  AI_PROPOSE_DIRECTOR_STEP_KIND,
  AI_PROPOSE_DM_TURN_KIND,
  AI_ANALYZE_FEEDBACK_KIND,
  type GenerateDialoguePayload,
  type GenerateDmTurnPayload,
  type GenerateDirectorStepPayload,
} from "../src/features/ai/contracts";
import {
  GeminiHttpError,
  GeminiMalformedJsonError,
  buildClaimedAiRequestQuery,
  computeRetryDelayMs,
  drainAiQueueOnce,
  extractJsonObject,
  generateCharacterReactionWithGemini,
  generateDmTurnWithGemini,
  generateDialogueWithGemini,
  generateDirectorStepWithGemini,
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

const geminiTextResponse = (text: string): Response =>
  jsonResponse({
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: {
      promptTokenCount: 11,
      candidatesTokenCount: 7,
    },
  });

const readRequestJson = (init: RequestInit | undefined): Record<string, any> =>
  JSON.parse(String(init?.body ?? "{}")) as Record<string, any>;

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

const baseDmPayload: GenerateDmTurnPayload = {
  source: AI_DM_TURN_SOURCE_SIDE_PANEL,
  scenarioId: "sandbox_ghost_pilot",
  nodeId: "scene_evidence_collection",
  actionText: "Я запугиваю Карла и прошу показать тайный ход.",
  remark: {
    text: "Я хочу убедиться, что он не расскажет общему знакомому.",
    visibility: "private_dm",
  },
  spendFateToken: true,
  fortuneSpend: 0,
  moveTags: ["coercive", "investigation"],
  resources: {
    fate: 6,
    fortune: 0,
    fortuneMod: -1,
    karma: -10,
  },
  psyche: {
    axisX: -35,
    axisY: -20,
    approach: 10,
    dominantInnerVoiceId: "inner_manipulator",
    activeInnerVoiceIds: ["inner_manipulator"],
  },
  bloodCurse: {
    tier: 1,
    pressure: 35,
    power: 0,
    debt: 0,
    alcoholAftertaste: 0,
  },
  activeSessionFacts: [],
  acceptedRemarks: [],
  visibleFacts: ["Karl fears the pantry corridor."],
  activeFlags: ["origin_witch"],
  toneMode: "gothic_mystery",
  locale: "ru",
};

const baseConfig: AiWorkerConfig = {
  host: "ws://127.0.0.1:3000",
  database: "grezwandererdata",
  token: "operator-token",
  geminiApiKey: "test-api-key",
  geminiModel: "gemini-3.5-flash",
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
    // Must read the public worker view, not the private ai_request table.
    expect(query).toContain("FROM worker_ai_requests");
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

  it("sends dialogue JSON schema to Gemini and preserves inert suggestions", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const request = readRequestJson(init);
      expect(request.generationConfig).toMatchObject({
        responseMimeType: "application/json",
        responseJsonSchema: {
          required: ["text", "canonicalVoiceId"],
        },
      });
      expect(
        request.generationConfig.responseJsonSchema.properties.suggestedEffects
          .description,
      ).toContain("never auto-applied");

      return geminiTextResponse(
        JSON.stringify({
          text: "The lie arrives polished, which is its own flaw.",
          canonicalVoiceId: "CHARISMA",
          suggestedEffects: [
            {
              type: "hypothesis_focus",
              target: "case_hidden_signals",
              value: "banker_pressure",
            },
          ],
        }),
      );
    });

    const result = await generateDialogueWithGemini(
      basePayload,
      {
        sceneSnapshot: "Scene snapshot",
        recentDialogue: [],
        activeQuestSummary: "",
      },
      baseConfig,
      { fetchImpl, now: () => 100 },
    );

    expect(result.response).toMatchObject({
      text: "The lie arrives polished, which is its own flaw.",
      canonicalVoiceId: "charisma",
      suggestedEffects: [
        {
          type: "hypothesis_focus",
          target: "case_hidden_signals",
          value: "banker_pressure",
        },
      ],
      metadata: {
        modelId: "gemini-3.5-flash",
        latencyMs: 0,
        promptTokens: 11,
        completionTokens: 7,
      },
    });
  });

  it("sends character reaction JSON schema to Gemini", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const request = readRequestJson(init);
      expect(request.generationConfig).toMatchObject({
        responseMimeType: "application/json",
        responseJsonSchema: {
          required: ["characterId", "reactionType", "text"],
        },
      });
      expect(
        request.generationConfig.responseJsonSchema.properties.reactionType
          .enum,
      ).toContain("evasion");

      return geminiTextResponse(
        JSON.stringify({
          characterId: "rudi",
          reactionType: "evasion",
          text: "Rudi wipes the table twice before answering.",
          revealHintFactId: "rudi_shift_timing",
        }),
      );
    });

    const result = await generateCharacterReactionWithGemini(
      {
        source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
        characterId: "rudi",
        scenarioId: "case01_false_trail_workers",
        nodeId: "scene_case01_workers_rudi",
        eventText: "The detective asks about the rail-yard shift.",
        visibleFacts: ["Rudi is a worker at the tavern."],
        relationshipState: {
          trust: -4,
          disposition: "neutral",
        },
      },
      baseConfig,
      { fetchImpl },
    );

    expect(result.proposal).toMatchObject({
      characterId: "rudi",
      reactionType: "evasion",
      text: "Rudi wipes the table twice before answering.",
      revealHintFactId: "rudi_shift_timing",
    });
  });

  it("sends DM turn JSON schema to Gemini and rejects canon mutation keys", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const request = readRequestJson(init);
      const systemPrompt = String(
        request.systemInstruction?.parts?.[0]?.text ?? "",
      );
      expect(systemPrompt).toContain("Witch Tabletop DM Rules Bible");
      expect(systemPrompt).toContain(
        "TEST DM RULE: Fate creates session canon only.",
      );
      expect(request.generationConfig).toMatchObject({
        responseMimeType: "application/json",
        responseJsonSchema: {
          required: [
            "narration",
            "checks",
            "sessionFacts",
            "suggestedStateDeltas",
            "risks",
            "toneMode",
            "canonRemarks",
          ],
        },
      });
      expect(
        request.generationConfig.responseJsonSchema.properties
          .suggestedStateDeltas.description,
      ).toContain("No snapshot/canon mutation");

      return geminiTextResponse(
        JSON.stringify({
          narration:
            "Карл отступает к кладовой и смотрит на ваши руки, будто боится не пальцев, а тени вокруг них.",
          checks: [
            {
              id: "dm_check_karl_pressure",
              label: "Дожать Карла",
              voiceId: "attr_social",
              difficulty: 11,
              moveTags: ["coercive"],
            },
          ],
          sessionFacts: [
            {
              id: "session.karl.pantry_route",
              text: "Karl knows a pantry route used after midnight.",
              scope: "session",
              source: "dm",
              status: "proposed",
            },
          ],
          suggestedStateDeltas: [
            {
              key: "witch_blood_curse_pressure",
              kind: "add_var",
              value: 10,
              reason: "The Veil reacts to coercion.",
            },
          ],
          risks: ["Karl may run to the Baroness."],
          toneMode: "gothic_mystery",
          canonRemarks: ["Session fact waits for review/accept."],
          resourceCosts: { fate: 1 },
        }),
      );
    });

    const result = await generateDmTurnWithGemini(baseDmPayload, baseConfig, {
      fetchImpl,
      loadDmRulesTextImpl: () =>
        "TEST DM RULE: Fate creates session canon only.",
    });

    expect(result.proposal.sessionFacts[0]?.scope).toBe("session");
    expect(result.proposal.suggestedStateDeltas[0]?.key).toBe(
      "witch_blood_curse_pressure",
    );

    const invalidFetchImpl = vi.fn<typeof fetch>(async () =>
      geminiTextResponse(
        JSON.stringify({
          narration: "Canon mutation attempt.",
          checks: [],
          sessionFacts: [],
          suggestedStateDeltas: [
            {
              key: "case_resolved",
              kind: "set_flag",
              value: true,
              reason: "Forbidden.",
            },
          ],
          risks: [],
          toneMode: "gothic_mystery",
          canonRemarks: [],
        }),
      ),
    );

    await expect(
      generateDmTurnWithGemini(baseDmPayload, baseConfig, {
        fetchImpl: invalidFetchImpl,
      }),
    ).rejects.toBeInstanceOf(GeminiMalformedJsonError);
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
            modelId: "gemini-3.5-flash",
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
          modelId: "gemini-3.5-flash",
          latencyMs: 42,
        },
      }),
    });
  });

  it("completes a claimed character reaction job as a proposal only", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(
      conn,
      makeJob({
        kind: AI_GENERATE_CHARACTER_REACTION_KIND,
        payloadJson: JSON.stringify({
          source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
          characterId: "rudi",
          scenarioId: "case01_false_trail_workers",
          nodeId: "scene_case01_workers_rudi",
          eventText: "The detective asks about the rail-yard shift.",
          visibleFacts: ["Rudi is a worker at the tavern."],
          relationshipState: {
            trust: -4,
            disposition: "neutral",
          },
        }),
      }),
      baseConfig,
      {
        createRequestId: (scope) => `req-${scope}`,
        generateCharacterReactionImpl: vi.fn(async () => ({
          proposal: {
            characterId: "rudi",
            reactionType: "evasion" as const,
            text: "Rudi wipes the table twice before answering.",
            revealHintFactId: "rudi_shift_timing",
            suggestedEffects: [
              {
                type: "trust_delta" as const,
                value: -1,
              },
            ],
          },
        })),
      },
    );

    expect(conn.reducers.completeAiRequest).toHaveBeenCalledTimes(1);
    expect(conn.reducers.completeAiRequest).toHaveBeenCalledWith({
      requestId: "req-complete",
      aiRequestId: 1n,
      responseJson: JSON.stringify({
        characterId: "rudi",
        reactionType: "evasion",
        text: "Rudi wipes the table twice before answering.",
        revealHintFactId: "rudi_shift_timing",
        suggestedEffects: [
          {
            type: "trust_delta",
            value: -1,
          },
        ],
      }),
    });
    expect(conn.reducers.failAiRequest).not.toHaveBeenCalled();
  });

  it("completes a claimed DM turn job as a review-only proposal", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(
      conn,
      makeJob({
        kind: AI_PROPOSE_DM_TURN_KIND,
        payloadJson: JSON.stringify(baseDmPayload),
      }),
      baseConfig,
      {
        createRequestId: (scope) => `req-${scope}`,
        generateDmTurnImpl: vi.fn(async () => ({
          proposal: {
            narration:
              "Карл показывает на кладовую, но просит не называть его имени.",
            checks: [],
            sessionFacts: [
              {
                id: "session.karl.pantry_route",
                text: "Karl knows a pantry route used after midnight.",
                scope: "session" as const,
                source: "dm" as const,
                status: "proposed" as const,
              },
            ],
            suggestedStateDeltas: [
              {
                key: "witch_blood_curse_pressure",
                kind: "add_var" as const,
                value: 10,
                reason: "Veil pressure rises.",
              },
            ],
            risks: ["Karl may warn the Baroness."],
            toneMode: "gothic_mystery" as const,
            canonRemarks: ["Review then accept."],
            resourceCosts: { fate: 1 },
          },
        })),
      },
    );

    expect(conn.reducers.completeAiRequest).toHaveBeenCalledTimes(1);
    expect(conn.reducers.completeAiRequest).toHaveBeenCalledWith({
      requestId: "req-complete",
      aiRequestId: 1n,
      responseJson: JSON.stringify({
        narration:
          "Карл показывает на кладовую, но просит не называть его имени.",
        checks: [],
        sessionFacts: [
          {
            id: "session.karl.pantry_route",
            text: "Karl knows a pantry route used after midnight.",
            scope: "session",
            source: "dm",
            status: "proposed",
          },
        ],
        suggestedStateDeltas: [
          {
            key: "witch_blood_curse_pressure",
            kind: "add_var",
            value: 10,
            reason: "Veil pressure rises.",
          },
        ],
        risks: ["Karl may warn the Baroness."],
        toneMode: "gothic_mystery",
        canonRemarks: ["Review then accept."],
        resourceCosts: { fate: 1 },
      }),
    });
    expect(conn.reducers.failAiRequest).not.toHaveBeenCalled();
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
        .mockReturnValueOnce("claim-3")
        .mockReturnValueOnce("claim-4")
        .mockReturnValueOnce("claim-5")
        .mockReturnValueOnce("claim-6"),
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
    expect(conn.reducers.claimNextAiRequest).toHaveBeenCalledTimes(6);
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
    expect(conn.reducers.claimNextAiRequest).toHaveBeenNthCalledWith(4, {
      requestId: "req-claim",
      kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
      leaseMs: baseConfig.leaseMs,
      claimToken: "claim-4",
    });
    expect(conn.reducers.claimNextAiRequest).toHaveBeenNthCalledWith(5, {
      requestId: "req-claim",
      kind: AI_PROPOSE_DM_TURN_KIND,
      leaseMs: baseConfig.leaseMs,
      claimToken: "claim-5",
    });
    expect(conn.reducers.claimNextAiRequest).toHaveBeenNthCalledWith(6, {
      requestId: "req-claim",
      kind: AI_ANALYZE_FEEDBACK_KIND,
      leaseMs: baseConfig.leaseMs,
      claimToken: "claim-6",
    });
    expect(conn.reducers.completeAiRequest).toHaveBeenCalledTimes(1);
    expect(
      seenQueries.some((query) =>
        query.includes("WHERE status = 'processing'"),
      ),
    ).toBe(true);
  });

  it("sends director step JSON schema to Gemini and accepts allowed return beats", async () => {
    const directorPayload: GenerateDirectorStepPayload = {
      source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_hbf_arrival_intro",
      currentBeatId: "case01_hbf_arrival",
      allowedBeatIds: ["case01_hbf_arrival", "case01_mayor_briefing"],
      visibleFacts: ["fritz_contact_established"],
      activeFlags: ["freiburg_case01_mainline_active"],
      activeQuests: [{ questId: "quest_case01_main", stage: 1 }],
    };

    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const request = readRequestJson(init);
      expect(request.generationConfig).toMatchObject({
        responseMimeType: "application/json",
        responseJsonSchema: {
          required: ["stepType", "framingText", "suggestedReturnBeatId"],
        },
      });
      expect(
        request.generationConfig.responseJsonSchema.properties.stepType.enum,
      ).toContain("soft_detour");

      return geminiTextResponse(
        JSON.stringify({
          stepType: "soft_detour",
          framingText: "Поезд гудит, толпа редеет, ты смотришь на расписание.",
          suggestedReturnBeatId: "case01_mayor_briefing",
          bridgeText: "Имя в расписании ничего не значит, но рука сама пишет.",
        }),
      );
    });

    const result = await generateDirectorStepWithGemini(
      directorPayload,
      baseConfig,
      { fetchImpl },
    );

    expect(result.proposal).toMatchObject({
      stepType: "soft_detour",
      suggestedReturnBeatId: "case01_mayor_briefing",
    });
  });

  it("rejects director proposals with return beat outside allowedBeatIds", async () => {
    const directorPayload: GenerateDirectorStepPayload = {
      source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_hbf_arrival_intro",
      currentBeatId: "case01_hbf_arrival",
      allowedBeatIds: ["case01_hbf_arrival", "case01_mayor_briefing"],
      visibleFacts: [],
      activeFlags: [],
      activeQuests: [],
    };

    const fetchImpl = vi.fn<typeof fetch>(async () =>
      geminiTextResponse(
        JSON.stringify({
          stepType: "next_beat_hint",
          framingText: "Director sneaks an off-canon target.",
          suggestedReturnBeatId: "scenario_off_canon",
        }),
      ),
    );

    await expect(
      generateDirectorStepWithGemini(directorPayload, baseConfig, {
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(GeminiMalformedJsonError);
  });

  it("completes a claimed director step job as a proposal only", async () => {
    const conn = createStubConnection();
    const directorPayload: GenerateDirectorStepPayload = {
      source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
      scenarioId: "case01_hbf_arrival",
      nodeId: "scene_case01_hbf_arrival_intro",
      currentBeatId: "case01_hbf_arrival",
      allowedBeatIds: ["case01_hbf_arrival", "case01_mayor_briefing"],
      visibleFacts: [],
      activeFlags: [],
      activeQuests: [],
    };

    await processClaimedAiRequest(
      conn,
      makeJob({
        kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
        payloadJson: JSON.stringify(directorPayload),
      }),
      baseConfig,
      {
        createRequestId: (scope) => `req-${scope}`,
        generateDirectorStepImpl: vi.fn(async () => ({
          proposal: {
            stepType: "framing" as const,
            framingText: "Director colors the platform softly.",
            suggestedReturnBeatId: "case01_hbf_arrival",
          },
        })),
      },
    );

    expect(conn.reducers.completeAiRequest).toHaveBeenCalledTimes(1);
    expect(conn.reducers.completeAiRequest).toHaveBeenCalledWith({
      requestId: "req-complete",
      aiRequestId: 1n,
      responseJson: JSON.stringify({
        stepType: "framing",
        framingText: "Director colors the platform softly.",
        suggestedReturnBeatId: "case01_hbf_arrival",
      }),
    });
    expect(conn.reducers.failAiRequest).not.toHaveBeenCalled();
  });

  it("fails invalid director step payload without retry", async () => {
    const conn = createStubConnection();
    await processClaimedAiRequest(
      conn,
      makeJob({
        kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
        payloadJson: JSON.stringify({ source: "wrong" }),
      }),
      baseConfig,
      { createRequestId: (scope) => `req-${scope}` },
    );

    expect(conn.reducers.failAiRequest).toHaveBeenCalledWith({
      requestId: "req-invalid_payload",
      aiRequestId: 1n,
      error: "Invalid propose_director_step payload JSON",
    });
    expect(conn.reducers.completeAiRequest).not.toHaveBeenCalled();
  });
});
