import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("mapbox-gl", () => ({
  default: {},
}));

vi.mock("react-map-gl/mapbox", () => ({
  default: ({ children }: { children?: unknown }) => children ?? null,
  Marker: ({ children }: { children?: unknown }) => children ?? null,
  NavigationControl: () => null,
}));
