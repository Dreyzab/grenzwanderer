import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMindPalaceReadiness } from "./useMindPalaceReadiness";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  tablesMock: {
    mindCase: Symbol("mindCase"),
    mindHypothesis: Symbol("mindHypothesis"),
    myMindFacts: Symbol("myMindFacts"),
    myMindHypotheses: Symbol("myMindHypotheses"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../entities/player/hooks/usePlayerVars", () => ({
  usePlayerVars: () => mocks.usePlayerVarsMock(),
}));

vi.mock("../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
}));

const Harness = () => {
  const readiness = useMindPalaceReadiness();
  return (
    <div>
      <span data-testid="has-ready">
        {readiness.hasReadyHypotheses ? "yes" : "no"}
      </span>
      <span data-testid="ready-count">{readiness.readyCount}</span>
    </div>
  );
};

describe("useMindPalaceReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerVarsMock.mockReturnValue({ attr_logic: 3 });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.mindCase) {
        return [[{ caseId: "case_1", isActive: true }], true];
      }
      if (table === mocks.tablesMock.mindHypothesis) {
        return [
          [
            {
              caseId: "case_1",
              hypothesisId: "hyp_1",
              requiredFactIdsJson: '["fact_1"]',
              requiredVarsJson: '[{"key":"attr_logic","op":"gte","value":2}]',
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myMindFacts) {
        return [[{ caseId: "case_1", factId: "fact_1" }], true];
      }
      if (table === mocks.tablesMock.myMindHypotheses) {
        return [[], true];
      }
      return [[], true];
    });
  });

  it("returns ready count when hypothesis is ready and not validated", () => {
    render(<Harness />);

    expect(screen.getByTestId("has-ready")).toHaveTextContent("yes");
    expect(screen.getByTestId("ready-count")).toHaveTextContent("1");
  });

  it("excludes validated hypotheses from ready count", () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.mindCase) {
        return [[{ caseId: "case_1", isActive: true }], true];
      }
      if (table === mocks.tablesMock.mindHypothesis) {
        return [
          [
            {
              caseId: "case_1",
              hypothesisId: "hyp_1",
              requiredFactIdsJson: "[]",
              requiredVarsJson: "[]",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.myMindFacts) {
        return [[], true];
      }
      if (table === mocks.tablesMock.myMindHypotheses) {
        return [
          [
            {
              caseId: "case_1",
              hypothesisId: "hyp_1",
              status: "validated",
            },
          ],
          true,
        ];
      }
      return [[], true];
    });

    render(<Harness />);
    expect(screen.getByTestId("has-ready")).toHaveTextContent("no");
    expect(screen.getByTestId("ready-count")).toHaveTextContent("0");
  });
});
