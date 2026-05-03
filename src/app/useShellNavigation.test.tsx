import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useShellNavigation } from "./useShellNavigation";

describe("useShellNavigation", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("reads initial tab and VN scenario from the URL", () => {
    window.history.replaceState(null, "", "/?tab=vn&vnScenario=scenario_alpha");

    const { result } = renderHook(() =>
      useShellNavigation("freiburg_detective"),
    );

    expect(result.current.activeTab).toBe("vn");
    expect(result.current.vnScenarioId).toBe("scenario_alpha");
  });

  it("applies popstate changes", async () => {
    const { result } = renderHook(() =>
      useShellNavigation("freiburg_detective"),
    );

    expect(result.current.activeTab).toBe("home");

    await act(async () => {
      window.history.pushState(null, "", "/?tab=vn&vnScenario=scenario_beta");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current.activeTab).toBe("vn");
    expect(result.current.vnScenarioId).toBe("scenario_beta");
  });

  it("writes opened VN scenarios into the query string", async () => {
    const { result } = renderHook(() =>
      useShellNavigation("freiburg_detective"),
    );

    act(() => {
      result.current.openVnScenario("case01_hbf_arrival");
    });

    await waitFor(() => {
      expect(window.location.search).toContain("tab=vn");
      expect(window.location.search).toContain("vnScenario=case01_hbf_arrival");
    });
  });

  it("writes the QR map panel only for the map tab", async () => {
    const { result } = renderHook(() =>
      useShellNavigation("freiburg_detective"),
    );

    act(() => {
      result.current.navigateToTab("map", { mapPanel: "qr" });
    });

    await waitFor(() => {
      expect(window.location.search).toContain("tab=map");
      expect(window.location.search).toContain("mapPanel=qr");
    });
  });

  it("coerces Karlsruhe navigation to the event pathname and allowed tabs", async () => {
    window.history.replaceState(null, "", "/elsewhere?tab=home");

    const { result } = renderHook(() => useShellNavigation("karlsruhe_event"));

    expect(result.current.pathname).toBe("/");
    expect(result.current.activeTab).toBe("map");

    act(() => {
      result.current.navigateToTab("map", { mapPanel: "qr" });
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe("/karlsruhe");
      expect(window.location.search).toContain("tab=map");
      expect(window.location.search).toContain("mapPanel=qr");
    });
  });
});
