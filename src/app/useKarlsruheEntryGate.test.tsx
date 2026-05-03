import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKarlsruheGrantStorageKey } from "../features/release/karlsruheEntry";
import type { TabId } from "../shared/navigation/shellNavigationTypes";
import { useKarlsruheEntryGate } from "./useKarlsruheEntryGate";

const mocks = vi.hoisted(() => ({
  beginKarlsruheEventEntryMock: vi.fn(),
  useTableMock: vi.fn(),
  tables: {
    myVnSessions: Symbol("myVnSessions"),
    myPlayerFlags: Symbol("myPlayerFlags"),
  },
}));

vi.mock("../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config")>();
  return {
    ...actual,
    KARLSRUHE_ENTRY_TOKEN: "good-token",
  };
});

vi.mock("spacetimedb/react", () => ({
  useReducer: () => mocks.beginKarlsruheEventEntryMock,
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  reducers: {
    beginKarlsruheEventEntry: Symbol("beginKarlsruheEventEntry"),
  },
  tables: mocks.tables,
}));

const baseProps = {
  activeTab: "map" as TabId,
  dbName: "grenzwandererdata",
  identityHex: "me",
  isKarlsruheProfile: true,
  pathname: "/karlsruhe",
  profile: "karlsruhe_event" as const,
  setActiveTab: vi.fn(),
  setEntryToken: vi.fn(),
  setVnScenarioId: vi.fn(),
  vnScenarioId: undefined,
};

const writeGrant = () => {
  window.localStorage.setItem(
    getKarlsruheGrantStorageKey("karlsruhe_event", "grenzwandererdata"),
    JSON.stringify({
      releaseProfile: "karlsruhe_event",
      databaseName: "grenzwandererdata",
      grantedAt: new Date().toISOString(),
    }),
  );
};

describe("useKarlsruheEntryGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.beginKarlsruheEventEntryMock.mockResolvedValue(undefined);
    mocks.useTableMock.mockReturnValue([[], true]);
  });

  it("denies invalid entry tokens", async () => {
    const { result } = renderHook(() =>
      useKarlsruheEntryGate({ ...baseProps, entryToken: "bad-token" }),
    );

    await waitFor(() => {
      expect(result.current.entryGateState).toBe("denied");
    });
    expect(result.current.entryGateError).toBe(
      "The supplied Karlsruhe event token is not valid.",
    );
    expect(mocks.beginKarlsruheEventEntryMock).not.toHaveBeenCalled();
  });

  it("waits for identity before validating a valid token", async () => {
    const { result } = renderHook(() =>
      useKarlsruheEntryGate({
        ...baseProps,
        entryToken: "good-token",
        identityHex: "",
      }),
    );

    await waitFor(() => {
      expect(result.current.entryGateState).toBe("validating");
    });
    expect(mocks.beginKarlsruheEventEntryMock).not.toHaveBeenCalled();
  });

  it("writes a grant and clears the entry token after reducer success", async () => {
    const setEntryToken = vi.fn();
    const { result } = renderHook(() =>
      useKarlsruheEntryGate({
        ...baseProps,
        entryToken: "good-token",
        setEntryToken,
      }),
    );

    await waitFor(() => {
      expect(result.current.entryGateState).toBe("granted");
    });
    expect(mocks.beginKarlsruheEventEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({ entryToken: "good-token" }),
    );
    expect(setEntryToken).toHaveBeenCalledWith(undefined);
    expect(
      window.localStorage.getItem(
        getKarlsruheGrantStorageKey("karlsruhe_event", "grenzwandererdata"),
      ),
    ).not.toBeNull();
  });

  it("forces the active VN session after grant", async () => {
    writeGrant();
    const setActiveTab = vi.fn();
    const setVnScenarioId = vi.fn();
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myVnSessions) {
        return [
          [
            {
              scenarioId: "karlsruhe_live_scene",
              completedAt: null,
            },
          ],
          true,
        ];
      }
      return [[], true];
    });

    renderHook(() =>
      useKarlsruheEntryGate({
        ...baseProps,
        setActiveTab,
        setVnScenarioId,
      }),
    );

    await waitFor(() => {
      expect(setVnScenarioId).toHaveBeenCalledWith("karlsruhe_live_scene");
      expect(setActiveTab).toHaveBeenCalledWith("vn");
    });
  });

  it("forces the arrival scenario until arrival is complete", async () => {
    writeGrant();
    const setActiveTab = vi.fn();
    const setVnScenarioId = vi.fn();

    renderHook(() =>
      useKarlsruheEntryGate({
        ...baseProps,
        setActiveTab,
        setVnScenarioId,
      }),
    );

    await waitFor(() => {
      expect(setVnScenarioId).toHaveBeenCalledWith("karlsruhe_event_arrival");
      expect(setActiveTab).toHaveBeenCalledWith("vn");
    });
  });
});
