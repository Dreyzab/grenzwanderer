import type { VnSnapshot as SharedVnSnapshot } from "../../../../src/shared/vn-contract";
import { getMindPalace } from "./snapshot";

export const syncMindPalaceContentTables = (
  ctx: any,
  snapshot: SharedVnSnapshot,
): void => {
  const mindPalace = getMindPalace(snapshot);

  for (const row of ctx.db.mindCase.iter()) {
    if (row.isActive) {
      ctx.db.mindCase.caseId.update({
        ...row,
        isActive: false,
        updatedAt: ctx.timestamp,
      });
    }
  }

  const staleFactIds = [...ctx.db.mindFact.iter()].map((row) => row.factId);
  for (const factId of staleFactIds) {
    ctx.db.mindFact.factId.delete(factId);
  }

  const staleHypothesisIds = [...ctx.db.mindHypothesis.iter()].map(
    (row) => row.hypothesisId,
  );
  for (const hypothesisId of staleHypothesisIds) {
    ctx.db.mindHypothesis.hypothesisId.delete(hypothesisId);
  }

  for (const caseDef of mindPalace.cases) {
    const existing = ctx.db.mindCase.caseId.find(caseDef.id);
    if (existing) {
      ctx.db.mindCase.caseId.update({
        ...existing,
        title: caseDef.title,
        schemaVersion: snapshot.schemaVersion,
        isActive: true,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.mindCase.insert({
        caseId: caseDef.id,
        title: caseDef.title,
        schemaVersion: snapshot.schemaVersion,
        isActive: true,
        createdAt: ctx.timestamp,
        updatedAt: ctx.timestamp,
      });
    }
  }

  for (const factDef of mindPalace.facts) {
    ctx.db.mindFact.insert({
      factId: factDef.id,
      caseId: factDef.caseId,
      sourceType: factDef.sourceType,
      sourceId: factDef.sourceId,
      text: factDef.text,
      tagsJson: JSON.stringify(factDef.tags ?? {}),
      createdAt: ctx.timestamp,
    });
  }

  for (const hypothesisDef of mindPalace.hypotheses) {
    ctx.db.mindHypothesis.insert({
      hypothesisId: hypothesisDef.id,
      caseId: hypothesisDef.caseId,
      key: hypothesisDef.key,
      text: hypothesisDef.text,
      requiredFactIdsJson: JSON.stringify(hypothesisDef.requiredFactIds),
      requiredVarsJson: JSON.stringify(hypothesisDef.requiredVars),
      rewardEffectsJson: JSON.stringify(hypothesisDef.rewardEffects),
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }
};
