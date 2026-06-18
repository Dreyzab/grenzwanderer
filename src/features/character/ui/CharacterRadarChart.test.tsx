import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CharacterRadarChart,
  type CharacterRadarDatum,
} from "./CharacterRadarChart";

const sampleData: CharacterRadarDatum[] = [
  {
    key: "inner_analyst",
    label: "Analyst",
    icon: "logic",
    color: "#d4a74f",
    value: 6,
  },
  {
    key: "inner_manipulator",
    label: "Manipulator",
    icon: "deception",
    color: "#b86b77",
    value: 3,
  },
  {
    key: "inner_guide",
    label: "Guide",
    icon: "empathy",
    color: "#7db7a6",
    value: 4,
  },
];

describe("CharacterRadarChart", () => {
  it("renders a local SVG radar chart with voice icons", () => {
    const { container } = render(<CharacterRadarChart data={sampleData} />);

    expect(screen.getByTestId("character-radar")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /patron voice radar chart/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("character-radar-polygon")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Manipulator")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(container.querySelectorAll("polygon").length).toBeGreaterThan(1);
  });
});
