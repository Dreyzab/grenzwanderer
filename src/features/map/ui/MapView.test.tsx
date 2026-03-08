import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeMapPoint } from "../types";
import { MapView } from "./MapView";

const mocks = vi.hoisted(() => ({
  useMapRuntimeStateMock: vi.fn(),
  useReducerMock: vi.fn(),
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  reducersMock: {
    mapInteract: Symbol("mapInteract"),
    redeemMapCode: Symbol("redeemMapCode"),
    travelTo: Symbol("travelTo"),
    setFlag: Symbol("setFlag"),
    startScenario: Symbol("startScenario"),
  },
  tablesMock: {
    playerRedeemedCode: Symbol("playerRedeemedCode"),
  },
}));

vi.mock("../../../config", () => ({
  MAPBOX_STYLE: "mapbox://styles/test",
  MAPBOX_TOKEN: "test-token",
}));

vi.mock("spacetimedb/react", () => ({
  useReducer: (...args: unknown[]) => mocks.useReducerMock(...args),
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  reducers: mocks.reducersMock,
  tables: mocks.tablesMock,
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../hooks/useMapRuntimeState", () => ({
  useMapRuntimeState: () => mocks.useMapRuntimeStateMock(),
}));

vi.mock("./DetectiveMapPin", () => ({
  DetectiveMapPin: ({
    point,
    onClick,
    isZoomedOut,
  }: {
    point: RuntimeMapPoint;
    onClick: () => void;
    isZoomedOut: boolean;
  }) => (
    <button
      type="button"
      data-testid={`pin-${point.id}`}
      data-zoomed-out={String(isZoomedOut)}
      onClick={onClick}
    >
      {point.title}
    </button>
  ),
}));

vi.mock("./CaseCard", () => ({
  CaseCard: () => <div>Case Card</div>,
}));

vi.mock("./DetectiveHub", () => ({
  DetectiveHub: () => <div>Detective Hub</div>,
}));

const basePoint: RuntimeMapPoint = {
  id: "loc_intro",
  regionId: "FREIBURG_1905",
  title: "Intro Point",
  lat: 47.99,
  lng: 7.85,
  locationId: "loc_intro",
  category: "PUBLIC",
  description: "Intro",
  state: "discovered",
  availableBindings: [],
  primaryBinding: null,
  travelBinding: null,
  isObjectiveActive: true,
  canTravel: false,
  resolvedScenarioId: null,
  canStartScenario: false,
  isVisible: true,
};

const makeMatchMedia = (width: number) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width: 960px)" ? width <= 960 : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: makeMatchMedia(width),
  });
};

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewport(1280);

    mocks.useReducerMock.mockImplementation(() =>
      vi.fn().mockResolvedValue(undefined),
    );
    mocks.useTableMock.mockReturnValue([[], true]);
    mocks.useIdentityMock.mockReturnValue({ identityHex: "me" });
    mocks.useMapRuntimeStateMock.mockReturnValue({
      source: "snapshot_v3",
      region: {
        id: "FREIBURG_1905",
        name: "Freiburg",
        geoCenterLat: 47.99,
        geoCenterLng: 7.85,
        zoom: 14,
      },
      points: [
        basePoint,
        {
          ...basePoint,
          id: "loc_bank",
          title: "Bank",
          locationId: "loc_bank",
          state: "locked",
          isObjectiveActive: false,
        },
      ],
      currentLocationId: "loc_intro",
      routes: [],
      isReady: false,
    });
  });

  it("keeps both overlay cards on desktop viewports", () => {
    render(<MapView onOpenVnScenario={vi.fn()} />);

    expect(
      screen.getByText(/a living city atlas layered over live spacetime/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Field Ledger" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open ledger" }),
    ).not.toBeInTheDocument();
  });

  it("renders a compact hud with a closed drawer by default", () => {
    setViewport(640);

    render(<MapView onOpenVnScenario={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open ledger" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByText(/a living city atlas layered over live spacetime/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Field Ledger" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Freiburg")).toBeInTheDocument();
  });

  it("opens the compact ledger drawer and closes it on map click", async () => {
    const user = userEvent.setup();
    setViewport(640);

    render(<MapView onOpenVnScenario={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Open ledger" }));

    expect(
      screen.getByRole("heading", { name: "Field Ledger" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close ledger" }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByTestId("map-gl-mock"));

    expect(
      screen.queryByRole("heading", { name: "Field Ledger" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open ledger" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
