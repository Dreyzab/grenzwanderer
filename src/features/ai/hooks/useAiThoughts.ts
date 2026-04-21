import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";

export const useAiThoughts = () => {
  const { identityHex } = useIdentity();
  const [requests] = useTable(tables.myAiRequests);

  return useMemo(
    () =>
      [...requests].sort((left, right) =>
        left.updatedAt.microsSinceUnixEpoch >
        right.updatedAt.microsSinceUnixEpoch
          ? -1
          : 1,
      ),
    [requests],
  );
};
