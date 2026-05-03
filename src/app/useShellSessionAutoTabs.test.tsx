import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShellSessionAutoTabs } from "./useShellSessionAutoTabs";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  tables: {
    myCommandSessions: Symbol("myCommandSessions"),
    myBattleSessions: Symbol("myBattleSessions"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  tables: mocks.tables,
}));

describe("useShellSessionAutoTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useTableMock.mockReturnValue([[], true]);
  });

  it("switches into command when a new command session appears", async () => {
    const setActiveTab = vi.fn();
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [[{ sessionKey: "me::command", status: "active" }], true];
      }
      return [[], true];
    });

    renderHook(() =>
      useShellSessionAutoTabs({ disabled: false, setActiveTab }),
    );

    await waitFor(() => {
      expect(setActiveTab).toHaveBeenCalledWith("command");
    });
  });

  it("switches into battle when a new battle session appears", async () => {
    const setActiveTab = vi.fn();
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myBattleSessions) {
        return [[{ sessionKey: "me::battle", status: "active" }], true];
      }
      return [[], true];
    });

    renderHook(() =>
      useShellSessionAutoTabs({ disabled: false, setActiveTab }),
    );

    await waitFor(() => {
      expect(setActiveTab).toHaveBeenCalledWith("battle");
    });
  });

  it("ignores closed sessions", () => {
    const setActiveTab = vi.fn();
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [[{ sessionKey: "me::command", status: "closed" }], true];
      }
      return [[], true];
    });

    renderHook(() =>
      useShellSessionAutoTabs({ disabled: false, setActiveTab }),
    );

    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("does not repeat the same session switch on rerender", async () => {
    const setActiveTab = vi.fn();
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [[{ sessionKey: "me::command", status: "active" }], true];
      }
      return [[], true];
    });

    const { rerender } = renderHook(() =>
      useShellSessionAutoTabs({ disabled: false, setActiveTab }),
    );

    await waitFor(() => {
      expect(setActiveTab).toHaveBeenCalledTimes(1);
    });

    rerender();

    expect(setActiveTab).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const setActiveTab = vi.fn();
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [[{ sessionKey: "me::command", status: "active" }], true];
      }
      return [[], true];
    });

    renderHook(() => useShellSessionAutoTabs({ disabled: true, setActiveTab }));

    expect(setActiveTab).not.toHaveBeenCalled();
  });
});
