import { useMemo } from "react";
import { useActiveContentSnapshot } from "./activeSnapshot";

export const useMindPalaceCatalog = () => {
  const { snapshot, contentReady } = useActiveContentSnapshot();

  const mindCases = useMemo(
    () =>
      (snapshot?.mindPalace?.cases ?? []).map((entry: any) => ({
        caseId: entry.id,
        title: entry.title,
        schemaVersion: snapshot?.schemaVersion ?? 0,
        isActive: true,
        createdAt: undefined,
        updatedAt: undefined,
      })),
    [snapshot],
  );

  const mindFacts = useMemo(
    () =>
      (snapshot?.mindPalace?.facts ?? []).map((entry: any) => ({
        factId: entry.id,
        caseId: entry.caseId,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        text: entry.text,
        tagsJson: JSON.stringify(entry.tags ?? {}),
        createdAt: undefined,
      })),
    [snapshot],
  );

  const mindHypotheses = useMemo(
    () =>
      (snapshot?.mindPalace?.hypotheses ?? []).map((entry: any) => ({
        hypothesisId: entry.id,
        caseId: entry.caseId,
        key: entry.key,
        text: entry.text,
        requiredFactIdsJson: JSON.stringify(entry.requiredFactIds ?? []),
        requiredVarsJson: JSON.stringify(entry.requiredVars ?? []),
        rewardEffectsJson: JSON.stringify(entry.rewardEffects ?? []),
        createdAt: undefined,
      })),
    [snapshot],
  );

  return {
    mindCases,
    mindFacts,
    mindHypotheses,
    contentReady,
  };
};
