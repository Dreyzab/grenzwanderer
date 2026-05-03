import { SenderError } from "spacetimedb/server";

import {
  createVnSnapshotIndex,
  type MindPalaceSnapshot,
  type VnDiceMode,
  type VnNode,
  type VnScenario,
  type VnSnapshot,
} from "../../../../src/shared/vn-contract";
import { parseSnapshotPayload } from "./parsers";

type IndexedSnapshot = Parameters<typeof createVnSnapshotIndex>[0];

const asSharedSnapshot = (snapshot: VnSnapshot): IndexedSnapshot =>
  snapshot as unknown as IndexedSnapshot;

export const getActiveSnapshot = (
  ctx: any,
): { activeVersion: any; snapshot: VnSnapshot } => {
  const activeVersion = [...ctx.db.contentVersion.iter()].find(
    (row: any) => row.isActive,
  );
  if (!activeVersion) {
    throw new SenderError("No active content version");
  }

  const snapshotRow = ctx.db.contentSnapshot.checksum.find(
    activeVersion.checksum,
  );
  if (!snapshotRow) {
    throw new SenderError("Active content snapshot is missing");
  }

  return {
    activeVersion,
    snapshot: parseSnapshotPayload(snapshotRow.payloadJson),
  };
};

export const getScenario = (
  snapshot: VnSnapshot,
  scenarioId: string,
): VnScenario => {
  const scenario =
    createVnSnapshotIndex(asSharedSnapshot(snapshot)).scenariosById.get(
      scenarioId,
    ) ?? null;
  if (!scenario) {
    throw new SenderError(`Unknown scenario: ${scenarioId}`);
  }
  return scenario as VnScenario;
};

export const resolveDiceMode = (
  snapshot: VnSnapshot,
  scenarioId: string,
): VnDiceMode => {
  const scenario = createVnSnapshotIndex(
    asSharedSnapshot(snapshot),
  ).scenariosById.get(scenarioId);
  return (
    (scenario as VnScenario | undefined)?.skillCheckDice ??
    snapshot.vnRuntime?.skillCheckDice ??
    "d20"
  );
};

export const getNode = (snapshot: VnSnapshot, nodeId: string): VnNode => {
  const node =
    createVnSnapshotIndex(asSharedSnapshot(snapshot)).nodesById.get(nodeId) ??
    null;
  if (!node) {
    throw new SenderError(`Unknown node: ${nodeId}`);
  }
  return node as VnNode;
};

export const getMindPalace = (snapshot: VnSnapshot): MindPalaceSnapshot => ({
  cases: snapshot.mindPalace?.cases ?? [],
  facts: snapshot.mindPalace?.facts ?? [],
  hypotheses: snapshot.mindPalace?.hypotheses ?? [],
});
