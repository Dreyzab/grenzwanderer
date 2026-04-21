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
  redeemMapCodeMock: vi.fn(),
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
  RELEASE_PROFILE: "default",
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

    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });

    mocks.redeemMapCodeMock.mockResolvedValue(undefined);
    mocks.useReducerMock.mockImplementation((reducer: symbol) => {
      if (reducer === mocks.reducersMock.redeemMapCode) {
        return mocks.redeemMapCodeMock;
      }
      return vi.fn().mockResolvedValue(undefined);
    });
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

  it("passes browser coordinates to redeemMapCode when geolocation resolves", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success: PositionCallback) =>
          success({
            coords: {
              latitude: 48.001,
              longitude: 7.838,
              accuracy: 1,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          } as GeolocationPosition),
        ),
      },
    });

    render(<MapView initialPanel="qr" onOpenVnScenario={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText("Enter archived code"),
      "warehouse-dock",
    );
    await user.click(screen.getByRole("button", { name: "Archive lead" }));

    expect(mocks.redeemMapCodeMock).toHaveBeenCalledTimes(1);
    expect(mocks.redeemMapCodeMock.mock.calls[0]?.[0]).toMatchObject({
      code: "warehouse-dock",
      attemptedFromLat: 48.001,
      attemptedFromLng: 7.838,
    });
  });

  it("shows location-required, distance, and cooldown QR errors", async () => {
    const user = userEvent.setup();
    render(<MapView initialPanel="qr" onOpenVnScenario={vi.fn()} />);

    const input = screen.getByPlaceholderText("Enter archived code");
    const submit = screen.getByRole("button", { name: "Archive lead" });
    const rejections = [
      ["code_location_required", "Location required to validate this lead."],
      ["code_outside_geofence", "You are too far away from this lead."],
      ["code_retry_later", "Try again shortly."],
    ] as const;

    for (const [errorMessage, expectedLabel] of rejections) {
      mocks.redeemMapCodeMock.mockRejectedValueOnce(new Error(errorMessage));
      await user.clear(input);
      await user.type(input, "warehouse-dock");
      await user.click(submit);
      expect(await screen.findByText(expectedLabel)).toBeInTheDocument();
    }
  });
});
