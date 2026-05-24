import type { VnSnapshot } from "../../../../src/shared/vn-contract";

export const createCaseVersionKey = (caseId: string, version: string): string =>
  `${caseId}:${version}`;

export const collectCaseIdsFromSnapshot = (snapshot: VnSnapshot): string[] =>
  [
    ...new Set(
      snapshot.scenarios.map((scenario) => scenario.packId ?? "default"),
    ),
  ].sort();

export const syncCaseVersions = (
  ctx: any,
  snapshot: VnSnapshot,
  version: string,
  checksum: string,
  schemaVersion: number,
): void => {
  for (const caseId of collectCaseIdsFromSnapshot(snapshot)) {
    const row = {
      caseVersionKey: createCaseVersionKey(caseId, version),
      caseId,
      version,
      schemaVersion,
      checksum,
      publishedAt: ctx.timestamp,
    };
    const existing = ctx.db.caseVersion.caseVersionKey.find(row.caseVersionKey);
    if (existing) {
      ctx.db.caseVersion.caseVersionKey.update(row);
    } else {
      ctx.db.caseVersion.insert(row);
    }
  }
};
