import { SenderError } from "spacetimedb/server";
import { assertNonEmpty } from "./payload_json";

export const ensureMindCaseActive = (ctx: any, caseId: string): any => {
  assertNonEmpty(caseId, "caseId");

  const caseRow = ctx.db.mindCase.caseId.find(caseId);
  if (!caseRow || !caseRow.isActive) {
    throw new SenderError(`Unknown or inactive mind case: ${caseId}`);
  }

  return caseRow;
};

export const ensureMindFactForCase = (
  ctx: any,
  caseId: string,
  factId: string,
): any => {
  assertNonEmpty(factId, "factId");
  const fact = ctx.db.mindFact.factId.find(factId);
  if (!fact || fact.caseId !== caseId) {
    throw new SenderError(`Unknown fact ${factId} for case ${caseId}`);
  }

  return fact;
};

export const ensureMindHypothesisForCase = (
  ctx: any,
  caseId: string,
  hypothesisId: string,
): any => {
  assertNonEmpty(hypothesisId, "hypothesisId");
  const hypothesis = ctx.db.mindHypothesis.hypothesisId.find(hypothesisId);
  if (!hypothesis || hypothesis.caseId !== caseId) {
    throw new SenderError(
      `Unknown hypothesis ${hypothesisId} for case ${caseId}`,
    );
  }

  return hypothesis;
};
