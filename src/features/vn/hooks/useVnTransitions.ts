import { useCallback } from "react";
import { useTable, useReducer } from "spacetimedb/react";
import { tables, reducers } from "../../../shared/spacetime/bindings";
import { useCompletionRoute } from "../completionRoute";
import { isCompletionRouteBlockedError } from "../vnScreenUtils";
import { createRequestId } from "../vnScreenUtils";
import type { VnSnapshot } from "../types";

export function useVnTransitions({
  identityHex,
  selectedScenarioId,
  currentSessionPointer,
}: {
  identityHex: string;
  selectedScenarioId: string;
  currentSessionPointer: string | null;
}) {
  const [sessions] = useTable(tables.myVnSessions);
  const startScenario = useReducer(reducers.startScenario);

  const { isLocked: isSceneLocked } = useCompletionRoute({
    id: selectedScenarioId || "",
  });

  const handleStartScenario = useCallback(async () => {
    if (!selectedScenarioId) return;

    try {
      await startScenario({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
      });
    } catch (err: any) {
      const message = err?.message || String(err);
      if (isCompletionRouteBlockedError(message)) {
        console.warn(
          "Scenario start blocked by completion route rules:",
          selectedScenarioId,
        );
      } else {
        console.error("Scenario start failed:", err);
      }
    }
  }, [selectedScenarioId, startScenario]);

  const mySessions = sessions.filter(
    (entry) => entry.playerId.toHexString() === identityHex,
  );
  const mySession = mySessions.find(
    (entry) => entry.scenarioId === selectedScenarioId,
  );

  return {
    sessions,
    mySessions,
    mySession,
    isSceneLocked,
    handleStartScenario,
  };
}
