import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MouseEvent, ReactNode } from "react";
import { vi } from "vitest";

// jsdom has no matchMedia; default to landscape so floating-focus stays static in tests.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const originalFetch = globalThis.fetch;
const bundledSnapshotPath = join(
  process.cwd(),
  "content",
  "vn",
  "pilot.snapshot.json",
);

globalThis.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const url = typeof input === "string" ? input : input.toString();
  if (url.includes("/content/vn/pilot.snapshot.json")) {
    const body = readFileSync(bundledSnapshotPath, "utf8");
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return originalFetch(input, init);
};

vi.mock("mapbox-gl", () => ({
  default: {},
}));

vi.mock("react-map-gl/mapbox", async () => {
  const React = await import("react");

  return {
    default: ({
      children,
      onClick,
    }: {
      children?: ReactNode;
      onClick?: (event: MouseEvent) => void;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "map-gl-mock",
          onClick,
        },
        children,
      ),
    Marker: ({ children }: { children?: unknown }) => children ?? null,
    NavigationControl: () => null,
    Source: ({ children }: { children?: ReactNode }) => children ?? null,
    Layer: () => null,
  };
});
