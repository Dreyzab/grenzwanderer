import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { usePlayerVars } from "../../entities/player/hooks/usePlayerVars";
import { tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import {
  deriveHypothesisState,
  parseRequiredFactIds,
  parseRequiredVars,
} from "./model/readiness";

export interface MindPalaceReadiness {
  hasReadyHypotheses: boolean;
  readyCount: number;
}

export const useMindPalaceReadiness = (): MindPalaceReadiness => {
  const { identityHex } = useIdentity();

  const [mindCases] = useTable(tables.mindCase);
  const [mindHypotheses] = useTable(tables.mindHypothesis);
  const [playerMindFacts] = useTable(tables.myMindFacts);
  const [playerMindHypotheses] = useTable(tables.myMindHypotheses);

  const varsByKey = usePlayerVars();

  return useMemo(() => {
    const activeCaseIds = new Set(
      mindCases.filter((entry) => entry.isActive).map((entry) => entry.caseId),
    );

    if (activeCaseIds.size === 0) {
      return { hasReadyHypotheses: false, readyCount: 0 };
    }

    const discoveredFactIds = new Set(playerMindFacts.map((row) => row.factId));

    const validatedHypothesisIds = new Set(
      playerMindHypotheses
        .filter((row) => row.status === "validated")
        .map((row) => row.hypothesisId),
    );

    let readyCount = 0;
    for (const hypothesis of mindHypotheses) {
      if (!activeCaseIds.has(hypothesis.caseId)) {
        continue;
      }
      if (validatedHypothesisIds.has(hypothesis.hypothesisId)) {
        continue;
      }

      const state = deriveHypothesisState({
        requiredFactIds: parseRequiredFactIds(hypothesis.requiredFactIdsJson),
        requiredVars: parseRequiredVars(hypothesis.requiredVarsJson),
        discoveredFactIds,
        varsByKey,
        validated: false,
      });
      if (state.ready) {
        readyCount += 1;
      }
    }

    return {
      hasReadyHypotheses: readyCount > 0,
      readyCount,
    };
  }, [
    mindCases,
    mindHypotheses,
    playerMindFacts,
    playerMindHypotheses,
    varsByKey,
  ]);
};
