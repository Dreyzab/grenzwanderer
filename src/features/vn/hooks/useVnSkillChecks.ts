import { useCallback, useState } from "react";
import { useTable, useReducer } from "spacetimedb/react";
import { tables, reducers } from "../../../shared/spacetime/bindings";
import { timestampMicros, createRequestId } from "../vnScreenUtils";
import type { VnNode, VnChoice } from "../types";

export function useVnSkillChecks({
  identityHex,
  selectedScenarioId,
  currentNode,
}: {
  identityHex: string;
  selectedScenarioId: string;
  currentNode: VnNode | null;
}) {
  const [skillResults] = useTable(tables.myVnSkillResults);
  const performSkillCheck = useReducer(reducers.performSkillCheck);
  const recordChoice = useReducer(reducers.recordChoice);

  const [lastCheckResultId, setLastCheckResultId] = useState<string | null>(
    null,
  );

  const handlePerformSkillCheck = useCallback(
    async (choice: VnChoice) => {
      if (!choice.skillCheck || !selectedScenarioId || !currentNode) return;

      try {
        await performSkillCheck({
          requestId: createRequestId(),
          scenarioId: selectedScenarioId,
          nodeId: currentNode.id,
          checkId: choice.skillCheck.id,
        });
      } catch (err) {
        console.error("Skill check failed:", err);
      }
    },
    [currentNode, performSkillCheck, selectedScenarioId],
  );

  const handleCommitChoice = useCallback(
    async (choice: VnChoice) => {
      if (!selectedScenarioId || !currentNode) return;

      try {
        await recordChoice({
          requestId: createRequestId(),
          scenarioId: selectedScenarioId,
          nodeId: currentNode.id,
          choiceId: choice.id,
        });
      } catch (err) {
        console.error("Choice commit failed:", err);
      }
    },
    [currentNode, recordChoice, selectedScenarioId],
  );

  const mySkillResults = skillResults
    .filter((entry) => entry.playerId.toHexString() === identityHex)
    .sort((left, right) =>
      timestampMicros(right.createdAt) > timestampMicros(left.updatedAt)
        ? 1
        : -1,
    );

  return {
    mySkillResults,
    lastCheckResultId,
    setLastCheckResultId,
    handlePerformSkillCheck,
    handleCommitChoice,
  };
}
