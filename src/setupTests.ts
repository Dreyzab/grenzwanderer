import "@testing-library/jest-dom";
import type { MouseEvent, ReactNode } from "react";
import { vi } from "vitest";

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
