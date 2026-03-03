import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MindPalacePanel } from "./MindPalacePanel";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useReducerMock: vi.fn(),
  useIdentityMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  usePlayerFlagsMock: vi.fn(),
  tablesMock: {
    mindCase: Symbol("mindCase"),
    mindFact: Symbol("mindFact"),
    mindHypothesis: Symbol("mindHypothesis"),
    playerMindCase: Symbol("playerMindCase"),
    playerMindFact: Symbol("playerMindFact"),
    playerMindHypothesis: Symbol("playerMindHypothesis"),
  },
  reducersMock: {
    startMindCase: Symbol("startMindCase"),
    validateHypothesis: Symbol("validateHypothesis"),
    setHypothesisFocus: Symbol("setHypothesisFocus"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
  useReducer: (...args: unknown[]) => mocks.useReducerMock(...args),
}));

vi.mock("../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../entities/player/hooks/usePlayerVars", () => ({
  usePlayerVars: () => mocks.usePlayerVarsMock(),
}));

vi.mock("../../entities/player/hooks/usePlayerFlags", () => ({
  usePlayerFlags: () => mocks.usePlayerFlagsMock(),
}));

vi.mock("../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
  reducers: mocks.reducersMock,
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

describe("MindPalacePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerVarsMock.mockReturnValue({});
    mocks.usePlayerFlagsMock.mockReturnValue({});

    const asyncNoop = vi.fn().mockResolvedValue(undefined);
    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducersMock.startMindCase) {
        return asyncNoop;
      }
      if (reducer === mocks.reducersMock.validateHypothesis) {
        return asyncNoop;
      }
      if (reducer === mocks.reducersMock.setHypothesisFocus) {
        return asyncNoop;
      }
      return asyncNoop;
    });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.mindCase) {
        return [
          [{ caseId: "case_1", title: "Case One", isActive: true }],
          true,
        ];
      }
      if (table === mocks.tablesMock.mindFact) {
        return [
          [{ caseId: "case_1", factId: "fact_1", text: "Fact text" }],
          true,
        ];
      }
      if (table === mocks.tablesMock.mindHypothesis) {
        return [
          [
            {
              caseId: "case_1",
              hypothesisId: "hypothesis_internal_id_001",
              text: "The suspect had inside help.",
              requiredFactIdsJson: '["fact_1"]',
              requiredVarsJson: "[]",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerMindCase) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              caseId: "case_1",
              status: "in_progress",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerMindFact) {
        return [
          [
            {
              playerId: makeIdentity("me"),
              caseId: "case_1",
              factId: "fact_1",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerMindHypothesis) {
        return [[], true];
      }
      return [[], true];
    });
  });

  it("uses human-facing status lines and polite live region", async () => {
    const user = userEvent.setup();

    render(<MindPalacePanel />);

    const validateButton = await screen.findByRole("button", {
      name: "Validate",
    });
    await user.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText("Hypothesis validated.")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/hypothesis_internal_id_001/i),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
