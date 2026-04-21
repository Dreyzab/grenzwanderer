import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPage } from "./CommandPage";

const mocks = vi.hoisted(() => {
  const tables = {
    myCommandSessions: Symbol("myCommandSessions"),
    myCommandParty: Symbol("myCommandParty"),
    myCommandHistory: Symbol("myCommandHistory"),
  };
  const reducers = {
    issueCommand: Symbol("issueCommand"),
    resolveCommand: Symbol("resolveCommand"),
    closeCommandMode: Symbol("closeCommandMode"),
  };

  return {
    tables,
    reducers,
    useTableMock: vi.fn(),
    useReducerMock: vi.fn(),
    useIdentityMock: vi.fn(),
    issueCommandMock: vi.fn(),
    resolveCommandMock: vi.fn(),
    closeCommandModeMock: vi.fn(),
  };
});

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
  useReducer: (...args: unknown[]) => mocks.useReducerMock(...args),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  tables: mocks.tables,
  reducers: mocks.reducers,
}));

vi.mock("../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

const identity = (hex: string) => ({
  toHexString: () => hex,
});

describe("CommandPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useIdentityMock.mockReturnValue({
      identityHex: "me",
    });
    mocks.issueCommandMock.mockResolvedValue(undefined);
    mocks.resolveCommandMock.mockResolvedValue(undefined);
    mocks.closeCommandModeMock.mockResolvedValue(undefined);

    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducers.issueCommand) {
        return mocks.issueCommandMock;
      }
      if (reducer === mocks.reducers.resolveCommand) {
        return mocks.resolveCommandMock;
      }
      if (reducer === mocks.reducers.closeCommandMode) {
        return mocks.closeCommandModeMock;
      }
      return vi.fn();
    });
  });

  it("renders active command orders and resolves one on click", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [
          [
            {
              sessionKey: "me::command",
              scenarioId: "agency_evening_briefing",
              sourceTab: "map",
              returnTab: "map",
              phase: "orders",
              status: "active",
              title: "Agency Evening Briefing",
              briefing: "A late bureau briefing.",
              ordersJson: JSON.stringify([
                {
                  id: "deploy_inspector_watch",
                  actorId: "inspector",
                  label: "Deploy Night Watch",
                  description: "Route the inspector through the station quarter.",
                  effectPreview: "Gain one strong lead.",
                  disabled: false,
                },
              ]),
              selectedOrderId: { tag: "none" },
              resultTitle: { tag: "none" },
              resultSummary: { tag: "none" },
              updatedAt: "2",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myCommandParty) {
        return [
          [
            {
              memberKey: "member::inspector",
              sessionKey: "me::command",
              actorId: "inspector",
              label: "Inspector",
              role: "Field Lead",
              availability: "available",
              trust: 0,
              notes: { tag: "some", value: "Always available." },
              sortOrder: 0,
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myCommandHistory) {
        return [[], true];
      }
      return [[], true];
    });

    render(<CommandPage onNavigateTab={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /deploy night watch/i }));

    await waitFor(() => {
      expect(mocks.issueCommandMock).toHaveBeenCalledTimes(1);
    });
    expect(mocks.resolveCommandMock).toHaveBeenCalledTimes(1);
  });

  it("returns to the stored tab when closing a resolved command session", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [
          [
            {
              sessionKey: "me::command",
              scenarioId: "agency_evening_briefing",
              sourceTab: "vn",
              returnTab: "vn",
              phase: "result",
              status: "resolved",
              title: "Agency Evening Briefing",
              briefing: "A late bureau briefing.",
              ordersJson: "[]",
              selectedOrderId: { tag: "some", value: "deploy_inspector_watch" },
              resultTitle: { tag: "some", value: "Night Watch Assigned" },
              resultSummary: {
                tag: "some",
                value: "The station quarter is now under surveillance.",
              },
              updatedAt: "3",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myCommandParty) {
        return [[], true];
      }
      if (table === mocks.tables.myCommandHistory) {
        return [[], true];
      }
      return [[], true];
    });

    const onNavigateTab = vi.fn();
    render(<CommandPage onNavigateTab={onNavigateTab} />);

    fireEvent.click(screen.getByRole("button", { name: /return to field/i }));

    await waitFor(() => {
      expect(mocks.closeCommandModeMock).toHaveBeenCalledTimes(1);
    });
    expect(onNavigateTab).toHaveBeenCalledWith("vn");
  });
});
