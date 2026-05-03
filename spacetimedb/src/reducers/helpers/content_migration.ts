export const resetForSchemaMigration = (ctx: any): void => {
  const contentVersions = [...ctx.db.contentVersion.iter()];
  for (const version of contentVersions) {
    ctx.db.contentVersion.version.delete(version.version);
  }

  const snapshots = [...ctx.db.contentSnapshot.iter()];
  for (const snapshot of snapshots) {
    ctx.db.contentSnapshot.checksum.delete(snapshot.checksum);
  }

  const sessions = [...ctx.db.vnSession.iter()];
  for (const session of sessions) {
    ctx.db.vnSession.sessionKey.delete(session.sessionKey);
  }

  const flags = [...ctx.db.playerFlag.iter()];
  for (const flag of flags) {
    ctx.db.playerFlag.flagId.delete(flag.flagId);
  }

  const vars = [...ctx.db.playerVar.iter()];
  for (const variable of vars) {
    ctx.db.playerVar.varId.delete(variable.varId);
  }

  const mindCases = [...ctx.db.mindCase.iter()];
  for (const caseRow of mindCases) {
    ctx.db.mindCase.caseId.delete(caseRow.caseId);
  }

  const mindFacts = [...ctx.db.mindFact.iter()];
  for (const fact of mindFacts) {
    ctx.db.mindFact.factId.delete(fact.factId);
  }

  const mindHypotheses = [...ctx.db.mindHypothesis.iter()];
  for (const hypothesis of mindHypotheses) {
    ctx.db.mindHypothesis.hypothesisId.delete(hypothesis.hypothesisId);
  }

  const playerMindCases = [...ctx.db.playerMindCase.iter()];
  for (const caseRow of playerMindCases) {
    ctx.db.playerMindCase.playerCaseKey.delete(caseRow.playerCaseKey);
  }

  const playerMindFacts = [...ctx.db.playerMindFact.iter()];
  for (const factRow of playerMindFacts) {
    ctx.db.playerMindFact.playerFactKey.delete(factRow.playerFactKey);
  }

  const playerMindHypotheses = [...ctx.db.playerMindHypothesis.iter()];
  for (const hypothesisRow of playerMindHypotheses) {
    ctx.db.playerMindHypothesis.playerHypothesisKey.delete(
      hypothesisRow.playerHypothesisKey,
    );
  }
};

export const deactivateContentVersions = (ctx: any): void => {
  const rows = [...ctx.db.contentVersion.iter()];
  for (const row of rows) {
    if (!row.isActive) {
      continue;
    }
    ctx.db.contentVersion.version.update({
      ...row,
      isActive: false,
      publishedAt: ctx.timestamp,
    });
  }
};
