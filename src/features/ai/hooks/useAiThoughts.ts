import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export const useAiThoughts = () => {
  const { identityHex } = useIdentity();
  const [requests] = useTable(tables.aiRequest);

  return useMemo(
    () =>
      requests
        .filter((entry) => entry.playerId.toHexString() === identityHex)
        .sort((left, right) =>
          left.updatedAt.microsSinceUnixEpoch >
          right.updatedAt.microsSinceUnixEpoch
            ? -1
            : 1,
        ),
    [identityHex, requests],
  );
};
