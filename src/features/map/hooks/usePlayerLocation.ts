import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export const usePlayerLocation = () => {
  const { identityHex } = useIdentity();
  const [locations] = useTable(tables.myPlayerLocation);

  return useMemo(() => {
    if (!identityHex) {
      return null;
    }

    return locations[0] ?? null;
  }, [identityHex, locations]);
};
