import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export const usePlayerVars = (): Record<string, number> => {
  const { identityHex } = useIdentity();
  const [vars] = useTable(tables.playerVar);

  return useMemo(() => {
    if (!identityHex) {
      return {};
    }

    const result: Record<string, number> = {};
    for (const row of vars) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      result[row.key] = row.floatValue;
    }
    return result;
  }, [identityHex, vars]);
};
