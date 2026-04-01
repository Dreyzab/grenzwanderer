import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ENABLE_AI } from "../../../config";
import { isInnerVoiceId } from "../../../../data/innerVoiceContract";
import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  trustToDisposition,
} from "../../ai/contracts";
import type { SceneResultEnvelope } from "../../ai/sceneResultEnvelope";
import {
  readPsycheState,
  resolveInnerVoiceSelection,
  resolveOverallInnerVoiceSelection,
} from "../../../shared/game/innerVoiceModel";
import { getNodeById } from "../vnContent";
import type { VnNode, VnSnapshot } from "../types";
import {
  AI_FOCUS_INTERLUDE_NODE_ID,
  aiRequestMatchesContext,
  buildAiThoughtKey,
  createRequestId,
  formatSpeaker,
  normalizeBody,
  normalizeNumeric,
  parseSkillCheckBreakdown,
  reactionRequestMatchesContext,
  resolveOutcomeGrade,
  sumBreakdownDelta,
  timestampMicros,
  unwrapOptionalString,
} from "../vnScreenUtils";
import type {
  ActiveAiThoughtContext,
  ActiveReactionContext,
  AwaitingSkillChoice,
  SkillCheckResultLike,
} from "../vnScreenTypes";

interface UseVnAiLogicParams {
  snapshot: VnSnapshot | null;
  selectedScenarioId: string;
  currentNode: {
    id: VnNode["id"];
    body: VnNode["body"];
    characterId?: VnNode["characterId"];
    voicePresenceMode?: VnNode["voicePresenceMode"];
    activeSpeakers?: VnNode["activeSpeakers"];
  } | null;
  contentReady: boolean;
  sessionReady: boolean;
  npcStateReady: boolean;
  activeAiThoughtContext: ActiveAiThoughtContext | null;
  setActiveAiThoughtContext: Dispatch<
    SetStateAction<ActiveAiThoughtContext | null>
  >;
  setActiveReactionKey: Dispatch<SetStateAction<string | null>>;
  currentReactionContext: ActiveReactionContext | null;
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  questRows: ReadonlyArray<{
    questId: string;
    stage: number | bigint | null | undefined;
  }>;
  myAiRequests: Array<{ payloadJson: unknown; createdAt: unknown }>;
  myReactionRequests: Array<{ payloadJson: unknown; createdAt: unknown }>;
  visibleFactsByCharacterId: Map<string, string[]>;
  trustByNpcId: Map<string, number>;
  enqueueAiRequest: (input: {
    requestId: string;
    kind: string;
    payloadJson: string;
  }) => Promise<unknown>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function useVnAiLogic({
  snapshot,
  selectedScenarioId,
  currentNode,
  contentReady,
  sessionReady,
  npcStateReady,
  activeAiThoughtContext,
  setActiveAiThoughtContext,
  setActiveReactionKey,
  currentReactionContext,
  myFlags,
  myVars,
  questRows,
  myAiRequests,
  myReactionRequests,
  visibleFactsByCharacterId,
  trustByNpcId,
  enqueueAiRequest,
  setError,
}: UseVnAiLogicParams) {
  const enqueuedAiThoughtKeysRef = useRef<Set<string>>(new Set());
  const enqueuedReactionKeysRef = useRef<Set<string>>(new Set());

  const buildDialoguePsycheProfile = useCallback(
    (activeSpeakers: readonly string[]) => {
      const psycheState = readPsycheState(myVars);
      const activeInnerVoiceIds = activeSpeakers.filter(isInnerVoiceId);
      const dominantInnerVoiceId =
        activeInnerVoiceIds.length > 0
          ? (resolveInnerVoiceSelection(psycheState, activeInnerVoiceIds, {
              includeCounter: activeInnerVoiceIds.length >= 3,
            }).dominant?.voiceId ?? null)
          : (resolveOverallInnerVoiceSelection(myVars).dominant?.voiceId ??
            null);

      return {
        axisX: psycheState.axisX,
        axisY: psycheState.axisY,
        approach: psycheState.approach,
        dominantInnerVoiceId,
        activeInnerVoiceIds,
      };
    },
    [myVars],
  );

  useEffect(() => {
    if (!activeAiThoughtContext || !currentNode) {
      return;
    }

    if (
      activeAiThoughtContext.scenarioId !== selectedScenarioId ||
      activeAiThoughtContext.nodeId !== currentNode.id
    ) {
      setActiveAiThoughtContext(null);
    }
  }, [
    activeAiThoughtContext,
    currentNode,
    selectedScenarioId,
    setActiveAiThoughtContext,
  ]);

  useEffect(() => {
    if (!currentReactionContext) {
      setActiveReactionKey(null);
      return;
    }

    const hasExistingRequest = myReactionRequests.some((entry) =>
      reactionRequestMatchesContext(entry, currentReactionContext),
    );

    if (
      hasExistingRequest ||
      enqueuedReactionKeysRef.current.has(currentReactionContext.reactionKey)
    ) {
      setActiveReactionKey(currentReactionContext.reactionKey);
    } else {
      setActiveReactionKey(null);
    }
  }, [currentReactionContext, myReactionRequests, setActiveReactionKey]);

  const enqueueResolvedSkillAiThought = useCallback(
    async (
      pending: AwaitingSkillChoice,
      matchedResult: SkillCheckResultLike,
    ) => {
      if (!ENABLE_AI) {
        return;
      }

      const nextNodeId = unwrapOptionalString(matchedResult.nextNodeId);
      const targetNodeId =
        nextNodeId === AI_FOCUS_INTERLUDE_NODE_ID
          ? AI_FOCUS_INTERLUDE_NODE_ID
          : pending.nodeId;
      const targetNode =
        snapshot && targetNodeId !== pending.nodeId
          ? getNodeById(snapshot, targetNodeId)
          : currentNode;
      const outcomeNode =
        snapshot && nextNodeId ? getNodeById(snapshot, nextNodeId) : null;
      const envelopeNode = outcomeNode ?? targetNode ?? currentNode;
      const breakdown = parseSkillCheckBreakdown(
        matchedResult.breakdownJson,
        pending.voiceId,
        matchedResult.voiceLevel,
      );
      const outcomeGrade = resolveOutcomeGrade(
        matchedResult.outcomeGrade,
        matchedResult.passed,
      );
      const margin =
        matchedResult.roll +
        sumBreakdownDelta(breakdown) -
        matchedResult.difficulty;
      const voicePresenceMode =
        envelopeNode?.voicePresenceMode ?? "text_variability";
      const activeSpeakers =
        envelopeNode?.activeSpeakers && envelopeNode.activeSpeakers.length > 0
          ? envelopeNode.activeSpeakers
          : [pending.voiceId];
      const psycheProfile = buildDialoguePsycheProfile(activeSpeakers);
      const context: ActiveAiThoughtContext = {
        scenarioId: pending.scenarioId,
        nodeId: targetNodeId,
        checkId: pending.checkId,
        choiceId: pending.choiceId,
        voiceId: pending.voiceId,
        choiceText: pending.choiceText,
        resultCreatedAtMicros: timestampMicros(matchedResult.createdAt),
      };

      setActiveAiThoughtContext(context);

      const sceneResultEnvelope: SceneResultEnvelope = {
        source: "skill_check",
        scenarioId: pending.scenarioId,
        nodeId: envelopeNode?.id ?? targetNodeId,
        locationName: pending.frozen.locationName,
        timestamp: Number(context.resultCreatedAtMicros),
        playerState: {
          flags: Object.entries(myFlags)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .sort(),
          activeQuests: questRows
            .map((row) => ({
              questId: row.questId,
              stage: normalizeNumeric(row.stage),
            }))
            .sort((left, right) => left.questId.localeCompare(right.questId)),
          voiceLevels: Object.fromEntries(
            Object.entries(myVars)
              .filter(
                ([key]) =>
                  key.startsWith("attr_") ||
                  key === pending.voiceId ||
                  activeSpeakers.includes(key),
              )
              .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
          ),
          psyche: psycheProfile,
        },
        checkResult: {
          checkId: pending.checkId,
          voiceId: pending.voiceId,
          outcomeGrade,
          margin,
          breakdown,
        },
        ensemble: {
          presenceMode: voicePresenceMode,
          activeSpeakers,
        },
      };

      const thoughtKey = buildAiThoughtKey(
        context.scenarioId,
        context.nodeId,
        context.checkId,
        context.choiceId,
        context.resultCreatedAtMicros,
      );
      if (enqueuedAiThoughtKeysRef.current.has(thoughtKey)) {
        return;
      }

      if (
        myAiRequests.some((entry) => aiRequestMatchesContext(entry, context))
      ) {
        enqueuedAiThoughtKeysRef.current.add(thoughtKey);
        return;
      }

      enqueuedAiThoughtKeysRef.current.add(thoughtKey);

      try {
        await enqueueAiRequest({
          requestId: createRequestId(),
          kind: AI_GENERATE_DIALOGUE_KIND,
          payloadJson: JSON.stringify({
            source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
            scenarioId: pending.scenarioId,
            nodeId: targetNodeId,
            checkId: pending.checkId,
            choiceId: pending.choiceId,
            voiceId: pending.voiceId,
            choiceText: pending.choiceText,
            passed: matchedResult.passed,
            roll: matchedResult.roll,
            difficulty: matchedResult.difficulty,
            voiceLevel: matchedResult.voiceLevel,
            outcomeGrade,
            breakdown,
            margin,
            voicePresenceMode,
            activeSpeakers,
            psycheProfile,
            locationName: pending.frozen.locationName,
            characterName: targetNode?.characterId
              ? formatSpeaker(targetNode.characterId, snapshot)
              : pending.frozen.characterName,
            narrativeText: targetNode
              ? normalizeBody(targetNode.body)
              : pending.frozen.narrativeText,
            sceneResultEnvelope,
          }),
        });
      } catch (caughtError) {
        console.error("AI skill-check enqueue failed:", caughtError);
        setActiveAiThoughtContext((current) =>
          current &&
          current.scenarioId === context.scenarioId &&
          current.nodeId === context.nodeId &&
          current.checkId === context.checkId &&
          current.choiceId === context.choiceId
            ? null
            : current,
        );
      }
    },
    [
      currentNode,
      enqueueAiRequest,
      myAiRequests,
      buildDialoguePsycheProfile,
      myFlags,
      myVars,
      questRows,
      setActiveAiThoughtContext,
      snapshot,
    ],
  );

  useEffect(() => {
    if (
      !ENABLE_AI ||
      !contentReady ||
      !sessionReady ||
      !npcStateReady ||
      !currentReactionContext
    ) {
      return;
    }

    const { characterId, nodeId, reactionKey, scenarioId } =
      currentReactionContext;
    if (enqueuedReactionKeysRef.current.has(reactionKey)) {
      return;
    }

    if (
      myReactionRequests.some((entry) =>
        reactionRequestMatchesContext(entry, currentReactionContext),
      )
    ) {
      enqueuedReactionKeysRef.current.add(reactionKey);
      setActiveReactionKey(reactionKey);
      return;
    }

    enqueuedReactionKeysRef.current.add(reactionKey);
    setActiveReactionKey(reactionKey);

    const visibleFacts = visibleFactsByCharacterId.get(characterId) ?? [];
    const trustScore = trustByNpcId.get(characterId) ?? 0;

    void enqueueAiRequest({
      requestId: createRequestId(),
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      payloadJson: JSON.stringify({
        source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
        characterId,
        scenarioId,
        nodeId,
        eventText: normalizeBody(currentNode?.body ?? ""),
        visibleFacts,
        relationshipState: {
          trust: trustScore,
          disposition: trustToDisposition(trustScore),
        },
      }),
    }).catch((caughtError) => {
      enqueuedReactionKeysRef.current.delete(reactionKey);
      setActiveReactionKey((current) =>
        current === reactionKey ? null : current,
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Character reaction request failed",
      );
    });
  }, [
    contentReady,
    currentNode?.body,
    currentReactionContext,
    enqueueAiRequest,
    myReactionRequests,
    npcStateReady,
    sessionReady,
    setActiveReactionKey,
    setError,
    trustByNpcId,
    visibleFactsByCharacterId,
  ]);

  return { enqueueResolvedSkillAiThought };
}
