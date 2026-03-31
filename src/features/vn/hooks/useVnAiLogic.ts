import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTable, useReducer } from "spacetimedb/react";
import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  matchesSkillCheckThought,
  parseGenerateCharacterReactionPayload,
  parseGenerateDialoguePayload,
} from "../../ai/contracts";
import { tables, reducers } from "../../../shared/spacetime/bindings";
import { ENABLE_AI } from "../../../config";
import {
  getNodeById,
  resolveOutcomeGrade,
  timestampMicros,
  unwrapOptionalString,
  normalizeBody,
  createRequestId,
} from "../vnScreenUtils";
import type { VnSnapshot, VnNode } from "../types";

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
  frozen: any;
}

export function useVnAiLogic({
  identityHex,
  snapshot,
  selectedScenarioId,
  currentNode,
  currentSessionPointer,
  mySession,
}: {
  identityHex: string;
  snapshot: VnSnapshot | null;
  selectedScenarioId: string;
  currentNode: VnNode | null;
  currentSessionPointer: string | null;
  mySession: any;
  myFlags: any;
  myVars: any;
  questRows: any[];
  npcFavorRows: any[];
}) {
  const [aiRequests] = useTable(tables.myAiRequests);
  const enqueueAiRequest = useReducer(reducers.enqueueAiRequest);

  const [activeAiThoughtContext, setActiveAiThoughtContext] =
    useState<ActiveAiThoughtContext | null>(null);
  const [activeReactionKey, setActiveReactionKey] = useState<string | null>(
    null,
  );

  const enqueuedAiThoughtKeysRef = useRef<Set<string>>(new Set());
  const enqueuedReactionKeysRef = useRef<Set<string>>(new Set());

  const myAiRequests = useMemo(
    () =>
      aiRequests
        .filter(
          (entry) =>
            entry.playerId.toHexString() === identityHex &&
            entry.kind === AI_GENERATE_DIALOGUE_KIND,
        )
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests, identityHex],
  );

  const myReactionRequests = useMemo(
    () =>
      aiRequests
        .filter(
          (entry) =>
            entry.playerId.toHexString() === identityHex &&
            entry.kind === AI_GENERATE_CHARACTER_REACTION_KIND,
        )
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests, identityHex],
  );

  const currentReactionContext = useMemo<ActiveReactionContext | null>(() => {
    if (
      !selectedScenarioId ||
      !currentNode?.characterId ||
      !currentSessionPointer ||
      !mySession
    ) {
      return null;
    }

    const reactionKey = `${selectedScenarioId}::${currentNode.id}::${currentNode.characterId}::${currentSessionPointer}`;
    return {
      scenarioId: selectedScenarioId,
      nodeId: currentNode.id,
      characterId: currentNode.characterId,
      sessionPointer: currentSessionPointer,
      sessionUpdatedAtMicros: timestampMicros(mySession.updatedAt),
      reactionKey,
    };
  }, [currentNode, currentSessionPointer, mySession, selectedScenarioId]);

  useEffect(() => {
    if (!currentReactionContext) {
      setActiveReactionKey(null);
      return;
    }

    const hasExistingRequest = myReactionRequests.some((entry) => {
      const payload = parseGenerateCharacterReactionPayload(entry.payloadJson);
      return (
        payload?.source === AI_CHARACTER_REACTION_SOURCE_VN_SCENE &&
        payload.characterId === currentReactionContext.characterId &&
        payload.scenarioId === currentReactionContext.scenarioId &&
        payload.nodeId === currentReactionContext.nodeId &&
        timestampMicros(entry.createdAt) >=
          currentReactionContext.sessionUpdatedAtMicros
      );
    });

    if (
      hasExistingRequest ||
      enqueuedReactionKeysRef.current.has(currentReactionContext.reactionKey)
    ) {
      setActiveReactionKey(currentReactionContext.reactionKey);
    } else {
      setActiveReactionKey(null);
    }
  }, [currentReactionContext, myReactionRequests]);

  const aiRequestMatchesContext = useCallback(
    (entry: any, context: ActiveAiThoughtContext) => {
      const payload = parseGenerateDialoguePayload(entry.payloadJson);
      return (
        matchesSkillCheckThought(
          payload,
          context.scenarioId,
          context.nodeId,
          context.checkId,
          context.choiceId,
        ) && timestampMicros(entry.createdAt) >= context.resultCreatedAtMicros
      );
    },
    [],
  );

  const enqueueResolvedSkillAiThought = useCallback(
    async (pending: AwaitingSkillChoice, matchedResult: any) => {
      if (!ENABLE_AI) return;

      const nextNodeId = unwrapOptionalString(matchedResult.nextNodeId);
      const targetNodeId =
        nextNodeId === "scene_case01_occult_bank_interlude"
          ? nextNodeId
          : pending.nodeId;
      const targetNode =
        snapshot && targetNodeId !== pending.nodeId
          ? getNodeById(snapshot, targetNodeId)
          : currentNode;

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

      const thoughtKey = `${context.scenarioId}::${context.nodeId}::${context.checkId}::${context.choiceId}::${context.resultCreatedAtMicros.toString()}`;
      if (enqueuedAiThoughtKeysRef.current.has(thoughtKey)) return;

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
            outcomeGrade: resolveOutcomeGrade(
              matchedResult.outcomeGrade,
              matchedResult.passed,
            ),
            margin:
              matchedResult.roll +
              matchedResult.voiceLevel -
              matchedResult.difficulty,
            locationName: pending.frozen.locationName,
            characterName:
              targetNode?.characterId ?? pending.frozen.characterName,
            narrativeText: targetNode
              ? normalizeBody(targetNode.body)
              : pending.frozen.narrativeText,
          }),
        });
      } catch (err) {
        console.error("AI skill-check enqueue failed:", err);
      }
    },
    [
      aiRequestMatchesContext,
      currentNode,
      enqueueAiRequest,
      myAiRequests,
      snapshot,
    ],
  );

  return {
    activeAiThoughtContext,
    setActiveAiThoughtContext,
    activeReactionKey,
    setActiveReactionKey,
    myAiRequests,
    myReactionRequests,
    enqueueResolvedSkillAiThought,
    aiRequestMatchesContext,
  };
}
