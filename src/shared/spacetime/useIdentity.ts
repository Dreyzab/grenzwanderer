import { useMemo } from "react";
import { useSpacetimeDB } from "spacetimedb/react";

export const useIdentity = () => {
  const { identity, isActive, connectionError } = useSpacetimeDB();

  const identityHex = useMemo(() => identity?.toHexString() ?? "", [identity]);

  const isConnected = Boolean(isActive && identity);

  return { identity, identityHex, isConnected, connectionError };
};
