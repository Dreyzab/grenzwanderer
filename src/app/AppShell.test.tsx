import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

const mocks = vi.hoisted(() => ({
  useIdentityMock: vi.fn(),
  lastVnProps: null as null | Record<string, unknown>,
}));

vi.mock("../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

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
    onOpenVnScenario: (scenarioId: string) => void;
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
vi.mock("../pages/MindPalacePage", () => ({
  MindPalacePage: () => <div>mind</div>,
}));
vi.mock("../pages/DevPage", () => ({ DevPage: () => <div>dev</div> }));

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
    window.history.replaceState(null, "", "/");
  });

  it("reads initial tab and vnScenario from query", async () => {
    window.history.replaceState(null, "", "/?tab=vn&vnScenario=scenario_alpha");

    render(<AppShell />);

    await waitFor(() => {
      expect(screen.getByTestId("vn-page")).toHaveTextContent(
        "vn:scenario_alpha",
      );
    });
    expect(mocks.lastVnProps?.initialScenarioId).toBe("scenario_alpha");
  });

  it("applies popstate changes for tab and vnScenario", async () => {
    window.history.replaceState(null, "", "/?tab=home");
    render(<AppShell />);

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
    render(<AppShell />);

    fireEvent.click(screen.getByRole("button", { name: "open-vn" }));

    await waitFor(() => {
      expect(window.location.search).toContain("tab=vn");
    });
  });

  it("opens a specific VN scenario from Home callback", async () => {
    render(<AppShell />);

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
});
