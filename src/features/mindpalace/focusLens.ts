export const findActiveHypothesisLens = (
  snapshot: any,
  flags: Record<string, boolean>,
  caseIds: string[],
): { caseTitle: string; hypothesisText: string } | null => {
  if (!snapshot?.mindPalace?.hypotheses) {
    return null;
  }

  for (const hypothesis of snapshot.mindPalace.hypotheses) {
    if (!caseIds.includes(hypothesis.caseId)) {
      continue;
    }
    const flagKey = `mind_focus::${hypothesis.caseId}::${hypothesis.id}`;
    if (flags[flagKey]) {
      const caseEntry = snapshot.mindPalace.cases?.find(
        (c: any) => c.id === hypothesis.caseId,
      );
      return {
        caseTitle: caseEntry?.title ?? hypothesis.caseId,
        hypothesisText: hypothesis.text,
      };
    }
  }

  return null;
};

export const collectCaseIdsFromMapConditions = (conditions: any): string[] => {
  if (!Array.isArray(conditions)) return [];
  const ids: string[] = [];
  for (const cond of conditions) {
    if (cond.type === "hypothesis_focus_is" && cond.caseId) {
      ids.push(cond.caseId);
    }
    if (cond.type === "logic_or" || cond.type === "logic_and") {
      ids.push(...collectCaseIdsFromMapConditions(cond.conditions));
    }
  }
  return ids;
};

export const collectCaseIdsFromVnConditions = (conditions: any): string[] => {
  return collectCaseIdsFromMapConditions(conditions);
};

export const createHypothesisFocusFlagKey = (
  caseId: string,
  hypothesisId: string,
): string => {
  return `mind_focus::${caseId}::${hypothesisId}`;
};
