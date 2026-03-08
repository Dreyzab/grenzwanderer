import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MindPalacePanel } from "./MindPalacePanel";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useReducerMock: vi.fn(),
  useIdentityMock: vi.fn(),
  usePlayerVarsMock: vi.fn(),
  tablesMock: {
    mindCase: Symbol("mindCase"),
    mindHypothesis: Symbol("mindHypothesis"),
    playerMindFact: Symbol("playerMindFact"),
    playerMindHypothesis: Symbol("playerMindHypothesis"),
    playerMindCase: Symbol("playerMindCase"),
  },
  reducersMock: {
    startMindCase: Symbol("startMindCase"),
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

vi.mock("../../shared/spacetime/bindings", () => ({
  tables: mocks.tablesMock,
  reducers: mocks.reducersMock,
}));

vi.mock("../mindboard/MindBoardCanvas", () => ({
  MindBoardCanvas: ({ caseId }: { caseId: string }) => (
    <div data-testid="mind-board-canvas">{caseId}</div>
  ),
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

describe("MindPalacePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.usePlayerVarsMock.mockReturnValue({ attr_logic: 3 });

    const startMindCase = vi.fn().mockResolvedValue(undefined);
    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducersMock.startMindCase) {
        return startMindCase;
      }
      return vi.fn().mockResolvedValue(undefined);
    });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.mindCase) {
        return [[{ caseId: "case_1", title: "Case One", isActive: true }], true];
      }
      if (table === mocks.tablesMock.mindHypothesis) {
        return [
          [
            {
              caseId: "case_1",
              hypothesisId: "hyp_1",
              text: "Hypothesis",
              requiredFactIdsJson: '["fact_1"]',
              requiredVarsJson: '[{"key":"attr_logic","op":"gte","value":2}]',
            },
          ],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerMindFact) {
        return [
          [{ playerId: makeIdentity("me"), caseId: "case_1", factId: "fact_1" }],
          true,
        ];
      }
      if (table === mocks.tablesMock.playerMindHypothesis) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMindCase) {
        return [
          [{ playerId: makeIdentity("me"), caseId: "case_1", status: "in_progress" }],
          true,
        ];
      }
      return [[], true];
    });
  });

  it("shows readiness summary derived from shared readiness model", () => {
    render(<MindPalacePanel />);

    expect(screen.getByText("Ready hypotheses: 1/1")).toBeInTheDocument();
    expect(screen.getByTestId("mind-board-canvas")).toHaveTextContent("case_1");
  });

  it("starts a case and renders status line", async () => {
    const user = userEvent.setup();

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tablesMock.mindCase) {
        return [[{ caseId: "case_1", title: "Case One", isActive: true }], true];
      }
      if (table === mocks.tablesMock.mindHypothesis) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMindFact) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMindHypothesis) {
        return [[], true];
      }
      if (table === mocks.tablesMock.playerMindCase) {
        return [[], true];
      }
      return [[], true];
    });

    render(<MindPalacePanel />);

    await user.click(screen.getByRole("button", { name: "Start Case" }));

    await waitFor(() => {
      expect(screen.getByText("Mind case started")).toBeInTheDocument();
    });
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
