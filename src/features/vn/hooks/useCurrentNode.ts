import { useMemo } from "react";
import type { VnSession } from "../../../shared/spacetime/bindings";
import { getNodeById } from "../vnContent";
import type { VnNode, VnScenario, VnSnapshot } from "../types";

export const useCurrentNode = (
  snapshot: VnSnapshot | null,
  scenario: VnScenario | null,
  session: VnSession | null,
  sessionReady: boolean,
): VnNode | null =>
  useMemo(() => {
    if (!snapshot || !scenario || !sessionReady) {
      return null;
    }

    if (!session) {
      return getNodeById(snapshot, scenario.startNodeId);
    }

    return getNodeById(snapshot, session.nodeId);
  }, [scenario, session, sessionReady, snapshot]);
