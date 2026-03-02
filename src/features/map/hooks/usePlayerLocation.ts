import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export const usePlayerLocation = () => {
  const { identityHex } = useIdentity();
  const [locations] = useTable(tables.playerLocation);

  return useMemo(() => {
    if (!identityHex) {
      return null;
    }

    return (
      locations.find((entry) => entry.playerId.toHexString() === identityHex) ??
      null
    );
  }, [identityHex, locations]);
};
