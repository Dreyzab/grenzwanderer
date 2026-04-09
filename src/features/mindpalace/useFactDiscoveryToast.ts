import { useEffect, useRef } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import { useToast } from "../../shared/hooks/useToast";

export const useFactDiscoveryToast = () => {
  const { identityHex } = useIdentity();
  const { showToast } = useToast();

  const [playerMindFacts, factsReady] = useTable(tables.myMindFacts);
  const [mindFacts] = useTable(tables.mindFact);

  const knownFactIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!factsReady || !identityHex) {
      return;
    }

    const currentFactIds = new Set(playerMindFacts.map((row) => row.factId));

    if (!initializedRef.current) {
      knownFactIdsRef.current = currentFactIds;
      initializedRef.current = true;
      return;
    }

    for (const factId of currentFactIds) {
      if (knownFactIdsRef.current.has(factId)) {
        continue;
      }

      const factDef = mindFacts.find((fact) => fact.factId === factId);
      const factLabel = factDef?.text ?? factId;
      showToast({
        message: `New Fact: ${factLabel}`,
        type: "fact",
        source: "mind_fact",
        dedupeKey: `mind_fact:${factId}`,
      });
    }

    knownFactIdsRef.current = currentFactIds;
  }, [factsReady, identityHex, mindFacts, playerMindFacts, showToast]);
};
