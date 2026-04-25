import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { parseGenerateDialoguePayload } from "../../ai/contracts";
import { createRequestId } from "../vnScreenUtils";
import type {
  ActiveAiThoughtContext,
  SkillCheckAiStatus,
} from "../vnScreenTypes";

interface UseVnProvidenceExpansionParams {
  activeAiThoughtContext: ActiveAiThoughtContext | null;
  activeAiThoughtRequest: { payloadJson: unknown } | null;
  activeProvidenceThoughtStatus: SkillCheckAiStatus | null;
  setActiveProvidenceThoughtContext: Dispatch<
    SetStateAction<ActiveAiThoughtContext | null>
  >;
  enqueueProvidenceDialogue: (input: {
    requestId: string;
    scenarioId: string;
    nodeId: string;
    checkId: string;
    choiceId: string;
    providenceCost: number;
    payloadJson: string;
  }) => Promise<unknown>;
  setError: Dispatch<SetStateAction<string | null>>;
}

const isProvidenceRequestInFlight = (status: SkillCheckAiStatus | null) =>
  status === "pending" || status === "processing" || status === "completed";

export function useVnProvidenceExpansion({
  activeAiThoughtContext,
  activeAiThoughtRequest,
  activeProvidenceThoughtStatus,
  setActiveProvidenceThoughtContext,
  enqueueProvidenceDialogue,
  setError,
}: UseVnProvidenceExpansionParams) {
  const handleProvidenceExpand = useCallback(async () => {
    if (!activeAiThoughtContext || !activeAiThoughtRequest) {
      return;
    }

    const payload = parseGenerateDialoguePayload(
      typeof activeAiThoughtRequest.payloadJson === "string"
        ? activeAiThoughtRequest.payloadJson
        : null,
    );
    if (!payload || payload.dialogueLayer !== "base") {
      return;
    }

    const providenceCost = Math.max(0, Math.trunc(payload.providenceCost ?? 0));
    if (providenceCost <= 0) {
      return;
    }

    if (isProvidenceRequestInFlight(activeProvidenceThoughtStatus)) {
      return;
    }

    const context: ActiveAiThoughtContext = {
      ...activeAiThoughtContext,
      dialogueLayer: "providence",
    };

    setActiveProvidenceThoughtContext(context);

    try {
      await enqueueProvidenceDialogue({
        requestId: createRequestId(),
        scenarioId: payload.scenarioId,
        nodeId: payload.nodeId,
        checkId: payload.checkId,
        choiceId: payload.choiceId,
        providenceCost,
        payloadJson: JSON.stringify({
          ...payload,
          dialogueLayer: "providence",
          providenceCost,
        }),
      });
    } catch (caughtError) {
      setActiveProvidenceThoughtContext((current) =>
        current?.scenarioId === context.scenarioId &&
        current?.nodeId === context.nodeId &&
        current?.checkId === context.checkId &&
        current?.choiceId === context.choiceId &&
        current?.dialogueLayer === "providence"
          ? null
          : current,
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Providence dialogue request failed",
      );
    }
  }, [
    activeAiThoughtContext,
    activeAiThoughtRequest,
    activeProvidenceThoughtStatus,
    enqueueProvidenceDialogue,
    setActiveProvidenceThoughtContext,
    setError,
  ]);

  return { handleProvidenceExpand };
}
