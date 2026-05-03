import { useMemo } from "react";
import { getScenarioById, parseSnapshot } from "../vnContent";
import type { VnScenario, VnSnapshot } from "../types";
import type {
  ContentSnapshot,
  ContentVersion,
} from "../../../shared/spacetime/bindings";

interface UseVnContentSnapshotInput {
  selectedScenarioId: string;
  snapshots: readonly ContentSnapshot[];
  snapshotsReady: boolean;
  versions: readonly ContentVersion[];
  versionsReady: boolean;
}

export function useVnContentSnapshot({
  selectedScenarioId,
  snapshots,
  snapshotsReady,
  versions,
  versionsReady,
}: UseVnContentSnapshotInput): {
  activeVersion: ContentVersion | null;
  contentReady: boolean;
  selectedScenario: VnScenario | null;
  snapshot: VnSnapshot | null;
} {
  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const snapshot = useMemo<VnSnapshot | null>(() => {
    if (!activeVersion) {
      return null;
    }

    const snapshotRow = snapshots.find(
      (entry) => entry.checksum === activeVersion.checksum,
    );
    if (!snapshotRow) {
      return null;
    }

    return parseSnapshot(snapshotRow.payloadJson);
  }, [activeVersion, snapshots]);

  const contentReady =
    (versionsReady && snapshotsReady) || Boolean(activeVersion && snapshot);

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
