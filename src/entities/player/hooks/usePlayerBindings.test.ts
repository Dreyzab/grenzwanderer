import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerBindingsProvider, usePlayerBindings } from "./usePlayerBindings";

const mocks = vi.hoisted(() => ({
  tableSymbols: {
    myPlayerFlags: Symbol("myPlayerFlags"),
    myPlayerVars: Symbol("myPlayerVars"),
    myPlayerProfile: Symbol("myPlayerProfile"),
    myPlayerLocation: Symbol("myPlayerLocation"),
    myPlayerInventory: Symbol("myPlayerInventory"),
    myQuests: Symbol("myQuests"),
    myRelationships: Symbol("myRelationships"),
    myNpcState: Symbol("myNpcState"),
    myNpcFavors: Symbol("myNpcFavors"),
    myFactionSignals: Symbol("myFactionSignals"),
    myAgencyCareer: Symbol("myAgencyCareer"),
  },
  tableRows: new Map<symbol, unknown[]>(),
  useIdentityMock: vi.fn(),
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (table: symbol) => [mocks.tableRows.get(table) ?? []],
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: mocks.tableSymbols,
}));

describe("usePlayerBindings", () => {
  beforeEach(() => {
    mocks.tableRows.clear();
    vi.clearAllMocks();
  });

  it("returns empty scoped data without identity", () => {
    mocks.useIdentityMock.mockReturnValue({ identityHex: "" });
    mocks.tableRows.set(mocks.tableSymbols.myPlayerFlags, [
      { key: "lang_ru", value: true },
    ]);
    mocks.tableRows.set(mocks.tableSymbols.myPlayerVars, [
      { key: "attr_intellect", floatValue: 4 },
    ]);

    const { result } = renderHook(() => usePlayerBindings(), {
      wrapper: PlayerBindingsProvider,
    });

    expect(result.current.flags).toEqual({});
    expect(result.current.vars).toEqual({});
    expect(result.current.profile).toBeNull();
    expect(result.current.inventory).toEqual([]);
    expect(result.current.rows.flags).toEqual([]);
  });

  it("collects player rows and maps flags and vars", () => {
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    const profile = { nickname: "Inspector" };
    const location = { locationId: "freiburg_hbf" };
    const inventory = [{ itemId: "notebook", quantity: 1 }];
    const quests = [{ questId: "case01", stage: 2 }];
    const relationship = [{ characterId: "anna", value: 20 }];
    const npcState = [{ npcId: "anna", trustScore: 20 }];
    const npcFavors = [{ npcId: "anna", balance: 1 }];
    const factionSignals = [{ factionId: "city_chancellery", value: 5 }];
    const agencyCareer = [{ rankId: "junior_inspector", standingScore: 3 }];

    mocks.tableRows.set(mocks.tableSymbols.myPlayerFlags, [
      { key: "lang_ru", value: true },
      { key: "case_resolved", value: false },
    ]);
    mocks.tableRows.set(mocks.tableSymbols.myPlayerVars, [
      { key: "attr_intellect", floatValue: 4 },
      { key: "rep_civic", floatValue: 1.5 },
    ]);
    mocks.tableRows.set(mocks.tableSymbols.myPlayerProfile, [profile]);
    mocks.tableRows.set(mocks.tableSymbols.myPlayerLocation, [location]);
    mocks.tableRows.set(mocks.tableSymbols.myPlayerInventory, inventory);
    mocks.tableRows.set(mocks.tableSymbols.myQuests, quests);
    mocks.tableRows.set(mocks.tableSymbols.myRelationships, relationship);
    mocks.tableRows.set(mocks.tableSymbols.myNpcState, npcState);
    mocks.tableRows.set(mocks.tableSymbols.myNpcFavors, npcFavors);
    mocks.tableRows.set(mocks.tableSymbols.myFactionSignals, factionSignals);
    mocks.tableRows.set(mocks.tableSymbols.myAgencyCareer, agencyCareer);

    const { result } = renderHook(() => usePlayerBindings(), {
      wrapper: PlayerBindingsProvider,
    });

    expect(result.current.flags).toEqual({
      lang_ru: true,
      case_resolved: false,
    });
    expect(result.current.vars).toEqual({ attr_intellect: 4, rep_civic: 1.5 });
    expect(result.current.profile).toBe(profile);
    expect(result.current.location).toBe(location);
    expect(result.current.inventory).toBe(inventory);
    expect(result.current.quests).toBe(quests);
    expect(result.current.relationships).toBe(relationship);
    expect(result.current.npcState).toBe(npcState);
    expect(result.current.npcFavors).toBe(npcFavors);
    expect(result.current.factionSignals).toBe(factionSignals);
    expect(result.current.agencyCareer).toBe(agencyCareer[0]);
  });

  it("keeps mapped records referentially stable when rows are stable", () => {
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    const flags = [{ key: "lang_ru", value: true }];
    const vars = [{ key: "attr_intellect", floatValue: 4 }];
    mocks.tableRows.set(mocks.tableSymbols.myPlayerFlags, flags);
    mocks.tableRows.set(mocks.tableSymbols.myPlayerVars, vars);

    const { result, rerender } = renderHook(() => usePlayerBindings(), {
      wrapper: PlayerBindingsProvider,
    });
    const firstFlags = result.current.flags;
    const firstVars = result.current.vars;

    rerender();

    expect(result.current.flags).toBe(firstFlags);
    expect(result.current.vars).toBe(firstVars);
  });
});
