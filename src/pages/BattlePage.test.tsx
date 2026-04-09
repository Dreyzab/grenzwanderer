import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattlePage } from "./BattlePage";

const mocks = vi.hoisted(() => {
  const tables = {
    myBattleSessions: Symbol("myBattleSessions"),
    myBattleCombatants: Symbol("myBattleCombatants"),
    myBattleCards: Symbol("myBattleCards"),
    myBattleHistory: Symbol("myBattleHistory"),
  };
  const reducers = {
    playBattleCard: Symbol("playBattleCard"),
    endBattleTurn: Symbol("endBattleTurn"),
    closeBattleMode: Symbol("closeBattleMode"),
  };

  return {
    tables,
    reducers,
    useTableMock: vi.fn(),
    useReducerMock: vi.fn(),
    useIdentityMock: vi.fn(),
    playBattleCardMock: vi.fn(),
    endBattleTurnMock: vi.fn(),
    closeBattleModeMock: vi.fn(),
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

describe("BattlePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useIdentityMock.mockReturnValue({
      identityHex: "me",
    });
    mocks.playBattleCardMock.mockResolvedValue(undefined);
    mocks.endBattleTurnMock.mockResolvedValue(undefined);
    mocks.closeBattleModeMock.mockResolvedValue(undefined);

    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducers.playBattleCard) {
        return mocks.playBattleCardMock;
      }
      if (reducer === mocks.reducers.endBattleTurn) {
        return mocks.endBattleTurnMock;
      }
      if (reducer === mocks.reducers.closeBattleMode) {
        return mocks.closeBattleModeMock;
      }
      return vi.fn();
    });
  });

  it("renders the empty state when no active battle session exists", () => {
    mocks.useTableMock.mockReturnValue([[], true]);

    render(<BattlePage onNavigateTab={vi.fn()} />);

    expect(
      screen.getByText(/no active battle is open/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/banker vn slice or the debug launcher/i),
    ).toBeInTheDocument();
  });

  it("renders the active battle hand and plays a card on click", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myBattleSessions) {
        return [
          [
            {
              sessionKey: "me::battle",
              scenarioId: "sandbox_son_duel",
              returnTab: "vn",
              phase: "player_turn",
              status: "active",
              title: "Casino Confrontation",
              briefing: "Break Friedrich's composure.",
              resolveLabel: "Resolve",
              apLabel: "Pressure",
              blockLabel: "Stance",
              resultType: { tag: "none" },
              resultTitle: { tag: "none" },
              resultSummary: { tag: "none" },
              updatedAt: "2",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleCombatants) {
        return [
          [
            {
              combatantKey: "player",
              sessionKey: "me::battle",
              combatantId: "detective",
              side: "player",
              label: "Detective",
              resolve: 24,
              maxResolve: 24,
              ap: 3,
              maxAp: 3,
              block: 0,
              subtitle: { tag: "none" },
              portraitUrl: { tag: "none" },
              nextIntentLabel: { tag: "none" },
              nextIntentSummary: { tag: "none" },
            },
            {
              combatantKey: "enemy",
              sessionKey: "me::battle",
              combatantId: "friedrich_richter",
              side: "enemy",
              label: "Friedrich Richter",
              resolve: 18,
              maxResolve: 18,
              ap: 0,
              maxAp: 0,
              block: 0,
              subtitle: { tag: "some", value: "Banker's son" },
              portraitUrl: { tag: "none" },
              nextIntentLabel: { tag: "some", value: "Smug Rebuttal" },
              nextIntentSummary: {
                tag: "some",
                value: "Deal 4 resolve damage.",
              },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleCards) {
        return [
          [
            {
              cardInstanceKey: "card::1",
              sessionKey: "me::battle",
              instanceId: "card_1",
              cardId: "card_pointed_question",
              ownerCombatantId: "detective",
              label: "Pointed Question",
              description: "Pin Friedrich to a detail he cannot wave away.",
              effectPreview: "Deal 4 resolve damage.",
              costAp: 1,
              zone: "hand",
              zoneOrder: 0,
              isPlayable: true,
              playableReason: { tag: "none" },
            },
            {
              cardInstanceKey: "card::2",
              sessionKey: "me::battle",
              instanceId: "card_2",
              cardId: "card_press_advantage",
              ownerCombatantId: "detective",
              label: "Press the Advantage",
              description: "Use the room's doubt to keep the tempo on your side.",
              effectPreview: "Deal 6 resolve damage.",
              costAp: 2,
              zone: "deck",
              zoneOrder: 0,
              isPlayable: false,
              playableReason: { tag: "none" },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleHistory) {
        return [
          [
            {
              historyKey: "history::1",
              sessionKey: "me::battle",
              message: "Battle opened: Casino Confrontation.",
              createdAt: "1",
            },
          ],
          true,
        ];
      }
      return [[], true];
    });

    render(<BattlePage onNavigateTab={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /pointed question/i }));

    await waitFor(() => {
      expect(mocks.playBattleCardMock).toHaveBeenCalledTimes(1);
    });
    expect(mocks.playBattleCardMock).toHaveBeenCalledWith(
      expect.objectContaining({ instanceId: "card_1" }),
    );
  });

  it("ends the turn from an active battle state", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myBattleSessions) {
        return [
          [
            {
              sessionKey: "me::battle",
              scenarioId: "sandbox_son_duel",
              returnTab: "vn",
              phase: "player_turn",
              status: "active",
              title: "Casino Confrontation",
              briefing: "Break Friedrich's composure.",
              resolveLabel: "Resolve",
              apLabel: "Pressure",
              blockLabel: "Stance",
              resultType: { tag: "none" },
              resultTitle: { tag: "none" },
              resultSummary: { tag: "none" },
              updatedAt: "2",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleCombatants) {
        return [
          [
            {
              combatantKey: "player",
              sessionKey: "me::battle",
              combatantId: "detective",
              side: "player",
              label: "Detective",
              resolve: 20,
              maxResolve: 24,
              ap: 1,
              maxAp: 3,
              block: 2,
              subtitle: { tag: "none" },
              portraitUrl: { tag: "none" },
              nextIntentLabel: { tag: "none" },
              nextIntentSummary: { tag: "none" },
            },
            {
              combatantKey: "enemy",
              sessionKey: "me::battle",
              combatantId: "friedrich_richter",
              side: "enemy",
              label: "Friedrich Richter",
              resolve: 11,
              maxResolve: 18,
              ap: 0,
              maxAp: 0,
              block: 0,
              subtitle: { tag: "none" },
              portraitUrl: { tag: "none" },
              nextIntentLabel: { tag: "some", value: "Smug Rebuttal" },
              nextIntentSummary: {
                tag: "some",
                value: "Deal 4 resolve damage.",
              },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleCards) {
        return [[], true];
      }
      if (table === mocks.tables.myBattleHistory) {
        return [[], true];
      }
      return [[], true];
    });

    render(<BattlePage onNavigateTab={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));

    await waitFor(() => {
      expect(mocks.endBattleTurnMock).toHaveBeenCalledTimes(1);
    });
  });

  it("returns to the stored tab when a resolved battle is closed", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myBattleSessions) {
        return [
          [
            {
              sessionKey: "me::battle",
              scenarioId: "sandbox_son_duel",
              returnTab: "map",
              phase: "result",
              status: "resolved",
              title: "Casino Confrontation",
              briefing: "Break Friedrich's composure.",
              resolveLabel: "Resolve",
              apLabel: "Pressure",
              blockLabel: "Stance",
              resultType: { tag: "some", value: "victory" },
              resultTitle: { tag: "some", value: "Friedrich Buckles" },
              resultSummary: {
                tag: "some",
                value: "The room sees the bluff collapse.",
              },
              updatedAt: "3",
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleCombatants) {
        return [
          [
            {
              combatantKey: "player",
              sessionKey: "me::battle",
              combatantId: "detective",
              side: "player",
              label: "Detective",
              resolve: 10,
              maxResolve: 24,
              ap: 1,
              maxAp: 3,
              block: 0,
              subtitle: { tag: "none" },
              portraitUrl: { tag: "none" },
              nextIntentLabel: { tag: "none" },
              nextIntentSummary: { tag: "none" },
            },
            {
              combatantKey: "enemy",
              sessionKey: "me::battle",
              combatantId: "friedrich_richter",
              side: "enemy",
              label: "Friedrich Richter",
              resolve: 0,
              maxResolve: 18,
              ap: 0,
              maxAp: 0,
              block: 0,
              subtitle: { tag: "none" },
              portraitUrl: { tag: "none" },
              nextIntentLabel: { tag: "none" },
              nextIntentSummary: { tag: "none" },
            },
          ],
          true,
        ];
      }
      if (table === mocks.tables.myBattleCards) {
        return [[], true];
      }
      if (table === mocks.tables.myBattleHistory) {
        return [[], true];
      }
      return [[], true];
    });

    const onNavigateTab = vi.fn();
    render(<BattlePage onNavigateTab={onNavigateTab} />);

    expect(screen.getByText("Friedrich Buckles")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "End Turn" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Return" }));

    await waitFor(() => {
      expect(mocks.closeBattleModeMock).toHaveBeenCalledTimes(1);
    });
    expect(onNavigateTab).toHaveBeenCalledWith("map");
  });
});
