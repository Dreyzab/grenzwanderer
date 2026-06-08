import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VnHubInlinePanel } from "./VnHubInlinePanel";

describe("VnHubInlinePanel", () => {
  it("renders the title and children as an always-visible region", () => {
    render(
      <VnHubInlinePanel title="Train Map">
        <div data-testid="hub-child">map</div>
      </VnHubInlinePanel>,
    );

    const panel = screen.getByTestId("vn-hub-inline-panel");
    expect(panel.tagName).toBe("ASIDE");
    expect(screen.getByRole("heading", { name: "Train Map" })).toBeVisible();
    expect(screen.getByTestId("hub-child")).toBeVisible();
  });

  it("falls back to a default aria-label when no title is provided", () => {
    render(
      <VnHubInlinePanel>
        <div>map</div>
      </VnHubInlinePanel>,
    );

    expect(
      screen.getByRole("complementary", { name: "Train map" }),
    ).toBeInTheDocument();
  });
});
