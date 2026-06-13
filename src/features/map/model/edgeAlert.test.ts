import { describe, expect, it } from "vitest";
import type { DiscoverySignalResult } from "./discoverySignal";
import { resolveEdgeAlert } from "./edgeAlert";

const signal = (
  overrides: Partial<DiscoverySignalResult>,
): DiscoverySignalResult => ({
  state: "idle",
  phase: "none",
  target: null,
  distanceMeters: null,
  ambiguity: false,
  channel: null,
  ...overrides,
});

describe("resolveEdgeAlert", () => {
  it("returns null when there is no signal and no threat", () => {
    expect(resolveEdgeAlert({ signal: signal({}) })).toBeNull();
  });

  it("maps discovery phases to escalating intensity and faster pulses", () => {
    const cold = resolveEdgeAlert({
      signal: signal({ state: "cold", phase: "cold" }),
    });
    const warm = resolveEdgeAlert({
      signal: signal({ state: "warm", phase: "warm" }),
    });
    const hot = resolveEdgeAlert({
      signal: signal({ state: "hot", phase: "hot" }),
    });

    expect(cold?.kind).toBe("discovery");
    expect(warm?.kind).toBe("discovery");
    expect(hot?.kind).toBe("discovery");
    expect(cold!.intensity).toBeLessThan(warm!.intensity);
    expect(warm!.intensity).toBeLessThan(hot!.intensity);
    expect(hot!.pulseSeconds).toBeLessThan(warm!.pulseSeconds);
    expect(warm!.pulseSeconds).toBeLessThan(cold!.pulseSeconds);
  });

  it("distinguishes QR caches from generic hidden POIs", () => {
    const qr = resolveEdgeAlert({
      signal: signal({ state: "warm", phase: "warm", channel: "qr_scan" }),
    });
    const poi = resolveEdgeAlert({
      signal: signal({ state: "warm", phase: "warm", channel: "proximity" }),
    });

    expect(qr?.kind).toBe("qr_cache");
    expect(poi?.kind).toBe("discovery");
    expect(qr?.intensity).toBe(poi?.intensity);
  });

  it("reports interference over the discovery phase", () => {
    const alert = resolveEdgeAlert({
      signal: signal({ state: "interference", phase: "warm", ambiguity: true }),
    });
    expect(alert?.kind).toBe("interference");
  });

  it("prioritizes danger over any discovery signal", () => {
    const alert = resolveEdgeAlert({
      signal: signal({ state: "hot", phase: "hot" }),
      threatLevel: "imminent",
    });
    expect(alert?.kind).toBe("danger");
    expect(alert?.intensity).toBe(1);

    const near = resolveEdgeAlert({
      signal: signal({}),
      threatLevel: "near",
    });
    expect(near?.kind).toBe("danger");
    expect(near!.intensity).toBeLessThan(1);
  });
});
