import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DevPage } from "./DevPage";

const mocks = vi.hoisted(() => ({
  useReducerMock: vi.fn(),
  showToastMock: vi.fn(),
  reducersMock: {
    discoverFact: Symbol("discoverFact"),
    startMindCase: Symbol("startMindCase"),
    openBattleMode: Symbol("openBattleMode"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useReducer: (...args: unknown[]) => mocks.useReducerMock(...args),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  reducers: mocks.reducersMock,
}));

vi.mock("../shared/hooks/useToast", () => ({
  useToast: () => ({ showToast: mocks.showToastMock }),
}));

vi.mock("../features/ai/ui/AiThoughtsPanel", () => ({
  AiThoughtsPanel: () => <div>ai-thoughts</div>,
}));

describe("DevPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success toast after awaited reducer success", async () => {
    const user = userEvent.setup();
    const discoverFact = vi.fn().mockResolvedValue(undefined);
    const startMindCase = vi.fn().mockResolvedValue(undefined);
    const openBattleMode = vi.fn().mockResolvedValue(undefined);

    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducersMock.discoverFact) {
        return discoverFact;
      }
      if (reducer === mocks.reducersMock.startMindCase) {
        return startMindCase;
      }
      if (reducer === mocks.reducersMock.openBattleMode) {
        return openBattleMode;
      }
      return vi.fn().mockResolvedValue(undefined);
    });

    render(<DevPage />);
    await user.click(screen.getByRole("button", { name: "Grant Demo Fact" }));

    await waitFor(() => {
      expect(discoverFact).toHaveBeenCalledTimes(1);
    });
    expect(mocks.showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Granted fact_loop_clue",
        source: "dev_cheat",
      }),
    );
  });

  it("shows error toast when reducer rejects", async () => {
    const user = userEvent.setup();
    const discoverFact = vi.fn().mockRejectedValue(new Error("boom"));
    const startMindCase = vi.fn().mockResolvedValue(undefined);
    const openBattleMode = vi.fn().mockResolvedValue(undefined);

    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducersMock.discoverFact) {
        return discoverFact;
      }
      if (reducer === mocks.reducersMock.startMindCase) {
        return startMindCase;
      }
      if (reducer === mocks.reducersMock.openBattleMode) {
        return openBattleMode;
      }
      return vi.fn().mockResolvedValue(undefined);
    });

    render(<DevPage />);
    await user.click(screen.getByRole("button", { name: "Grant Demo Fact" }));

    await waitFor(() => {
      expect(mocks.showToastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Dev cheat failed: boom",
          source: "dev_cheat",
        }),
      );
    });
  });

  it("opens the son duel through the authoritative reducer", async () => {
    const user = userEvent.setup();
    const discoverFact = vi.fn().mockResolvedValue(undefined);
    const startMindCase = vi.fn().mockResolvedValue(undefined);
    const openBattleMode = vi.fn().mockResolvedValue(undefined);

    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducersMock.discoverFact) {
        return discoverFact;
      }
      if (reducer === mocks.reducersMock.startMindCase) {
        return startMindCase;
      }
      if (reducer === mocks.reducersMock.openBattleMode) {
        return openBattleMode;
      }
      return vi.fn().mockResolvedValue(undefined);
    });

    render(<DevPage />);
    await user.click(screen.getByRole("button", { name: "Open Son Duel" }));

    await waitFor(() => {
      expect(openBattleMode).toHaveBeenCalledTimes(1);
    });
    expect(openBattleMode).toHaveBeenCalledWith(
      expect.objectContaining({
        scenarioId: "sandbox_son_duel",
        sourceTab: "dev",
      }),
    );
  });
});
