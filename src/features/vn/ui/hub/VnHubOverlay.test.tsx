import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VnHubOverlay } from "./VnHubOverlay";

describe("VnHubOverlay", () => {
  it("renders nothing while closed", () => {
    render(
      <VnHubOverlay open={false} onClose={() => undefined}>
        <span data-testid="hub-content">Content</span>
      </VnHubOverlay>,
    );
    expect(screen.queryByTestId("hub-content")).toBeNull();
    expect(screen.queryByTestId("vn-hub-overlay")).toBeNull();
  });

  it("renders children and a close button when open", () => {
    render(
      <VnHubOverlay open onClose={() => undefined} title="Train">
        <span data-testid="hub-content">Content</span>
      </VnHubOverlay>,
    );
    expect(screen.getByTestId("hub-content")).toBeInTheDocument();
    expect(screen.getByTestId("vn-hub-overlay-close")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Train" })).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <VnHubOverlay open onClose={onClose}>
        <span />
      </VnHubOverlay>,
    );
    fireEvent.click(screen.getByTestId("vn-hub-overlay-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <VnHubOverlay open onClose={onClose}>
        <span />
      </VnHubOverlay>,
    );
    fireEvent.click(screen.getByTestId("vn-hub-overlay-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <VnHubOverlay open onClose={onClose}>
        <span />
      </VnHubOverlay>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
