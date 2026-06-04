import { useMemo } from "react";
import { useActiveContentSnapshot } from "../../../shared/content/activeSnapshot";
import { getScenarioById } from "../vnContent";
import type { VnScenario, VnSnapshot } from "../types";
import type { ContentVersion } from "../../../shared/spacetime/bindings";

interface UseVnContentSnapshotInput {
  selectedScenarioId: string;
  versions: readonly ContentVersion[];
  versionsReady: boolean;
}

export function useVnContentSnapshot({
  selectedScenarioId,
  versions,
  versionsReady,
}: UseVnContentSnapshotInput): {
  activeVersion: ContentVersion | null;
  contentReady: boolean;
  selectedScenario: VnScenario | null;
  snapshot: VnSnapshot | null;
} {
  const {
    snapshot,
    activeVersion: resolvedActiveVersion,
    contentReady: snapshotReady,
  } = useActiveContentSnapshot();

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? resolvedActiveVersion,
    [resolvedActiveVersion, versions],
  );

  const contentReady =
    (versionsReady && snapshotReady) || Boolean(activeVersion && snapshot);

  const selectedScenario = useMemo<VnScenario | null>(() => {
    if (!snapshot || !selectedScenarioId) {
      return null;
    }
    return getScenarioById(snapshot, selectedScenarioId);
  }, [selectedScenarioId, snapshot]);

  return {
    activeVersion,
    contentReady,
    selectedScenario,
    snapshot,
  };
}
