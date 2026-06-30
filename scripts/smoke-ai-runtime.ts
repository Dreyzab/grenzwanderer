import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  AI_PROPOSE_DIRECTOR_STEP_KIND,
  type GenerateCharacterReactionPayload,
  type GenerateDialoguePayload,
  type GenerateDirectorStepPayload,
} from "../src/features/ai/contracts";
import {
  connectOperatorConnection,
  ensureAdminAccess,
  ensureWorkerAccess,
  getOperatorToken,
} from "./spacetime-operator";

const host = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const database = process.env.SMOKE_STDB_DB ?? "grezwandererdata";

type AiRequestRow = {
  id: bigint;
  requestId: string;
  status: string;
};

const dialoguePayload: GenerateDialoguePayload = {
  source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
  scenarioId: "case01_hbf_arrival",
  nodeId: "scene_case01_hbf_police",
  checkId: "smoke_ai_dialogue_check",
  choiceId: "SMOKE_AI_DIALOGUE_CHOICE",
  voiceId: "attr_social",
  choiceText: "Keep the police post calm.",
  passed: true,
  roll: 15,
  difficulty: 10,
  voiceLevel: 2,
  locationName: "Freiburg Hauptbahnhof",
  characterName: "Matthias Adler",
  narrativeText: "The police clerk waits for the detective to choose a tone.",
};

const reactionPayload = (
  characterId: string,
): GenerateCharacterReactionPayload => ({
  source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  characterId,
  scenarioId: "case01_false_trail_workers",
  nodeId: "scene_case01_workers_rudi",
  eventText: "The detective asks about the rail-yard shift.",
  visibleFacts: ["Rudi is a worker at the tavern."],
  relationshipState: {
    trust: -4,
    disposition: "neutral",
  },
});

const directorStepPayload = (nodeId: string): GenerateDirectorStepPayload => ({
  source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
  scenarioId: "case01_hbf_arrival",
  nodeId,
  currentBeatId: "case01_hbf_arrival",
  allowedBeatIds: ["case01_hbf_arrival", "case01_mayor_briefing"],
  visibleFacts: ["fritz_contact_established"],
  activeFlags: ["freiburg_case01_mainline_active"],
  activeQuests: [{ questId: "quest_case01_main", stage: 1 }],
});

const connectAnonymousConnection = async (): Promise<DbConnection> =>
  new Promise<DbConnection>((resolve, reject) => {
    let settled = false;
    DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .onConnect((conn) => {
        settled = true;
        resolve(conn);
      })
      .onConnectError((_ctx, error) => {
        reject(error);
      })
      .onDisconnect((_ctx, error) => {
        if (!settled && error) {
          reject(error);
        }
      })
      .build();
  });

const waitForSubscription = (
  conn: DbConnection,
  queries: readonly string[],
): Promise<void> =>
  new Promise((resolve) => {
    conn
      .subscriptionBuilder()
      .onApplied(() => resolve())
      .subscribe([...queries]);
  });

const waitForAiRequest = async (
  readRows: () => Iterable<AiRequestRow>,
  requestId: string,
  expectedStatus?: string,
): Promise<AiRequestRow> => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const row = [...readRows()].find((entry) => entry.requestId === requestId);
    if (row && (!expectedStatus || row.status === expectedStatus)) {
      return row;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(
    expectedStatus
      ? `AI runtime smoke failed: request '${requestId}' did not reach '${expectedStatus}'`
      : `AI runtime smoke failed: request '${requestId}' was not persisted`,
  );
};

const expectRejected = async (
  action: () => Promise<unknown>,
  message: string,
): Promise<void> => {
  let rejected = false;
  try {
    await action();
  } catch (_error) {
    rejected = true;
  }

  if (!rejected) {
    throw new Error(message);
  }
};

const runSmoke = async (): Promise<void> => {
  const runId = Date.now();
  const request = (suffix: string) => `smoke_ai_runtime_${suffix}_${runId}`;
  const operator = await connectOperatorConnection(
    host,
    database,
    getOperatorToken(host, database),
  );
  let secondaryWorker: DbConnection | null = null;

  try {
    await ensureAdminAccess(operator);
    await waitForSubscription(operator, ["SELECT * FROM my_ai_requests"]);

    secondaryWorker = await connectAnonymousConnection();
    await expectRejected(
      () => secondaryWorker!.reducers.registerWorkerIdentity({}),
      "AI runtime smoke failed: non-allowlisted worker registration was accepted",
    );
    await expectRejected(
      () =>
        secondaryWorker!.reducers.claimNextAiRequest({
          requestId: request("unauthorized_claim"),
          kind: AI_GENERATE_DIALOGUE_KIND,
          leaseMs: 1_000,
          claimToken: request("unauthorized_claim_token"),
        }),
      "AI runtime smoke failed: unauthorized worker claim was accepted",
    );

    const secondaryIdentity = secondaryWorker.identity;
    if (!secondaryIdentity) {
      throw new Error("AI runtime smoke failed: secondary identity missing");
    }
    await operator.reducers.allowWorkerIdentity({
      identity: secondaryIdentity,
    });
    await secondaryWorker.reducers.registerWorkerIdentity({});

    await ensureWorkerAccess(operator);
    await waitForSubscription(operator, ["SELECT * FROM worker_ai_requests"]);

    await expectRejected(
      () =>
        operator.reducers.enqueueAiRequest({
          requestId: request("invalid_reaction_payload"),
          kind: AI_GENERATE_CHARACTER_REACTION_KIND,
          payloadJson: '{"bad":true}',
        }),
      "AI runtime smoke failed: invalid character reaction payload was accepted",
    );

    const dialogueRequestId = request("dialogue");
    const reactionCompleteRequestId = request("reaction_complete");
    const reactionFailRequestId = request("reaction_fail");

    await operator.reducers.enqueueAiRequest({
      requestId: dialogueRequestId,
      kind: AI_GENERATE_DIALOGUE_KIND,
      payloadJson: JSON.stringify(dialoguePayload),
    });
    await operator.reducers.enqueueAiRequest({
      requestId: reactionCompleteRequestId,
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      payloadJson: JSON.stringify(reactionPayload("rudi")),
    });
    await operator.reducers.enqueueAiRequest({
      requestId: reactionFailRequestId,
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      payloadJson: JSON.stringify(reactionPayload("rudi")),
    });

    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      dialogueRequestId,
      "pending",
    );
    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      reactionCompleteRequestId,
      "pending",
    );

    await operator.reducers.claimNextAiRequest({
      requestId: request("claim_dialogue"),
      kind: AI_GENERATE_DIALOGUE_KIND,
      leaseMs: 5_000,
      claimToken: request("claim_dialogue_token"),
    });
    const claimedDialogue = await waitForAiRequest(
      () => operator.db.workerAiRequests.iter(),
      dialogueRequestId,
      "processing",
    );
    await operator.reducers.completeAiRequest({
      requestId: request("complete_dialogue"),
      aiRequestId: claimedDialogue.id,
      responseJson:
        '{"text":"The clerk waits for pressure to become procedure.","canonicalVoiceId":"charisma","suggestedEffects":[{"type":"hypothesis_focus","value":"police_pressure"}]}',
    });
    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      dialogueRequestId,
      "completed",
    );

    await operator.reducers.claimNextAiRequest({
      requestId: request("claim_reaction_complete"),
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      leaseMs: 5_000,
      claimToken: request("claim_reaction_complete_token"),
    });
    const claimedReaction = await waitForAiRequest(
      () => operator.db.workerAiRequests.iter(),
      reactionCompleteRequestId,
      "processing",
    );
    await expectRejected(
      () =>
        secondaryWorker!.reducers.completeAiRequest({
          requestId: request("non_owner_complete"),
          aiRequestId: claimedReaction.id,
          responseJson:
            '{"characterId":"rudi","reactionType":"dialogue","text":"Wrong worker."}',
        }),
      "AI runtime smoke failed: non-owner worker completed a claimed request",
    );
    await expectRejected(
      () =>
        operator.reducers.completeAiRequest({
          requestId: request("invalid_reaction_response"),
          aiRequestId: claimedReaction.id,
          responseJson:
            '{"characterId":"rudi","reactionType":"dialogue","text":"Here is the key.","action":"grant_evidence"}',
        }),
      "AI runtime smoke failed: invalid character reaction response was accepted",
    );
    await operator.reducers.completeAiRequest({
      requestId: request("complete_reaction"),
      aiRequestId: claimedReaction.id,
      responseJson:
        '{"characterId":"rudi","reactionType":"evasion","text":"Rudi wipes the table twice before answering.","revealHintFactId":"rudi_shift_timing","suggestedEffects":[{"type":"clue_hint","target":"rudi","value":"shift_timing"}]}',
    });
    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      reactionCompleteRequestId,
      "completed",
    );

    await operator.reducers.claimNextAiRequest({
      requestId: request("claim_reaction_fail"),
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      leaseMs: 5_000,
      claimToken: request("claim_reaction_fail_token"),
    });
    const claimedFailedReaction = await waitForAiRequest(
      () => operator.db.workerAiRequests.iter(),
      reactionFailRequestId,
      "processing",
    );
    await operator.reducers.failAiRequest({
      requestId: request("fail_reaction"),
      aiRequestId: claimedFailedReaction.id,
      error: "smoke forced reaction failure",
      retryDelayMs: undefined,
    });
    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      reactionFailRequestId,
      "failed",
    );

    await expectRejected(
      () =>
        operator.reducers.enqueueAiRequest({
          requestId: request("invalid_director_payload"),
          kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
          payloadJson: '{"bad":true}',
        }),
      "AI runtime smoke failed: invalid director step payload was accepted",
    );

    await expectRejected(
      () =>
        operator.reducers.enqueueAiRequest({
          requestId: request("director_offcanon"),
          kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
          payloadJson: JSON.stringify({
            ...directorStepPayload("scene_case01_smoke_offcanon"),
            allowedBeatIds: ["sandbox_off_canon"],
          }),
        }),
      "AI runtime smoke failed: director allowedBeatIds outside Case01 canon was accepted",
    );

    const directorCompleteRequestId = request("director_complete");
    const directorFailRequestId = request("director_fail");
    const directorCompleteNode = "scene_case01_smoke_director_complete";
    const directorFailNode = "scene_case01_smoke_director_fail";

    await operator.reducers.enqueueAiRequest({
      requestId: directorCompleteRequestId,
      kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
      payloadJson: JSON.stringify(directorStepPayload(directorCompleteNode)),
    });
    await expectRejected(
      () =>
        operator.reducers.enqueueAiRequest({
          requestId: request("director_inflight_dup"),
          kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
          payloadJson: JSON.stringify(
            directorStepPayload(directorCompleteNode),
          ),
        }),
      "AI runtime smoke failed: duplicate in-flight director request for the same scenario/node was accepted",
    );
    await operator.reducers.enqueueAiRequest({
      requestId: directorFailRequestId,
      kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
      payloadJson: JSON.stringify(directorStepPayload(directorFailNode)),
    });

    await operator.reducers.claimNextAiRequest({
      requestId: request("claim_director_complete"),
      kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
      leaseMs: 5_000,
      claimToken: request("claim_director_complete_token"),
    });
    const claimedDirector = await waitForAiRequest(
      () => operator.db.workerAiRequests.iter(),
      directorCompleteRequestId,
      "processing",
    );
    await expectRejected(
      () =>
        operator.reducers.completeAiRequest({
          requestId: request("invalid_director_response"),
          aiRequestId: claimedDirector.id,
          responseJson:
            '{"stepType":"framing","framingText":"Director leaks state mutation.","suggestedReturnBeatId":"case01_hbf_arrival","flagsToSet":["case_resolved"]}',
        }),
      "AI runtime smoke failed: invalid director step proposal was accepted",
    );
    await expectRejected(
      () =>
        operator.reducers.completeAiRequest({
          requestId: request("director_offcanon_return"),
          aiRequestId: claimedDirector.id,
          responseJson:
            '{"stepType":"next_beat_hint","framingText":"Director picks an off-allowlist target.","suggestedReturnBeatId":"sandbox_off_canon"}',
        }),
      "AI runtime smoke failed: director proposal with return beat outside allowedBeatIds was accepted",
    );
    await operator.reducers.completeAiRequest({
      requestId: request("complete_director"),
      aiRequestId: claimedDirector.id,
      responseJson:
        '{"stepType":"soft_detour","framingText":"Платформа гудит, ты задерживаешься у расписания.","suggestedReturnBeatId":"case01_mayor_briefing","bridgeText":"Имя в расписании ничего не значит, но рука сама пишет."}',
    });
    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      directorCompleteRequestId,
      "completed",
    );

    await operator.reducers.claimNextAiRequest({
      requestId: request("claim_director_fail"),
      kind: AI_PROPOSE_DIRECTOR_STEP_KIND,
      leaseMs: 5_000,
      claimToken: request("claim_director_fail_token"),
    });
    const claimedFailedDirector = await waitForAiRequest(
      () => operator.db.workerAiRequests.iter(),
      directorFailRequestId,
      "processing",
    );
    await operator.reducers.failAiRequest({
      requestId: request("fail_director"),
      aiRequestId: claimedFailedDirector.id,
      error: "smoke forced director failure",
      retryDelayMs: undefined,
    });
    await waitForAiRequest(
      () => operator.db.myAiRequests.iter(),
      directorFailRequestId,
      "failed",
    );
  } finally {
    secondaryWorker?.disconnect();
    operator.disconnect();
  }
};

try {
  await runSmoke();
  console.log("AI runtime smoke script passed.");
} catch (error) {
  console.error("AI runtime smoke script failed:", error);
  process.exitCode = 1;
}
