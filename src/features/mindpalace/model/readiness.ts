export type RequiredVar = {
  key: string;
  op: "gte" | "lte" | "eq";
  value: number;
};

export type DeriveHypothesisStateParams = {
  requiredFactIds: string[];
  requiredVars: RequiredVar[];
  discoveredFactIds: Set<string>;
  varsByKey: Record<string, number>;
  validated: boolean;
};

export type HypothesisDerivedState = {
  ready: boolean;
  validated: boolean;
  missingFacts: string[];
  failedVars: RequiredVar[];
};

export const parseRequiredFactIds = (json: string): string[] => {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
};

export const parseRequiredVars = (json: string): RequiredVar[] => {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is RequiredVar =>
        typeof entry === "object" &&
        entry !== null &&
        "key" in entry &&
        "op" in entry &&
        "value" in entry &&
        typeof (entry as { key?: unknown }).key === "string" &&
        ((entry as { op?: unknown }).op === "gte" ||
          (entry as { op?: unknown }).op === "lte" ||
          (entry as { op?: unknown }).op === "eq") &&
        typeof (entry as { value?: unknown }).value === "number",
    );
  } catch {
    return [];
  }
};

export const doesVarPass = (
  requiredVar: RequiredVar,
  currentValue: number,
): boolean => {
  if (requiredVar.op === "gte") {
    return currentValue >= requiredVar.value;
  }
  if (requiredVar.op === "lte") {
    return currentValue <= requiredVar.value;
  }
  return currentValue === requiredVar.value;
};

export const deriveHypothesisState = ({
  requiredFactIds,
  requiredVars,
  discoveredFactIds,
  varsByKey,
  validated,
}: DeriveHypothesisStateParams): HypothesisDerivedState => {
  const missingFacts = requiredFactIds.filter(
    (factId) => !discoveredFactIds.has(factId),
  );
  const failedVars = requiredVars.filter(
    (requiredVar) => !doesVarPass(requiredVar, varsByKey[requiredVar.key] ?? 0),
  );

  return {
    validated,
    missingFacts,
    failedVars,
    ready: missingFacts.length === 0 && failedVars.length === 0,
  };
};
