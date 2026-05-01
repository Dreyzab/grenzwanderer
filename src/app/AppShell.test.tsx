import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";
import { I18nProvider } from "../features/i18n/I18nProvider";

const renderAppShell = () =>
  render(
    <I18nProvider>
      <AppShell />
    </I18nProvider>,
  );

const mocks = vi.hoisted(() => ({
  useIdentityMock: vi.fn(),
  useTableMock: vi.fn(),
  lastVnProps: null as null | Record<string, unknown>,
  tables: {
    myCommandSessions: Symbol("myCommandSessions"),
    myBattleSessions: Symbol("myBattleSessions"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
  useReducer: () => vi.fn(),
}));

vi.mock("../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  tables: mocks.tables,
  reducers: {
    startScenario: Symbol("startScenario"),
    setNickname: Symbol("setNickname"),
    beginFreiburgOrigin: Symbol("beginFreiburgOrigin"),
  },
}));

vi.mock("../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config")>();
  return {
    ...actual,
    RELEASE_PROFILE: "freiburg_detective",
    SPACETIMEDB_DB_NAME: "grenzwandererdata",
  };
});

vi.mock("../pages/VnPage", () => ({
  VnPage: (props: Record<string, unknown>) => {
    mocks.lastVnProps = props;
    return (
      <div data-testid="vn-page">
        vn:{String(props.initialScenarioId ?? "none")}
      </div>
    );
  },
}));

vi.mock("../pages/HomePage", () => ({
  HomePage: ({
    onNavigate,
    onOpenVnScenario,
  }: {
    onNavigate: (tab: string) => void;
    onOpenVnScenario: (scenarioId: string, options?: unknown) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onNavigate("vn")}>
        open-vn
      </button>
      <button
        type="button"
        onClick={() => onOpenVnScenario("origin_journalist_bootstrap")}
      >
        open-freiburg
      </button>
    </div>
  ),
}));

vi.mock("../pages/MapPage", () => ({ MapPage: () => <div>map</div> }));
vi.mock("../pages/CharacterPage", () => ({
  CharacterPage: () => <div>character</div>,
}));
vi.mock("../pages/CommandPage", () => ({
  CommandPage: () => <div data-testid="command-page">command</div>,
}));
vi.mock("../pages/BattlePage", () => ({
  BattlePage: () => <div data-testid="battle-page">battle</div>,
}));
vi.mock("../pages/MindPalacePage", () => ({
  MindPalacePage: () => <div>mind</div>,
}));
vi.mock("../features/mindpalace/useFactDiscoveryToast", () => ({
  useFactDiscoveryToast: () => {},
}));
vi.mock("../features/mindpalace/useHypothesisRewardToast", () => ({
  useHypothesisRewardToast: () => {},
}));
vi.mock("../features/mindpalace/useMindPalaceReadiness", () => ({
  useMindPalaceReadiness: () => ({ hasReadyHypotheses: false }),
}));

vi.mock("../widgets/navbar/Navbar", () => ({
  Navbar: ({
    tabs,
    onTabChange,
  }: {
    tabs: Array<{ id: string; label: string }>;
    onTabChange: (tab: string) => void;
  }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)}>
          tab-{tab.id}
        </button>
      ))}
    </div>
  ),
}));

describe("AppShell URL synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lastVnProps = null;
    mocks.useIdentityMock.mockReturnValue({
      identity: { toHexString: () => "me" },
      identityHex: "me",
    });
    mocks.useTableMock.mockReturnValue([[], true]);
    window.history.replaceState(null, "", "/");
  });

  it("reads initial tab and vnScenario from query", async () => {
    window.history.replaceState(null, "", "/?tab=vn&vnScenario=scenario_alpha");

    renderAppShell();

    await waitFor(() => {
      expect(screen.getByTestId("vn-page")).toHaveTextContent(
        "vn:scenario_alpha",
      );
    });
    expect(mocks.lastVnProps?.initialScenarioId).toBe("scenario_alpha");
  });

  it("applies popstate changes for tab and vnScenario", async () => {
    window.history.replaceState(null, "", "/?tab=home");
    renderAppShell();

    expect(screen.queryByTestId("vn-page")).not.toBeInTheDocument();

    await act(async () => {
      window.history.pushState(null, "", "/?tab=vn&vnScenario=scenario_beta");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("vn-page")).toHaveTextContent(
        "vn:scenario_beta",
      );
    });
    expect(mocks.lastVnProps?.initialScenarioId).toBe("scenario_beta");
  });

  it("writes updated tab/scenario into query via replaceState", async () => {
    renderAppShell();

    fireEvent.click(screen.getByRole("button", { name: "open-vn" }));

    await waitFor(() => {
      expect(window.location.search).toContain("tab=vn");
    });
  });

  it("opens a specific VN scenario from Home callback", async () => {
    renderAppShell();

    fireEvent.click(screen.getByRole("button", { name: "open-freiburg" }));

    await waitFor(() => {
      expect(screen.getByTestId("vn-page")).toHaveTextContent(
        "vn:origin_journalist_bootstrap",
      );
    });
    expect(window.location.search).toContain("tab=vn");
    expect(window.location.search).toContain(
      "vnScenario=origin_journalist_bootstrap",
    );
  });

  it("switches into command tab when an active command session appears", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myCommandSessions) {
        return [
          [
            {
              sessionKey: "me::command",
              status: "active",
            },
          ],
          true,
        ];
      }
      return [[], true];
    });

    renderAppShell();

    await waitFor(() => {
      expect(screen.getByTestId("command-page")).toBeInTheDocument();
    });
    expect(window.location.search).toContain("tab=command");
  });

  it("switches into battle tab when an active battle session appears", async () => {
    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.myBattleSessions) {
        return [
          [
            {
              sessionKey: "me::battle",
              status: "active",
            },
          ],
          true,
        ];
      }
      return [[], true];
    });

    renderAppShell();

    await waitFor(() => {
      expect(screen.getByTestId("battle-page")).toBeInTheDocument();
    });
    expect(window.location.search).toContain("tab=battle");
  });
});
