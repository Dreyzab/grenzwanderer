import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import type { VnSession } from "../../../shared/spacetime/bindings";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export interface UseVnSessionResult {
  session: VnSession | null;
  isReady: boolean;
}

const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }

  return true;
};

export const useVnSession = (scenarioId?: string): UseVnSessionResult => {
  const { identityHex } = useIdentity();
  const [sessions, isReady] = useTable(tables.myVnSessions);
  const effectiveReady = isReady || Boolean(identityHex);

  return useMemo(() => {
    if (!identityHex) {
      return { session: null, isReady: effectiveReady };
    }

    if (scenarioId) {
      return {
        session: sessions.find((entry) => entry.scenarioId === scenarioId) ?? null,
        isReady: effectiveReady,
      };
    }

    return {
      session:
        sessions.find((entry) => !hasOptionalValue(entry.completedAt)) ?? null,
      isReady: effectiveReady,
    };
  }, [effectiveReady, identityHex, scenarioId, sessions]);
};
