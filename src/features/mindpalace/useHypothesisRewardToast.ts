import { useEffect, useRef } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import { useToast } from "../../shared/hooks/useToast";

export const useHypothesisRewardToast = () => {
  const { identityHex } = useIdentity();
  const { showToast } = useToast();

  const [playerMindHypotheses, hypothesesReady] = useTable(
    tables.playerMindHypothesis,
  );

  const knownValidatedIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!hypothesesReady || !identityHex) {
      return;
    }

    const myValidated = playerMindHypotheses.filter(
      (row) =>
        row.playerId.toHexString() === identityHex &&
        row.status === "validated",
    );

    const currentValidatedIds = new Set(
      myValidated.map((row) => row.hypothesisId),
    );

    if (!initializedRef.current) {
      knownValidatedIdsRef.current = currentValidatedIds;
      initializedRef.current = true;
      return;
    }

    for (const hypothesisId of currentValidatedIds) {
      if (knownValidatedIdsRef.current.has(hypothesisId)) {
        continue;
      }

      showToast({
        message: "Hypothesis confirmed! Check the Map for new leads.",
        type: "reward",
        source: "mind_hypothesis",
        dedupeKey: `mind_hypothesis:${hypothesisId}`,
      });
    }

    knownValidatedIdsRef.current = currentValidatedIds;
  }, [hypothesesReady, identityHex, playerMindHypotheses, showToast]);
};
