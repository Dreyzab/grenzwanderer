import type {
  VnEffect,
  VnOutcomeGrade,
  VnSkillCheck,
  VnSkillCheckCostBranch,
  VnSkillCheckOutcomeBranch,
} from "./types";

export interface ResolvedSkillCheckOutcome {
  outcomeGrade: VnOutcomeGrade;
  outcome: VnSkillCheckOutcomeBranch | VnSkillCheckCostBranch | undefined;
  costEffects?: VnEffect[];
}

interface ResolveSkillCheckOutcomeParams {
  check: Pick<
    VnSkillCheck,
    "outcomeModel" | "onSuccess" | "onFail" | "onCritical" | "onSuccessWithCost"
  >;
  passed: boolean;
  margin: number;
}

export const resolveSkillCheckOutcome = ({
  check,
  passed,
  margin,
}: ResolveSkillCheckOutcomeParams): ResolvedSkillCheckOutcome => {
  if (check.outcomeModel === "tiered") {
    if (!passed) {
      return {
        outcomeGrade: "fail",
        outcome: check.onFail,
      };
    }

    if (margin >= 5 && check.onCritical) {
      return {
        outcomeGrade: "critical",
        outcome: check.onCritical,
      };
    }

    if (margin < 3 && check.onSuccessWithCost) {
      return {
        outcomeGrade: "success_with_cost",
        outcome: check.onSuccessWithCost,
        costEffects: check.onSuccessWithCost.costEffects,
      };
    }
  }

  return {
    outcomeGrade: passed ? "success" : "fail",
    outcome: passed ? check.onSuccess : check.onFail,
  };
};
