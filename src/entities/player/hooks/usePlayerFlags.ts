import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export const usePlayerFlags = (): Record<string, boolean> => {
  const { identityHex } = useIdentity();
  const [flags] = useTable(tables.playerFlag);

  return useMemo(() => {
    if (!identityHex) {
      return {};
    }

    const result: Record<string, boolean> = {};
    for (const row of flags) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      result[row.key] = row.value;
    }
    return result;
  }, [flags, identityHex]);
};
